# ABCodeRun - ABCode Runtime Environment for Scripts

Execute ABCode scripts directly without intermediate files using Rust + BoaJS.

Part of the **ABCode Cargo workspace**. Compiles via [`abcodelib`](../abcodelib) and runs the generated JavaScript with the same library (`execute_js`).

## Features

- **Direct execution** - Run `.abc` files like scripts
- **JavaScript runtime** - Uses BoaJS engine internally (through `abcodelib`)
- **ABCode compilation** - Uses `abcodelib` for transpilation
- **Console support** - Built-in `console.log()` functionality
- **Verbose mode** - Show compilation and execution details

## Build

```bash
# From repo root (preferred)
cargo build -p abcoderun --release

# Or from inside this directory (still uses workspace)
cargo build -p abcoderun --release
```

The compiled binary is always at:

```
../../target/release/abcoderun   (when running from inside abcoderun/)
../../../target/release/abcoderun (if deeper nesting)
# or simply
target/release/abcoderun          (run from workspace root)
```

## Usage

### Basic Execution (recommended from repo root)

```bash
cargo run -p abcoderun -- abc/hello.abc
./target/release/abcoderun abc/hello.abc
```

### Verbose Mode
```bash
./target/release/abcoderun -v abc/hello.abc
```

### From the `abcoderun/` directory

This package contains `example.abc`.

```bash
cd abcoderun
cargo run -p abcoderun -- example.abc
cargo run -p abcoderun -- ../abc/hello.abc
```

### Example ABCode Script

```abcode
goal: any
#type: HelloWorld

fun: greet(name)
  echo: "Hello " + name + "!"
  like: console.log(`Hello ${name}!`) #in: javascript

fun: calculate(a, b)
  echo: a + b

run: greet("ABCode")
run: calculate(10, 20)
```

## Architecture

```
.abc → abcodelib::compile (→ JS) → abcodelib::execute_js (BoaJS) → console output
```

The workspace ensures that if you already built `abcodec`, recompiling `abcoderun` (or vice versa) will only do incremental work.

---
© 2021-2026 by César Andres Arcila Buitrago
