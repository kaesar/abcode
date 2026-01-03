// © 2021-2025 by César Andres Arcila Buitrago

// Variable to store current script for framework detection
let currentScript = '';

function start(script, plan) {
    console.log('~~~~~~~~~~~~~~~');
    console.log('ABCode for Deno');
    console.log(`~~~~~~~~~~~~~~~\n\n${script}`);

    // Store script for framework detection
    currentScript = script;

    // Determine target language based on plan or goal directive
    let targetLang = 'deno';
    
    // If plan is a number (from -t argument), use it to determine target
    if (plan && !isNaN(parseInt(plan))) {
        const targetNum = parseInt(plan);
        
        if (targetMap[targetNum]) {
            targetLang = targetMap[targetNum];
        }
    } else {
        targetLang = checkGoal(script);
    }
    
    const processedScript = checkLike(script, targetLang);
    return transpileLines('Deno', processedScript, transpileLine);
}

const checkLet = (indent, key, code) => {
    let [name, kind, value] = parseVar(code);
    if (value !== null && value.length === 0)
        value = 'null';
    else if (value === 'nil')
        value = 'null';

    // Apply routines to the value
    if (value && value !== 'null') {
        value = applyRoutines(value, 'deno');
    }

    let sentence = `let ${name} = ${value}`;

    if (sentence.indexOf('int') > -1)
        sentence = sentence.replace(new RegExp('int','g'), 'number');
    else if (sentence.indexOf('float') > -1)
        sentence = sentence.replace(new RegExp('float','g'), 'number');
    
    return `${indent}${sentence};\n`;
}

const checkFun = (indent, code) => {
    const [name, kind, params, spec, simple] = parseFun(code);
    let sentence = `function ${name} (`;

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
        sentence = sentence.replace(new RegExp('int','g'), 'number');
    else if (sentence.indexOf('float') > -1)
        sentence = sentence.replace(new RegExp('float','g'), 'number');
    else if (sentence === 'function main () {')
        sentence = 'async function main () {';
    
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
    return `${indent}require ${code};\n`;
}

const checkSet = (indent, code) => {
    return `${indent}let ${code};\n`;
}

const checkUse = (indent, code) => {
    let lib = parseUse(code)
    if (lib === '@abc')
        lib = `{ abc } from 'abc.js';\n`;
    else if (lib === '@api')
        lib = 'restana from "npm:restana";';  // Default: Restana
    else if (lib === '@hono')
        lib = '{ Hono } from "npm:hono";';
    else if (lib === "@mongodb")
        lib = '{ MongoClient } from "https://deno.land/x/mongo/mod.ts"';
    
    return `${indent}import ${lib};\n`;
}

const checkSub = (indent, code) => {
    const [method, route, name, simple] = parseSub(code);
    if (['get','post','put','delete','head','patch','options'].includes(method)) {
        // Check if using Hono
        const isHono = currentScript && currentScript.includes('@hono');
        
        if (isHono) {
            return `${indent}app.${method}(${route}, (c) => {\n`;
        } else {
            // Default: Restana
            return `${indent}app.${method}(${route}, (req, res) => {\n`;
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
            return `${indent}const ${handle} = restana();\n`;
        }
    } else if (method === '@listen' || method === 'listen') {
        if (isHono) {
            return `${indent}Deno.serve(app.fetch);\n`;
        } else {
            return `${indent}app.start(${handle});\n`;
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
        return `${indent}const dbc = new MongoClient();\n${indent}dbc.connect(${handle});\n`;
    else if (vary)
        return `${indent}let ${vary} = dbc.database(${handle});\n`;

    return `${indent}${code}\n`;
}

// Process goal: directive to determine target language
const checkGoal = (script) => {
    const goalMatch = script.match(/goal:\s*(\w+)/i);
    if (goalMatch && goalMatch[1]) {
        const goal = goalMatch[1].toLowerCase();
        if (goal !== 'deno') {
            console.log(`@GOAL:${goal}`);
        }
        return goal;
    }
    return 'deno';
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

// Función para manejar operaciones de archivo
const checkFile = (indent, code) => {
    const parts = code.split(/\s*=\s*/);
    if (parts.length < 2) return `${indent}// Invalid file operation: ${code}\n`;
    
    const method = parts[0].trim();
    const args = parts[1].trim();
    
    switch (method) {
        case '@open':
        case 'open':
            return `${indent}const fileHandle = await Deno.open(${args});\n`;
        case '@write':
        case 'write':
            return `${indent}await Deno.writeTextFile(${args.split(',')[0]}, ${args.split(',')[1]});\n`;
        case '@read':
        case 'read':
            return `${indent}const fileContent = await Deno.readTextFile(${args});\n`;
        case '@close':
        case 'close':
            return `${indent}fileHandle.close();\n`;
        default:
            return `${indent}// Unknown file operation: ${method}\n`;
    }
};

const transpileLine = (item) => {
    let indent = '';
    if (item.indent > 0)
        for (let j = 0;  j < item.indent; j++)
            indent += ' ';

    if (item.key === 'line')  // enter
        return `\n`;

    if (item.key === 'end') {  // ##
        // Check if this closes a block that needs extra line break
        const needsBreak = item.indent === 0 || 
                          (item.grade && item.grade < (item.prevGrade || 0));
        return needsBreak ? `${indent}}\n\n` : `${indent}}\n`;
    }

    if (item.key === 'doc') {  // #
        if (item.code.startsWith('[') && item.code.endsWith(']')) {
            return `${indent}// ${item.code}\n`;
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
        let code = item.code.replace(/@([a-zA-Z0-9_]+)/g, 'this.$1');
        code = applyRoutines(code, 'deno');
        return `${indent}${code}\n`;
    }

    if (item.key === 'echo') {  // echo:
        let code = item.code.replace(/@([a-zA-Z0-9_]+)/g, 'this.$1');
        
        if (code.includes('{') && code.includes('}') && code.startsWith('"') && code.endsWith('"')) {
            code = code.substring(1, code.length - 1);
            code = code.replace(/{([^{}:]+)(?::([^{}]+))?}/g, (match, varName, format) => {
                if (!format) return '${' + varName.trim() + '}';
                
                if (format.includes('.')) {
                    const [width, precision] = format.split('.');
                    return '${' + varName.trim() + '.toFixed(' + precision + ')}';
                }
                return '${' + varName.trim() + '.padStart(' + format + ')}';
            });
            return `${indent}console.log(\`${code}\`);\n`;
        }
        
        return `${indent}console.log(${code});\n`;
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
        return `${indent}class ${item.code} {\n`;

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