# ABCodeC - ABCode Compiler

Command-line compiler for ABCode programming language.

Part of the **ABCode Cargo workspace** (repository root). Shared compilation logic lives in [`abcodelib`](../abcodelib); this crate is the CLI shell (args, files, `run/` output).

## Usage

From the **repository root**:

```bash
# Build the compiler
cargo build -p abcodec --release

# Compile ABCode to different targets
./target/release/abcodec -s abc/hello.abc -t 1  # NodeJS
./target/release/abcodec -s abc/hello.abc -t 6  # Python
./target/release/abcodec -s abc/hello.abc -t 5  # Java

# Or without a prior build
cargo run -p abcodec -- -s abc/hello.abc -t 1
```

From this directory (`abcodec/`), the same commands work; Cargo still uses the workspace root `target/` and `Cargo.lock`.

## Supported Targets

| Target | Language    | Extension |
|--------|-------------|-----------|
| 0      | Rust        | .rs       |
| 1      | NodeJS      | .js       |
| 2      | Deno        | .ts       |
| 3      | WebAssembly | .ts       |
| 4      | Kotlin      | .kt       |
| 5      | Java        | .java     |
| 6      | Python      | .py       |
| 7      | Go          | .go       |
| 8      | PHP         | .php      |
| 9      | C#          | .cs       |

## Cross-compilation

Use the provided build script for multiple platforms. The script **must run from the workspace root** (it switches automatically):

```bash
./abcodec/build.sh
# or from inside abcodec/
./build.sh
```

Outputs land in the `dist/` directory at the repository root:

- macOS ARM64 → `dist/abcodec-mac`
- Windows x64  → `dist/abcodec.exe`
- Linux x64    → `dist/abcodec`

## Workspace-aware build

The recommended way to build involves the workspace root `target/`:

```bash
# always works
cargo build -p abcodec --release

# from inside this folder
cargo build -p abcodec --release
```

Cargo automatically uses the workspace `Cargo.toml`, `Cargo.lock`, and shared `target/`.

## Dependencies

- Rust (edition 2024)
- [`abcodelib`](../abcodelib) — compilation + BoaJS (embeds `../abcodejs/`)
- `clap` — CLI arguments

> Because everything goes through the workspace, `boa_engine` and other heavy crates are built only once for `abcodec`, `abcoderun`, `abcodefun` and `abcodeweb`.

---
© 2021-2026 by César Andres Arcila Buitrago
