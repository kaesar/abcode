use std::fs;
use std::path::Path;
use clap::{Arg, Command};
use abcodelib::{compile, execute_js};
use anyhow::{Result, anyhow};

fn main() -> Result<()> {
    let matches = Command::new("abcoderun")
        .version("0.6.0")
        .about("ABCode Runtime - Execute ABCode scripts directly")
        .arg(
            Arg::new("script")
                .help("ABCode script file (.abc)")
                .required(true)
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

    let script_path = matches.get_one::<String>("script").unwrap();
    let verbose = matches.get_flag("verbose");

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

    let exec = execute_js(&compile_result.code)
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
