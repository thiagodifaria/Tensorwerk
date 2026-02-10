use tensorwerk_nervous::ingestion::zero_copy::MarketDataIngestor;
use std::time::Duration;
use tracing::info;

fn main() {
    // Initialize logging
    tracing_subscriber::fmt()
        .with_max_level(tracing::Level::INFO)
        .init();

    info!("Starting Tensorwerk Ingestor...");

    // Create ingestor with 100MB arena and 10000 slot channel
    let _ingestor = MarketDataIngestor::new(100 * 1024 * 1024, 10000);

    info!("Ingestor initialized successfully. Running in background...");

    // Keep the application running
    loop {
        std::thread::sleep(Duration::from_secs(1));
    }
}
