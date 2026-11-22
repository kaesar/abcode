// © 2021-2025 by César Andres Arcila Buitrago

// Variable to store current script for framework detection
let currentScript = '';
// Stack of open blocks: fun, if, for, do, try, fail, type, set
let blockStack = [];

const normalizeBool = (code) => String(code === null || code === undefined ? '' : code)
    .replace(/\bTrue\b/g, 'true')
    .replace(/\bFalse\b/g, 'false');

function start(script, plan) {
    console.log('~~~~~~~~~~~~~~~~~~~~~~');
    console.log('ABCode for WebAssembly');
    console.log(`~~~~~~~~~~~~~~~~~~~~~~\n\n${script}`);
    
    // Store script for framework detection
    currentScript = script;
    
    // Determine target language based on plan or goal directive
    let targetLang = 'wasm';
    
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
    return transpileLines('Wasm', processedScript, transpileLine) || '';
}

const checkLet = (indent, key, code) => {
    // Class property: var: @name (or var: @name = value)
    const field = code.trim().match(/^@([A-Za-z_$][\w$]*)\s*(?:=\s*(.*))?$/);
    if (field) {
        const fieldName = field[1];
        if (field[2] !== undefined && field[2].trim() !== '')
            return `${indent}this.${fieldName} = ${field[2].trim()};\n`;
        return `${indent}${fieldName};\n`;
    }

    let [name, kind, value] = parseVar(code);
    if (value !== null && value.length === 0)
        value = 'null';

    // Apply routines to the value
    if (value && value !== 'null') {
        value = applyRoutines(value, 'wasm');
    }

    // AssemblyScript: keep explicit scalar types when declared.
    const asType = { int: 'i32', float: 'f64', boolean: 'bool', string: 'string' }[kind];
    const typed = asType ? `${name}: ${asType}` : name;
    let sentence = `let ${typed} = ${value}`;

    return `${indent}${sentence}\n`;
}

const checkFun = (indent, code) => {
    const [name, kind, params, spec, simple] = parseFun(code);
    const paramList = params.map(p => p.name).join(', ');
    const inClass = blockStack.includes('type');

    // Constructor: fun: new(...) -> constructor(...)
    if (name === 'new')
        return `${indent}constructor (${paramList}) {\n`;

    // Method inside type: ... -> name(...) { ... }
    if (inClass) {
        const prefix = spec && spec.includes('async') ? 'async ' : '';
        return `${indent}${prefix}${name} (${paramList}) {\n`;
    }

    // AssemblyScript: annotate parameters and return type.
    const asType = (t) => ({ int: 'i32', float: 'f64', boolean: 'bool', string: 'string' }[t] || t || 'void');
    let sentence = `function ${name}(${params.map(p => `${p.name}: ${asType(p.kind)}`).join(', ')})`;

    if (name === 'new')
        return `${indent}constructor (${paramList}) {\n`;

    if (inClass)
        return `${indent}${name} (${params.map(p => `${p.name}: ${asType(p.kind)}`).join(', ')})${kind && kind !== 'void' ? ': ' + asType(kind) : ''} {\n`;

    sentence += kind && kind !== 'void' ? `: ${asType(kind)} {` : ' {';
    if (spec && spec.includes('async'))
        sentence = `async ${sentence}`;

    return `${indent}${sentence}\n`;
}

const checkIf = (indent, key, code) => {
    let sentence = normalizeBool(parseIf(key, code));

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
    const condition = normalizeBool(code);

    if (incode && varstep) {
        // for: i in range(...) -> numeric loop
        if (start !== null && stop !== null) {
            const limit = stop.indexOf('len(') === 0 && varsize
                ? `${varsize}.length`
                : stop;
            if (step && step !== "1")
                return `${indent}for (let ${varstep} = ${start}; ${varstep} < ${limit}; ${varstep} += ${step}) {\n`;
            return `${indent}for (let ${varstep} = ${start}; ${varstep} < ${limit}; ${varstep}++) {\n`;
        }
        // for: x in collection -> iterate values, not indexes
        const collection = incode.replace(/^in\s+/, '');
        return `${indent}for (const ${varstep} of ${collection}) {\n`;
    }
    else if (varsize)
        return `${indent}while (${condition.replace('len(' + varsize + ')', varsize + '.length')}) {\n`;
    else
        return `${indent}while (${condition}) {\n`;
}

const checkDoc = (indent, code) => {
    let sentence = `${indent}# ${code}\n`;
    if (code === 'end')
        sentence = `${indent}}\n`;
    sentence = sentence.replace('# ', '//');
    return sentence;
}

const checkRead = (indent, code) => {
    // read: is reserved in the specification; do not emit invalid JS.
    return `${indent}// read: ${code} (reserved)\n`;
}

const checkSet = (indent, code, item) => {
    // set: Name defines a data structure. Map it to a JS class whose
    // constructor accepts an object with the declared fields.
    const fields = [];
    const baseIndent = item.indent;
    for (let i = 0; i < sentences.length; i++) {
        const sentence = sentences[i];
        if (sentence.line <= item.line)
            continue;
        if (sentence.indent <= baseIndent)
            break;
        if (['end','line','raw','doc'].includes(sentence.key))
            continue;
        fields.push({ name: sentence.key, type: sentence.code || 'any' });
    }

    let out = `${indent}/** @typedef {Object} ${code}\n`;
    for (const field of fields)
        out += `${indent} * @property {${field.type}} ${field.name}\n`;
    out += `${indent} */\n`;
    out += `${indent}class ${code} {\n`;
    out += `${indent}  constructor(fields = {}) {\n`;
    out += `${indent}    Object.assign(this, {\n`;
    for (const field of fields)
        out += `${indent}      ${field.name}: undefined,\n`;
    out += `${indent}    }, fields);\n`;
    out += `${indent}  }\n`;
    out += `${indent}}\n`;
    return out;
}

const checkUse = (indent, code) => {
    let lib = parseUse(code)
    if (lib === '@abc')
        lib = "const abc = require('abc');";
    else if (lib === '@api')
        lib = "const userver = require('low-http-server')({});\nconst restana = require('restana');";  // Default: Restana
    else if (lib === '@hono')
        lib = "const { Hono } = require('hono');";
    else if (lib === "@mongodb")
        lib = "const mongodb = require('mongodb');";
    else if (lib === '@sys')
        lib = "const sys = require('sys');";
    else if (lib === '@cli')
        lib = "const { execSync } = require('child_process');";
    else if (lib.startsWith('@'))
        lib = `// use: ${lib} (not implemented)`;
    else
        lib = `require('${lib}');`;

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
            // Default: Restana. Alias r to req for existing ABCode examples.
            return `${indent}app.${method}(${route.replace(new RegExp('"','g'), `'`)}, ${name})\n${indent}function ${name} (req, res) {\n${indent}  const r = req;\n`;
        }
    }
    
    // Generic do: is not a web route. Avoid emitting invalid JS.
    return `${indent}// do: ${code} (unsupported form)\n`;
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
        return `${indent}const dbc = new mongodb.MongoClient(${handle});\n`;
    else if (vary)
        return `${indent}const ${vary} = dbc.db(${handle});\n`;

    return `${indent}// dbc: ${code}\n`;
}

// Process goal: directive to determine target language
const checkGoal = (script) => {
    const goalMatch = script.match(/goal:\s*(\w+)/i);
    if (goalMatch && goalMatch[1]) {
        const goal = goalMatch[1].toLowerCase();
        // If goal is specified and it's not node, log it for potential use
        if (goal !== 'wasm') {
            console.log(`@GOAL:${goal}`);
        }
        return goal;
    }
    return 'wasm'; // Default goal
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
        
        // Skip goal: directives (not statements). type: must be kept.
        if (line.trim().match(/^goal:/i)) {
            continue;
        }
        
        // Check if this is a like: directive with inline #in: comment
        if (line.trim().match(/^like:/i)) {
            const inMatch = line.match(/#@?in:\s*(\w+)/i);
            if (inMatch && inMatch[1]) {
                const targetLang = inMatch[1].toLowerCase();
                
                // If the target language matches our current goal, use the like: line
                if (targetLang === currentGoal) {
                    // Replace the previous line with the like: content
                    if (processedLines.length > 0) {
                        processedLines.pop(); // Remove the previous line
                    }
                    // Add the like: content (removing the 'like:' prefix and the #in: comment)
                    const cleanedLine = line.replace(/^like:\s*/i, '').replace(/#@?in:\s*\w+/i, '').trim();
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

const transpileLine = (item) => {
    let indent = '';
    if (item.indent > 0)
        for (let j = 0; j < item.indent; j++)
            indent += ' ';

    if (item.key === 'raw')  // verbatim continuation line
        return `${item.code}\n`;

    if (item.key === 'line')  // enter
        return `\n`;

    if (item.key === 'end') {  // ##
        const kind = blockStack.pop();
        if (!kind)
            return `\n`;
        if (kind === 'set')
            return ``; // set: has no JS block
        // Check if this closes a block that needs extra line break
        const needsBreak = item.indent === 0 ||
                          (item.grade && item.grade < (item.prevGrade || 0));
        return needsBreak ? `${indent}}\n\n` : `${indent}}\n`;
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
        blockStack.push('fun');
        return checkFun(indent, item.code);
    }

    if (item.key === 'pass') {  // pass:
        // Reemplazar @ con this. para acceder a propiedades de clase
        let code = item.code.replace(/@([a-zA-Z0-9_]+)/g, 'this.$1');
        return `${indent}return ${code};\n`;
    }

    if (item.key === 'if') {  // if:
        blockStack.push('if');
        return checkIf(indent, item.key, item.code);
    }

    if (item.key === 'when')  // when:
        return checkIf(indent, item.key, item.code);

    if (item.key === 'else')  // else:
        return checkIf(indent, item.key, item.code);

    if (item.key === 'for') {  // for:
        blockStack.push('for');
        return checkFor(indent, item.code);
    }

    if (item.key === 'run') {  // run:
        // Reemplazar @ con this. para acceder a propiedades de clase
        let code = item.code.replace(/@([a-zA-Z0-9_]+)/g, 'this.$1');
        // Apply routines to the code
        code = applyRoutines(code, 'wasm');
        // Handle await expressions
        code = code.replace(/\bawait\s+/g, 'await ');
        return `${indent}${code}\n`;
    }

    if (item.key === 'echo') {  // echo:
        // Reemplazar @ con this. para acceder a propiedades de clase
        let code = item.code.replace(/@([a-zA-Z0-9_]+)/g, 'this.$1');
        // Apply routines (e.g. s.find("x"), len(v)) to printed expressions.
        code = applyRoutines(code, 'wasm');
        
        // Detectar si es una cadena con interpolación
        if (code.includes('{') && code.includes('}') && code.startsWith('"') && code.endsWith('"')) {
            // Convertir a template literal
            code = code.substring(1, code.length - 1); // Quitar comillas
            // Convert {var} / {var:width} / {var:.2f}, but keep an already
            // valid JS interpolation such as ${var} untouched.
            code = code.replace(/(^|[^$])\{([^{}:]+)(?::([^{}]+))?\}/g, (match, prefix, varName, format) => {
                const name = varName.trim();
                if (!format) return prefix + '${' + name + '}';

                // Decimal format: {price:.2f}
                if (format.startsWith('.')) {
                    const precision = format.slice(1).replace(/[^0-9]/g, '') || '0';
                    return prefix + '${Number(' + name + ').toFixed(' + precision + ')}';
                }

                // Width format: {name:10}
                const width = format.replace(/[^0-9]/g, '') || '0';
                return prefix + '${String(' + name + ').padStart(' + width + ')}';
            });
            return `${indent}console.log(\`${code}\`)\n`;
        }
        
        return `${indent}console.log(${code})\n`;
    }

    if (item.key === 'read')  // read:
        return checkRead(indent, item.code);

    if (item.key === 'do') {  // do:
        blockStack.push('do');
        return checkSub(indent, item.code);
    }

    if (item.key === 'try') {  // try:
        blockStack.push('try');
        return `${indent}try {\n`;
    }

    if (item.key === 'fail') {  // fail:
        blockStack.push('fail');
        return `${indent}catch(err) {\n`;
    }

    if (item.key === 'use')  // use:
        return checkUse(indent, item.code)

    if (item.key === 'type') {  // type:
        blockStack.push('type');
        return `${indent}class ${item.code} {\n`;
    }

    if (item.key === 'set') {  // set:
        blockStack.push('set');
        return checkSet(indent, item.code, item);
    }

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
