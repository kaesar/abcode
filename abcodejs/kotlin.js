// © 2021-2025 by César Andres Arcila Buitrago

// Variable to store current script for Spring Boot detection
let currentScript = '';

function start(script, plan) {
    console.log('~~~~~~~~~~~~~~~~~');
    console.log('ABCode for Kotlin');
    console.log(`~~~~~~~~~~~~~~~~~\n\n${script}`);
    
    // Store script for Spring Boot detection
    currentScript = script;

    // Determine target language based on plan or goal directive
    let targetLang = 'kotlin';
    
    if (plan && !isNaN(parseInt(plan))) {
        const targetNum = parseInt(plan);
        
        if (targetMap[targetNum]) {
            targetLang = targetMap[targetNum];
        }
    } else {
        targetLang = checkGoal(script);
    }
    
    const processedScript = checkLike(script, targetLang);
    const className = extractClassName(processedScript);
    let transpiled = transpileLines('Kotlin', processedScript, transpileLine);
    
    return `fun main(args: Array<String>) {\n${transpiled}\n}`;
}

// Extract class name from script using @class directive
const extractClassName = (script) => {
    let className = "Main";
    const classDirectiveMatch = script.match(/#\s*@class\s+([a-zA-Z][a-zA-Z0-9]*)/i);
    
    if (classDirectiveMatch && classDirectiveMatch[1]) {
        className = classDirectiveMatch[1];
        // Export the class name for main.rs to use
        console.log(`@CLASSNAME:${className}`);
    }
    
    return className;
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
            value = applyRoutines(value, 'kt');
        }
    }
    else {
        variable = code;
        value = 'null';
    }

    sentence = `var ${variable} = ${value}`;
    if (key === 'val')
        sentence = `val ${variable} = ${value}`;

    if (sentence.indexOf('= [') > 0) {
        sentence = sentence.replace('= [', '= listOf(');
        sentence = sentence.replace(']', ')');
    }

    if (sentence.indexOf('int') > -1)
        sentence = sentence.replace(new RegExp('int','g'), 'Int');
    else if (sentence.indexOf('string') > -1)
        sentence = sentence.replace(new RegExp('string','g'), 'String');
    else if (sentence.indexOf('any') > -1)
        sentence = sentence.replace(new RegExp('any','g'), 'Any');
    else if (sentence.indexOf('float') > -1)
        sentence = sentence.replace(new RegExp('float','g'), 'Double');

    return `${indent}${sentence}\n`;
}

const checkFun = (indent, code) => {
    const [name, kind, params, spec, simple] = parseFun(code);
    let sentence = `suspend fun ${name}(`;
    
    // Kotlin coroutines for async
    if (spec && spec.includes('async')) {
        sentence = `suspend fun ${name}(`;
    } else {
        sentence = `fun ${name}(`;
    }

    for (let i = 0; i < params.length; i++) {
        if (i > 0)
            sentence += ', ';
        sentence += params[i].name + ': ' + params[i].kind;
    }

    if (kind && kind !== 'void')
        sentence += `): ${kind} {`;
    else
        sentence += ') {';

    if (sentence.indexOf('int') > -1)
        sentence = sentence.replace(new RegExp('int','g'), 'Int');
    else if (sentence.indexOf('string') > -1)
        sentence = sentence.replace(new RegExp('string','g'), 'String');
    else if (sentence.indexOf('any') > -1)
        sentence = sentence.replace(new RegExp('any','g'), 'Any');
    else if (sentence.indexOf('float') > -1)
        sentence = sentence.replace(new RegExp('float','g'), 'Double');
    
    if (code === 'new')
        setence = sentence.replace('new', 'constructor');

    return `${indent}${sentence}\n`;
}

const checkIf = (indent, key, code) => {
    let sentence = parseIf(key, code);

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
    // Skip comments with @class directive
    if (code.match(/@class\s+[a-zA-Z][a-zA-Z0-9]*/i)) {
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
    return `${indent}val ${code}\n`;
}

const checkUse = (indent, code) => {
    let lib = parseUse(code)
    if (lib === '@abc')
        lib = 'abc';
    else if (lib === '@api')
        lib = 'org.http4k.core.*\n${indent}import org.http4k.server.Jetty\n${indent}import org.http4k.server.asServer';  // Default: http4k
    else if (lib === '@spring')
        lib = 'org.springframework.boot.SpringApplication\n${indent}import org.springframework.web.bind.annotation.*\n${indent}import org.springframework.boot.autoconfigure.SpringBootApplication';
    else if (lib === '@webflux')
        lib = 'org.springframework.boot.SpringApplication\n${indent}import org.springframework.web.bind.annotation.*\n${indent}import org.springframework.boot.autoconfigure.SpringBootApplication\n${indent}import reactor.core.publisher.Mono\n${indent}import reactor.core.publisher.Flux\n${indent}import kotlinx.coroutines.reactor.mono\n${indent}import kotlinx.coroutines.reactor.flux';
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
            return `${indent}${methodAnnotation}(${route})\n${indent}fun ${name}(): Mono<String> = mono {\n`;
        } else if (isSpring) {
            const methodAnnotation = `@${method.charAt(0).toUpperCase() + method.slice(1)}Mapping`;
            return `${indent}${methodAnnotation}(${route})\n${indent}suspend fun ${name}(): String {\n`;
        } else if (isMicronaut) {
            const methodAnnotation = `@${method.charAt(0).toUpperCase() + method.slice(1)}`;
            return `${indent}${methodAnnotation}(${route})\n${indent}suspend fun ${name}(): HttpResponse<String> {\n`;
        } else if (isVertx) {
            return `${indent}router.${method}(${route}).handler { ctx ->\n${indent}    ${name}(ctx)\n${indent}}\n${indent}suspend fun ${name}(ctx: RoutingContext) {\n`;
        } else {
            // Default: http4k
            return `${indent}"${route}" bind Method.${method.toUpperCase()} to { request: Request ->\n`;
        }
    }
    return `${indent}${code}.forEach {\n`;
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
            return `${indent}val vertx = Vertx.vertx()\n${indent}val ${handle} = vertx.createHttpServer()\n${indent}val router = Router.router(vertx)\n`;
        } else {
            return `${indent}val ${handle} = routes(\n`;
        }
    } else if (method === '@listen' || method === 'listen') {
        if (isWebFlux || isSpring) {
            return `${indent}SpringApplication.run(${extractClassName(currentScript || '')}.class, args)\n`;
        } else if (isMicronaut) {
            return `${indent}Micronaut.run(${extractClassName(currentScript || '')}.class, args)\n`;
        } else if (isVertx) {
            return `${indent}server.requestHandler(router).listen(${handle})\n`;
        } else {
            return `${indent}${handle}.asServer(Jetty(${handle})).start()\n`;
        }
    } else if (method === '@handle' || method === '@handler' || method === 'handle') {
        if (isWebFlux) {
            return `${indent}${handle}\n${indent}}\n`; // Close mono block
        } else if (isSpring) {
            return `${indent}return ${handle}\n`;
        } else if (isMicronaut) {
            return `${indent}return HttpResponse.ok(${handle})\n`;
        } else if (isVertx) {
            return `${indent}ctx.response().end(${handle})\n`;
        } else {
            return `${indent}Response(OK).body(${handle})\n`;
        }
    }
    
    return ``;
}

const checkDBC = (indent, code) => {
    const [method, handle, vary] = parseDBC(code);
    if (method === 'link')
        return `${indent}var dbc: MongoClient? = null\n${indent}try {\n${indent}  dbc = MongoClient("127.0.0.1", 27017)\n${indent}} catch (e: MongoException) { e.printStackTrace() }\n`;
    else if (vary)
        return ``;
        //return `${indent}val ${vary} = dbc.database(${handle})\n`;

    return `${indent}${code}\n`;
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
            return `${indent}val fileHandle = File(${args}).bufferedReader()\n`;
        case '@write':
        case 'write':
            const writeArgs = args.split(',');
            return `${indent}File(${writeArgs[0]}).writeText(${writeArgs[1]})\n`;
        case '@read':
        case 'read':
            return `${indent}val fileContent = File(${args}).readText()\n`;
        case '@close':
        case 'close':
            return `${indent}${args}.close()\n`;
        default:
            return `${indent}// Unknown file operation: ${method}\n`;
    }
};

// Process goal: directive to determine target language
const checkGoal = (script) => {
    const goalMatch = script.match(/goal:\s*(\w+)/i);
    if (goalMatch && goalMatch[1]) {
        const goal = goalMatch[1].toLowerCase();
        if (goal !== 'kotlin') {
            console.log(`@GOAL:${goal}`);
        }
        return goal;
    }
    return 'kotlin';
}

// Process like: directives with inline #in: comments
const checkLike = (script, currentGoal) => {
    const lines = script.split('\n');
    const processedLines = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        if (!line.trim()) {
            processedLines.push(line);
            continue;
        }
        
        if (line.trim().match(/^(goal|type):/i)) {
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

const transpileLine = (item) => {
    let indent = '';
    if (item.indent > 0)
        for (let j = 0;  j < item.indent; j++)
            indent += '  '; // Usar 2 espacios por nivel de indentación

//console.log(item)
    if (item.key === 'line')  // enter
        return `\n`;

    if (item.key === 'end')  // ##
        return `${indent}}\n\n`;

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
        return `${indent}return ${code}\n`;
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
        code = applyRoutines(code, 'kt');
        return `${indent}${code}\n`;
    }

    if (item.key === 'echo') {  // echo:
        // Reemplazar @ con this. para acceder a propiedades de clase
        let code = item.code.replace(/@([a-zA-Z0-9_]+)/g, 'this.$1');
        
        // Detectar si es una cadena con interpolación
        if (code.includes('{') && code.includes('}') && code.startsWith('"') && code.endsWith('"')) {
            // Convertir a string template de Kotlin
            code = code.substring(1, code.length - 1); // Quitar comillas
            code = code.replace(/{([^{}:]+)(?::([^{}]+))?}/g, (match, varName, format) => {
                if (!format) return '${' + varName.trim() + '}';
                
                // Manejar formato
                if (format.includes('.')) {
                    const [width, precision] = format.split('.');
                    return '${String.format("%.'+precision+'f", ' + varName.trim() + ')}';
                }
                return '${' + varName.trim() + '.padStart(' + format + ')}';
            });
            return `${indent}println("${code}")\n`;
        }
        
        return `${indent}println(${code})\n`;
    }

    if (item.key === 'read')  // read:
        return checkRead(indent, item.code);

    if (item.key === 'do')  // do:
        return checkSub(indent, item.code);

    if (item.key === 'try')  // try:
        return `${indent}try {\n`;

    if (item.key === 'fail')  // fail:
        return `${indent}catch(err) {\n`;

    if (item.key === 'use')  // use:
        return checkUse(indent, item.code)

    if (item.key === 'type')  // type:
        return `${indent}interface ${item.code} {\n`;

    if (item.key === 'set')  // set:
        return checkSet(indent, item.code);

    if (item.key === 'web')  // web: server, listen, handle, expose, socket, upload, fetch
        return checkWeb(indent, item.code);

    if (item.key === 'file')  // file: open, write, read, close
        return checkFile(indent, item.code);

    if (item.key === 'dbc')  // dbc:
        return checkDBC(indent, item.code);

    if (item.key === '@')  // @:
        return ``;
}

// module.exports = { start }
