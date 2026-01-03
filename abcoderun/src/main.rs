use std::fs;
use std::path::Path;
use clap::{Arg, Command};
use boa_engine::{Context, Source};
use abcodelib::compile;
use anyhow::{Result, anyhow};

fn main() -> Result<()> {
    let matches = Command::new("abcoderun")
        .version("0.6.0")
        .about("ABCode Runtime - Execute ABCode scripts directly")
        .arg(
            Arg::new("script")
                .help("ABCode script file (.abc)")
                .required(true)
                .index(1)
        )
        .arg(
            Arg::new("verbose")
                .short('v')
                .long("verbose")
                .help("Show compilation details")
                .action(clap::ArgAction::SetTrue)
        )
        .get_matches();

    let script_path = matches.get_one::<String>("script").unwrap();
    let verbose = matches.get_flag("verbose");

    // Validate file extension
    if !script_path.ends_with(".abc") {
        return Err(anyhow!("Error: File must have .abc extension"));
    }

    // Check if file exists
    if !Path::new(script_path).exists() {
        return Err(anyhow!("Error: File '{}' not found", script_path));
    }

    // Read ABCode source
    let abcode_source = fs::read_to_string(script_path)
        .map_err(|e| anyhow!("Error reading file '{}': {}", script_path, e))?;

    if verbose {
        println!("- ABCodeRun - Runtime Environment for Scripts");
        println!("- Script: {}", script_path);
        println!("- Compiling ABCode to JavaScript...\n");
    }

    // Compile ABCode to JavaScript using abcodelib
    let compile_result = compile(1, &abcode_source, "*")
        .map_err(|e| anyhow!("Compilation error: {}", e))?;

    if verbose {
        println!("- Compilation successful!");
        if !compile_result.console_messages.is_empty() {
            println!("- Compiler messages:\n{}", compile_result.console_messages);
        }
        println!("- Executing JavaScript code...\n");
        println!("{}", "=".repeat(50));
        println!("Generated JavaScript:");
        println!("{}", compile_result.code);
        println!("{}", "=".repeat(50));
    }

    // Execute JavaScript code using BoaJS
    execute_javascript(&compile_result.code)?;

    if verbose {
        println!("{}", "=".repeat(50));
        println!("- Execution completed!");
    }

    Ok(())
}

fn execute_javascript(js_code: &str) -> Result<()> {
    let mut context = Context::default();
    
    // Load abchelper.js exactly like the compiler does
    let pre_header_bytes = abcodelib::Asset::get("abchelper.js")
        .ok_or(anyhow!("abchelper.js not found"))?;
    let pre_header_code = String::from_utf8(pre_header_bytes.data.to_vec())
        .map_err(|_| anyhow!("Invalid UTF-8 in abchelper.js"))?;
    
    // Execute abchelper.js to set up console
    let helper_source = Source::from_bytes(pre_header_code.as_bytes());
    context.eval(helper_source)
        .map_err(|e| anyhow!("Helper setup error: {}", e))?;

    // Execute the compiled JavaScript
    let js_source = Source::from_bytes(js_code.as_bytes());
    context.eval(js_source)
        .map_err(|e| anyhow!("JavaScript execution error: {}", e))?;

    // Get and print console messages like the compiler does
    let console_messages_key = boa_engine::JsString::from("getConsole");
    let console_messages_fn = context
        .global_object()
        .get(console_messages_key, &mut context)
        .map_err(|e| anyhow!("Failed to get getConsole: {}", e))?;
    let console_messages_fn = console_messages_fn
        .as_callable()
        .ok_or(anyhow!("getConsole is not a function"))?;
    let console_messages_result = console_messages_fn
        .call(&boa_engine::JsValue::undefined(), &[], &mut context)
        .map_err(|e| anyhow!("Failed to call getConsole: {}", e))?;
    let console_messages = console_messages_result.as_string()
        .ok_or(anyhow!("getConsole did not return a string"))?
        .to_std_string()
        .map_err(|_| anyhow!("Failed to convert console messages to UTF-8"))?;

    // Print the console messages (this is the actual output)
    if !console_messages.is_empty() {
        println!("{}", console_messages);
    }

    Ok(())
}