use feather::*;
use feather::jwt::{JwtManager, SimpleClaims};
use serde::Serialize;
use std::error::Error;
use std::fs;
use std::path::Path;
use std::sync::mpsc;
use std::thread;
use abcodelib::{compile, execute_js};

const DEFAULT_PORT: u16 = 3001;

#[derive(Serialize)]
struct InvokeResponse {
    status_code: u16,
    body: Option<serde_json::Value>,
    logs: Option<String>,
    error: Option<String>,
    execution_time_ms: u64,
}

fn main() {
    let mut app = App::new();

    // Initialize auth config from environment
    let auth_config = AuthConfig::from_env();
    let auth_mode = if auth_config.jwt_manager.is_some() { "JWT" } else { "NoAuth" };

    // Add auth middleware (NoAuth if JWT_SECRET not set)
    app.use_middleware(auth_middleware(auth_config));

    app.post(
        "/invoke/:function_name",
        |req: &mut Request, res: &mut Response, _ctx: &AppContext| -> Result<MiddlewareResult, Box<dyn Error>> {
            let function_name = req.param("function_name").unwrap_or("unknown").to_string();
            let result = handle_invoke(req, &function_name);
            let json_result = serde_json::to_string(&result).unwrap();
            res.body = Some(json_result.into_bytes().into());
            let _ = res.add_header("Content-Type", "application/json");
            Ok(MiddlewareResult::Next)
        },
    );

    app.get(
        "/health",
        move |_req: &mut Request, res: &mut Response, _ctx: &AppContext| -> Result<MiddlewareResult, Box<dyn Error>> {
            let health = serde_json::json!({
                "status": "healthy",
                "service": "abcodefun",
                "version": "0.7.0",
                "auth_mode": auth_mode
            });
            res.body = Some(health.to_string().into_bytes().into());
            let _ = res.add_header("Content-Type", "application/json");
            Ok(MiddlewareResult::Next)
        },
    );

    // Support PORT environment variable
    let port = std::env::var("PORT").ok().and_then(|p| p.parse().ok()).unwrap_or(DEFAULT_PORT);

    println!("- ABCodeFun - Serverless ABCode Runtime");
    println!("- Functions directory: ./functions/");
    println!("- Server running on http://localhost:{}", port);
    println!("- Endpoints:");
    println!("   POST /invoke/:function_name - Execute ABCode function");
    println!("   GET  /health - Health check");

    app.listen(&format!("127.0.0.1:{}", port));
}

/// Authentication configuration - supports NoAuth mode (default) or JWT mode
struct AuthConfig {
    jwt_manager: Option<JwtManager>,
}

impl AuthConfig {
    fn from_env() -> Self {
        // Check for JWT_SECRET environment variable
        if let Ok(secret) = std::env::var("JWT_SECRET") {
            let manager = JwtManager::new(secret);
            println!("- JWT Authentication: ENABLED (HS256)");
            AuthConfig { jwt_manager: Some(manager) }
        } else {
            println!("- JWT Authentication: DISABLED (NoAuth mode)");
            AuthConfig { jwt_manager: None }
        }
    }
}

/// Middleware to extract and validate JWT token
/// If no JWT manager configured, acts as pass-through (NoAuth mode)
fn auth_middleware(auth_config: AuthConfig) -> impl Fn(&mut Request, &mut Response, &AppContext) -> Result<MiddlewareResult, Box<dyn Error>> + 'static {
    move |req: &mut Request, res: &mut Response, _ctx: &AppContext| -> Result<MiddlewareResult, Box<dyn Error>> {
        // If no JWT manager configured, skip auth (NoAuth mode)
        let Some(manager) = &auth_config.jwt_manager else {
            return Ok(MiddlewareResult::Next);
        };

        // Extract token from Authorization header
        let auth_header = req.headers.get("authorization")
            .and_then(|h| h.to_str().ok());

        let token = match auth_header {
            Some(header) if header.starts_with("Bearer ") => &header[7..],
            _ => {
                res.set_status(401);
                res.send_json(&serde_json::json!({
                    "error": "Missing or invalid Authorization header. Expected: Bearer <token>"
                }));
                return Ok(MiddlewareResult::End);
            }
        };

        // Validate token
        match manager.decode::<SimpleClaims>(token) {
            Ok(claims) => {
                // Store claims in request extensions for downstream use
                // Arc implements Clone so it works with Extensions::insert
                req.extensions.insert(std::sync::Arc::new(claims));
                Ok(MiddlewareResult::Next)
            }
            Err(e) => {
                res.set_status(401);
                res.send_json(&serde_json::json!({
                    "error": format!("Invalid token: {}", e)
                }));
                Ok(MiddlewareResult::End)
            }
        }
    }
}

fn handle_invoke(req: &mut Request, function_name: &str) -> InvokeResponse {
    let start_time = std::time::Instant::now();

    let body_str = std::str::from_utf8(&req.body).unwrap_or("");
    let event: serde_json::Value = match serde_json::from_str(body_str) {
        Ok(event) => event,
        Err(_) => {
            return InvokeResponse {
                status_code: 400,
                body: None,
                logs: None,
                error: Some("Invalid JSON request".to_string()),
                execution_time_ms: start_time.elapsed().as_millis() as u64,
            };
        }
    };

    let function_path = format!("functions/{}.abc", function_name);
    if !Path::new(&function_path).exists() {
        return InvokeResponse {
            status_code: 404,
            body: None,
            logs: None,
            error: Some(format!("Function '{}' not found", function_name)),
            execution_time_ms: start_time.elapsed().as_millis() as u64,
        };
    }

    let abcode_source = match fs::read_to_string(&function_path) {
        Ok(content) => content,
        Err(e) => {
            return InvokeResponse {
                status_code: 500,
                body: None,
                logs: None,
                error: Some(format!("Failed to read function: {}", e)),
                execution_time_ms: start_time.elapsed().as_millis() as u64,
            };
        }
    };

    let enhanced_abcode = format!(
        "# Event injection\nvar: event = {}\n\n{}",
        event.to_string(),
        abcode_source
    );

    let (tx, rx) = mpsc::channel();

    thread::Builder::new()
        .stack_size(8 * 1024 * 1024)
        .spawn(move || {
            let result = compile(1, &enhanced_abcode, "*");
            tx.send(result).unwrap();
        })
        .unwrap();

    match rx.recv().unwrap() {
        Ok(compile_result) => match execute_function(&compile_result.code) {
            Ok((return_value, logs)) => InvokeResponse {
                status_code: 200,
                body: return_value,
                logs: Some(logs),
                error: None,
                execution_time_ms: start_time.elapsed().as_millis() as u64,
            },
            Err(error) => InvokeResponse {
                status_code: 500,
                body: None,
                logs: None,
                error: Some(format!("Execution error: {}", error)),
                execution_time_ms: start_time.elapsed().as_millis() as u64,
            },
        },
        Err(error) => InvokeResponse {
            status_code: 500,
            body: None,
            logs: None,
            error: Some(format!("Compilation error: {}", error)),
            execution_time_ms: start_time.elapsed().as_millis() as u64,
        },
    }
}

fn execute_function(js_code: &str) -> Result<(Option<serde_json::Value>, String), String> {
    let exec = execute_js(js_code)?;

    let return_value = match exec.value_json {
        Some(json_str) => match serde_json::from_str(&json_str) {
            Ok(json_val) => Some(json_val),
            Err(_) => Some(serde_json::Value::String(json_str)),
        },
        None => None,
    };

    Ok((return_value, exec.logs))
}