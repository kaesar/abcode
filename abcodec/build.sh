#!/bin/bash
# Cross-compile abcodec for release artifacts.
# Run from anywhere; builds from the workspace root.

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

mkdir -p dist

cargo build --release -p abcodec --target=aarch64-apple-darwin
cargo build --release -p abcodec --target=x86_64-pc-windows-msvc
cargo build --release -p abcodec --target=x86_64-unknown-linux-gnu
# cargo build --release -p abcodec --target=aarch64-unknown-linux-gnu

cp target/aarch64-apple-darwin/release/abcodec dist/abcodec-mac
cp target/x86_64-pc-windows-msvc/release/abcodec.exe dist/abcodec.exe
cp target/x86_64-unknown-linux-gnu/release/abcodec dist/abcodec
# cp target/aarch64-unknown-linux-gnu/release/abcodec dist/abcodec-arm

echo "Binaries written to dist/"
