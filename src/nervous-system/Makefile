all: build

build:
	cargo build

clean:
	cargo clean

test:
	cargo test

format:
	cargo fmt

clippy:
	cargo clippy

docs:
	cargo doc --no-deps

release:
	cargo build --release

coverage:
	cargo tarpaulin --ignore-tests

.PHONY: all build clean test format clippy docs release coverage
