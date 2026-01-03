use rust_embed::RustEmbed;
use boa_engine::{Context, Source, JsValue, JsString};

#[derive(RustEmbed)]
#[folder = "../abcodejs/"]
pub struct Asset;

pub struct CompileResult {
    pub code: String,
    pub console_messages: String,
    pub file_extension: String,
}

pub fn compile(target: i32, script_code: &str, plan: &str) -> Result<CompileResult, String> {
    let pre_header_bytes = Asset::get("abchelper.js")
        .ok_or("abchelper.js not found")?;
    let pre_header_code = String::from_utf8(pre_header_bytes.data.to_vec())
        .map_err(|_| "Invalid UTF-8 in abchelper.js")?;
    
    let header_bytes = Asset::get("abcode.js")
        .ok_or("abcode.js not found")?;
    let header_code = String::from_utf8(header_bytes.data.to_vec())
        .map_err(|_| "Invalid UTF-8 in abcode.js")?;

    let transpiler_file = match target {
        0 => "rust.js",
        1 => "node.js",
        2 => "deno.js",
        3 => "wasm.js",
        4 => "kotlin.js",
        5 => "java.js",
        6 => "python.js",
        7 => "go.js",
        8 => "php.js",
        9 => "csharp.js",
        _ => return Err(format!("Unsupported target: {}", target)),
    };

    let transpiler_bytes = Asset::get(transpiler_file)
        .ok_or_else(|| format!("Transpiler {} not found", transpiler_file))?;
    let transpiler_code = String::from_utf8(transpiler_bytes.data.to_vec())
        .map_err(|_| format!("Invalid UTF-8 in {}", transpiler_file))?;

    let compiler = format!("{}{}{}", pre_header_code, header_code, transpiler_code);

    let mut context = Context::default();
    let script = Source::from_bytes(compiler.as_bytes());
    context.eval(script)
        .map_err(|e| format!("Compiler evaluation error: {}", e))?;

    let key = JsString::from("start");
    let binding = context.global_object().get(key, &mut context)
        .map_err(|e| format!("Failed to get start function: {}", e))?;
    let start_fn = binding.as_callable()
        .ok_or("start is not a function")?;

    let script_code_val = JsValue::new(JsString::from(script_code));
    let plan_val = JsValue::new(JsString::from(plan));
    let args = vec![script_code_val, plan_val];

    let result = start_fn.call(&JsValue::undefined(), &args, &mut context)
        .map_err(|e| format!("Compilation error: {}", e))?;
    
    let code = result.as_string()
        .ok_or("Compiler did not return a string")?
        .to_std_string()
        .map_err(|_| "Failed to convert result to UTF-8")?;

    let console_messages_key = JsString::from("getConsole");
    let console_messages_fn = context.global_object()
        .get(console_messages_key, &mut context)
        .map_err(|_| "Failed to get getConsole function")?;
    let console_messages_fn = console_messages_fn.as_callable()
        .ok_or("getConsole is not a function")?;
    let console_messages_result = console_messages_fn
        .call(&JsValue::undefined(), &[], &mut context)
        .map_err(|_| "Failed to call getConsole")?;
    let console_messages = console_messages_result.as_string()
        .ok_or("getConsole did not return a string")?
        .to_std_string()
        .map_err(|_| "Failed to convert console messages to UTF-8")?;

    let file_extension = match target {
        0 => ".rs",
        1 => ".js",
        2 => ".ts",
        3 => ".ts",
        4 => ".kt",
        5 => ".java",
        6 => ".py",
        7 => ".go",
        8 => ".php",
        9 => ".cs",
        _ => ".js",
    }.to_string();

    // Add INFO messages like the original compiler
    let info_message = match target {
        0 => "INFO => try \"cd run & cargo run\" with your environment",
        1 => "INFO => You must include first a \"package.json\" file with \"restana\" module if it is a WebServer",
        2 => "INFO => You can compile it executing: deno compile ...",
        3 => "INFO => try \"cd run & npx asc ... --outFile ...\" with your environment",
        4 => "INFO => You must include \"-cp path/javalib/*\" or use \"gradle\" (even \"maven\") if it is a WebServer",
        5 => "INFO => Unless using JBang, you must include \"-cp path/javalib/*\" or use \"gradle\" (even \"maven\") if it is a WebServer",
        6 => "INFO => You must install first \"pip install bottle\" if it is a WebServer",
        7 => "INFO => try \"cd run & go run ...\" with your environment",
        8 => "INFO => You must install first \"composer install\" if it is a WebServer",
        9 => "INFO => try \"cd run & dotnet run\" with your environment",
        _ => "",
    };

    let final_console_messages = if !info_message.is_empty() {
        format!("{}\n\n{}", console_messages, info_message)
    } else {
        console_messages
    };

    Ok(CompileResult {
        code,
        console_messages: final_console_messages,
        file_extension,
    })
}