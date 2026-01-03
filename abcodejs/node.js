// © 2021-2025 by César Andres Arcila Buitrago

// Variable to store current script for framework detection
let currentScript = '';

function start(script, plan) {
    console.log('~~~~~~~~~~~~~~~~~~');
    console.log('ABCode for Node.js');
    console.log(`~~~~~~~~~~~~~~~~~~\n\n${script}`);
    
    // Store script for framework detection
    currentScript = script;
    
    // Determine target language based on plan or goal directive
    let targetLang = 'node';
    
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
    
    // Process like directives with the determined target language
    const processedScript = checkLike(script, targetLang);
    
    // Transpile the processed script
    return transpileLines('Node', processedScript, transpileLine) || '';
    //return transpileLines('Node', script, transpileLine);
}

const checkLet = (indent, key, code) => {
    let [name, kind, value] = parseVar(code);
    if (value !== null && value.length === 0)
        value = 'null';

    // Apply routines to the value
    if (value && value !== 'null') {
        value = applyRoutines(value, 'js');
    }

    let sentence = key === 'val' ? `const ${name} = ${value}` : `let ${name} = ${value}`;
   
    return `${indent}${sentence}\n`;
}

const checkFun = (indent, code) => {
    const [name, kind, params, spec, simple] = parseFun(code);
    let sentence = `function ${simple} {`;
    
    // Handle async functions
    if (spec && spec.includes('async')) {
        sentence = `async function ${name}(`;
        for (let i = 0; i < params.length; i++) {
            if (i > 0) sentence += ', ';
            sentence += params[i].name;
        }
        sentence += ') {';
    }
    
    if (name === 'new')
        return `${indent}constructor (${simple}) {\n`;

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
                return `${indent}for (let ${varstep} = ${start}; ${varstep} < ${varsize}.length; ${varstep} += ${step}) {\n`;
            return `${indent}for (let ${varstep} = ${start}; ${varstep} < ${varsize}.length; ${varstep}++) {\n`;
        }
        else
            return `${indent}for (let ${varstep} = ${start}; ${varstep} < ${stop}; ${varstep}++) {\n`;
    }
    else if (incode)
        return `${indent}for (${code}) {\n`;
    else if (varsize)
        return `${indent}while (${code.replace('len(' + varsize + ')', varsize + '.length')}) {\n`;
    else
        return `${indent}while (${code}) {\n`;
}

const checkDoc = (indent, code) => {
    let sentence = `${indent}# ${code}\n`;
    if (code === 'end')
        sentence = `${indent}}\n`;
    sentence = sentence.replace('# ', '//');
    return sentence;
}

const checkRead = (indent, code) => {
    return `${indent}require ${code}\n`;
}

const checkSet = (indent, code) => {
    return `${indent}let ${code}\n`;
}

const checkUse = (indent, code) => {
    let lib = parseUse(code)
    if (lib === '@abc')
        lib = "const abc = require('abc')";
    else if (lib === '@api')
        lib = "const userver = require('low-http-server')({});\nconst restana = require('restana');";  // Default: Restana
    else if (lib === '@hono')
        lib = "const { Hono } = require('hono');";
    else if (lib === "@mongodb")
        lib = "const mongodb = require('mongodb');";
    else
        lib = `import ${lib}`;
    
    return `${indent}${lib}\n`;
}

const checkSub = (indent, code) => {
    const [method, route, name, simple] = parseSub(code);
    if (['get','post','put','delete','head','patch','options'].includes(method)) {
        // Check if using Hono
        const isHono = currentScript && currentScript.includes('@hono');
        
        if (isHono) {
            return `${indent}app.${method}(${route.replace(new RegExp('"','g'), `'`)}, (c) => {\n`;
        } else {
            // Default: Restana
            return `${indent}app.${method}(${route.replace(new RegExp('"','g'), `'`)}, ${name})\n${indent}function ${name} (req, res) {\n`;
        }
    }
    
    return `${indent}${code}.forEach {\n`;
}

const checkWeb = (indent, code) => {
    const [method, handle] = parseWeb(code);
    const isHono = currentScript && currentScript.includes('@hono');
    
    if (method === '@server' || method === 'server') {
        if (isHono) {
            return `${indent}const ${handle} = new Hono();\n`;
        } else {
            return `${indent}const ${handle} = restana({ server: userver, prioRequestsProcessing: false });\n`;
        }
    } else if (method === '@listen' || method === 'listen') {
        if (isHono) {
            return `${indent}const server = require('http').createServer(app.fetch);\n${indent}server.listen(${handle});\n`;
        } else {
            return `${indent}userver.listen(${handle});\n`;
        }
    } else if (method === '@handle' || method === '@handler' || method === 'handle') {
        if (isHono) {
            return `${indent}return c.text(${handle});\n`;
        } else {
            return `${indent}res.send(${handle});\n`;
        }
    }
    
    return ``;
}

const checkDBC = (indent, code) => {
    const [method, handle, vary] = parseDBC(code);
    if (method === 'link')
        return `${indent}const dbc = mongodb.MongoClient;\n${indent}dbc.connect(${handle})\n`;
    else if (vary)
        return `${indent}let ${vary} = dbc.name\n`;  // (${handle})
    
    return `${indent}${code}\n`;
}

// Process goal: directive to determine target language
const checkGoal = (script) => {
    const goalMatch = script.match(/goal:\s*(\w+)/i);
    if (goalMatch && goalMatch[1]) {
        const goal = goalMatch[1].toLowerCase();
        // If goal is specified and it's not node, log it for potential use
        if (goal !== 'node') {
            console.log(`@GOAL:${goal}`);
        }
        return goal;
    }
    return 'node'; // Default goal
}

// Process like: directives with inline #in: comments
const checkLike = (script, currentGoal) => {
    // Split script into lines
    const lines = script.split('\n');
    const processedLines = [];
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        
        // Skip empty lines
        if (!line.trim()) {
            processedLines.push(line);
            continue;
        }
        
        // Skip goal: and type: directives
        if (line.trim().match(/^(goal|type):/i)) {
            continue;
        }
        
        // Check if this is a like: directive with inline #in: comment
        if (line.trim().match(/^like:/i)) {
            const inMatch = line.match(/#in:\s*(\w+)/i);
            if (inMatch && inMatch[1]) {
                const targetLang = inMatch[1].toLowerCase();
                
                // If the target language matches our current goal, use the like: line
                if (targetLang === currentGoal) {
                    // Replace the previous line with the like: content
                    if (processedLines.length > 0) {
                        processedLines.pop(); // Remove the previous line
                    }
                    // Add the like: content (removing the 'like:' prefix and the #in: comment)
                    const cleanedLine = line.replace(/^like:\s*/i, '').replace(/#in:\s*\w+/i, '').trim();
                    processedLines.push(cleanedLine);
                }
                // Skip this line if it doesn't match the current goal
                continue;
            }
        }
        
        // Regular line, add it to processed lines
        processedLines.push(line);
    }
    
    return processedLines.join('\n');
}

// Función para manejar operaciones de archivo
const checkFile = (indent, code) => {
    // Extraer el método y el argumento
    const parts = code.split(/\s*=\s*/);
    if (parts.length < 2) return `${indent}// Invalid file operation: ${code}\n`;
    
    const method = parts[0].trim();
    const args = parts[1].trim();
    
    switch (method) {
        case '@open':
        case 'open':
            return `${indent}const fs = require('fs');\n${indent}const fileHandle = fs.openSync(${args}, 'r+');\n`;
        case '@write':
        case 'write':
            return `${indent}fs.writeFileSync(${args.split(',')[0]}, ${args.split(',')[1]});\n`;
        case '@read':
        case 'read':
            return `${indent}const fileContent = fs.readFileSync(${args}, 'utf8');\n`;
        case '@close':
        case 'close':
            return `${indent}fs.closeSync(${args});\n`;
        default:
            return `${indent}// Unknown file operation: ${method}\n`;
    }
};

// Mantener un seguimiento de los bloques abiertos para evitar cierres duplicados
let openBlocks = 0;

const transpileLine = (item) => {
    let indent = '';
    if (item.indent > 0)
        for (let j = 0; j < item.indent; j++)
            indent += ' ';

    if (item.key === 'line')  // enter
        return `\n`;

    if (item.key === 'end') {  // ##
        if (openBlocks > 0) {
            openBlocks--;
            // Check if this closes a block that needs extra line break
            const needsBreak = item.indent === 0 || 
                              (item.grade && item.grade < (item.prevGrade || 0));
            return needsBreak ? `${indent}}\n\n` : `${indent}}\n`;
        }
        return `\n`; // No generar cierre si no hay bloques abiertos
    }

    if (item.key === 'doc') {  // #
        // Verificar si es una anotación estilo Rust (#[annotation])
        if (item.code.startsWith('[') && item.code.endsWith(']')) {
            return `${indent}// ${item.code}\n`;
        }
        return checkDoc(indent, item.code);
    }

    if (item.key === 'var')  // var:
        return checkLet(indent, item.key, item.code);
    
    if (item.key === 'val')  // val:
        return checkLet(indent, item.key, item.code);
    
    if (item.key === 'fun') {  // fun:
        openBlocks++; // Incrementar contador de bloques abiertos
        return checkFun(indent, item.code);
    }

    if (item.key === 'pass') {  // pass:
        // Reemplazar @ con this. para acceder a propiedades de clase
        let code = item.code.replace(/@([a-zA-Z0-9_]+)/g, 'this.$1');
        return `${indent}return ${code};\n`;
    }

    if (item.key === 'if') {  // if:
        openBlocks++; // Incrementar contador de bloques abiertos
        return checkIf(indent, item.key, item.code);
    }

    if (item.key === 'when')  // when:
        return checkIf(indent, item.key, item.code);

    if (item.key === 'else')  // else:
        return checkIf(indent, item.key, item.code);

    if (item.key === 'for') {  // for:
        openBlocks++; // Incrementar contador de bloques abiertos
        return checkFor(indent, item.code);
    }

    if (item.key === 'run') {  // run:
        // Reemplazar @ con this. para acceder a propiedades de clase
        let code = item.code.replace(/@([a-zA-Z0-9_]+)/g, 'this.$1');
        // Apply routines to the code
        code = applyRoutines(code, 'js');
        // Handle await expressions
        code = code.replace(/\bawait\s+/g, 'await ');
        return `${indent}${code}\n`;
    }

    if (item.key === 'echo') {  // echo:
        // Reemplazar @ con this. para acceder a propiedades de clase
        let code = item.code.replace(/@([a-zA-Z0-9_]+)/g, 'this.$1');
        
        // Detectar si es una cadena con interpolación
        if (code.includes('{') && code.includes('}') && code.startsWith('"') && code.endsWith('"')) {
            // Convertir a template literal
            code = code.substring(1, code.length - 1); // Quitar comillas
            code = code.replace(/{([^{}:]+)(?::([^{}]+))?}/g, (match, varName, format) => {
                if (!format) return '${' + varName.trim() + '}';
                
                // Manejar formato
                if (format.includes('.')) {
                    const [width, precision] = format.split('.');
                    return '${' + varName.trim() + '.toFixed(' + precision + ')}';
                }
                return '${' + varName.trim() + '.padStart(' + format + ')}';
            });
            return `${indent}console.log(\`${code}\`)\n`;
        }
        
        return `${indent}console.log(${code})\n`;
    }

    if (item.key === 'read')  // read:
        return checkRead(indent, item.code);

    if (item.key === 'do') {  // do:
        openBlocks++; // Incrementar contador de bloques abiertos
        return checkSub(indent, item.code);
    }

    if (item.key === 'try') {  // try:
        openBlocks++; // Incrementar contador de bloques abiertos
        return `${indent}try {\n`;
    }

    if (item.key === 'fail') {  // fail:
        openBlocks++; // Incrementar contador de bloques abiertos
        return `${indent}catch(err) {\n`;
    }

    if (item.key === 'use')  // use:
        return checkUse(indent, item.code)

    if (item.key === 'type') {  // type:
        openBlocks++; // Incrementar contador de bloques abiertos
        return `${indent}class ${item.code} {\n`;
    }

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
