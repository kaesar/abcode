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

## Authentication

abcodefun supports two authentication modes controlled by the `JWT_SECRET` environment variable:

### NoAuth Mode (Default)

When `JWT_SECRET` is **not set**, the server runs in NoAuth mode - no authentication is required. This is the default behavior for development, testing, or when authentication is handled by an external layer (API Gateway, reverse proxy, etc.).

```bash
# No authentication required
./target/release/abcodefun

curl -X POST http://localhost:3001/invoke/hello \
  -H "Content-Type: application/json" \
  -d '{"name": "World"}'

curl http://localhost:3001/health
# {"auth_mode":"NoAuth","service":"abcodefun","status":"healthy","version":"0.7.0"}
```

### JWT Mode (Optional)

When `JWT_SECRET` is **set**, JWT authentication is enabled. All endpoints require a valid `Authorization: Bearer <token>` header.

```bash
# Enable JWT authentication
JWT_SECRET="your-secure-secret-key" ./target/release/abcodefun

# Requests must include valid JWT token
TOKEN="<your-jwt-token>"
curl -H "Authorization: Bearer $TOKEN" \
  -X POST http://localhost:3001/invoke/hello \
  -H "Content-Type: application/json" \
  -d '{"name": "World"}'

curl -H "Authorization: Bearer $TOKEN" http://localhost:3001/health
# {"auth_mode":"JWT","service":"abcodefun","status":"healthy","version":"0.7.0"}
```

**Token format:** HS256 with `sub` (subject) and `exp` (expiration timestamp) claims.

```python
import jwt
token = jwt.encode({'sub': 'user123', 'exp': 9999999999}, 'your-secret-key', algorithm='HS256')
```

### Health Endpoint

The `/health` endpoint always responds (even in JWT mode without token) and shows the current auth mode:
```json
{"auth_mode":"NoAuth","service":"abcodefun","status":"healthy","version":"0.7.0"}
{"auth_mode":"JWT","service":"abcodefun","status":"healthy","version":"0.7.0"}
```

## Configuration

### Port

Configure the server port via the `PORT` environment variable (default: 3001):

```bash
PORT=8080 ./target/release/abcodefun
```

### JWT Secret

Set the JWT signing secret via `JWT_SECRET`:

```bash
JWT_SECRET="your-secure-random-secret" ./target/release/abcodefun
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
# NoAuth mode
curl -X POST http://localhost:3001/invoke/hello \
  -H "Content-Type: application/json" \
  -d '{"name": "World", "message": "Hello from ABCode!"}'

curl http://localhost:3001/health

# JWT mode (requires valid token)
curl -H "Authorization: Bearer $TOKEN" \
  -X POST http://localhost:3001/invoke/hello \
  -H "Content-Type: application/json" \
  -d '{"name": "World", "message": "Hello from ABCode!"}'

curl -H "Authorization: Bearer $TOKEN" http://localhost:3001/health
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
