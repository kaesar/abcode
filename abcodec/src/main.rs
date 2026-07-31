use std::fs;
use std::io::Write;
use clap::{Arg, Command, value_parser};
use abcodelib::{compile, compiler_source, output_path, TARGETS_HELP};

fn main() {
    let matches = Command::new("abcodec")
        .version("0.7.0")
        .about("ABCode Compiler (Transpiler)")
        .arg(
            Arg::new("target")
                .short('t')
                .long("target")
                .value_parser(value_parser!(i32))
                .default_value("1")
                .help(TARGETS_HELP),
        )
        .arg(
            Arg::new("backend")
                .short('b')
                .long("backend")
                .value_parser(["auto", "scriptc", "perry"])
                .default_value("auto")
                .help("Native binary backend for target 0 (scriptc by default, perry as fallback)"),
        )
        .arg(
            Arg::new("script")
                .short('s')
                .long("script")
                .required(true)
                .help("Program file (your abcode script with .abc extension)"),
        )
        .get_matches();

    let target: i32 = *matches.get_one("target").unwrap();
    let backend: &String = matches.get_one("backend").unwrap();
    let script: &String = matches.get_one("script").unwrap();
    let plan = "*";
    let output = "./run/";

    println!(
        "\nINIT => target: {} | script: {} | plan: {} | output: {} | os: {}\n",
        target,
        script,
        plan,
        output,
        std::env::consts::OS
    );

    if target > 9 {
        println!("{}", TARGETS_HELP);
    } else {
        get_plain_js(target, backend, script, plan);
    }

    println!();
}

fn get_plain_js(target: i32, backend: &str, script_file: &str, plan: &str) {
    fs::create_dir_all("./run").unwrap();

    let newfile = output_path(script_file, target);

    let script_code = fs::read_to_string(script_file).unwrap_or_else(|e| {
        eprintln!("ERROR: Could not read script file {}: {}", script_file, e);
        eprintln!("       Check if the file exists and you have read permissions");
        std::process::exit(1);
    });

    // Debug dump of the embedded JS compiler bundle
    if let Ok(compiler) = compiler_source(target) {
        if let Err(e) = fs::write("./run/abcodec.js", &compiler) {
            eprintln!("ERROR: Trying writing debugger {}", e);
        }
    }

    print!("Compiling... {}", script_file);
    std::io::stdout().flush().unwrap();

    let result = match compile(target, &script_code, plan) {
        Ok(result) => result,
        Err(err) => {
            eprintln!("\nERROR! {}", err);
            eprintln!("       This could be an error in your code.");
            eprintln!("       Please, check your syntax in: {}", script_file);
            return;
        }
    };

    let code = result.code;
    let console_messages = result.console_messages;

    println!(" Ok!");
    println!("---\n{} \n", console_messages);

    // For Java/Kotlin/C#, honor @CLASSNAME: from compiler messages
    let mut custom_file = None;
    if target == 4 || target == 5 || target == 9 {
        if let Some(class_name_pos) = console_messages.find("@CLASSNAME:") {
            let class_name_start = class_name_pos + "@CLASSNAME:".len();
            if let Some(class_name_end) = console_messages[class_name_start..].find('\n') {
                let class_name =
                    &console_messages[class_name_start..class_name_start + class_name_end];
                let extension = result.file_extension.as_str();
                let new_file_path = format!("./run/{}{}", class_name, extension);
                custom_file = Some(new_file_path);
            }
        }
    }

    let final_file = custom_file.as_deref().unwrap_or(&newfile);
    println!("Generating... {}", final_file);
    println!("---\n{}", code);

    if let Some(parent) = std::path::Path::new(final_file).parent() {
        fs::create_dir_all(parent).unwrap_or_else(|e| {
            eprintln!("ERROR: Could not create directory {:?}: {}", parent, e);
        });
    }

    fs::write(final_file, &code).unwrap_or_else(|e| {
        eprintln!("ERROR: Could not write file {}: {}", final_file, e);
        eprintln!("       Check if the directory exists and you have write permissions");
    });

    // Shell helper only — INFO text already comes from abcodelib::compile
    write_run_script(target, backend, final_file);
}

fn write_run_script(target: i32, backend: &str, file: &str) {
    let compiler = match target {
        0 => {
            // Intermediate/layer JS -> native binary.
            let out = file.trim_end_matches(".js").trim_end_matches(".ts");
            println!("INFO => Building native binary...");
            match try_binary_compile(backend, file, out) {
                Ok(()) => {
                    println!("OK => Native binary generated: {}", out);
                    format!("./{}", out)
                }
                Err(msg) => {
                    eprintln!("WARN => {}", msg);
                    fallback_run_script(backend, file, out)
                }
            }
        }
        3 | 7 | 9 => return,
        1 => format!("node {}", file),
        2 => {
            let cmd = format!(
                "deno run --allow-read --allow-write --allow-net --unstable {}",
                file
            );
            // Dynamic hint with the real path (more specific than the static INFO)
            println!("INFO => You can compile it executing: {}", cmd.replace("run ", "compile "));
            cmd
        }
        4 => format!(
            "kotlinc {} -include-runtime -cp ../javalib/javalin-5.0.1.jar -d {}",
            file,
            file.replace(".kt", ".jar")
        ),
        5 => format!("jbang {}", file),
        6 => format!("python {}", file),
        8 => format!("php {}", file),
        _ => return,
    };

    let shell = "./run/abctest.sh";
    if let Err(e) = fs::write(shell, compiler) {
        eprintln!("ERROR: Trying writing test {}", e);
    }
}

/// Compile intermediate/layer JS to a native binary.
///
/// Order (when `backend` is `"auto"`):
///   1. scriptc — small static binaries (~358 KB), ideal for ABCode scripts
///   2. perry   — fallback, larger binary (~7.6 MB) but broader Node API coverage
///   3. node    — last resort, run as script
///
/// Use `--backend perry` to force Perry, or `--backend scriptc` to force scriptc.
fn try_binary_compile(backend: &str, js_file: &str, out: &str) -> Result<(), String> {
    match backend {
        "scriptc" => try_scriptc(js_file, out),
        "perry" => try_perry(js_file, out),
        _ => {
            // auto: scriptc first, then perry
            match try_scriptc(js_file, out) {
                Ok(()) => return Ok(()),
                Err(_) => try_perry(js_file, out),
            }
        }
    }
}

fn try_scriptc(js_file: &str, out: &str) -> Result<(), String> {
    let r = std::process::Command::new("scriptc")
        .args(["build", js_file, "-o", out])
        .output();
    match r {
        Ok(output) if output.status.success() => Ok(()),
        Ok(output) => {
            let stderr = String::from_utf8_lossy(&output.stderr);
            let first = stderr.lines().next().unwrap_or("scriptc failed");
            eprintln!("       scriptc: {first}");
            Err("scriptc failed".into())
        }
        Err(_) => {
            Err("scriptc not found".into())
        }
    }
}

fn try_perry(js_file: &str, out: &str) -> Result<(), String> {
    let r = std::process::Command::new("perry")
        .args(["compile", js_file, "-o", out])
        .output();
    match r {
        Ok(output) if output.status.success() => Ok(()),
        Ok(output) => {
            let stderr = String::from_utf8_lossy(&output.stderr);
            let first = stderr.lines().next().unwrap_or("perry failed");
            eprintln!("       perry: {first}");
            Err("perry failed".into())
        }
        Err(_) => Err("perry not found".into()),
    }
}

/// Generate a shell script that tries scriptc then perry, for manual use.
fn fallback_run_script(_backend: &str, file: &str, out: &str) -> String {
    let scriptc = format!("scriptc build {} -o {}", file, out);
    let perry = format!("perry compile {} -o {}", file, out);
    eprintln!("       Install a binary backend: npm i -g scriptc");
    format!(
        "#!/bin/sh\n\
         if command -v scriptc >/dev/null 2>&1; then\n  {}\n\
         elif command -v perry >/dev/null 2>&1; then\n  {}\n\
         else\n  echo 'Install a binary backend: npm i -g scriptc  OR  npm i -g @perryts/perry' >&2\n  exit 1\n\
         fi\n./{}",
        scriptc, perry, out
    )
}
