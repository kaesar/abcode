use std::fs;
use std::path::Path;
use clap::{Arg, Command};
use abcodelib::{compile, execute_js_with_argv};
use anyhow::{Result, anyhow};

fn main() -> Result<()> {
    let matches = Command::new("abcoderun")
        .version("0.7.0")
        .about("ABCode Runtime - Execute ABCode scripts directly")
        .arg(
            Arg::new("script")
                .help("ABCode script file (.abc) followed by optional script arguments")
                .required(true)
                .num_args(1..)
                .trailing_var_arg(true)
                .index(1),
        )
        .arg(
            Arg::new("verbose")
                .short('v')
                .long("verbose")
                .help("Show compilation details")
                .action(clap::ArgAction::SetTrue),
        )
        .get_matches();

    let verbose = matches.get_flag("verbose");
    let all_args: Vec<&String> = matches.get_many("script")
        .map(|v| v.collect())
        .unwrap_or_default();
    let script_path = all_args[0];
    let script_args: Vec<String> = all_args[1..].iter().map(|s| (*s).clone()).collect();

    if !script_path.ends_with(".abc") {
        return Err(anyhow!("Error: File must have .abc extension"));
    }

    if !Path::new(script_path).exists() {
        return Err(anyhow!("Error: File '{}' not found", script_path));
    }

    let abcode_source = fs::read_to_string(script_path)
        .map_err(|e| anyhow!("Error reading file '{}': {}", script_path, e))?;

    if verbose {
        println!("- ABCodeRun - Runtime Environment for Scripts");
        println!("- Script: {}", script_path);
        println!("- Compiling ABCode to JavaScript...\n");
    }

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

    // Build argv: [script_path, user_arg1, user_arg2, ...]
    let mut argv = vec![script_path.to_string()];
    argv.extend_from_slice(&script_args);

    let exec = execute_js_with_argv(&compile_result.code, &argv)
        .map_err(|e| anyhow!("{}", e))?;

    if !exec.logs.is_empty() {
        println!("{}", exec.logs);
    }

    if verbose {
        println!("{}", "=".repeat(50));
        println!("- Execution completed!");
    }

    Ok(())
}