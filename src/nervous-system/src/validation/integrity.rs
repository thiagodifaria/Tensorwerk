//! Validação de integridade de dados: checksum, bounds, timestamps

use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::time::{Duration, SystemTime, UNIX_EPOCH};
use thiserror::Error;
use tracing::warn;

#[derive(Debug, Error)]
pub enum ValidationError {
    #[error("Checksum: esperado={expected:?}, calculado={calculated:?}")]
    ChecksumMismatch { expected: u32, calculated: u32 },
    #[error("Timestamp inválido: {0}")]
    InvalidTimestamp(String),
    #[error("Valor fora dos limites: campo={field}, valor={value}")]
    OutOfBounds { field: String, value: f64 },
    #[error("Tipo desconhecido: {0}")]
    UnknownMessageType(u8),
    #[error("Ordem temporal violada: prev={prev}, atual={current}")]
    TemporalOrderViolation { prev: u64, current: u64 },
    #[error("Símbolo inválido: {0}")]
    InvalidSymbol(String),
    #[error("Formato corrompido")]
    CorruptedFormat,
}

pub struct ChecksumValidator {
    table: [u32; 256],
}

impl ChecksumValidator {
    pub fn new() -> Self {
        const POLYNOMIAL: u32 = 0xEDB88320;
        let mut table = [0u32; 256];

        for i in 0..256 {
            let mut crc = i as u32;
            for _ in 0..8 {
                if crc & 1 != 0 {
                    crc = (crc >> 1) ^ POLYNOMIAL;
                } else {
                    crc >>= 1;
                }
            }
            table[i as usize] = crc;
        }

        Self { table }
    }

    #[inline]
    pub fn calculate(&self, data: &[u8]) -> u32 {
        let mut crc = 0xFFFFFFFF_u32;

        for &byte in data {
            let index = ((crc as u8) ^ byte) as usize;
            crc = (crc >> 8) ^ self.table[index];
        }

        !crc
    }

    #[inline]
    pub fn validate(&self, data: &[u8], expected: u32) -> Result<(), ValidationError> {
        let calculated = self.calculate(data);
        if calculated != expected {
            return Err(ValidationError::ChecksumMismatch { expected, calculated });
        }
        Ok(())
    }
}

impl Default for ChecksumValidator {
    fn default() -> Self { Self::new() }
}

#[derive(Debug, Clone, Copy)]
pub struct DataBounds {
    pub min_price: f64,
    pub max_price: f64,
    pub min_quantity: f64,
    pub max_quantity: f64,
    pub min_timestamp: u64,
    pub max_timestamp: u64,
}

impl DataBounds {
    pub fn crypto() -> Self {
        let min_ts = 1_577_836_800_000_000_000;
        let max_ts = 1_893_456_000_000_000_000;

        Self {
            min_price: 0.00000001,
            max_price: 10_000_000.0,
            min_quantity: 0.00000001,
            max_quantity: 10_000_000.0,
            min_timestamp: min_ts,
            max_timestamp: max_ts,
        }
    }

    pub fn stocks() -> Self {
        Self {
            min_price: 0.01,
            max_price: 10_000_000.0,
            min_quantity: 1.0,
            max_quantity: 1_000_000_000.0,
            min_timestamp: 1_577_836_800_000_000_000,
            max_timestamp: 1_893_456_000_000_000_000,
        }
    }

    #[inline]
    pub fn validate_price(&self, price: f64, field: &str) -> Result<(), ValidationError> {
        if price < self.min_price || price > self.max_price {
            return Err(ValidationError::OutOfBounds {
                field: field.to_string(),
                value: price,
            });
        }
        Ok(())
    }

    #[inline]
    pub fn validate_quantity(&self, qty: f64, field: &str) -> Result<(), ValidationError> {
        if qty < self.min_quantity || qty > self.max_quantity {
            return Err(ValidationError::OutOfBounds {
                field: field.to_string(),
                value: qty,
            });
        }
        Ok(())
    }

    #[inline]
    pub fn validate_timestamp(&self, ts: u64) -> Result<(), ValidationError> {
        if ts < self.min_timestamp || ts > self.max_timestamp {
            return Err(ValidationError::InvalidTimestamp(format!("Timestamp inválido: {}", ts)));
        }
        Ok(())
    }
}

#[derive(Debug, Clone, Hash, Eq, PartialEq)]
struct LastTimestamp {
    symbol: [u8; 8],
    source: u8,
}

pub struct TemporalValidator {
    last_timestamps: std::collections::HashMap<LastTimestamp, u64>,
    clock_skew_tolerance: u64,
}

impl TemporalValidator {
    pub fn new(clock_skew_tolerance: Duration) -> Self {
        Self {
            last_timestamps: std::collections::HashMap::new(),
            clock_skew_tolerance: clock_skew_tolerance.as_nanos() as u64,
        }
    }

    pub fn validate_monotonic(
        &mut self,
        symbol: &[u8; 8],
        source: u8,
        timestamp: u64,
    ) -> Result<(), ValidationError> {
        let key = LastTimestamp { symbol: *symbol, source };

        if let Some(&last_ts) = self.last_timestamps.get(&key) {
            if timestamp < last_ts.saturating_sub(self.clock_skew_tolerance) {
                return Err(ValidationError::TemporalOrderViolation { prev: last_ts, current: timestamp });
            }
        }

        self.last_timestamps.insert(key, timestamp);
        Ok(())
    }

    pub fn forget_symbol(&mut self, symbol: &[u8; 8], source: u8) {
        let key = LastTimestamp { symbol: *symbol, source };
        self.last_timestamps.remove(&key);
    }
}

pub struct SymbolValidator {
    known_symbols: HashSet<[u8; 8]>,
    allow_unknown: bool,
}

impl SymbolValidator {
    pub fn whitelist(symbols: Vec<String>) -> Self {
        let mut known = HashSet::new();

        for sym in symbols {
            let mut bytes = [0u8; 8];
            let sym_bytes = sym.as_bytes();
            let len = sym_bytes.len().min(8);
            bytes[..len].copy_from_slice(&sym_bytes[..len]);
            known.insert(bytes);
        }

        Self { known_symbols: known, allow_unknown: false }
    }

    pub fn permissive() -> Self {
        Self { known_symbols: HashSet::new(), allow_unknown: true }
    }

    pub fn validate(&self, symbol: &[u8; 8]) -> Result<(), ValidationError> {
        for &byte in symbol {
            if byte != 0 && !(byte.is_ascii_alphanumeric() || byte == b'-' || byte == b'_') {
                return Err(ValidationError::InvalidSymbol(format!("Caractere inválido: {}", byte)));
            }
        }

        if !self.allow_unknown && !self.known_symbols.contains(symbol) {
            return Err(ValidationError::InvalidSymbol(format!("Símbolo desconhecido: {}", String::from_utf8_lossy(symbol))));
        }

        Ok(())
    }
}

pub struct CompositeValidator {
    checksum: ChecksumValidator,
    bounds: DataBounds,
    temporal: TemporalValidator,
    symbol: SymbolValidator,
}

impl CompositeValidator {
    pub fn new(bounds: DataBounds, symbol_validator: SymbolValidator) -> Self {
        Self {
            checksum: ChecksumValidator::new(),
            bounds,
            temporal: TemporalValidator::new(Duration::from_millis(1)),
            symbol: symbol_validator,
        }
    }

    pub fn validate_message(
        &mut self,
        header: &crate::ingestion::zero_copy::MessageHeader,
        payload: &[u8],
    ) -> Result<(), ValidationError> {
        self.checksum.validate(payload, header.checksum)?;

        match header.msg_type {
            0 | 1 | 2 | 3 => {},
            _ => return Err(ValidationError::UnknownMessageType(header.msg_type)),
        }

        self.bounds.validate_timestamp(header.timestamp)?;

        match header.msg_type {
            0 => self.validate_trade(payload)?,
            1 => self.validate_quote(payload)?,
            _ => {},
        }

        Ok(())
    }

    fn validate_trade(&mut self, payload: &[u8]) -> Result<(), ValidationError> {
        use crate::ingestion::zero_copy::Trade;

        if payload.len() < std::mem::size_of::<Trade>() {
            return Err(ValidationError::CorruptedFormat);
        }

        let trade = unsafe { *(payload.as_ptr() as *const Trade) };

        self.symbol.validate(&trade.symbol)?;

        let price = trade.price as f64 / 1e8;
        let qty = trade.quantity as f64 / 1e8;

        self.bounds.validate_price(price, "price")?;
        self.bounds.validate_quantity(qty, "quantity")?;
        self.temporal.validate_monotonic(&trade.symbol, 0, trade.timestamp)?;

        Ok(())
    }

    fn validate_quote(&mut self, payload: &[u8]) -> Result<(), ValidationError> {
        use crate::ingestion::zero_copy::Quote;

        if payload.len() < std::mem::size_of::<Quote>() {
            return Err(ValidationError::CorruptedFormat);
        }

        let quote = unsafe { *(payload.as_ptr() as *const Quote) };

        self.symbol.validate(&quote.symbol)?;

        let bid_price = quote.bid_price as f64 / 1e8;
        let ask_price = quote.ask_price as f64 / 1e8;

        if bid_price >= ask_price {
            return Err(ValidationError::InvalidSymbol("Bid deve ser menor que Ask".to_string()));
        }

        self.bounds.validate_price(bid_price, "bid_price")?;
        self.bounds.validate_price(ask_price, "ask_price")?;

        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_checksum_validation() {
        let validator = ChecksumValidator::new();
        let data = b"Hello, world!";
        let checksum = validator.calculate(data);
        assert!(validator.validate(data, checksum).is_ok());
    }

    #[test]
    fn test_bounds_validation() {
        let bounds = DataBounds::crypto();
        assert!(bounds.validate_price(50000.0, "BTC").is_ok());
        assert!(bounds.validate_price(0.000000001, "BTC").is_err());
    }
}
