package main

import (
	"embed"
	"flag"
	"fmt"
	"log"
	"os"
	"runtime"
	"strings"

	"github.com/dop251/goja"
	"github.com/dop251/goja_nodejs/console"
	"github.com/dop251/goja_nodejs/require"
)

const abcodejs = "abcodejs/"

//go:embed abcodejs/*
var abcodeFS embed.FS

func main() {
	targets := "Target language or runtime: 1. Node.js, 2, Deno, 3. Wasm, 4. Python, 5. Lua"
	target := flag.Int("t", 1, targets)
	script := flag.String("s", "", "Program file (your abcode script with .abc extension)")
	// plan := flag.String("p", "", "Plan to prepare the code for a framework according the target")
	// output := flag.String("o", "./run/", "Output directory to generate or transpile the target code")
	plan := "*"
	output := "./run/"
	flag.Parse()

	fmt.Printf("\nINIT => target: %d | script: %s | plan: %s | output: %s | os: %s\n\n", *target, *script, plan, output, runtime.GOOS) // *plan *output

	if *script != "" && *target <= 6 {
		GetPlainJS(*target, *script, plan) // *plan
	} else if *target > 6 {
		fmt.Println(targets)
	} else {
		fmt.Println("Oops! Missing script (-s ...). Example: abcodec -s example.abc -t 2")
	}

	fmt.Println()
}

func getNewFile(target int, file string) string {
	extension := ".js"
	if target == 2 { // Deno
		extension = ".ts"
	} else if target == 3 { // AssemblyScript (wasm)
		extension = ".ts"
	} else if target == 4 { // Python
		extension = ".py"
	} else if target == 5 { // Lua (TSTL)
		extension = ".ts"
	} else if target == 6 { // Kotlin
		extension = ".kt"
	}
	//else if target == 7 { // Go
	//	extension = ".go"
	//}
	//else if target == 8 { // C#
	//	extension = ".cs"
	//}
	//else if target == 9 { // Rust
	//	extension = ".rs"
	//}
	//else if target == 10 { // PHP
	//	extension = ".php"
	//}
	newfile := strings.Replace(file, "abc", "run", 1)
	return strings.Replace(newfile, ".abc", extension, 1)
}

func loadHeader() string {
	headerBytes, err := abcodeFS.ReadFile(abcodejs + "abcode.js")
	if err != nil {
		log.Fatal(err)
		return ""
	}
	headerCode := string(headerBytes)
	return headerCode
}

func loadTranspiler(target int) string {
	file := abcodejs + "node.js"
	if target == 2 { // Deno
		file = abcodejs + "deno.js"
	} else if target == 3 { // AssemblyScript (wasm)
		file = abcodejs + "wasm.js"
	} else if target == 4 { // Python
		file = abcodejs + "python.js"
	} else if target == 5 { // Lua
		file = abcodejs + "lua.js"
	} else if target == 6 { // Koltin
		file = abcodejs + "kotlin.js"
	}
	//else if target == 7 { // Go
	//	file = abcodejs + "go.js"
	//}
	//else if target == 8 { // C#
	//	file = abcodejs + "csharp.js"
	//}
	//else if target == 9 { // Rust
	//	file = abcodejs + "rust.js"
	//}
	//else if target == 10 { // PHP
	//	file = abcodejs + "php.js"
	//}
	transpilerBytes, err := abcodeFS.ReadFile(file)
	if err != nil {
		log.Fatal(err)
		return ""
	}
	transpiler := string(transpilerBytes)
	return transpiler
}

func loadScript(scriptFile string) string {
	file := scriptFile
	if !strings.Contains(file, ".abc") {
		file = scriptFile + ".abc"
	}
	scriptBytes, err := os.ReadFile(file)
	if err != nil {
		log.Fatal(err)
		return ""
	}
	scriptCode := string(scriptBytes)
	return scriptCode
}

func saveTranspiler(compiler string) {
	transpilerBytes := []byte(compiler)
	os.WriteFile("./run/abcodec.js", transpilerBytes, 0)
}

func saveTarget(file string, code string) {
	codeBytes := []byte(code)
	os.WriteFile(file, codeBytes, 0)
}

func compileTarget(target int, file string) {
	compiler := ""

	if target == 1 { // Node.js
		compiler = "node " + file
		fmt.Println("INFO => You must include first a \"package.json\" file with \"restana\" module if it is a WebServer")
	} else if target == 2 { // Deno
		compiler = "deno run --allow-read --allow-write --allow-net --unstable " + file
		fmt.Println("INFO => You can compile it executing: " + strings.Replace(compiler, "run ", "compile ", 1))
	} else if target == 3 { // AssemblyScript (wasm)
		fmt.Println("INFO => try \"cd run & npx asc " + file + " --outFile ...\" with your environment")
	} else if target == 4 { // Python
		compiler = "python " + file
		fmt.Println("INFO => You must install first \"pip install bottle\" if it is a WebServer")
	} else if target == 5 { // Lua (TSTL)
		fmt.Println("INFO => try \"cd run & npx tstl " + strings.Replace(file, "run/", "", 1) + "\" with your environment")
	} else if target == 6 { // Kotlin
		compiler = "kotlinc " + file + " -include-runtime -cp ../javalib/javalin-5.0.1.jar -d " + strings.Replace(file, ".kt", ".jar", 1)
		fmt.Println("INFO => You must include \"-cp path/javalib/*\" or use \"gradle\" (even \"maven\") if it is a WebServer")
	}
	//else if target == 7 { // Go
	//	compiler = "go build " + file
	//	fmt.Println("INFO => You must execute first \"go get github.com/gofiber/fiber/v2\" if it is a WebServer")
	//}
	//else if target == 8 { // C#
	//  csprojFile := ""
	//  csprojContent := "<Project Sdk=\"Microsoft.NET.Sdk\">\n  <PropertyGroup>\n    <OutputType>Exe</OutputType>\n    <TargetFramework>netcoreapp3.1</TargetFramework>\n    <RootNamespace>Test</RootNamespace>\n  </PropertyGroup>\n</Project>"
	//  csprojFile = strings.Replace(file, ".cs", ".csproj", 1)
	//  os.WriteFile(csprojFile, []byte(csprojContent), 0)
	//	compiler = "dotnet run -p " + csprojFile
	//  fmt.Println("INFO => " + compiler + " ...\n" + csprojContent)
	//}
	//else if target == 9 { // Rust
	//	compiler = "rustc " + file
	//	fmt.Println("INFO => You must install first a \"cargo.toml\" file with \"nickel\" dependency if it is a WebServer")
	//	fmt.Println("INFO => Set an environment to compile with " + compiler + " or \"cargo run\"")
	//}
	//else if target == 10 { // PHP
	//	compiler = "php " + file + " start"
	//	fmt.Println("INFO => You must execute first \"composer require simps\" and setup \"composer\" if it is a WebServer")
	//}

	if compiler != "" {
		shell := "./run/abctest.sh"
		fmt.Println(compiler)
		fmt.Println(shell)
		os.WriteFile(shell, []byte(compiler), 0)
	}
}

func GetPlainJS(target int, scriptFile string, plan string) {
	vm := goja.New()
	new(require.Registry).Enable(vm)
	console.Enable(vm)

	file := getNewFile(target, scriptFile)
	headerCode := loadHeader()
	transpilerCode := loadTranspiler(target)
	scriptCode := loadScript(scriptFile)
	compiler := headerCode + transpilerCode
	saveTranspiler(compiler)

	fmt.Print("Compiling... ", scriptFile)
	runnable, err := goja.Compile("", compiler, true)
	if err != nil {
		fmt.Printf("Error compiling the script %v ", err)
		return
	}

	fmt.Println(" Ok!\nGenerating...", file)
	//vm.RunProgram(runnable)
	_, err = vm.RunProgram(runnable)
	if err != nil {
		fmt.Printf("Error running the transpiler %v", err)
		return
	}

	var start goja.Callable
	err = vm.ExportTo(vm.Get("start"), &start)
	if err != nil {
		fmt.Printf("Error exporting the function %v", err)
		return
	}

	res, err := start(goja.Undefined(), vm.ToValue(scriptCode), vm.ToValue(plan))
	if err != nil {
		fmt.Printf("Error calling function %v", err)
		return
	}
	code := res.ToString()
	fmt.Printf("---\n%s \n", code)

	saveTarget(file, code.String())
	compileTarget(target, file)
}
