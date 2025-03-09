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
    let matches = Command::new("abcodec")
        .version("0.3.0")
        .about("ABCode Compiler (Transpiler)")
        .arg(
            Arg::new("target")
                .short('t')
                .long("target")
                .value_parser(clap::value_parser!(i32))
                .default_value("1")
                .help("Target language or runtime: 1. Node.js, 2. Deno, 3. Wasm, 4. Python, 5. Lua, 6. Kotlin"),
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

    // Main logic: In case of target > 6, it shows the target options
    if target > 6 {
        println!("Target language or runtime: 1. Node.js, 2. Deno, 3. Wasm, 4. Python, 5. Lua, 6. Kotlin");
    } else {
        get_plain_js(target, script, plan);
    }

    println!();
}

fn get_new_file(target: i32, script_file: &str) -> String {
    // Set extension according to the target
    let extension = match target {
        1 => ".js",    // Node.js
        2 => ".ts",    // Deno
        3 => ".ts",    // Wasm (AssemblyScript)
        4 => ".py",    // Python
        5 => ".ts",    // Lua (TSTL)
        6 => ".kt",    // Kotlin
        _ => ".js",    // Por defecto
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
            .call(&JsValue::Undefined, &[], &mut $context)
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
        1 => "node.js",
        2 => "deno.js",
        3 => "wasm.js",
        4 => "python.js",
        5 => "lua.js",
        6 => "kotlin.js",
        _ => "node.js",
    };
    let transpiler_bytes = Asset::get(transpiler_file).unwrap_or_else(|| {
        panic!("ERROR: Language compiler/transpiler not found for target {}", target);
    }).data;
    let transpiler_code = String::from_utf8(transpiler_bytes.to_vec()).unwrap();

    // Read the script file and combine it with the pre-header and header
    let script_code = fs::read_to_string(script_file).unwrap();
    let compiler = format!("{}{}{}", pre_header_code, header_code, transpiler_code);
    fs::write("./run/abcodec.js", &compiler).unwrap();  // Save the compiler for debugging

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

    let script_code_val = JsValue::String(script_code.into());
    let plan_val = JsValue::String(plan.into());
    let args = vec![script_code_val, plan_val];

    let result = start_fn.call(&JsValue::Undefined, &args, &mut context).unwrap();
    let code = result.as_string().unwrap().to_std_string().unwrap();
    let console_messages = get_console_messages!(context);

    // Show the result and save it in the new file
    println!(" Ok!\nGenerating... {}", newfile);
    println!("---\n{} \n", console_messages);
    println!("---\n{}", code);
    fs::write(&newfile, &code).unwrap();

    // Generate the shell script for compiling the new file
    compile_target(target, &newfile);
}

fn compile_target(target: i32, file: &str) {
    let compiler = match target {
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
            println!("INFO => You must install first \"pip install bottle\" if it is a WebServer");
            format!("python {}", file)
        }
        5 => {
            println!("INFO => try \"cd run & npx tstl {}\" with your environment", file.replace("run/", ""));
            return;
        }
        6 => {
            println!("INFO => You must include \"-cp path/javalib/*\" or use \"gradle\" (even \"maven\") if it is a WebServer");
            format!("kotlinc {} -include-runtime -cp ../javalib/javalin-5.0.1.jar -d {}", file, file.replace(".kt", ".jar"))
        }
        _ => return,
    };

    // Save the shell script
    let shell = "./run/abctest.sh";
    fs::write(shell, compiler).unwrap();
}