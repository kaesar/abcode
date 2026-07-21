# ABCodeFun - ABCode Web Runtime for Functions

AWS Lambda-style web execution platform for ABCode functions, thinking in serverless.

Part of the **ABCode Cargo workspace**. Uses [`abcodelib`](../abcodelib) for compile + JS execution.

## API

### Execute Function
```
POST /invoke/{function_name}
Content-Type: application/json

{
  "name": "World",
  "message": "Hello from ABCode!"
}
```

### Health Check
```
GET /health
```

## Usage Examples

### Running the server

`abcodefun` resolves function files relative to the **current working directory** (`./functions/*.abc`). You must start it from (or with a cwd that sees) the `abcodefun/` directory.

**From the repository root (recommended way):**

```bash
cargo build -p abcodefun --release

# Launch with the correct cwd
(cd abcodefun && ../target/release/abcodefun)

# During development
(cd abcodefun && cargo run -p abcodefun)
```

**Working inside the package directory:**

```bash
cd abcodefun
cargo run -p abcodefun
```

### Calling the API

```bash
curl -X POST http://localhost:3001/invoke/hello \
  -H "Content-Type: application/json" \
  -d '{"name": "World", "message": "Hello from ABCode!"}'

curl http://localhost:3001/health
```

## Function Structure

Functions are stored in the `./functions/` directory relative to the process current working directory when the server starts.

Example file:

```abcode
# abcodefun/functions/hello.abc
echo: "Function: " + event.name
echo: "Message: " + event.message
```

Because of the workspace layout, the canonical pattern is:

```bash
(cd abcodefun && ../target/release/abcodefun)
```

## Workspace notes

Rebuilding after you changed `abcodelib` or any other member only rebuilds what Cargo deems necessary. All heavy dependencies (including Boa) are shared.

```bash
cargo build -p abcodefun --release   # incremental most of the time
```

The `event` variable is automatically injected with the request payload.

---
© 2021-2026 by César Andres Arcila Buitrago
