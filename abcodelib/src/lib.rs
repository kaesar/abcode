use boa_engine::{
    Context, JsString, Source,
    gc::{empty_trace, Finalize, Trace},
    object::{builtins::JsArray, ObjectInitializer},
    property::Attribute,
    NativeFunction,
};
use std::sync::Arc;
use rust_embed::RustEmbed;

pub use boa_engine::{JsError, JsValue};

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
    // Replace the first "abc" path component with "run", otherwise write to run/.
    let path = std::path::Path::new(script_file);
    let file_name = path
        .file_name()
        .and_then(|name| name.to_str())
        .unwrap_or(script_file);
    let stem = file_name.strip_suffix(".abc").unwrap_or(file_name);

    let mut out = std::path::PathBuf::new();
    let mut replaced = false;
    if let Some(parent) = path.parent() {
        for component in parent.components() {
            if !replaced && component.as_os_str() == "abc" {
                out.push("run");
                replaced = true;
            } else {
                out.push(component.as_os_str());
            }
        }
    }

    if !replaced {
        out.clear();
        out.push("run");
    }

    out.push(format!("{stem}{extension}"));
    out.to_string_lossy().to_string()
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
    if argv.is_empty() {
        return execute_js_with_globals(js_code, &[]);
    }

    let js_argv: Vec<JsValue> = argv
        .iter()
        .map(|s| JsValue::new(JsString::from(s.as_str())))
        .collect();
    let mut context = Context::default();

    let js_argv_array = JsArray::from_iter(js_argv, &mut context);
    let process_obj = ObjectInitializer::new(&mut context)
        .property(
            JsString::from("argv"),
            JsValue::from(js_argv_array),
            Attribute::empty(),
        )
        .build();

    let globals = [("process", JsValue::new(process_obj))];
    execute_core(js_code, &globals)
}

/// Execute JavaScript with `abchelper.js` (console capture) and extra host
/// globals registered on the context **before** the script is evaluated.
///
/// Each entry in `globals` is a `(name, value)` pair written to the global
/// object (e.g. a host `services` facade for hex). The helper is always loaded
/// first, so callbacks like `getConsole()` remain available.
pub fn execute_js_with_globals(
    js_code: &str,
    globals: &[(&str, JsValue)],
) -> Result<ExecuteResult, String> {
    execute_core(js_code, globals)
}

fn execute_core(js_code: &str, globals: &[(&str, JsValue)]) -> Result<ExecuteResult, String> {
    let mut context = Context::default();

    let helper = load_asset("abchelper.js")?;
    context
        .eval(Source::from_bytes(helper.as_bytes()))
        .map_err(|e| format!("Helper setup error: {e}"))?;

    for (name, value) in globals {
        context
            .global_object()
            .set(JsString::from(*name), value.clone(), false, &mut context)
            .map_err(|e| format!("Failed to set {name} global: {e}"))?;
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

/// Convert a `serde_json::Value` into a Boa `JsValue` within `context`.
///
/// `hex` uses this to hand Rust facade results (serialized as JSON) to scripts
/// as native JS values.
pub fn js_value_from_json(
    context: &mut Context,
    json: &serde_json::Value,
) -> Result<JsValue, String> {
    JsValue::from_json(json, context).map_err(|e| format!("JSON to JsValue conversion: {e}"))
}

/// A host callable exposed to scripts as a method on the global `services` object.
///
/// The callback receives the raw JSON arguments the script passed and must return
/// a JSON value (or an error string). All Boa internals are hidden from the caller.
pub struct HostService {
    /// Method name on `services` (e.g. `abcSheet`, `sendEmail`).
    pub name: &'static str,
    /// Rust callback backing the method.
    pub callback: Arc<dyn Fn(&[serde_json::Value]) -> Result<serde_json::Value, String> + Send + Sync>,
}

/// Captured handle for a `HostService` callback inside a native Boa function.
struct HostServiceHandle {
    callback: Arc<dyn Fn(&[serde_json::Value]) -> Result<serde_json::Value, String> + Send + Sync>,
}

// The handle only holds a plain Rust closure (no `Gc`/`JsValue`), so tracing is a no-op.
unsafe impl Trace for HostServiceHandle {
    empty_trace!();
}
impl Finalize for HostServiceHandle {}

/// Execute JavaScript with `abchelper.js` and a **global `services` object** whose
/// methods are host callbacks.
///
/// This is the bridge `hex` uses to give ABCode scripts access to infrastructure
/// (XDB, cache, email, S3, events, Lambda…). abcodelib keeps every Boa interaction
/// internal: `hex` only supplies `HostService{ name, callback }` closures.
pub fn execute_js_with_services(
    js_code: &str,
    services: &[HostService],
) -> Result<ExecuteResult, String> {
    let mut context = Context::default();

    let helper = load_asset("abchelper.js")?;
    context
        .eval(Source::from_bytes(helper.as_bytes()))
        .map_err(|e| format!("Helper setup error: {e}"))?;

    let mut builder = ObjectInitializer::new(&mut context);
    for service in services {
        let handle = HostServiceHandle {
            callback: Arc::clone(&service.callback),
        };
        let function = NativeFunction::from_copy_closure_with_captures(
            move |_this, args, capture, context| {
                let mut json_args = Vec::with_capacity(args.len());
                for arg in args {
                    json_args.push(arg.to_json(context)?.unwrap_or(serde_json::Value::Null));
                }

                let result = (capture.callback)(&json_args)
                    .map_err(|e| JsError::from_opaque(JsValue::new(JsString::from(e))))?;

                Ok(JsValue::from_json(&result, context)?)
            },
            handle,
        );
        builder.function(function, JsString::from(service.name), 0);
    }
    let services_object = builder.build();

    context
        .global_object()
        .set(
            JsString::from("services"),
            JsValue::new(services_object),
            false,
            &mut context,
        )
        .map_err(|e| format!("Failed to set services global: {e}"))?;

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

// ============================================================================
// C FFI API (for JNI, JNA, FFM, etc.)
// ============================================================================

use std::ffi::{CStr, CString};
use std::os::raw::c_char;

/// Compile ABCode source to target language.
/// Returns a C string that MUST be freed with `abcode_free_string`.
/// Returns NULL on error (check with abcode_last_error).
#[unsafe(no_mangle)]
pub extern "C" fn abcode_compile(
    target: i32,
    script_code: *const c_char,
    plan: *const c_char,
) -> *mut c_char {
    let script_code = unsafe {
        if script_code.is_null() {
            return std::ptr::null_mut();
        }
        CStr::from_ptr(script_code).to_string_lossy().into_owned()
    };
    let plan = unsafe {
        if plan.is_null() {
            return std::ptr::null_mut();
        }
        CStr::from_ptr(plan).to_string_lossy().into_owned()
    };

    match compile(target, &script_code, &plan) {
        Ok(result) => {
            let json = serde_json::json!({
                "code": result.code,
                "console_messages": result.console_messages,
                "file_extension": result.file_extension,
            });
            match CString::new(json.to_string()) {
                Ok(cstr) => cstr.into_raw(),
                Err(_) => std::ptr::null_mut(),
            }
        }
        Err(e) => {
            set_last_error(&e);
            std::ptr::null_mut()
        }
    }
}

/// Execute JavaScript with abchelper.js (console capture).
/// Returns a C string that MUST be freed with `abcode_free_string`.
/// Returns NULL on error.
#[unsafe(no_mangle)]
pub extern "C" fn abcode_execute_js(js_code: *const c_char) -> *mut c_char {
    let js_code = unsafe {
        if js_code.is_null() {
            return std::ptr::null_mut();
        }
        CStr::from_ptr(js_code).to_string_lossy().into_owned()
    };

    match execute_js(&js_code) {
        Ok(result) => {
            let json = serde_json::json!({
                "logs": result.logs,
                "value_json": result.value_json,
            });
            match CString::new(json.to_string()) {
                Ok(cstr) => cstr.into_raw(),
                Err(_) => std::ptr::null_mut(),
            }
        }
        Err(e) => {
            set_last_error(&e);
            std::ptr::null_mut()
        }
    }
}

/// Free a C string returned by abcode_compile or abcode_execute_js.
#[unsafe(no_mangle)]
pub extern "C" fn abcode_free_string(ptr: *mut c_char) {
    if !ptr.is_null() {
        unsafe {
            drop(CString::from_raw(ptr));
        }
    }
}

/// Get the last error message (thread-local).
/// Returns a C string that MUST be freed with `abcode_free_string`.
/// Returns NULL if no error.
#[unsafe(no_mangle)]
pub extern "C" fn abcode_last_error() -> *mut c_char {
    LAST_ERROR.with(|cell| {
        let mut last_error = cell.borrow_mut();
        if let Some(err) = last_error.take() {
            match CString::new(err) {
                Ok(cstr) => cstr.into_raw(),
                Err(_) => std::ptr::null_mut(),
            }
        } else {
            std::ptr::null_mut()
        }
    })
}

thread_local! {
    static LAST_ERROR: std::cell::RefCell<Option<String>> = const { std::cell::RefCell::new(None) };
}

fn set_last_error(err: &str) {
    LAST_ERROR.with(|cell| {
        *cell.borrow_mut() = Some(err.to_string());
    });
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn execute_js_with_globals_injects_named_global() {
        let js = "evens = 2 + 2;";
        let globals = [("myGlobal", JsValue::new(JsString::from("ok")))];
        let result = execute_js_with_globals(js, &globals).unwrap();
        assert_eq!(result.value_json.as_deref(), Some("4"));
    }

    #[test]
    fn execute_js_with_services_exposes_host_callbacks() {
        let js = "const r = services.multiply(3, 3);\nr;";
        let service = HostService {
            name: "multiply",
            callback: Arc::new(|args: &[serde_json::Value]| {
                let a = args.get(0).and_then(|v| v.as_u64()).unwrap_or(0);
                let b = args.get(1).and_then(|v| v.as_u64()).unwrap_or(0);
                Ok(serde_json::json!(a * b))
            }),
        };
        let result = execute_js_with_services(js, &[service]).unwrap();
        assert_eq!(result.value_json.as_deref(), Some("9"));
    }

    #[test]
    fn abcode_transpiles_services_calls() {
        let source = concat!(
            "goal: any\n",
            "fun: handler()\n",
            "  val: r = services.double(21)\n",
            "  pass: { \"result\": r }\n",
            "run: handler()"
        );

        let compiled = compile(1, source, "*").expect("compile");
        assert!(compiled.code.contains("services.double"));

        let service = HostService {
            name: "double",
            callback: Arc::new(|args: &[serde_json::Value]| {
                let n = args.get(0).and_then(|v| v.as_u64()).unwrap_or(0);
                Ok(serde_json::json!(n * 2))
            }),
        };
        let result = execute_js_with_services(&compiled.code, &[service]).unwrap();
        assert_eq!(result.value_json.as_deref(), Some("{\"result\":42}"));
    }
}
