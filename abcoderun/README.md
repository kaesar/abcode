# ABCodeRun - ABCode Runtime Environment for Scripts

Execute ABCode scripts directly without intermediate files using Rust + BoaJS.

## Features

- **Direct execution** - Run `.abc` files like scripts
- **JavaScript runtime** - Uses BoaJS engine internally  
- **ABCode compilation** - Uses `abcodelib` for transpilation
- **Console support** - Built-in `console.log()` functionality
- **Verbose mode** - Show compilation and execution details

## Installation

```bash
cd abcoderun
cargo build --release
```

## Usage

### Basic Execution
```bash
./target/release/abcoderun script.abc
```

### Verbose Mode
```bash
./target/release/abcoderun -v script.abc
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
ABCode Script → abcodelib → JavaScript → BoaJS → Output
```

## Comparison

| Runtime | Language | Speed | Features |
|---------|----------|-------|----------|
| **abcoderun** | Rust+BoaJS | Fast | ABCode native |
| Node.js | C++/V8 | Very Fast | Full ecosystem |
| Deno | Rust/V8 | Very Fast | TypeScript, Security |
| Bun | Zig/JSC | Fastest | All-in-one |

## Use Cases

- **ABCode development** - Test scripts quickly
- **Educational** - Learn ABCode interactively  
- **Prototyping** - Rapid ABCode experimentation
- **Embedded** - Lightweight JavaScript runtime

---
© 2021-2026 by César Andres Arcila Buitrago