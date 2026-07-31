# ABCodeRun - ABCode Runtime Environment for Scripts

Execute ABCode scripts directly without intermediate files using Rust + BoaJS.

Part of the **ABCode Cargo workspace**. Compiles via [`abcodelib`](../abcodelib) and runs the generated JavaScript with the same library (`execute_js`).

## Features

- **Direct execution** - Run `.abc` files like scripts
- **JavaScript runtime** - Uses BoaJS engine internally (through `abcodelib`)
- **ABCode compilation** - Uses `abcodelib` for transpilation
- **Console support** - Built-in `console.log()` functionality
- **Verbose mode** (`-v`) - Show compilation and execution details
- **Script arguments** - Pass arguments to your ABCode scripts via `process.argv`

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

### Passing Arguments to the Script
```bash
# All arguments after the .abc file are available via process.argv
./target/release/abcoderun abc/test_argv.abc --hello world

# With verbose
./target/release/abcoderun -v abc/test_argv.abc one two three
```

### From the `abcoderun/` directory

This package contains `example.abc`.

```bash
cd abcoderun
cargo run -p abcoderun -- example.abc
cargo run -p abcoderun -- ../abc/hello.abc
```

## process.argv

When you pass arguments after the `.abc` file, `abcoderun` injects a `process` global object into the JavaScript runtime. Your ABCode scripts can read them:

```abcode
goal: any

fun: main()
  echo: "Total args: " + process.argv.length
  echo: "Script: " + process.argv[0]
  if: process.argv.length > 1
    echo: "Arg 1: " + process.argv[1]

run: main()
```

```bash
./target/release/abcoderun abc/test_argv.abc foo bar
# → Total args: 3
# → Script: abc/test_argv.abc
# → Arg 1: foo
```

## Architecture

```
.abc → abcodelib::compile (→ JS) → abcodelib::execute_js_with_argv (BoaJS) → console output
```

The workspace ensures that if you already built `abcodec`, recompiling `abcoderun` (or vice versa) will only do incremental work.

---
© 2021-2026 by César Andres Arcila Buitrago