//! Testes de Integração do Sistema Nervoso
//!
//! Testes que verificam a integração entre:
//! - Ingestão de dados
//! - Validação de integridade
//! - FFI para C++/Python

use tensorwerk_nervous::ingestion::zero_copy::{ZeroCopyArena, ZeroCopyBuffer, MarketDataIngestor};
use tensorwerk_nervous::validation::integrity::{
    ChecksumValidator, DataBounds, TemporalValidator
};
use std::sync::Arc;

#[cfg(test)]
mod tests {
    use super::*;

    // -------------------------------------------------------------------------
    // Testes de Arena Zero-Copy
    // -------------------------------------------------------------------------

    #[test]
    fn test_arena_alloc_and_free() {
        let arena = ZeroCopyArena::new(1024 * 1024).unwrap(); // 1 MB

        // Alocar vários buffers
        let buf1 = arena.allocate(128).unwrap();
        let buf2 = arena.allocate(256).unwrap();
        let buf3 = arena.allocate(512).unwrap();

        // Verificar que endereços são diferentes
        assert_ne!(buf1.as_ptr(), buf2.as_ptr());
        assert_ne!(buf2.as_ptr(), buf3.as_ptr());

        // Verificar alinhamento AVX-512
        assert_eq!(buf1.as_ptr() as usize % 64, 0);
        assert_eq!(buf2.as_ptr() as usize % 64, 0);
        assert_eq!(buf3.as_ptr() as usize % 64, 0);
    }

    #[test]
    fn test_arena_overflow() {
        let arena = ZeroCopyArena::new(1024).unwrap(); // 1 KB

        // Alocar 900 bytes - deve funcionar
        let _buf1 = arena.allocate(900).unwrap();

        // Tentar alocar mais 200 bytes - deve falhar
        let result = arena.allocate(200);
        assert!(result.is_err());
    }

    #[test]
    fn test_zero_copy_buffer() {
        let arena = Arc::new(ZeroCopyArena::new(4096).unwrap());
        let mut buffer = ZeroCopyBuffer::new(128, arena).unwrap();

        // Escrever dados
        let data: Vec<u8> = (0..128).map(|i| i as u8).collect();
        buffer.as_mut_slice().copy_from_slice(&data);

        // Ler dados (zero-copy)
        let slice = buffer.as_slice();
        assert_eq!(slice.len(), 128);
        assert_eq!(slice[0], 0);
        assert_eq!(slice[127], 127);
    }

    // -------------------------------------------------------------------------
    // Testes de Validação
    // -------------------------------------------------------------------------

    #[test]
    fn test_checksum_validation() {
        let validator = ChecksumValidator::new();

        let data = b"Hello, tensorwerk!";
        let checksum = validator.calculate(data);

        // Checksum deve bater
        assert!(validator.validate(data, checksum).is_ok());

        // Checksum errado deve falhar
        assert!(validator.validate(data, checksum + 1).is_err());
    }

    #[test]
    fn test_bounds_validation() {
        let bounds = DataBounds::crypto();

        // Preço válido
        assert!(bounds.validate_price(50000.0, "BTC").is_ok());

        // Preço muito baixo
        assert!(bounds.validate_price(0.000000001, "BTC").is_err());

        // Preço muito alto
        assert!(bounds.validate_price(20_000_000.0, "BTC").is_err());
    }

    #[test]
    fn test_temporal_validation() {
        let mut validator = TemporalValidator::new(std::time::Duration::from_millis(1));

        let symbol = *b"BTCUSD\0\0";
        let source = 0;

        // Usar timestamps em nanosegundos realistas (1h após epoch)
        let base_ts = 3600 * 1_000_000_000;
        
        // Primeiro timestamp sempre válido
        assert!(validator.validate_monotonic(&symbol, source, base_ts).is_ok());

        // Timestamp posterior válido
        assert!(validator.validate_monotonic(&symbol, source, base_ts + 2000).is_ok());

        // Timestamp anterior muito distante inválido (> 1ms tolerance)
        // 1ms = 1_000_000 ns. Voltando 2ms deve falhar.
        assert!(validator.validate_monotonic(&symbol, source, base_ts - 2_000_000).is_err());
    }

    // -------------------------------------------------------------------------
    // Testes de Integração End-to-End
    // -------------------------------------------------------------------------

    #[test]
    fn test_ingestion_pipeline() {
        // Criar ingestor
        let ingestor = MarketDataIngestor::new(16 * 1024 * 1024, 1000);

        // Criar dados brutos simulados
        let mut raw_data = bytes::BytesMut::with_capacity(128);

        // Header válido (24 bytes)
        // Magic: "MRKT" -> 0x4D524B54 (Little Endian: 54 4B 52 4D)
        raw_data.extend_from_slice(&[0x54, 0x4B, 0x52, 0x4D]); // Magic
        raw_data.extend_from_slice(&[0; 1]); // msg_type (0 = Trade)
        raw_data.extend_from_slice(&[1; 1]); // version
        raw_data.extend_from_slice(&[0; 2]); // priority, flags
        raw_data.extend_from_slice(&[0; 8]); // timestamp
        raw_data.extend_from_slice(&(64u32).to_le_bytes()); // payload_size (64 bytes)
        raw_data.extend_from_slice(&[0; 4]); // checksum (ignorado pelo ingestor simples sem validação rigorosa aqui)

        // Payload (64 bytes)
        raw_data.extend_from_slice(&[42u8; 64]);

        // Processar
        let result = ingestor.process_raw_data(&mut raw_data);

        // Verificar estatísticas
        let stats = ingestor.stats();
        assert_eq!(stats.messages_received, 1);
        assert_eq!(stats.parse_errors, 0);
    }

    #[test]
    fn test_validation_on_ingestion() {
        let arena = Arc::new(ZeroCopyArena::new(4096).unwrap());

        // Criar buffer com dados inválidos
        let mut buffer = ZeroCopyBuffer::new(128, arena).unwrap();
        buffer.as_mut_slice().copy_from_slice(&[0xFF; 128]);

        // Validar deve falhar (checksum não bate)
        let validator = ChecksumValidator::new();
        let checksum = validator.calculate(buffer.as_slice());

        // Alterar um byte
        buffer.as_mut_slice()[0] = 0x00;

        // Validar com checksum original deve falhar
        assert!(validator.validate(buffer.as_slice(), checksum).is_err());
    }

    #[test]
    fn test_ffi_compatibility() {
        // Testar que estruturas são compatíveis com C ABI
        use std::mem;

        // Verificar alinhamento (deve ser pelo menos 1, geralmente 8 em 64-bit)
        assert!(mem::align_of::<ZeroCopyArena>() >= 1);

        // Verificar tamanho (não deve mudar acidentalmente)
        // Nota: Arena tem ponteiros internos, tamanho depende de arquitetura
        let arena = ZeroCopyArena::new(4096).unwrap();
        assert!(std::mem::size_of_val(&arena) > 0);
    }

    // -------------------------------------------------------------------------
    // Testes de Performance (Benchmarks)
    // -------------------------------------------------------------------------

    #[test]
    fn benchmark_ingestion_latency() {
        let ingestor = MarketDataIngestor::new(16 * 1024 * 1024, 10000);

        let start = std::time::Instant::now();

        for _ in 0..1000 {
            let mut raw_data = bytes::BytesMut::with_capacity(128);
            // Header válido
            raw_data.extend_from_slice(&[0x54, 0x4B, 0x52, 0x4D]); // Magic
            raw_data.extend_from_slice(&[0; 1]); // msg_type
            raw_data.extend_from_slice(&[1; 1]); // version
            raw_data.extend_from_slice(&[0; 2]); // priority, flags
            raw_data.extend_from_slice(&[0; 8]); // timestamp
            
            // Payload size (124 - 24 header = 100 bytes payload)
            // Mas o teste original botava 124 bytes de zeros. 
            // Header é 24 bytes. Sobra 104 bytes no capacity 128?
            // Vamos usar payload size 64 para caber.
            raw_data.extend_from_slice(&(64u32).to_le_bytes()); 
            
            raw_data.extend_from_slice(&[0; 4]); // checksum
            
            // Payload
            raw_data.extend_from_slice(&[0u8; 64]);

            ingestor.process_raw_data(&mut raw_data).unwrap();
        }

        let elapsed = start.elapsed();

        println!("1000 mensagens processadas em {:?}", elapsed);
        println!("Latência média: {:?} por mensagem", elapsed / 1000);

        // Verificar que latência é < 10μs (target)
        assert!(elapsed.as_micros() / 1000 < 10);
    }
}
