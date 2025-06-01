#!/bin/bash

# Crosss-compilation setup for Rust project
cargo build --release --target=aarch64-apple-darwin
cargo build --release --target=x86_64-pc-windows-msvc
cargo build --release --target=x86_64-unknown-linux-gnu
cargo build --release --target=aarch64-unknown-linux-gnu

# Copying the built binaries to the dist directory
mkdir -p dist
cp target/aarch64-apple-darwin/release/abcode dist/abcode-macos-arm
cp target/x86_64-pc-windows-msvc/release/abcode.exe dist/abcode-windows-x64.exe
cp target/x86_64-unknown-linux-gnu/release/abcode dist/abcode-linux-x64
cp target/aarch64-unknown-linux-gnu/release/abcode dist/abcode-linux-arm
