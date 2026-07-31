use boa_engine::{
    Context, JsString, JsValue, Source,
    object::{builtins::JsArray, ObjectInitializer},
    property::Attribute,
};
use rust_embed::RustEmbed;

#[derive(RustEmbed)]
#[folder = "../abcodejs/"]
struct Asset;

/// Result of compiling ABCode source to a target language.
pub struct CompileResult {
    pub code: String,
    pub console_messages: String,
    pub file_extension: String,
}

/// Result of executing JavaScript (with abchelper console capture).
pub struct ExecuteResult {
    /// Captured console messages from `getConsole()`.
    pub logs: String,
    /// `JSON.stringify` of the script completion value, when defined.
    pub value_json: Option<String>,
}

/// Human-readable list of supported targets (CLI help text).
pub const TARGETS_HELP: &str = "Target language or runtime:\n\
0. Binary (native via scriptc/perry), 1. NodeJS/Bun, 2. Deno, 3. Wasm, 4. Kotlin, \
5. Java (JBang), 6. Python, 7. Go, 8. PHP, 9. C# (.NET)";

/// File extension for a target language (including the leading dot).
/// Target 0 emits Node-compatible JS intermediate for AOT binary tools.
pub fn file_extension(target: i32) -> &'static str {
    match target {
        0 => ".js",
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
    }
}

/// Short display name for a target.
pub fn target_name(target: i32) -> &'static str {
    match target {
        0 => "Binary",
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
    }
}

/// Static post-compile info message for a target, if any.
pub fn target_info(target: i32) -> Option<&'static str> {
    match target {
        0 => Some(
            "INFO => Same JS intermediate as target 1 (uses node.js transpiler).\n\
             Build native binary with (npm i -g either):\n\
               PerryTS (recommended): perry compile <file>.js -o <name>\n\
               scriptc (smaller binaries): scriptc build <file>.js -o <name>",
        ),
        1 => Some(
            "INFO => You must include first a \"package.json\" file with \"restana\" module if it is a WebServer",
        ),
        2 => Some("INFO => You can compile it executing: deno compile ..."),
        3 => Some("INFO => try \"cd run & npx asc ... --outFile ...\" with your environment"),
        4 => Some(
            "INFO => You must include \"-cp path/javalib/*\" or use \"gradle\" (even \"maven\") if it is a WebServer",
        ),
        5 => Some(
            "INFO => Unless using JBang, you must include \"-cp path/javalib/*\" or use \"gradle\" (even \"maven\") if it is a WebServer",
        ),
        6 => Some("INFO => You must install first \"pip install bottle\" if it is a WebServer"),
        7 => Some("INFO => try \"cd run & go run ...\" with your environment"),
        8 => Some("INFO => You must install first \"composer install\" if it is a WebServer"),
        9 => Some("INFO => try \"cd run & dotnet run\" with your environment"),
        _ => None,
    }
}

fn transpiler_file(target: i32) -> Option<&'static str> {
    match target {
        0 => Some("node.js"),
        1 => Some("node.js"),
        2 => Some("deno.js"),
        3 => Some("wasm.js"),
        4 => Some("kotlin.js"),
        5 => Some("java.js"),
        6 => Some("python.js"),
        7 => Some("go.js"),
        8 => Some("php.js"),
        9 => Some("csharp.js"),
        _ => None,
    }
}

fn load_asset(name: &str) -> Result<String, String> {
    let bytes = Asset::get(name).ok_or_else(|| format!("{name} not found"))?;
    String::from_utf8(bytes.data.to_vec()).map_err(|_| format!("Invalid UTF-8 in {name}"))
}

/// Concatenated JS sources for the compiler (helper + core + target transpiler).
/// Useful for debug dumps (`run/abcodec.js`).
pub fn compiler_source(target: i32) -> Result<String, String> {
    let transpiler = transpiler_file(target)
        .ok_or_else(|| format!("Unsupported target: {target}"))?;
    Ok(format!(
        "{}{}{}",
        load_asset("abchelper.js")?,
        load_asset("abcode.js")?,
        load_asset(transpiler)?
    ))
}

/// Map an input path under `abc/` to the corresponding `run/` output path.
pub fn output_path(script_file: &str, target: i32) -> String {
    let extension = file_extension(target);
    let newfile = if let Some(pos) = script_file.find("abc") {
        let (before, after) = script_file.split_at(pos);
        format!("{before}run{}", &after[3..])
    } else {
        script_file.to_string()
    };
    newfile.replace(".abc", extension)
}

/// Compile ABCode source to the given target language.
pub fn compile(target: i32, script_code: &str, plan: &str) -> Result<CompileResult, String> {
    let compiler = compiler_source(target)?;

    let mut context = Context::default();
    let script = Source::from_bytes(compiler.as_bytes());
    context
        .eval(script)
        .map_err(|e| format!("Compiler evaluation error: {e}"))?;

    let key = JsString::from("start");
    let binding = context
        .global_object()
        .get(key, &mut context)
        .map_err(|e| format!("Failed to get start function: {e}"))?;
    let start_fn = binding.as_callable().ok_or("start is not a function")?;

    let script_code_val = JsValue::new(JsString::from(script_code));
    let plan_val = JsValue::new(JsString::from(plan));
    let args = vec![script_code_val, plan_val];

    let result = start_fn
        .call(&JsValue::undefined(), &args, &mut context)
        .map_err(|e| format!("Compilation error: {e}"))?;

    let code = result
        .as_string()
        .ok_or("Compiler did not return a string")?
        .to_std_string()
        .map_err(|_| "Failed to convert result to UTF-8")?;

    let console_messages = call_get_console(&mut context)?;

    let final_console_messages = match target_info(target) {
        Some(info) => format!("{console_messages}\n\n{info}"),
        None => console_messages,
    };

    Ok(CompileResult {
        code,
        console_messages: final_console_messages,
        file_extension: file_extension(target).to_string(),
    })
}

/// Execute JavaScript with `abchelper.js` (console capture) loaded first.
pub fn execute_js(js_code: &str) -> Result<ExecuteResult, String> {
    execute_js_with_argv(js_code, &[])
}

/// Execute JavaScript with `abchelper.js` and a `process.argv` array.
///
/// The first element of `argv` is the script name (convention: `process.argv[0]`).
/// The rest are the user-provided arguments. When `argv` is empty, no `process`
/// global is injected (backwards-compatible with plain `execute_js`).
pub fn execute_js_with_argv(js_code: &str, argv: &[String]) -> Result<ExecuteResult, String> {
    let mut context = Context::default();

    let helper = load_asset("abchelper.js")?;
    context
        .eval(Source::from_bytes(helper.as_bytes()))
        .map_err(|e| format!("Helper setup error: {e}"))?;

    // Inject process.argv if arguments were provided
    if !argv.is_empty() {
        let js_argv: Vec<JsValue> = argv
            .iter()
            .map(|s| JsValue::new(JsString::from(s.as_str())))
            .collect();
        let js_argv_array = JsArray::from_iter(js_argv, &mut context);

        let process_obj = ObjectInitializer::new(&mut context)
            .property(
                JsString::from("argv"),
                JsValue::from(js_argv_array),
                Attribute::empty(),
            )
            .build();

        let process_val = JsValue::new(process_obj);
        context
            .global_object()
            .set(JsString::from("process"), process_val, false, &mut context)
            .map_err(|e| format!("Failed to set process global: {e}"))?;
    }

    let result = context
        .eval(Source::from_bytes(js_code.as_bytes()))
        .map_err(|e| format!("JavaScript execution error: {e}"))?;

    let logs = call_get_console(&mut context)?;

    let value_json = if result.is_undefined() {
        None
    } else {
        Some(json_stringify(&mut context, result)?)
    };

    Ok(ExecuteResult { logs, value_json })
}

fn call_get_console(context: &mut Context) -> Result<String, String> {
    let key = JsString::from("getConsole");
    let binding = context
        .global_object()
        .get(key, context)
        .map_err(|e| format!("Failed to get getConsole function: {e}"))?;
    let get_console = binding
        .as_callable()
        .ok_or("getConsole is not a function")?;
    let result = get_console
        .call(&JsValue::undefined(), &[], context)
        .map_err(|e| format!("Failed to call getConsole: {e}"))?;
    result
        .as_string()
        .ok_or("getConsole did not return a string")?
        .to_std_string()
        .map_err(|_| "Failed to convert console messages to UTF-8".to_string())
}

fn json_stringify(context: &mut Context, value: JsValue) -> Result<String, String> {
    let json_key = JsString::from("JSON");
    let json_obj = context
        .global_object()
        .get(json_key, context)
        .map_err(|e| format!("Failed to get JSON object: {e}"))?;

    let stringify_key = JsString::from("stringify");
    let stringify_fn = json_obj
        .as_object()
        .ok_or("JSON is not an object")?
        .get(stringify_key, context)
        .map_err(|e| format!("Failed to get JSON.stringify: {e}"))?;

    let stringify_fn = stringify_fn
        .as_callable()
        .ok_or("JSON.stringify is not a function")?;

    let json_result = stringify_fn
        .call(&JsValue::undefined(), &[value], context)
        .map_err(|e| format!("Failed to call JSON.stringify: {e}"))?;

    json_result
        .as_string()
        .ok_or("JSON.stringify did not return a string")?
        .to_std_string()
        .map_err(|_| "Failed to convert JSON string to UTF-8".to_string())
}
