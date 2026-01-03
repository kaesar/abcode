# ABCodeC - ABCode Compiler

Command-line compiler for ABCode programming language.

## Usage

```bash
# Build the compiler
cargo build --release

# Compile ABCode to different targets
./target/release/abcodec -s ../abc/hello.abc -t 1  # NodeJS
./target/release/abcodec -s ../abc/hello.abc -t 6  # Python
./target/release/abcodec -s ../abc/hello.abc -t 5  # Java
```

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

Use the provided build script for multiple platforms:

```bash
./build.sh
```

This will generate binaries for:
- macOS ARM64
- Windows x64
- Linux x64
- Linux ARM64

## Dependencies

- Rust 1.70+
- JavaScript transpilers from `../abcodejs/`
- BoaJS for JavaScript execution

---
© 2021-2026 by César Andres Arcila Buitrago