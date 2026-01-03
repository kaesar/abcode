use feather::*;
use serde::Serialize;
use std::error::Error;
use std::fs;
use std::path::Path;
use std::thread;
use std::sync::mpsc;
use abcodelib::compile;

const PORT: u16 = 3001;

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
    
    app.post("/invoke/:function_name", |req: &mut Request, res: &mut Response, _ctx: &AppContext| -> Result<MiddlewareResult, Box<dyn Error>> {
        let function_name = req.param("function_name").unwrap_or("unknown").to_string();
        let result = handle_invoke(req, &function_name);
        let json_result = serde_json::to_string(&result).unwrap();
        res.body = Some(json_result.into_bytes().into());
        let _ = res.add_header("Content-Type", "application/json");
        Ok(MiddlewareResult::Next)
    });
    
    app.get("/health", |_req: &mut Request, res: &mut Response, _ctx: &AppContext| -> Result<MiddlewareResult, Box<dyn Error>> {
        let health = serde_json::json!({
            "status": "healthy",
            "service": "abcodefun",
            "version": "0.6.0"
        });
        res.body = Some(health.to_string().into_bytes().into());
        let _ = res.add_header("Content-Type", "application/json");
        Ok(MiddlewareResult::Next)
    });
    
    println!("- ABCodeFun - Serverless ABCode Runtime");
    println!("- Functions directory: ./functions/");
    println!("- Server running on http://localhost:{}", PORT);
    println!("- Endpoints:");
    println!("   POST /invoke/:function_name - Execute ABCode function");
    println!("   GET  /health - Health check");
    
    app.listen(&format!("127.0.0.1:{}", PORT));
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
    
    // Load ABCode function from functions directory
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
    
    // Inject event into ABCode context
    let enhanced_abcode = format!(
        "# Event injection\nvar: event = {}\n\n{}", 
        event.to_string(),
        abcode_source
    );
    
    // Execute ABCode function in separate thread with larger stack
    let (tx, rx) = mpsc::channel();
    
    thread::Builder::new()
        .stack_size(8 * 1024 * 1024) // 8MB stack
        .spawn(move || {
            let result = compile(1, &enhanced_abcode, "*"); // Target 1 = NodeJS
            tx.send(result).unwrap();
        })
        .unwrap();
    
    match rx.recv().unwrap() {
        Ok(compile_result) => {
            // Execute the compiled JavaScript and capture output
            match execute_function(&compile_result.code) {
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
            }
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
    use boa_engine::{Context, Source};
    
    let mut context = Context::default();
    
    // Load abchelper.js for console support
    let pre_header_bytes = abcodelib::Asset::get("abchelper.js")
        .ok_or("abchelper.js not found")?;
    let pre_header_code = String::from_utf8(pre_header_bytes.data.to_vec())
        .map_err(|_| "Invalid UTF-8 in abchelper.js")?;
    
    // Execute abchelper.js
    let helper_source = Source::from_bytes(pre_header_code.as_bytes());
    context.eval(helper_source)
        .map_err(|e| format!("Helper setup error: {}", e))?;

    // Execute the compiled JavaScript
    let js_source = Source::from_bytes(js_code.as_bytes());
    let result = context.eval(js_source)
        .map_err(|e| format!("JavaScript execution error: {}", e))?;

    // Get console messages (logs)
    let console_messages_key = boa_engine::JsString::from("getConsole");
    let console_messages_fn = context
        .global_object()
        .get(console_messages_key, &mut context)
        .map_err(|e| format!("Failed to get getConsole: {}", e))?;
    let console_messages_fn = console_messages_fn
        .as_callable()
        .ok_or("getConsole is not a function")?;
    let console_messages_result = console_messages_fn
        .call(&boa_engine::JsValue::undefined(), &[], &mut context)
        .map_err(|e| format!("Failed to call getConsole: {}", e))?;
    let logs = console_messages_result.as_string()
        .ok_or("getConsole did not return a string")?
        .to_std_string()
        .map_err(|_| "Failed to convert console messages to UTF-8")?;

    // Parse return value as JSON if it's not undefined
    let return_value = if result.is_undefined() {
        None
    } else {
        // Try to get JSON representation using JSON.stringify
        let stringify_key = boa_engine::JsString::from("JSON");
        let json_obj = context
            .global_object()
            .get(stringify_key, &mut context)
            .map_err(|e| format!("Failed to get JSON object: {}", e))?;
        
        let stringify_key = boa_engine::JsString::from("stringify");
        let stringify_fn = json_obj
            .as_object()
            .ok_or("JSON is not an object")?
            .get(stringify_key, &mut context)
            .map_err(|e| format!("Failed to get JSON.stringify: {}", e))?;
        
        let stringify_fn = stringify_fn
            .as_callable()
            .ok_or("JSON.stringify is not a function")?;
        
        let json_result = stringify_fn
            .call(&boa_engine::JsValue::undefined(), &[result], &mut context)
            .map_err(|e| format!("Failed to call JSON.stringify: {}", e))?;
        
        let json_str = json_result.as_string()
            .ok_or("JSON.stringify did not return a string")?
            .to_std_string()
            .map_err(|_| "Failed to convert JSON string to UTF-8")?;
        
        match serde_json::from_str(&json_str) {
            Ok(json_val) => Some(json_val),
            Err(_) => Some(serde_json::Value::String(json_str)),
        }
    };

    Ok((return_value, logs))
}