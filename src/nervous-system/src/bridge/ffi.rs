//! FFI para C++ e Python: exportação de funções Rust com memória compartilhada

use std::ffi::{c_char, c_double, c_float, c_int, c_void};
use std::mem::ManuallyDrop;
use std::ptr::NonNull;
use std::sync::Arc;

use crate::ingestion::zero_copy::{MessageHeader, Trade, Quote};

#[repr(C)]
pub struct RustIngestor {
    _private: [u8; 0],
}

#[repr(C)]
pub struct RustBuffer {
    ptr: *const u8,
    len: usize,
    _capacity: usize,
    _arena_ptr: *const c_void,
}

#[no_mangle]
pub extern "C" fn rust_ingestor_new(
    arena_capacity_mb: usize,
    channel_size: usize,
) -> *mut RustIngestor {
    std::ptr::null_mut()
}

#[no_mangle]
pub extern "C" fn rust_ingestor_free(ingestor: *mut RustIngestor) {
    if !ingestor.is_null() {}
}

#[no_mangle]
pub extern "C" fn rust_ingestor_process(
    ingestor: *mut RustIngestor,
    raw_data: *const u8,
    len: usize,
) -> c_int {
    if ingestor.is_null() || raw_data.is_null() { return -1; }
    0
}

#[no_mangle]
pub extern "C" fn rust_ingestor_next(
    ingestor: *mut RustIngestor,
    out_buffer: *mut RustBuffer,
) -> c_int {
    if ingestor.is_null() || out_buffer.is_null() { return 0; }
    0
}

#[no_mangle]
pub extern "C" fn rust_buffer_free(buffer: RustBuffer) {}

#[no_mangle]
pub extern "C" fn rust_ingestor_get_py_buffer(
    ingestor: *mut RustIngestor,
    py_buffer: *mut *mut c_void,
) -> c_int {
    if ingestor.is_null() || py_buffer.is_null() { return -1; }
    0
}

#[no_mangle]
pub extern "C" fn rust_py_buffer_decref(py_buffer: *mut c_void) {}

#[no_mangle]
pub extern "C" fn rust_copy_to_cuda(
    rust_buffer: RustBuffer,
    cuda_ptr: *mut c_void,
    size: usize,
) -> c_int {
    if rust_buffer.ptr.is_null() || cuda_ptr.is_null() { return -1; }
    if size > rust_buffer.len { return -2; }
    0
}

#[no_mangle]
pub extern "C" fn rust_copy_from_cuda(
    cuda_ptr: *const c_void,
    rust_buffer: RustBuffer,
    size: usize,
) -> c_int {
    if cuda_ptr.is_null() || rust_buffer.ptr.is_null() { return -1; }
    if size > rust_buffer.len { return -2; }
    0
}

#[repr(C)]
pub struct IngestorStatsFFI {
    pub messages_received: u64,
    pub bytes_received: u64,
    pub parse_errors: u64,
    pub arena_used_mb: usize,
    pub arena_capacity_mb: usize,
    pub messages_per_second: f64,
}

#[no_mangle]
pub extern "C" fn rust_ingestor_stats(
    ingestor: *mut RustIngestor,
    out_stats: *mut IngestorStatsFFI,
) -> c_int {
    if ingestor.is_null() || out_stats.is_null() { return -1; }
    unsafe {
        (*out_stats).messages_received = 0;
        (*out_stats).bytes_received = 0;
        (*out_stats).parse_errors = 0;
        (*out_stats).arena_used_mb = 0;
        (*out_stats).arena_capacity_mb = 0;
        (*out_stats).messages_per_second = 0.0;
    }
    0
}

#[no_mangle]
pub extern "C" fn rust_last_error() -> *const c_char {
    static mut LAST_ERROR: [u8; 256] = [0; 256];
    unsafe { LAST_ERROR.as_ptr() as *const c_char }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_null_safety() {
        let result = rust_ingestor_process(std::ptr::null_mut(), std::ptr::null(), 0);
        assert_eq!(result, -1);
    }
}
