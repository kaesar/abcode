use clap::{Arg, Command};
use rust_embed::RustEmbed;
use boa_engine::{Context, Source, JsValue, JsString};
use std::fs;
use std::io::Write;

#[derive(RustEmbed)]
#[folder = "abcodejs/"]
struct Asset;

fn main() {
    // Configuración de Clap para parsear los argumentos de línea de comandos
    let matches = Command::new("abcodec")
        .version("1.0")
        .about("ABCode transpiler")
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

    // Mensaje inicial
    println!(
        "\nINIT => target: {} | script: {} | plan: {} | output: {} | os: {}\n",
        target,
        script,
        plan,
        output,
        std::env::consts::OS
    );

    // Lógica principal: si target > 6, muestra los targets; si no, procesa el script
    if target > 6 {
        println!("Target language or runtime: 1. Node.js, 2. Deno, 3. Wasm, 4. Python, 5. Lua, 6. Kotlin");
    } else {
        get_plain_js(target, script, plan);
    }

    println!();
}

fn get_new_file(target: i32, script_file: &str) -> String {
    // Determina la extensión según el target
    let extension = match target {
        1 => "js",    // Node.js
        2 => "ts",    // Deno
        3 => "ts",    // Wasm (AssemblyScript)
        4 => "py",    // Python
        5 => "ts",    // Lua (TSTL)
        6 => "kt",    // Kotlin
        _ => "js",    // Por defecto
    };
    // Reemplaza "abc" por "run" y cambia la extensión
    let newfile = script_file.replace("abc", "run");
    newfile.replace(".abc", extension)
}

fn get_plain_js(target: i32, script_file: &str, plan: &str) {
    // Crea el directorio de salida si no existe
    fs::create_dir_all("./run").unwrap();

    // Calcula el nombre del archivo de salida
    let newfile = get_new_file(target, script_file);

    // Carga el encabezado desde los archivos embebidos
    let header_bytes = Asset::get("abcode.js").unwrap().data;
    let header_code = String::from_utf8(header_bytes.to_vec()).unwrap();

    // Carga el transpilador según el target
    let transpiler_file = match target {
        1 => "node.js",
        2 => "deno.js",
        3 => "wasm.js",
        4 => "python.js",
        5 => "lua.js",
        6 => "kotlin.js",
        _ => "node.js",
    };
    let transpiler_bytes = Asset::get(transpiler_file).unwrap().data;
    let transpiler_code = String::from_utf8(transpiler_bytes.to_vec()).unwrap();

    // Lee el script ABCode desde el archivo
    let script_code = fs::read_to_string(script_file).unwrap();

    // Combina el encabezado y el transpilador
    let compiler = format!("{}{}", header_code, transpiler_code);
    fs::write("./run/abcodec.js", &compiler).unwrap(); // Guarda el compilador (quizás para depuración)

    // Mensaje de compilación
    print!("Compiling... {}", script_file);
    std::io::stdout().flush().unwrap();

    // Crea un contexto de Boa y evalúa el compilador
    let mut context = Context::default();
    let script = Source::from_bytes(compiler.as_bytes());
    context.eval(script).unwrap();

    // Obtiene la función "start" y la llama con los argumentos
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

    // Muestra el resultado y lo guarda
    println!(" Ok!\nGenerating... {}", newfile);
    println!("---\n{:?} \n", code);
    fs::write(&newfile, &code).unwrap();

    // Genera el script de compilación/ejecución
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

    // Guarda el script en ./run/abctest.sh
    let shell = "./run/abctest.sh";
    fs::write(shell, compiler).unwrap();
}