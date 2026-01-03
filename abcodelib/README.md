# ABCodeLib - ABCode Compilation Library

Rust library for compiling ABCode to multiple target languages.

## Usage

```rust
use abcodelib::{compile, CompileResult};

let result = compile(1, "print 'Hello World'", "*")?;
println!("Generated code: {}", result.code);
```

## API

### `compile(target: i32, script_code: &str, plan: &str) -> Result<CompileResult, String>`

**Parameters:**
- `target`: Target language (0=Rust, 1=NodeJS, 2=Deno, 3=Wasm, 4=Kotlin, 5=Java, 6=Python, 7=Go, 8=PHP, 9=C#)
- `script_code`: ABCode source code
- `plan`: Compilation plan (use "*" for default)

**Returns:**
- `CompileResult` with generated code, console messages, and file extension

## Integration

### Rust Projects
```toml
[dependencies]
abcodelib = { path = "../abcodelib" }
```

### Java/JNI Example
```java
///usr/bin/env jbang "$0" "$@" ; exit $?
//JAVA 17+
//DEPS info.picocli:picocli:4.7.5

public class ABCodeCompiler {
    static {
        System.loadLibrary("abcodelib");
    }
    
    public native String compile(int target, String code, String plan);
    
    public static void main(String[] args) {
        ABCodeCompiler compiler = new ABCodeCompiler();
        
        String abcodeSource = "goal: any\n" +
                             "fun: hello()\n" +
                             "  echo: 'Hello from ABCode!'\n" +
                             "run: hello()";
        
        // Compile to different targets
        String javaCode = compiler.compile(5, abcodeSource, "*");
        String nodeCode = compiler.compile(1, abcodeSource, "*");
        String pythonCode = compiler.compile(6, abcodeSource, "*");
        
        System.out.println("Java output: " + javaCode);
        System.out.println("Node output: " + nodeCode);
        System.out.println("Python output: " + pythonCode);
    }
}
```

> You can test it using **JBang**

### Bun.js/FFI Example
```javascript
#!/usr/bin/env bun
// ABCode compiler using Bun FFI
import { dlopen, FFIType, suffix } from "bun:ffi";

const lib = dlopen(`./libabcodelib.${suffix}`, {
  compile: {
    args: [FFIType.i32, FFIType.cstring, FFIType.cstring],
    returns: FFIType.cstring,
  },
  free_string: {
    args: [FFIType.ptr],
    returns: FFIType.void,
  },
});

class ABCodeCompiler {
  compile(target, code, plan = "*") {
    const result = lib.symbols.compile(target, code, plan);
    const output = new CString(result).toString();
    lib.symbols.free_string(result);
    return output;
  }
}

// Usage example
const compiler = new ABCodeCompiler();

const abcodeSource = `goal: any
#type: MultiTarget

fun: processData(input)
  echo: "Processing: " + input
  like: console.log(\`Processing: \${input}\`) #in: javascript
  
run: processData("Hello Bun!")`;

// Compile to multiple targets with Bun's speed
const targets = {
  1: "NodeJS", 
  5: "Java",
  6: "Python"
};

console.log("ABCode Multi-Target Compilation with Bun\n");

for (const [target, language] of Object.entries(targets)) {
  const startTime = performance.now();
  const result = compiler.compile(parseInt(target), abcodeSource);
  const endTime = performance.now();
  
  console.log(`${language} (${(endTime - startTime).toFixed(2)}ms):`);
  console.log(result);
  console.log("─".repeat(50));
}
```

### PHP/FFI Example
```php
<?php
// ABCode compiler using PHP FFI
class ABCodeCompiler {
    private $ffi;
    
    public function __construct() {
        $this->ffi = FFI::cdef("
            char* compile(int target, char* code, char* plan);
            void free_string(char* ptr);
        ", "./libabcodelib.so"); // or .dll on Windows
    }
    
    public function compile(int $target, string $code, string $plan = "*"): string {
        $result = $this->ffi->compile($target, $code, $plan);
        $output = FFI::string($result);
        $this->ffi->free_string($result);
        return $output;
    }
}

// Usage example
$compiler = new ABCodeCompiler();

$abcodeSource = "goal: any\n" .
               "fun: greet(name)\n" .
               "  echo: 'Hello ' + name + '!'\n" .
               "run: greet('World')";

// Compile to different targets
$targets = [
    8 => 'PHP',
    6 => 'Python', 
    1 => 'NodeJS',
    5 => 'Java'
];

foreach ($targets as $target => $language) {
    $result = $compiler->compile($target, $abcodeSource);
    echo "$language output:\n$result\n\n";
}
?>
```

## Dependencies

- Uses JavaScript transpilers from `../abcodejs/` via BoaJS
- Embedded transpilers for offline compilation
- No external JavaScript runtime required

---
© 2021-2026 by César Andres Arcila Buitrago