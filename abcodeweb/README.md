# ABCodeWeb - ABCode Web UI

Web interface (like playground) for compiling and previewing ABCode online using Rust and Feather.

## Features

- **Real-time compilation** - Compile ABCode to 10 target languages
- **Web interface** - Simple HTML form with target selection
- **Lightweight** - Uses Feather framework (no async/tokio)
- **Library integration** - Uses `abcodelib` for compilation logic

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

## Usage

### Start Server
```bash
cd abcodeweb
cargo run
```

### Access Interface
Open http://localhost:3000 in your browser

### API Endpoint
```bash
curl -X POST http://localhost:3000/compile \
  -H "Content-Type: application/json" \
  -d '{"target": 1, "code": "print \"Hello World\"", "plan": "*"}'
```

## Dependencies

- **feather** - Lightweight web framework
- **serde** - JSON serialization
- **abcodelib** - ABCode compilation library

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