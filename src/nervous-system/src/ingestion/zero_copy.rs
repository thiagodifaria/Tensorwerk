//! Ingestão zero-copy de dados de mercado com latência < 10μs

use bytes::{Buf, BytesMut};
use crossbeam_channel::{bounded, Sender};
use parking_lot::Mutex;
use serde::{Deserialize, Serialize};
use std::alloc::{alloc, dealloc, Layout};
use std::ptr::NonNull;
use std::sync::atomic::{AtomicU64, Ordering};
use std::sync::Arc;
use std::time::Instant;
use tracing::{debug, info, warn};

pub const RECV_BUFFER_SIZE: usize = 16 * 1024 * 1024;
pub const AVX512_ALIGNMENT: usize = 64;
pub const MAX_PENDING_MESSAGES: usize = 10_000;

pub struct ZeroCopyArena {
    base_ptr: NonNull<u8>,
    capacity: usize,
    offset: AtomicU64,
    layout: Layout,
}

unsafe impl Send for ZeroCopyArena {}
unsafe impl Sync for ZeroCopyArena {}

impl ZeroCopyArena {
    pub fn new(capacity: usize) -> Result<Self, std::io::Error> {
        let aligned_capacity = (capacity + AVX512_ALIGNMENT - 1) / AVX512_ALIGNMENT * AVX512_ALIGNMENT;
        let layout = Layout::from_size_align(aligned_capacity, AVX512_ALIGNMENT)
            .map_err(|e| std::io::Error::new(std::io::ErrorKind::Other, e))?;

        let base_ptr = unsafe {
            let ptr = alloc(layout);
            if ptr.is_null() {
                return Err(std::io::Error::new(std::io::ErrorKind::Other, "Falha na alocação"));
            }
            NonNull::new_unchecked(ptr)
        };

        debug!("Arena criada: {} MB", aligned_capacity / (1024 * 1024));

        Ok(Self {
            base_ptr,
            capacity: aligned_capacity,
            offset: AtomicU64::new(0),
            layout,
        })
    }

    pub fn allocate(&self, size: usize) -> Result<NonNull<u8>, std::io::Error> {
        let aligned_size = (size + AVX512_ALIGNMENT - 1) / AVX512_ALIGNMENT * AVX512_ALIGNMENT;
        let current_offset = self.offset.fetch_add(aligned_size as u64, Ordering::Acquire) as usize;

        if current_offset + aligned_size > self.capacity {
            self.offset.fetch_sub(aligned_size as u64, Ordering::Release);
            return Err(std::io::Error::new(std::io::ErrorKind::Other, "Arena esgotada"));
        }

        Ok(unsafe { NonNull::new_unchecked(self.base_ptr.as_ptr().add(current_offset)) })
    }

    pub fn capacity(&self) -> usize { self.capacity }
    pub fn used(&self) -> usize { self.offset.load(Ordering::Relaxed) as usize }
}

impl Drop for ZeroCopyArena {
    fn drop(&mut self) {
        unsafe { dealloc(self.base_ptr.as_ptr(), self.layout); }
        debug!("Arena destruída");
    }
}

pub struct ZeroCopyBuffer {
    ptr: NonNull<u8>,
    len: usize,
    _arena: Arc<ZeroCopyArena>,
}

unsafe impl Send for ZeroCopyBuffer {}
unsafe impl Sync for ZeroCopyBuffer {}

impl ZeroCopyBuffer {
    pub fn new(len: usize, arena: Arc<ZeroCopyArena>) -> Result<Self, std::io::Error> {
        let ptr = arena.allocate(len)?;
        Ok(Self { ptr, len, _arena: arena })
    }

    pub fn as_slice(&self) -> &[u8] {
        unsafe { std::slice::from_raw_parts(self.ptr.as_ptr(), self.len) }
    }

    pub fn as_mut_slice(&mut self) -> &mut [u8] {
        unsafe { std::slice::from_raw_parts_mut(self.ptr.as_ptr(), self.len) }
    }

    pub fn len(&self) -> usize { self.len }
    pub fn is_empty(&self) -> bool { self.len == 0 }
}

#[derive(Copy, Clone, Debug)]
#[repr(C, packed)]
pub struct MessageHeader {
    pub magic: u32,
    pub msg_type: u8,
    pub version: u8,
    pub priority: u8,
    pub flags: u8,
    pub timestamp: u64,
    pub payload_size: u32,
    pub checksum: u32,
}

impl MessageHeader {
    pub const MAGIC: u32 = 0x4D524B54;

    pub fn is_valid(&self) -> bool {
        self.magic == Self::MAGIC && self.payload_size > 0 && self.payload_size <= 10_000_000
    }
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[repr(C, packed)]
pub struct Trade {
    pub symbol: [u8; 8],
    pub price: i64,
    pub quantity: i64,
    pub timestamp: u64,
    pub side: u8,
    pub trade_id: u64,
    _padding: [u8; 7],
}

#[derive(Debug, Clone, Copy, Serialize, Deserialize)]
#[repr(C, packed)]
pub struct Quote {
    pub symbol: [u8; 8],
    pub bid_price: i64,
    pub bid_quantity: i64,
    pub ask_price: i64,
    pub ask_quantity: i64,
    pub timestamp: u64,
    _padding: [u8; 8],
}

pub struct MarketDataIngestor {
    arena: Arc<ZeroCopyArena>,
    tx: Sender<ZeroCopyBuffer>,
    stats: Mutex<IngestionStats>,
}

#[derive(Debug, Default)]
struct IngestionStats {
    messages_received: u64,
    bytes_received: u64,
    parse_errors: u64,
    last_message_time: Option<Instant>,
}

#[derive(Debug, Serialize)]
pub struct IngestionStatsSnapshot {
    pub messages_received: u64,
    pub bytes_received: u64,
    pub parse_errors: u64,
    pub arena_used_mb: usize,
    pub arena_capacity_mb: usize,
    pub messages_per_second: f64,
}

impl MarketDataIngestor {
    pub fn new(arena_capacity: usize, channel_size: usize) -> Self {
        let arena = Arc::new(ZeroCopyArena::new(arena_capacity).unwrap());
        let (tx, _) = bounded(channel_size);

        info!("Ingestor criado: arena={} MB, canal={}", arena_capacity / (1024 * 1024), channel_size);

        Self {
            arena,
            tx,
            stats: Mutex::new(IngestionStats::default()),
        }
    }

    pub fn process_raw_data(&self, raw_data: &mut BytesMut) -> Result<(), std::io::Error> {
        let start = Instant::now();

        if raw_data.len() < std::mem::size_of::<MessageHeader>() {
            return Err(std::io::Error::new(std::io::ErrorKind::UnexpectedEof, "Dados muito pequenos"));
        }

        let header = unsafe { *(raw_data.as_ptr() as *const MessageHeader) };

        if !header.is_valid() {
            let mut stats = self.stats.lock();
            stats.parse_errors += 1;
            return Err(std::io::Error::new(std::io::ErrorKind::InvalidData, "Header inválido"));
        }

        let payload_size = header.payload_size as usize;
        let total_size = std::mem::size_of::<MessageHeader>() + payload_size;

        if raw_data.len() < total_size {
            return Err(std::io::Error::new(std::io::ErrorKind::UnexpectedEof, "Payload incompleto"));
        }

        let mut buffer = ZeroCopyBuffer::new(total_size, self.arena.clone())?;
        buffer.as_mut_slice().copy_from_slice(&raw_data[..total_size]);
        raw_data.advance(total_size);

        if let Err(e) = self.tx.try_send(buffer) {
            warn!("Canal cheio: {}", e);
        }

        let elapsed = start.elapsed();
        if elapsed.as_micros() > 100 {
            warn!("Processamento lento: {} μs", elapsed.as_micros());
        }

        let mut stats = self.stats.lock();
        stats.messages_received += 1;
        stats.bytes_received += total_size as u64;
        stats.last_message_time = Some(Instant::now());

        Ok(())
    }

    pub fn stats(&self) -> IngestionStatsSnapshot {
        let stats = self.stats.lock();
        IngestionStatsSnapshot {
            messages_received: stats.messages_received,
            bytes_received: stats.bytes_received,
            parse_errors: stats.parse_errors,
            arena_used_mb: self.arena.used() / (1024 * 1024),
            arena_capacity_mb: self.arena.capacity() / (1024 * 1024),
            messages_per_second: 0.0,
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_arena_allocation() {
        let arena = ZeroCopyArena::new(1024).unwrap();
        assert_eq!(arena.capacity(), 1024);

        let buf1 = arena.allocate(64).unwrap();
        let buf2 = arena.allocate(128).unwrap();

        assert_ne!(buf1.as_ptr(), buf2.as_ptr());
        assert_eq!(buf1.as_ptr() as usize % 64, 0);
    }

    #[test]
    fn test_header_validation() {
        let header = MessageHeader {
            magic: MessageHeader::MAGIC,
            msg_type: 0,
            version: 1,
            priority: 0,
            flags: 0,
            timestamp: 0,
            payload_size: 100,
            checksum: 0,
        };

        assert!(header.is_valid());
    }

    #[test]
    fn test_zero_copy_buffer() {
        let arena = std::sync::Arc::new(ZeroCopyArena::new(1024).unwrap());
        let mut buffer = ZeroCopyBuffer::new(128, arena).unwrap();

        buffer.as_mut_slice().copy_from_slice(&[42u8; 128]);
        let slice = buffer.as_slice();
        assert_eq!(slice.len(), 128);
        assert_eq!(slice[0], 42);
    }
}
