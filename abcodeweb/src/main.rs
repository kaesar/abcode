use feather::*;
use serde::{Deserialize, Serialize};
use std::error::Error;
use abcodelib::compile;
use std::thread;
use std::sync::mpsc;

const PORT: u16 = 3000;

#[derive(Deserialize)]
struct CompileRequest {
    target: i32,
    code: String,
    plan: Option<String>,
}

#[derive(Serialize)]
struct CompileResponse {
    success: bool,
    code: Option<String>,
    console_messages: Option<String>,
    file_extension: Option<String>,
    error: Option<String>,
}

#[derive(Serialize)]
struct PreviewResponse {
    target: String,
    preview: String,
}

fn main() {
    let mut app = App::new();
    
    app.get("/", |_req: &mut Request, res: &mut Response, _ctx: &AppContext| -> Result<MiddlewareResult, Box<dyn Error>> {
        res.body = Some(render_interface().into_bytes().into());
        let _ = res.add_header("Content-Type", "text/html");
        Ok(MiddlewareResult::Next)
    });
    
    app.get("/abcode-mode.js", |_req: &mut Request, res: &mut Response, _ctx: &AppContext| -> Result<MiddlewareResult, Box<dyn Error>> {
        let js_content = include_str!("../static/abcode-mode.js");
        res.body = Some(js_content.to_string().into_bytes().into());
        let _ = res.add_header("Content-Type", "application/javascript");
        Ok(MiddlewareResult::Next)
    });
    
    app.post("/api/compile", |req: &mut Request, res: &mut Response, _ctx: &AppContext| -> Result<MiddlewareResult, Box<dyn Error>> {
        let result = handle_compile(req);
        let json_result = serde_json::to_string(&result).unwrap();
        res.body = Some(json_result.into_bytes().into());
        let _ = res.add_header("Content-Type", "application/json");
        Ok(MiddlewareResult::Next)
    });
    
    app.post("/api/preview", |req: &mut Request, res: &mut Response, _ctx: &AppContext| -> Result<MiddlewareResult, Box<dyn Error>> {
        let result = handle_preview(req);
        let json_result = serde_json::to_string(&result).unwrap();
        res.body = Some(json_result.into_bytes().into());
        let _ = res.add_header("Content-Type", "application/json");
        Ok(MiddlewareResult::Next)
    });
    
    println!("ABCode Web running on http://localhost:{}", PORT);
    app.listen(&format!("127.0.0.1:{}", PORT));
}

fn render_interface() -> String {
    r#"<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ABCode Web - Compiler</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/ace/1.32.6/ace.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/ace/1.32.6/mode-yaml.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/ace/1.32.6/mode-javascript.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/ace/1.32.6/mode-python.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/ace/1.32.6/mode-java.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/ace/1.32.6/mode-kotlin.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/ace/1.32.6/mode-golang.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/ace/1.32.6/mode-rust.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/ace/1.32.6/mode-php.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/ace/1.32.6/mode-csharp.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/ace/1.32.6/mode-typescript.js"></script>
    <script src="/abcode-mode.js"></script>
</head>
<body class="bg-gray-900 text-white">
    <nav class="bg-gray-800 p-4">
        <div class="flex items-center justify-between">
            <h1 class="text-xl font-bold">ABCode Web - Compiler</h1>
        </div>
    </nav>
    
    <div class="flex h-screen">
        <div class="w-1/2 p-4">
            <div class="mb-4 flex items-center space-x-4">
                <label class="text-sm">Target:</label>
                <select id="target" class="bg-gray-800 text-white px-3 py-1 rounded">
                    <option value="0">Rust</option>
                    <option value="1" selected>NodeJS</option>
                    <option value="2">Deno</option>
                    <option value="3">WebAssembly</option>
                    <option value="4">Kotlin</option>
                    <option value="5">Java</option>
                    <option value="6">Python</option>
                    <option value="7">Go</option>
                    <option value="8">PHP</option>
                    <option value="9">C#</option>
                </select>
                <button id="compile" class="bg-blue-600 hover:bg-blue-700 px-4 py-1 rounded">Compile</button>
                <button id="preview" class="bg-green-600 hover:bg-green-700 px-4 py-1 rounded">Preview</button>
            </div>
            <div id="editor" class="h-5/6 border border-gray-700 rounded"></div>
        </div>
        
        <div class="w-1/2 p-4">
            <h3 class="text-lg font-bold mb-4">Output / Preview</h3>
            <div id="output" class="bg-gray-800 p-4 h-5/6 rounded overflow-auto font-mono text-sm"></div>
            <div id="preview-editor" class="h-5/6 border border-gray-700 rounded" style="display:none;"></div>
        </div>
    </div>

    <script>
        const editor = ace.edit("editor");
        editor.setTheme("ace/theme/monokai");
        editor.session.setMode("ace/mode/abcode");
        
        const previewEditor = ace.edit("preview-editor");
        previewEditor.setTheme("ace/theme/monokai");
        previewEditor.setReadOnly(true);
        
        const targetModes = {
            0: "ace/mode/rust",
            1: "ace/mode/javascript", 
            2: "ace/mode/typescript",
            3: "ace/mode/typescript",
            4: "ace/mode/kotlin",
            5: "ace/mode/java",
            6: "ace/mode/python",
            7: "ace/mode/golang",
            8: "ace/mode/javascript",
            9: "ace/mode/csharp"
        };
        
        editor.setValue(`goal: any
#type: Hello

fun: myFunction()
  echo: "Hello there!"
  like: System.out.print("Hola mundo") #in: java

run: myFunction()`);

        document.getElementById('compile').onclick = () => {
            const code = editor.getValue();
            const target = document.getElementById('target').value;
            
            fetch('/api/compile', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({target: parseInt(target), code: code, plan: '*'})
            })
            .then(r => r.json())
            .then(data => {
                document.getElementById('preview-editor').style.display = 'none';
                document.getElementById('output').style.display = 'block';
                document.querySelector('h3').textContent = 'Output / Preview';
                
                if (data.success) {
                    document.getElementById('output').innerHTML = `<pre class="text-green-400">${data.console_messages}</pre>`;
                } else {
                    document.getElementById('output').innerHTML = `<pre class="text-red-400">${data.error}</pre>`;
                }
            });
        };

        document.getElementById('preview').onclick = () => {
            const code = editor.getValue();
            const target = document.getElementById('target').value;
            
            const startTime = performance.now();
            fetch('/api/preview', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({target: parseInt(target), code: code, plan: '*'})
            })
            .then(r => r.json())
            .then(data => {
                const endTime = performance.now();
                const duration = (endTime - startTime).toFixed(2);
                
                document.getElementById('output').style.display = 'none';
                document.getElementById('preview-editor').style.display = 'block';
                
                const mode = targetModes[target] || 'ace/mode/text';
                previewEditor.session.setMode(mode);
                previewEditor.setValue(data.preview, -1);
                
                document.querySelector('h3').textContent = `${data.target} Preview (${duration}ms)`;
            });
        };
    </script>
</body>
</html>"#.to_string()
}

fn handle_compile(req: &mut Request) -> CompileResponse {
    let body_str = std::str::from_utf8(&req.body).unwrap_or("");
    let compile_req: CompileRequest = match serde_json::from_str(body_str) {
        Ok(req) => req,
        Err(_) => {
            return CompileResponse {
                success: false,
                code: None,
                console_messages: None,
                file_extension: None,
                error: Some("Invalid JSON".to_string()),
            };
        }
    };
    
    // Use thread with larger stack to avoid overflow
    let (tx, rx) = mpsc::channel();
    let target = compile_req.target;
    let code = compile_req.code.clone();
    let plan = compile_req.plan.unwrap_or_else(|| "*".to_string());
    
    thread::Builder::new()
        .stack_size(8 * 1024 * 1024) // 8MB stack
        .spawn(move || {
            let result = compile(target, &code, &plan);
            tx.send(result).unwrap();
        })
        .unwrap();
    
    match rx.recv().unwrap() {
        Ok(result) => {
            // Combine console messages with generated code like the original compiler
            let full_output = format!(
                "{}\n---\nGenerating...\n---\n{}", 
                result.console_messages, 
                result.code
            );
            
            CompileResponse {
                success: true,
                code: Some(result.code),
                console_messages: Some(full_output),
                file_extension: Some(result.file_extension),
                error: None,
            }
        },
        Err(error) => CompileResponse {
            success: false,
            code: None,
            console_messages: None,
            file_extension: None,
            error: Some(error),
        },
    }
}

fn handle_preview(req: &mut Request) -> PreviewResponse {
    let body_str = std::str::from_utf8(&req.body).unwrap_or("");
    let compile_req: CompileRequest = match serde_json::from_str(body_str) {
        Ok(req) => req,
        Err(_) => {
            return PreviewResponse {
                target: "Error".to_string(),
                preview: "Invalid JSON request".to_string(),
            };
        }
    };
    
    let target_name = get_target_name(compile_req.target);
    
    // Use thread with larger stack to avoid overflow
    let (tx, rx) = mpsc::channel();
    let target = compile_req.target;
    let code = compile_req.code.clone();
    let plan = compile_req.plan.unwrap_or_else(|| "*".to_string());
    
    thread::Builder::new()
        .stack_size(8 * 1024 * 1024) // 8MB stack
        .spawn(move || {
            let result = compile(target, &code, &plan);
            tx.send(result).unwrap();
        })
        .unwrap();
    
    match rx.recv().unwrap() {
        Ok(result) => PreviewResponse {
            target: target_name,
            preview: result.code,
        },
        Err(error) => PreviewResponse {
            target: target_name,
            preview: format!("Compilation error: {}", error),
        },
    }
}

fn get_target_name(target: i32) -> String {
    match target {
        0 => "Rust",
        1 => "NodeJS",
        2 => "Deno",
        3 => "WebAssembly",
        4 => "Kotlin",
        5 => "Java",
        6 => "Python",
        7 => "Go",
        8 => "PHP",
        9 => "C#",
        _ => "NodeJS",
    }.to_string()
}