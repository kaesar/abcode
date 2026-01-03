#!/bin/bash

# Cross-compilation setup for Rust project
cargo build --release --target=aarch64-apple-darwin
cargo build --release --target=x86_64-pc-windows-msvc
cargo build --release --target=x86_64-unknown-linux-gnu
#cargo build --release --target=aarch64-unknown-linux-gnu

# Copying the built binaries to the dist directory
mkdir -p dist
cp target/aarch64-apple-darwin/release/abcodec dist/abcodec-mac
cp target/x86_64-pc-windows-msvc/release/abcodec.exe dist/abcodec.exe
cp target/x86_64-unknown-linux-gnu/release/abcodec dist/abcodec
#cp target/aarch64-unknown-linux-gnu/release/abcodec dist/abcodec-arm
