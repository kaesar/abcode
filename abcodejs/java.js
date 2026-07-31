// © 2021-2025 by César Andres Arcila Buitrago

// Variable to store current script for framework detection (@spring, @webflux, @micronaut)
let currentScript = '';

// Track whether the AB source defined its own logic entry called "main"
let hasUserMain = false;

// Track whether we already saw an explicit invocation of main from user code (run: main())
let sawUserMainInvocation = false;

// The name the user gave to the server (from `web: @server = NAME`).
// Falls back to "server".
let currentJavaServerVar = 'server';

function start(script, plan) {
    console.log('~~~~~~~~~~~~~~~');
    console.log('ABCode for Java');
    console.log(`~~~~~~~~~~~~~~~\n\n${script}`);
    
    // Reset state
    currentScript = script;
    pendingSetBlocks = 0;
    hasUserMain = false;
    sawUserMainInvocation = false;

    // Determine target language based on plan or goal directive
    let targetLang = 'java';
    
    // If plan is a number (from -t argument), use it to determine target
    if (plan && !isNaN(parseInt(plan))) {
        const targetNum = parseInt(plan);
        
        if (targetMap[targetNum]) {
            targetLang = targetMap[targetNum];
        }
    } else {
        // Otherwise use goal directive
        targetLang = checkGoal(script);
    }
    
    // Process like directives
    const processedScript = checkLike(script, targetLang);

    // Extract class name from script
    const className = extractClassName(processedScript);

    // Add JBang shebang line at the beginning of the output
    const jbangShebang = "//usr/bin/env jbang \"$0\" \"$@\" ; exit $?\n\n";
    
    // Transpile the script
    const transpiled = transpileLines('Java', processedScript, transpileLine) || '';
    
    // Process the transpiled code into sections
    const codeSections = processTranspiledCode(transpiled);
    
    // Assemble the final Java code
    return jbangShebang + assembleJavaCode(className, codeSections);
}

// Process like: directives with inline #in: comments
const checkLike = (script, currentGoal) => {
    const lines = script.split('\n');
    const processedLines = [];
    currentReplacements = {}; // Clear any previous replacements
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        if (!line.trim()) {
            processedLines.push(line);
            continue;
        }
        
        // Skip goal: directive but keep type: directive
        if (line.trim().match(/^goal:/i)) {
            continue;
        }
        
        if (line.trim().match(/^like:/i)) {
            const inMatch = line.match(/#in:\s*(\w+)/i);
            if (inMatch && inMatch[1]) {
                const targetLang = inMatch[1].toLowerCase();
                
                if (targetLang === currentGoal) {
                    if (processedLines.length > 0) {
                        processedLines.pop();
                    }
                    const cleanedLine = line.replace(/^like:\s*/i, '').replace(/#in:\s*\w+/i, '').trim();
                    processedLines.push(cleanedLine);
                }
                continue;
            }
        }
        
        processedLines.push(line);
    }
    
    return processedLines.join('\n');
}

// Extract class name from script using type: directive
const extractClassName = (script) => {
    let className = "Main";
    
    // Look for type: directive
    const typeDirectiveMatch = script.match(/type:\s*([a-zA-Z][a-zA-Z0-9]*)/i);
    if (typeDirectiveMatch && typeDirectiveMatch[1]) {
        className = typeDirectiveMatch[1];
        // Export the class name for main.rs to use
        console.log(`@CLASSNAME:${className}`);
    }
    
    return className;
}

// Separate the raw transpilation result into:
// - importLines
// - functionLines : normal user-defined fun: (hoisted as class-level static helpers)
// - codeLines     : everything that must go inside the generated main(String[] args)
//
// IMPORTANT: if the source contained a "fun: main(...)", we treat its body as
// the *main program logic* and inline the statements into codeLines (so variables
// declared at top level of script, like "app", "port", "todos" are visible).
// We also suppress any "abMain();" or "main();" call that was injected as a
// result of `run: main()`.
const processTranspiledCode = (transpiled) => {
    const lines = transpiled.split('\n');

    const importLines = [];
    const functionLines = [];
    const codeLines = [];

    let i = 0;
    while (i < lines.length) {
        const raw = lines[i];
        const trimmed = raw.trim();

        if (trimmed.startsWith('import ')) {
            importLines.push(trimmed);
            i++;
            continue;
        }

        // Detect method emitted by checkFun:
        //   public [static] Type name(
        const funHead = /^public\s+(static\s+)?(\w+)\s+(\w+)\s*\(/.exec(trimmed);
        if (funHead) {
            const retTok = funHead[2];   // e.g. void, Integer, ...
            const mname  = funHead[3];   // method name

            const isProgramMain = (mname === 'main' || mname === 'abMain' || retTok === 'main');

            // Collect the body statements contained in this fun
            const bodyStmts = [];

            let decl = trimmed;
            if (!isProgramMain && !/\bstatic\b/.test(decl)) {
                decl = decl.replace(/^public\s+/, 'public static ');
            }

            let opens = (decl.match(/\{/g) || []).length;
            let closes = (decl.match(/\}/g) || []).length;
            let depth = opens - closes;
            i++;

            while (i < lines.length && depth > 0) {
                const t = lines[i].trim();

                if (t === '}' && depth === 1) {
                    depth = 0;
                    i++;
                    break;
                }

                if (t) bodyStmts.push(t);
                else bodyStmts.push('');

                opens = (t.match(/\{/g) || []).length;
                closes = (t.match(/\}/g) || []).length;
                depth += opens - closes;
                i++;
            }

            if (isProgramMain) {
                // Inline the body of what the user wrote as "fun: main" or "fun: main()"
                // directly into the scope of the generated main(String[] args).
                for (const stmt of bodyStmts) {
                    codeLines.push(stmt ? ('        ' + stmt) : '');
                }
            } else {
                // Regular helper -> emit a real public static method at class level
                functionLines.push('    ' + decl);
                for (const stmt of bodyStmts) {
                    functionLines.push(stmt ? ('        ' + stmt) : '');
                }
                functionLines.push('    }');
            }
            continue;
        }

        // Top-level statements (outside any fun)
        if (trimmed) {
            // Suppress any residual calls to the inlined main body
            if (/^\s*(abMain\s*\(\s*\)|main\s*\(\s*\))\s*;?\s*$/.test(trimmed)) {
                // do nothing — body was inlined
            } else {
                codeLines.push('        ' + trimmed);
            }
        }
        i++;
    }

    return { importLines, functionLines, codeLines };
}

/**
 * Convert ABCode/JS-ish literals into valid Java expressions:
 * - {"hello":"there!"}  → "{\"hello\":\"there!}\"
 * - [1, 2, 3] remains usable (we usually translate to Arrays.asList via checkLet)
 * - bare numbers / identifiers / calls stay as-is
 * Used primarily for web: @handle = ...
 */
const toJavaValueExpr = (expr) => {
    if (expr == null) return 'null';
    const s = String(expr).trim();

    // Already looks like a valid-ish expr (quoted string, number, ident, call starting with ident or this.)
    if (/^".*"$/.test(s) ||
        /^-?\d+(\.\d+)?$/.test(s) ||
        /^[a-zA-Z_$][\w$]*(\.[a-zA-Z_$][\w$]*|\(\))*$/.test(s.replace(/\s+/g, ''))) {
        // further heuristic: if a naked object/array literal leaks through, fall to escape below
        if (!/^\s*[\{\[]/.test(s)) {
            return s;
        }
    }

    // Object literal → escape to JSON string (good enough for ctx.json("...") or simple cases)
    if (s.startsWith('{') && s.endsWith('}')) {
        // Escape inner double quotes minimally
        const escaped = s.replace(/"/g, '\\"');
        return `"${escaped}"`;
    }

    // Array literal (rare at top-level handle) - leave but caller should have wrapped as list earlier
    if (s.startsWith('[') && s.endsWith(']')) {
        return s;
    }

    return s;
};

// Assemble the final Java code
const assembleJavaCode = (className, { importLines, functionLines, codeLines }) => {

    const isSpring = currentScript && currentScript.includes('@spring');
    const isWebFlux = currentScript && currentScript.includes('@webflux');
    const isMicronaut = currentScript && currentScript.includes('@micronaut');
    
    // Imports section
    const imports = importLines.join('\n') + (importLines.length > 0 ? '\n\n' : '');
    
    // Class definition with framework annotations
    let classWrapper;
    if (isWebFlux) {
        classWrapper = `@SpringBootApplication\n@RestController\npublic class ${className} {\n\n`;
    } else if (isSpring) {
        classWrapper = `@SpringBootApplication\n@RestController\npublic class ${className} {\n\n`;

    } else {  // Default: Micronaut
        classWrapper = `@Controller\npublic class ${className} {\n\n`;
    }
    
    // Functions section (all fun: become static methods)
    const functions = functionLines.length > 0 ? functionLines.join('\n') + '\n\n' : '';
    
    // Build main body.
    // We may need to add an explicit invocation to the user's "main" logic (abMain) if:
    //   - the source contained a fun: main that we renamed
    //   - AND the user never wrote `run: main()` that now became `abMain()`
    let injectedCall = '';
    if (hasUserMain && !sawUserMainInvocation) {
        injectedCall = '        abMain();\n';
    }

    const mainBody = codeLines.join('\n') + (injectedCall ? '\n' + injectedCall : '');
    
    const mainMethod = "    public static void main(String[] args) {\n" + 
                       mainBody + 
                       "\n    }\n";
    
    // Class closing
    const closing = "}";
    
    // Post reset bookkeeping (safety)
    hasUserMain = false;
    sawUserMainInvocation = false;
    
    return imports + classWrapper + functions + mainMethod + closing;
}

const checkLet = (indent, key, code) => {
    let sentence = '';
    let variable = '';
    let value = '';
    let typing = [];
    let parcial = code.split('=');
    if (parcial.length > 1) {
        typing = parcial[0].split(':');
        if (typing.length > 1)
            variable = typing[0].trim();
        else
            variable = parcial[0].trim()
        value = parcial[1].trim();
        
        if (value && value !== 'null') {
            value = applyRoutines(value, 'java');
        }
    }
    else {
        variable = code;
        value = 'null';
    }

    // Special case: empty list literal intending mutation later
    if (/^\[\s*\]$/.test(value.trim())) {
        value = 'new java.util.ArrayList<>()';
    } else if (sentence.indexOf('= [') > 0 || value.indexOf('= [') > 0 || value.trim().startsWith('[')) {
        // General: try to convert array literal to mutable list when not already converted
        if (value.indexOf('[') === 0) {
            value = value.replace('[', 'java.util.Arrays.asList(').replace(']', ')');
        }
    }

    let type = 'Object';
    if (typing.length > 1) {
        let declaredType = typing[1].trim();
        if (declaredType === 'int') type = 'Integer';
        else if (declaredType === 'string') type = 'String';
        else if (declaredType === 'any') type = 'Object';
        else if (declaredType === 'float') type = 'Double';
        else type = declaredType;
        
        sentence = `${type} ${variable} = ${value}`;
    } else {
        sentence = `var ${variable} = ${value}`;
    }

    if (sentence.indexOf('= [') > 0 && !sentence.includes('asList')) {
        sentence = sentence.replace('= [', '= java.util.Arrays.asList(');
        sentence = sentence.replace(/]$/, ')');
    }

    return `${indent}${sentence};\n`;
}

const checkFun = (indent, code) => {
    const [name, kind, params, spec, simple] = parseFun(code);

    const originalName = name;
    let methodName = name;

    // collision handling: reserve real Java "main" signature for entrypoint. Redirect user's main.
    if (originalName === 'main') {
        hasUserMain = true;
        methodName = 'abMain';   // renamed to avoid duplicate public static void main
        sawUserMainInvocation = false; // will be turned on later if user does explicit run: main()
    }

    let returnType = kind && kind !== 'void' ? kind : 'void';
    
    // Convert types to Java types
    if (returnType === 'int') returnType = 'Integer';
    else if (returnType === 'string') returnType = 'String';
    else if (returnType === 'any') returnType = 'Object';
    else if (returnType === 'float') returnType = 'Double';
    
    let sentence = `public static ${returnType} ${methodName}(`;
    
    // Check for WebFlux reactive types
    const isWebFlux = currentScript && currentScript.includes('@webflux');
    
    if (spec && spec.includes('async')) {
        if (isWebFlux) {
            // Use Mono for single values, Flux for streams
            returnType = returnType === 'void' ? 'Mono<Void>' : `Mono<${returnType}>`;
        } else {
            // Traditional CompletableFuture
            returnType = `CompletableFuture<${returnType}>`;
        }
        sentence = `public static ${returnType} ${methodName}(`;
    }

    for (let i = 0; i < params.length; i++) {
        if (i > 0)
            sentence += ', ';
        
        // Convert parameter type to Java type
        let paramType = params[i].kind || 'Object';
        if (paramType === 'int') paramType = 'Integer';
        else if (paramType === 'string') paramType = 'String';
        else if (paramType === 'any') paramType = 'Object';
        else if (paramType === 'float') paramType = 'Double';
        
        // Java uses "type name" format, not "name: type"
        sentence += `${paramType} ${params[i].name}`;
    }

    sentence += ') {';
    
    if (code === 'new')
        sentence = sentence.replace(/public static \w+ new/, 'public static');

    return `${indent}${sentence}\n`;
}

const checkIf = (indent, key, code) => {
    let sentence = parseIf(key, code);
    
    // Transform comparisons from == to equals() -> Pattern: something == "string" or "string" == something
    const equalityRegex = /([a-zA-Z0-9_\.]+)\s*==\s*"([^"]*)"|"([^"]*)"\s*==\s*([a-zA-Z0-9_\.]+)/g;
    sentence = sentence.replace(equalityRegex, (match, leftVar, rightStr, leftStr, rightVar) => {
        if (leftVar && rightStr) {
            return `${leftVar}.equals("${rightStr}")`;
        } else {
            return `"${leftStr}".equals(${rightVar})`;
        }
    });

    if (key === 'if') {  // if:
        return `${indent}if (${sentence}) {\n`;
    }
    
    if (key === 'when') {  // when:
        if (sentence.toLowerCase() === 'no')
            return `${indent}} else {\n`;
        else
            return `${indent}} else if (${sentence}) {\n`;
    }
    
    if (key === 'else') {  // else:
        return `${indent}} else {\n`;
    }
}

const checkFor = (indent, code) => {
    const [ start, stop, step, varstep, varsize, incode ] = parseFor(code);

    // Normalize sizing for Java lists / collections
    const sizeExpr = (v) => `${v}.size()`;

    if (incode && varstep) {
        // "for: i in range(...)"
        const useSize = (stop && stop.indexOf('len(') === 0 && varsize);
        const upper = useSize ? sizeExpr(varsize) : stop;

        const init = `${varstep} = ${start}`;
        const cond = `${varstep} < ${upper}`;
        const inc  = (step && step !== "1") ? `${varstep} += ${step}` : `${varstep}++`;

        // Use a clean for-loop with a proper local declaration in the header
        return `${indent}for (int ${varstep} = ${start}; ${cond}; ${inc}) {\n`;
    }
    else if (incode) {
        // raw style not very common in ABCode Java path, still emit a guard
        return `${indent}for (${code}) {\n`;
    }
    else if (varsize) {
        // while (len(xs)) style → translate to while (xs.size() > 0) or similar
        // keep behavior similar to existing but correct .size -> .size()
        const replaced = code.replace('len(' + varsize + ')', sizeExpr(varsize));
        return `${indent}while (${replaced}) {\n`;
    }
    else {
        return `${indent}while (${code}) {\n`;
    }
}

const checkDoc = (indent, code) => {
    // Skip directive comments
    if (code.match(/^(type|goal|like):/i)) {
        return '';
    }
    
    // Skip #in: comments
    if (code.match(/^#in:/i)) {
        return '';
    }
    
    let sentence = `${indent}# ${code}\n`;
    if (code === 'end') {
        sentence = `${indent}${closeOneBlock()}\n`;
    }
    sentence = sentence.replace('# ', '//');
    return sentence;
}

// Close handler / block.
function closeOneBlock() {
    if (pendingSetBlocks > 0) {
        pendingSetBlocks--;
        return ''; // set: blocks emit no real '}'
    }
    return '}';
}

const checkRead = (indent, code) => {
    return `${indent}import ${code};\n`;
}
let pendingSetBlocks = 0;

const checkSet = (indent, code) => {
    // set: starts a block of field declarations. In Java we emit a marker comment
    // and then ignore the corresponding 'end' block (we pretend the block closed without writing '}' ).
    pendingSetBlocks++;
    return `${indent}// ABCode set: ${code}  (consider a static class or record for strong typing)\n`;
}

const checkUse = (indent, code) => {
    let lib = parseUse(code);
    const emitSingle = (l) => `${indent}import ${l};\n`;

    if (lib === '@abc')
        return emitSingle('abc');

    if (lib === '@api') {
        // Java default web framework is Micronaut
        return `${indent}import io.micronaut.runtime.Micronaut;\n` +
               `${indent}import io.micronaut.http.annotation.*;\n` +
               `${indent}import io.micronaut.http.HttpResponse;\n`;
    }

    if (lib === '@spring') {
        // Note: SpringBoot cases usually rely on the generated main to bootstrap via SpringApplication.run
        // Emit the needed annotations + SpringApplication
        return `${indent}import org.springframework.boot.SpringApplication;\n` +
               `${indent}import org.springframework.web.bind.annotation.*;\n` +
               `${indent}import org.springframework.boot.autoconfigure.SpringBootApplication;\n`;
    }

    if (lib === '@webflux') {
        return `${indent}import org.springframework.boot.SpringApplication;\n` +
               `${indent}import org.springframework.web.bind.annotation.*;\n` +
               `${indent}import org.springframework.boot.autoconfigure.SpringBootApplication;\n` +
               `${indent}import reactor.core.publisher.Mono;\n` +
               `${indent}import reactor.core.publisher.Flux;\n` +
               `${indent}import org.springframework.web.reactive.function.server.*;\n`;
    }

    if (lib === '@micronaut') {
        return `${indent}import io.micronaut.runtime.Micronaut;\n` +
               `${indent}import io.micronaut.http.annotation.*;\n` +
               `${indent}import io.micronaut.http.HttpResponse;\n`;
    }

    if (lib === '@mongodb') {
        return `${indent}import com.mongodb.MongoClient;\n` +
               `${indent}import com.mongodb.MongoException;\n`;
    }

    // Generic single import, force semicolon
    if (lib && !lib.includes('\n')) {
        return emitSingle(lib);
    }

    // Fallback: split possible multi-line and clean
    return lib.split('\n').map(l => {
        const trimmed = l.trim();
        if (!trimmed) return '';
        if (trimmed.startsWith('import ')) {
            return trimmed.endsWith(';') ? `${indent}${trimmed}\n` : `${indent}${trimmed};\n`;
        }
        return `${indent}import ${trimmed};\n`;
    }).join('');
}

const checkSub = (indent, code) => {
    const [method, route, name, simple] = parseSub(code);
    if (['get','post','put','delete','head','patch','options'].includes(method)) {
        const isSpring = currentScript && currentScript.includes('@spring');
        const isWebFlux = currentScript && currentScript.includes('@webflux');
        const isMicronaut = currentScript && currentScript.includes('@micronaut');

        const handlerName = name || ('handler_' + Math.random().toString(36).slice(2, 8));

        if (isWebFlux) {
            const methodAnnotation = `@${method.charAt(0).toUpperCase() + method.slice(1)}Mapping`;
            return `${indent}${methodAnnotation}(${route})\n${indent}public Mono<String> ${handlerName}() {\n`;
        } else if (isSpring) {
            const methodAnnotation = `@${method.charAt(0).toUpperCase() + method.slice(1)}Mapping`;
            return `${indent}${methodAnnotation}(${route})\n${indent}public String ${handlerName}() {\n`;
        } else {  // Default for Java: Micronaut
            const methodAnnotation = `@${method.charAt(0).toUpperCase() + method.slice(1)}`;
            return `${indent}${methodAnnotation}(${route})\n${indent}public HttpResponse<String> ${handlerName}() {\n`;
        }
    }
    return `${indent}for (Object item : ${code}) {\n`;
}

const checkWeb = (indent, code) => {
    const [method, handle] = parseWeb(code);
    const isSpring = currentScript && currentScript.includes('@spring');
    const isWebFlux = currentScript && currentScript.includes('@webflux');
    const isMicronaut = currentScript && currentScript.includes('@micronaut');
    
    if (method === '@server' || method === 'server') {
        if (isWebFlux) {
            return `${indent}// Spring WebFlux app configured via @SpringBootApplication\n`;
        } else if (isSpring) {
            return `${indent}// Spring Boot app configured via @SpringBootApplication\n`;
        } else {  // Default for Java: Micronaut
            // Use the exact variable name the user wrote (e.g. "app").
            // If they wrote `web: @server = app`, we must use "app", not hard-coded "server".
            const sv = (handle && handle.trim()) ? handle.trim() : 'server';
            currentJavaServerVar = sv;
            return `${indent}// Micronaut app configured via @Controller\n`;
        }
    } else if (method === '@listen' || method === 'listen') {
        if (isWebFlux || isSpring) {
            return `${indent}SpringApplication.run(${extractClassName(currentScript || '')}.class, args);\n`;
        } else {  // Default: Micronaut (including @micronaut explicit or plain @api)
            return `${indent}Micronaut.run(${extractClassName(currentScript || '')}.class, args);\n`;
        }
    } else if (method === '@handle' || method === '@handler' || method === 'handle') {
        const safeHandle = toJavaValueExpr(handle);

        if (isWebFlux) {
            return `${indent}return Mono.just(${safeHandle});\n`;
        } else if (isSpring) {
            return `${indent}return ${safeHandle};\n`;
        } else {  // Default: Micronaut style response
            return `${indent}return HttpResponse.ok(${safeHandle});\n`;
        }
    }
    
    return ``;
}

const checkDBC = (indent, code) => {
    const [method, handle, vary] = parseDBC(code);
    if (method === 'link')
        return `${indent}MongoClient dbc;\n${indent}try {\n${indent}  dbc = new MongoClient("127.0.0.1", 27017);\n${indent}} catch (MongoException e) { e.printStackTrace(); }\n`;
    else if (vary)
        return ``;
        //return `${indent}MongoDatabase ${vary} = dbc.getDatabase(${handle});\n`;

    return `${indent}${code};\n`;
}

// Función para manejar operaciones de archivo
const checkFile = (indent, code) => {
    const parts = code.split(/\s*=\s*/);
    if (parts.length < 2) return `${indent}// Invalid file operation: ${code}\n`;
    
    const method = parts[0].trim();
    const args = parts[1].trim();
    
    switch (method) {
        case '@open':
        case 'open':
            return `${indent}FileInputStream fileHandle = new FileInputStream(${args});\n`;
        case '@write':
        case 'write':
            const writeArgs = args.split(',');
            return `${indent}Files.write(Paths.get(${writeArgs[0]}), ${writeArgs[1]}.getBytes());\n`;
        case '@read':
        case 'read':
            return `${indent}String fileContent = new String(Files.readAllBytes(Paths.get(${args})));\n`;
        case '@close':
        case 'close':
            return `${indent}${args}.close();\n`;
        default:
            return `${indent}// Unknown file operation: ${method}\n`;
    }
};

// Process goal: directive to determine target language
const checkGoal = (script) => {
    const goalMatch = script.match(/goal:\s*(\w+)/i);
    if (goalMatch && goalMatch[1]) {
        const goal = goalMatch[1].toLowerCase();
        // If goal is specified and it's not java, log it for potential use
        if (goal !== 'java') {
            console.log(`@GOAL:${goal}`);
        }
        return goal;
    }
    return 'java'; // Default goal
}

// Variable to store replacements
let currentReplacements = {};

// Function to transpile a line of code
const transpileLine = (item) => {
    let indent = '';
    if (item.indent > 0)
        for (let j = 0; j < item.indent; j++)
            indent += ' ';

    //console.log(item)
    if (item.key === 'line')  // enter
        return `\n`;

    if (item.key === 'end')  // ##
        return `${indent}${closeOneBlock()}\n`;

    if (item.key === 'doc') {  // #
        // Verificar si es una anotación estilo Rust (#[annotation])
        if (item.code.startsWith('[') && item.code.endsWith(']')) {
            return `${indent}@${item.code.substring(1, item.code.length-1)}\n`;
        }
        return checkDoc(indent, item.code);
    }

    if (item.key === 'var')  // var:
        return checkLet(indent, item.key, item.code);
    
    if (item.key === 'val')  // val:
        return checkLet(indent, item.key, item.code);
    
    if (item.key === 'fun')  // fun:
        return checkFun(indent, item.code);

    if (item.key === 'pass') {  // pass:
        // Reemplazar @ con this. para acceder a propiedades de clase
        let code = item.code.replace(/@([a-zA-Z0-9_]+)/g, 'this.$1');
        return `${indent}return ${code};\n`;
    }

    if (item.key === 'if')  // if:
        return checkIf(indent, item.key, item.code);

    if (item.key === 'when')  // when:
        return checkIf(indent, item.key, item.code);

    if (item.key === 'else')  // else:
        return checkIf(indent, item.key, item.code);

    if (item.key === 'for')  // for:
        return checkFor(indent, item.code);

    if (item.key === 'run') {  // run:
        // Handle user explicitly calling main — we redirect to our safe name.
        // User source may do:  run: main()   or  run: main(x, y)
        const mainCallMatch = item.code.match(/^\s*main\s*\((.*)\)\s*$/);
        if (mainCallMatch) {
            sawUserMainInvocation = true;
            const args = mainCallMatch[1].trim();
            const call = args ? `abMain(${args})` : `abMain()`;
            return `${indent}${call};\n`;
        }

        // Reemplazar @ con this. para acceder a propiedades de clase
        let code = item.code.replace(/@([a-zA-Z0-9_]+)/g, 'this.$1');
        // Apply routines to the code
        code = applyRoutines(code, 'java');
        return `${indent}${code};\n`;
    }

    if (item.key === 'echo') {  // echo:
        // Reemplazar @ con this. para acceder a propiedades de clase
        let code = item.code.replace(/@([a-zA-Z0-9_]+)/g, 'this.$1');
        
        // Detectar si es una cadena con interpolación
        if (code.includes('{') && code.includes('}') && code.startsWith('"') && code.endsWith('"')) {
            // Convertir a String.format
            code = code.substring(1, code.length - 1); // Quitar comillas
            let formatArgs = [];
            code = code.replace(/{([^{}:]+)(?::([^{}]+))?}/g, (match, varName, format) => {
                formatArgs.push(varName.trim());
                if (!format) return "%s";
                
                // Manejar formato
                if (format.includes('.')) {
                    return "%." + format.split('.')[1] + "f";
                }
                return "%" + format + "s";
            });
            return `${indent}System.out.printf("${code}\\n", ${formatArgs.join(', ')});\n`;
        }
        
        return `${indent}System.out.println(${code});\n`;
    }

    if (item.key === 'read')  // read:
        return checkRead(indent, item.code);

    if (item.key === 'do')  // do:
        return checkSub(indent, item.code);

    if (item.key === 'try')  // try:
        return `${indent}try {\n`;

    if (item.key === 'fail')  // fail:
        return `${indent}catch(Exception err) {\n`;

    if (item.key === 'use')  // use:
        return checkUse(indent, item.code)

    if (item.key === 'type')  // type:
        return '';

    if (item.key === 'set')  // set:
        return checkSet(indent, item.code);

    if (item.key === 'web')  // web: server, listen, handle, expose, socket, upload, fetch
        return checkWeb(indent, item.code);

    if (item.key === 'file')  // file: open, write, read, close
        return checkFile(indent, item.code);

    if (item.key === 'dbc')  // dbc:
        return checkDBC(indent, item.code);

    if (item.key === '@')  // @:
        return '';
        
    return '';
}

// module.exports = { start }