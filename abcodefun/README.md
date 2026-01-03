# ABCodeFun - ABCode Web Runtime for Funtions

AWS Lambda-style web execution platform for ABCode functions, thinking in serverless.

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

```bash
# Start server
cargo run

# Execute hello function
curl -X POST http://localhost:3001/invoke/hello \
  -H "Content-Type: application/json" \
  -d '{"name": "World", "message": "Hello from ABCode!"}'

# Health check
curl http://localhost:3001/health
```

## Function Structure

Functions are stored in `./functions/` directory as `.abc` files:

```javascript
// functions/hello.abc
console.log("Function:", event.name)
console.log("Message:", event.message)
```

The `event` variable is automatically injected with the request payload.

---
© 2026 by César Andres Arcila Buitrago