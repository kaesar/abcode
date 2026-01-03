use std::fs;
use std::io::Write;
use clap::{Arg, Command};
use rust_embed::RustEmbed;
use boa_engine::{Context, Source, JsValue, JsString};

#[derive(RustEmbed)]
#[folder = "abcodejs/"]
struct Asset;

fn main() {
    // Setting Clap for command line arguments
    let targets = "Target language or runtime:\n0. Rust (binary), 1. NodeJS/Bun, 2. Deno, 3. Wasm, 4. Kotlin, 5. Java (JBang), 6. Python, 7. Go, 8. PHP, 9. C# (.NET)";
    let matches = Command::new("abcodec")
        .version("0.5.0")
        .about("ABCode Compiler (Transpiler)")
        .arg(
            Arg::new("target")
                .short('t')
                .long("target")
                .value_parser(clap::value_parser!(i32))
                .default_value("1")
                .help(targets)
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
    let script: &String = matches.get_one("script").unwrap();
    let plan = "*";
    let output = "./run/";

    // Initial message
    println!(
        "\nINIT => target: {} | script: {} | plan: {} | output: {} | os: {}\n",
        target,
        script,
        plan,
        output,
        std::env::consts::OS
    );

    // Main logic: In case of target > 9, it shows the target options
    if target > 9 {
        println!("{}", targets);
    } else {
        get_plain_js(target, script, plan);
    }

    println!();
}

fn get_new_file(target: i32, script_file: &str) -> String {
    // Set extension according to the target
    let extension = match target {
        0 => ".rs",   // Rust
        1 => ".js",   // NodeJS/Bun
        2 => ".ts",   // Deno
        3 => ".ts",   // Wasm (AssemblyScript)
        4 => ".kt",   // Kotlin
        5 => ".java", // Java/SpringBoot
        6 => ".py",   // Python
        7 => ".go",   // GoLang
        8 => ".php",  // PHP
        9 => ".cs",   // C#
        _ => ".js",   // Por defecto
    };

    // Replace first "abc" with "run"
    let newfile = if let Some(pos) = script_file.find("abc") {
        let (before, after) = script_file.split_at(pos);
        format!("{}run{}", before, &after[3..])
    } else {
        script_file.to_string()
    };
    
    newfile.replace(".abc", extension)
}

macro_rules! get_console_messages {
    ($context:expr) => {{
        let console_messages_key = JsString::from("getConsole");
        let console_messages_fn = $context
            .global_object()
            .get(console_messages_key, &mut $context)
            .unwrap();
        let console_messages_fn = console_messages_fn
            .as_callable()
            .unwrap();
        let console_messages_result = console_messages_fn
            .call(&JsValue::undefined(), &[], &mut $context)
            .unwrap();
        console_messages_result.as_string().unwrap().to_std_string().unwrap()
    }};
}

fn get_plain_js(target: i32, script_file: &str, plan: &str) {
    fs::create_dir_all("./run").unwrap();

    let newfile = get_new_file(target, script_file);
    let pre_header_bytes = Asset::get("abchelper.js").unwrap().data;
    let pre_header_code = String::from_utf8(pre_header_bytes.to_vec()).unwrap();
    let header_bytes = Asset::get("abcode.js").unwrap().data;
    let header_code = String::from_utf8(header_bytes.to_vec()).unwrap();

    // Load the transpiler file according to the target
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
        _ => "node.js",
    };
    let transpiler_bytes = Asset::get(transpiler_file).unwrap_or_else(|| {
        panic!("ERROR: Language compiler/transpiler not found for target {}", target);
    }).data;
    let transpiler_code = String::from_utf8(transpiler_bytes.to_vec()).unwrap();

    // Read the script file and combine it with the pre-header and header
    let script_code = fs::read_to_string(script_file).unwrap_or_else(|e| {
        eprintln!("ERROR: Could not read script file {}: {}", script_file, e);
        eprintln!("       Check if the file exists and you have read permissions");
        std::process::exit(1);
    });
    let compiler = format!("{}{}{}", pre_header_code, header_code, transpiler_code);
    
    // Save the compiler for debugging
    match fs::write("./run/abcodec.js", &compiler) {
        Ok(_) => print!(""),
        Err(e) => eprintln!("ERROR: Trying writing debugger {}", e),
    };

    // Message for the user
    print!("Compiling... {}", script_file);
    std::io::stdout().flush().unwrap();

    // Create Boa context and evaluate the compiler/transpiler
    let mut context = Context::default();
    let script = Source::from_bytes(compiler.as_bytes());
    context.eval(script).unwrap();

    // Get the "start" function from Boa context
    let key = JsString::from("start");
    let binding = context
        .global_object()
        .get(key, &mut context)
        .unwrap();
    let start_fn = binding
        .as_callable()
        .unwrap();

    let script_code_val = JsValue::new(JsString::from(script_code));
    let plan_val = JsValue::new(JsString::from(plan));
    let args = vec![script_code_val, plan_val];

    let result = match start_fn.call(&JsValue::undefined(), &args, &mut context) {
        Ok(value) => value,
        Err(err) => {
            eprintln!("\nERROR! {}", err);
            eprintln!("       This could be an error in your code.");
            eprintln!("       Please, check your syntax in: {}", script_file);
            return;
        }
    };
    
    let code = match result.as_string() {
        Some(js_string) => js_string.to_std_string().unwrap_or_else(|_| {
            eprintln!("\nERROR: Could not convert the result to an UTF-8 string");
            String::new()
        }),
        None => {
            eprintln!("\nERROR: Compiler did not return a valid string");
            String::new()
        }
    };
    let console_messages = get_console_messages!(context);

    // Show the result
    println!(" Ok!");
    println!("---\n{} \n", console_messages);
    
    // For Java/Kotlin/C# target, check if a class name was specified
    let mut custom_file = None;
    if target == 4 || target == 5 || target == 9 {
        if let Some(class_name_pos) = console_messages.find("@CLASSNAME:") {
            let class_name_start = class_name_pos + "@CLASSNAME:".len();
            if let Some(class_name_end) = console_messages[class_name_start..].find('\n') {
                let class_name = &console_messages[class_name_start..class_name_start + class_name_end];
                
                // Use the correct extension based on target
                let extension = match target {
                    4 => ".kt",
                    5 => ".java",
                    9 => ".cs",
                    _ => ".java"
                };
                let new_file_path = format!("./run/{}{}", class_name, extension);
                custom_file = Some(new_file_path);
            }
        }
    }
    
    // Use custom file path if found, otherwise use default
    let final_file = custom_file.as_deref().unwrap_or(&newfile);
    println!("Generating... {}", final_file);
    println!("---\n{}", code);
    
    // Ensure the directory exists before writing
    if let Some(parent) = std::path::Path::new(final_file).parent() {
        fs::create_dir_all(parent).unwrap_or_else(|e| {
            eprintln!("ERROR: Could not create directory {:?}: {}", parent, e);
        });
    }
    
    fs::write(final_file, &code).unwrap_or_else(|e| {
        eprintln!("ERROR: Could not write file {}: {}", final_file, e);
        eprintln!("       Check if the directory exists and you have write permissions");
    });

    // Generate the shell script for compiling the new file
    compile_target(target, final_file);
}

fn compile_target(target: i32, file: &str) {
    let compiler = match target {
        0 => {
            println!("INFO => try \"cd run & cargo run\" with your environment");
            return;
        }
        1 => {
            println!("INFO => You must include first a \"package.json\" file with \"restana\" module if it is a WebServer");
            format!("node {}", file)
        }
        2 => {
            let cmd = format!("deno run --allow-read --allow-write --allow-net --unstable {}", file);
            println!("INFO => You can compile it executing: {}", cmd.replace("run ", "compile "));
            cmd
        }
        3 => {
            println!("INFO => try \"cd run & npx asc {} --outFile ...\" with your environment", file);
            return;
        }
        4 => {
            println!("INFO => You must include \"-cp path/javalib/*\" or use \"gradle\" (even \"maven\") if it is a WebServer");
            format!("kotlinc {} -include-runtime -cp ../javalib/javalin-5.0.1.jar -d {}", file, file.replace(".kt", ".jar"))
        }
        5 => {
            println!("INFO => Unless using JBang, you must include \"-cp path/javalib/*\" or use \"gradle\" (even \"maven\") if it is a WebServer");
            format!("jbang {}", file)
        }
        6 => {
            println!("INFO => You must install first \"pip install bottle\" if it is a WebServer");
            format!("python {}", file)
        }
        7 => {
            println!("INFO => try \"cd run & go run {}\" with your environment", file.replace("run/", ""));
            return;
        }
        8 => {
            println!("INFO => You must install first \"composer install\" if it is a WebServer");
            format!("php {}", file)
        }
        9 => {
            println!("INFO => try \"cd run & dotnet run\" with your environment");
            return;
        }
        _ => return,
    };

    // Save the shell script
    let shell = "./run/abctest.sh";
    match fs::write(shell, compiler) {
        Ok(_) => print!(""),
        Err(e) => eprintln!("ERROR: Trying writing test {}", e),
    };
}