// © 2021-2025 by César Andres Arcila Buitrago

// Variable to store current script for Spring Boot detection
let currentScript = '';

function start(script, plan) {
    console.log('~~~~~~~~~~~~~~~');
    console.log('ABCode for Java');
    console.log(`~~~~~~~~~~~~~~~\n\n${script}`);
    
    // Store script for Spring Boot detection
    currentScript = script;

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

// Process transpiled code into separate sections
const processTranspiledCode = (transpiled) => {
    const importLines = [];
    const functionLines = [];
    const codeLines = [];
    
    let inFunctionDefinition = false;
    let functionIndent = "    "; // 4 spaces for class-level indentation
    let currentFunction = [];
    
    transpiled.split('\n').forEach(line => {
        if (line.trim().startsWith("import ")) {
            importLines.push(line);
        } 
        // Check for function definition start
        else if (line.match(/^\s*public\s+\w+\s+\w+\s*\([^)]*\)\s*\{/)) {
            inFunctionDefinition = true;
            // Make all methods static
            let staticLine = line.replace(/public\s+(\w+)\s+(\w+)/, "public static $1 $2");
            currentFunction = [functionIndent + staticLine]; // Start collecting the function
        }
        // If we're inside a function definition
        else if (inFunctionDefinition) {
            // Check if this line ends the function
            if (line.trim() === "}") {
                currentFunction.push(functionIndent + line);
                functionLines.push(...currentFunction);
                currentFunction = [];
                inFunctionDefinition = false;
            } else {
                // Add line to current function with proper indentation
                currentFunction.push(functionIndent + "    " + line.trim());
            }
        }
        // Regular code (not function definition or import)
        else if (line.trim() !== '') {
            codeLines.push("        " + line.trim()); // 8 spaces for main method
        }
    });
    
    return { importLines, functionLines, codeLines };
}

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
    } else if (isMicronaut) {
        classWrapper = `@Controller\npublic class ${className} {\n\n`;
    } else {
        classWrapper = `public class ${className} {\n\n`;
    }
    
    // Functions section
    const functions = functionLines.length > 0 ? functionLines.join('\n') + '\n\n' : '';
    
    // Main method
    const mainMethod = "    public static void main(String[] args) {\n" + 
                       codeLines.join('\n') + 
                       "\n    }\n";
    
    // Class closing
    const closing = "}";
    
    return imports + classWrapper + functions + mainMethod + closing;
}

const checkLet = (indent, key, code) => {
    let sentence = '';
    let variable = '';
    let value = '';
    //let typify = 'any';
    let typing = [];
    let parcial = code.split('=');
    if (parcial.length > 1) {
        typing = parcial[0].split(':');
        if (typing.length > 1)
            variable = typing[0].trim();
        else
            variable = parcial[0].trim()
        value = parcial[1].trim();
        
        // Apply routines to the value
        if (value && value !== 'null') {
            value = applyRoutines(value, 'java');
        }
    }
    else {
        variable = code;
        value = 'null';
    }

    // Determine variable type
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

    if (sentence.indexOf('= [') > 0) {
        sentence = sentence.replace('= [', '= Arrays.asList(');
        sentence = sentence.replace(']', ')');
    }

    return `${indent}${sentence};\n`;
}

const checkFun = (indent, code) => {
    const [name, kind, params, spec, simple] = parseFun(code);
    let returnType = kind && kind !== 'void' ? kind : 'void';
    
    // Convert types to Java types
    if (returnType === 'int') returnType = 'Integer';
    else if (returnType === 'string') returnType = 'String';
    else if (returnType === 'any') returnType = 'Object';
    else if (returnType === 'float') returnType = 'Double';
    
    let sentence = `public ${returnType} ${name}(`;
    
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
        sentence = `public ${returnType} ${name}(`;
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
        sentence = sentence.replace(/public \w+ new/, 'public');

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
    if (incode && varstep) {
        if (stop.indexOf('len(') === 0 && varsize) {
            if (step && step !== "1")
                return `${indent}var ${varstep} = 0\n${indent}for (${varstep} = ${start}; ${varstep} < ${varsize}.size; ${varstep} += ${step}) {\n`;
            return `${indent}var ${varstep} = 0\n${indent}for (${varstep} = ${start}; ${varstep} < ${varsize}.size; ${varstep}++) {\n`;
        }
        else
            return `${indent}var ${varstep} = 0\n${indent}for (${varstep} = ${start}; ${varstep} < ${stop}; ${varstep}++) {\n`;
    }
    else if (incode)
        return `${indent}for (${code}) {\n`;
    else if (varsize)
        return `${indent}while (${code.replace('len(' + varsize + ')', varsize + '.size')}) {\n`;
    else
        return `${indent}while (${code}) {\n`;
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
    if (code === 'end')
        sentence = `${indent}}\n`;
    sentence = sentence.replace('# ', '//');
    return sentence;
}

const checkRead = (indent, code) => {
    return `${indent}import ${code}\n`;
}

const checkSet = (indent, code) => {
    return `${indent}var ${code}\n`;
}

const checkUse = (indent, code) => {
    let lib = parseUse(code)
    if (lib === '@abc')
        lib = 'abc';
    else if (lib === '@api')
        lib = 'io.javalin.Javalin';  // Default: Javalin
    else if (lib === '@spring')
        lib = 'org.springframework.boot.SpringApplication\n${indent}import org.springframework.web.bind.annotation.*\n${indent}import org.springframework.boot.autoconfigure.SpringBootApplication';
    else if (lib === '@webflux')
        lib = 'org.springframework.boot.SpringApplication\n${indent}import org.springframework.web.bind.annotation.*\n${indent}import org.springframework.boot.autoconfigure.SpringBootApplication\n${indent}import reactor.core.publisher.Mono\n${indent}import reactor.core.publisher.Flux\n${indent}import org.springframework.web.reactive.function.server.*';
    else if (lib === '@micronaut')
        lib = 'io.micronaut.runtime.Micronaut\n${indent}import io.micronaut.http.annotation.*\n${indent}import io.micronaut.http.HttpResponse';
    else if (lib === '@vertx')
        lib = 'io.vertx.core.Vertx\n${indent}import io.vertx.ext.web.Router\n${indent}import io.vertx.core.http.HttpServer\n${indent}import io.vertx.ext.web.RoutingContext';
    else if (lib === '@mongodb')
        lib = `com.mongodb.MongoClient\n${indent}import com.mongodb.MongoException`;
    return `${indent}import ${lib}\n`;
}

const checkSub = (indent, code) => {
    const [method, route, name, simple] = parseSub(code);
    if (['get','post','put','delete','head','patch','options'].includes(method)) {
        // Check framework type
        const isSpring = currentScript && currentScript.includes('@spring');
        const isWebFlux = currentScript && currentScript.includes('@webflux');
        const isMicronaut = currentScript && currentScript.includes('@micronaut');
        const isVertx = currentScript && currentScript.includes('@vertx');
        
        if (isWebFlux) {
            const methodAnnotation = `@${method.charAt(0).toUpperCase() + method.slice(1)}Mapping`;
            return `${indent}${methodAnnotation}(${route})\n${indent}public Mono<String> ${name}() {\n`;
        } else if (isSpring) {
            const methodAnnotation = `@${method.charAt(0).toUpperCase() + method.slice(1)}Mapping`;
            return `${indent}${methodAnnotation}(${route})\n${indent}public String ${name}() {\n`;
        } else if (isMicronaut) {
            const methodAnnotation = `@${method.charAt(0).toUpperCase() + method.slice(1)}`;
            return `${indent}${methodAnnotation}(${route})\n${indent}public HttpResponse<String> ${name}() {\n`;
        } else if (isVertx) {
            return `${indent}router.${method}(${route}).handler(ctx -> {\n${indent}    ${name}(ctx);\n${indent}});\n${indent}public void ${name}(RoutingContext ctx) {\n`;
        } else {
            // Default: Javalin
            return `${indent}app.${method}(${route}, (ctx) -> {\n`;
        }
    }
    return `${indent}for (Object item : ${code}) {\n`;
}

const checkWeb = (indent, code) => {
    const [method, handle] = parseWeb(code);
    const isSpring = currentScript && currentScript.includes('@spring');
    const isWebFlux = currentScript && currentScript.includes('@webflux');
    const isMicronaut = currentScript && currentScript.includes('@micronaut');
    const isVertx = currentScript && currentScript.includes('@vertx');
    
    if (method === '@server' || method === 'server') {
        if (isWebFlux) {
            return `${indent}// Spring WebFlux app configured via @SpringBootApplication\n`;
        } else if (isSpring) {
            return `${indent}// Spring Boot app configured via @SpringBootApplication\n`;
        } else if (isMicronaut) {
            return `${indent}// Micronaut app configured via @Controller\n`;
        } else if (isVertx) {
            return `${indent}Vertx vertx = Vertx.vertx();\n${indent}HttpServer ${handle} = vertx.createHttpServer();\n${indent}Router router = Router.router(vertx);\n`;
        } else {
            return `${indent}Javalin ${handle} = Javalin.create();\n`;
        }
    } else if (method === '@listen' || method === 'listen') {
        if (isWebFlux || isSpring) {
            return `${indent}SpringApplication.run(${extractClassName(currentScript || '')}.class, args);\n`;
        } else if (isMicronaut) {
            return `${indent}Micronaut.run(${extractClassName(currentScript || '')}.class, args);\n`;
        } else if (isVertx) {
            return `${indent}server.requestHandler(router).listen(${handle});\n`;
        } else {
            return `${indent}app.start(${handle});\n`;
        }
    } else if (method === '@handle' || method === '@handler' || method === 'handle') {
        if (isWebFlux) {
            return `${indent}return Mono.just(${handle});\n`;
        } else if (isSpring) {
            return `${indent}return ${handle};\n`;
        } else if (isMicronaut) {
            return `${indent}return HttpResponse.ok(${handle});\n`;
        } else if (isVertx) {
            return `${indent}ctx.response().end(${handle});\n`;
        } else {
            return `${indent}ctx.result(${handle});\n`;
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

    // Check if this is an echo statement and we have replacements
    if (item.key === 'echo' && Object.keys(currentReplacements).length > 0) {
        // Look for a replacement for this echo statement
        for (const lineIndex in currentReplacements) {
            // Simple string match to identify the line
            if (item.code && currentReplacements[lineIndex]) {
                return `${indent}${currentReplacements[lineIndex]};\n`;
            }
        }
    }

//console.log(item)
    if (item.key === 'line')  // enter
        return `\n`;

    if (item.key === 'end')  // ##
        return `${indent}}\n`;

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
        if (item.code.indexOf('main(') > -1)
            return '';
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