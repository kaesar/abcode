# ABCode Programming Language

> Mitigating the Software Tower of Babel to a great degree  
> [**Download...**](https://github.com/kaesar/abcode/releases) | [Video](https://www.youtube.com/embed/GuPJzq43FbY)  

![](https://assets.onmind.net/know/abcode-logo.png)

![](https://assets.onmind.net/know/onmind22-abcode.gif)

## Quick Start

Just download and uncompress according to your system and run something like...

```bash
./abcodec -s abc/hello.abc
```

> `abcodec` is the compiler and `abc/hello.abc` represent your source code with **ABCode**.  
> Go to [`ABCode`](https://onmind.net/onmind/en/ABCode) topic in my blog.

## Supported Targets

| Target | Language    | Extension |
|--------|-------------|-----------|
| 1      | NodeJS      | .js       |
| 2      | Deno        | .ts       |
| 3      | WebAssembly | .ts       |
| 4      | Kotlin      | .kt       |
| 5      | Java        | .java     |
| 6      | Python      | .py       |
| 7      | Go          | .go       |
| 8      | PHP         | .php      |
| 9      | C#          | .cs       |
| 0      | Rust        | .rs       |

## Project Structure

```
abcode/
├── abcodec/            # CLI Compiler (abcodec)
│   ├── src/main.rs     # Main compiler source
│   ├── Cargo.toml      # Compiler dependencies
│   └── build.sh        # Cross-compilation script
├── abc/                # ABCode examples
├── abcodejs/           # JavaScript transpilers
├── abcodelib/          # ABCode as library
├── abcodeweb/          # Web interface (like playground)
├── abcoderun/          # ABCode Runtime Environment for Scripts
├── abcodefun/          # ABCode Web Runtime for Functions
└── abcodeext/          # ABCode extensions for Editors
```

### Components

- **`abcodec`**: Command-line compiler for ABCode under Rust
- **`abcodejs`**: JavaScript transpilers (used by all components via BoaJS)
- **`abcodelib`**: ABCode compilation as Rust library
- **`abcodeweb`**: Web UI for online compilation and preview (like playground)
- **`abcoderun`**: ABCode Runtime Environment for Scripts
- **`abcodefun`**: ABCode Web Runtime for Functions execution platform (AWS Lambda-style)
- **`abcodeext`**: ABCode extensions for Editors (VSCode, Intellij, Vim, Zed, Lapce, Sublime, ACE.js)

### Usage

```bash
# CLI Compiler
cd abcodec && cargo build --release
./target/release/abcodec -s ../abc/hello.abc -t 1

# Web Interface
cd abcodeweb && cargo run
# Visit http://localhost:3000

# Serverless Functions
cd abcodefun && cargo run
# POST http://localhost:3001/invoke

# Runtime
cd abcoderun && cargo run example.abc

# Library
cd abcodelib && cargo build
```

---
<!--
Compiling with `cargo` and running...

```bash
cd abcodec
cargo run -- -s ../abc/hello.abc -t 6
cargo build --release && ./target/release/abcodec -s ../abc/hello.abc -t 6
```

Prepare for building...

```bash
rustup target add aarch64-apple-darwin
rustup target add x86_64-pc-windows-msvc
rustup target add x86_64-unknown-linux-gnu
rustup target add aarch64-unknown-linux-gnu
```

Building script with: `abcodec/build.sh`
-->

> © 2021-2026 by César Andres Arcila Buitrago
