# ABCodeWeb - ABCode Web UI

Web interface (like playground) for compiling and previewing ABCode online using Rust and Feather.

Part of the **ABCode Cargo workspace**. Compilation goes through [`abcodelib`](../abcodelib).

## Features

- **Real-time compilation** - Compile ABCode to 10 target languages
- **Web interface** - Simple HTML form with target selection
- **Lightweight** - Uses Feather framework (no async/tokio)
- **Library integration** - Uses `abcodelib` for compilation logic

## Supported Targets

| Target | Language    | Extension |
|--------|-------------|-----------|
| 0      | Binary      | (exe)     |
| 1      | NodeJS/Bun  | .js       |
| 2      | Deno        | .ts       |
| 3      | WebAssembly | .ts       |
| 4      | Kotlin      | .kt       |
| 5      | Java        | .java     |
| 6      | Python      | .py       |
| 7      | Go          | .go       |
| 8      | PHP         | .php      |
| 9      | C#          | .cs       |

## Usage

### Start Server

From the **repository root**:

```bash
cargo run -p abcodeweb
# or
cargo build -p abcodeweb --release
./target/release/abcodeweb
```

This works from anywhere inside the workspace; Cargo always places the binary in the shared `target/release/`.

### Access Interface
Open http://localhost:3000 in your browser

### API Endpoint
```bash
curl -X POST http://localhost:3000/compile \
  -H "Content-Type: application/json" \
  -d '{"target": 1, "code": "print \"Hello World\"", "plan": "*"}'
```

## Dependencies

- **feather** — Lightweight web framework
- **serde** — JSON serialization
- **abcodelib** — ABCode compilation library (workspace member)

Because of the Cargo workspace, you only pay the cost of compiling BoaJS and heavy crates once across `abcodeweb`, `abcodec`, `abcoderun` and `abcodefun`.

## Architecture

```
abcodeweb (Feather) → abcodelib → abcodejs/ (BoaJS) → Generated Code
```

## Example ABCode

```abcode
goal: any
#type: Hello

fun: myFunction()
  echo: "Hello there!"
  like: System.out.print("Hola mundo") #in: java

run: myFunction()
```

---
© 2026 by César Andres Arcila Buitrago
