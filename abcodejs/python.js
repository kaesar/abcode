// © 2021-2025 by César Andres Arcila Buitrago

function start(script, plan) {
    console.log('~~~~~~~~~~~~~~~~~');
    console.log('ABCode for Python');
    console.log(`~~~~~~~~~~~~~~~~~\n\n${script}`);

    // Determine target language based on plan or goal directive
    let targetLang = 'python';
    
    if (plan && !isNaN(parseInt(plan))) {
        const targetNum = parseInt(plan);
        
        if (targetMap[targetNum]) {
            targetLang = targetMap[targetNum];
        }
    } else {
        targetLang = checkGoal(script);
    }
    
    const processedScript = checkLike(script, targetLang);
    return transpileLines('Python', processedScript, transpileLine);
}

const checkLet = (indent, key, code) => {
    let [name, kind, value] = parseVar(code);
    if (value !== null && value.length === 0)
        value = 'None';

    // Apply routines to the value
    if (value && value !== 'None') {
        value = applyRoutines(value, 'py');
    }

    let sentence = `${name} = ${value}`;
   
    return `${indent}${sentence}\n`;
}

const checkFun = (indent, code) => {
    const [name, kind, params, spec, simple] = parseFun(code);
    let sentence = `def ${simple}:`;
    
    // Python async functions
    if (spec && spec.includes('async')) {
        sentence = `async def ${name}(`;
        for (let i = 0; i < params.length; i++) {
            if (i > 0) sentence += ', ';
            sentence += params[i].name;
        }
        sentence += '):';
    }

    if (name === 'new')
        return `${indent}__init__ (${simple}) {\n`;

    return `${indent}${sentence}\n`;
}

const checkIf = (indent, key, code) => {
    let sentence = parseIf(key, code);
    
    // Reemplazar operadores de JavaScript por equivalentes en Python
    sentence = sentence.replace(/\s*&&\s*/g, ' and ')
                       .replace(/\s*\|\|\s*/g, ' or ')
                       .replace(/!([a-zA-Z0-9_]+)/g, 'not $1');

    if (key === 'if') {  // if:
        return `${indent}if ${sentence}:\n`;
    }

    if (key === 'when') {  // when:
        if (sentence.toLowerCase() === 'no')
            return `${indent}else:\n`;
        else
            return `${indent}elif ${sentence}:\n`;
    }

    if (key === 'else') {  // else:
        return `${indent}else:\n`;
    }
}

const checkFor = (indent, code) => {
    const [ start, stop, step, varstep, varsize, incode ] = parseFor(code);
    if (incode)
        return `${indent}for ${code}:\n`;
    else
        return `${indent}while ${code}:\n`;
}

const checkDoc = (indent, code) => {
    let sentence = `${indent}# ${code}\n`;
    if (code === 'end')
        sentence = `${indent}#end\n`;
    return sentence;
}

const checkRead = (indent, code) => {
    return `${indent}with ${code}\n`;
}

const checkSet = (indent, code) => {
    return checkLet(indent, 'set', code);
}

const checkUse = (indent, code) => {
    let lib = parseUse(code)
    if (lib === '@abc')
        lib = 'import abc';
    else if (lib === '@api')
        lib = 'from fastapi import FastAPI\nfrom fastapi.responses import JSONResponse';
    else if (lib == "@mongodb")
        lib = 'import pymongo';
    else
        lib = `${indent}import ${item.code}`;

    return `${indent}${lib}\n`;
}

const checkSub = (indent, code) => {
    const [method, route, name, simple] = parseSub(code);
    if (['get','post','put','delete','head','patch','options'].includes(method))
        return `${indent}@app.${method}(${route})\n${indent}async def ${simple}:\n`;
    
    return `${indent}pass\n`;  //`${indent}each: ${item.code}\n`;
}

const checkWeb = (indent, code) => {
    const [method, handle] = parseWeb(code);
    if (method === '@server' || method === 'server')
        return `${indent}app = FastAPI()\n`;
    else if (method === '@listen' || method === 'listen') {
        let line = `${indent}import uvicorn\n${indent}uvicorn.run(app, host="0.0.0.0", port=${handle})\n`
        if (indent.length === 0)
            return `if __name__ == '__main__':\n    ${line}`;
        return line;
    }
    else if (method === '@handle' || method === '@handler' || method === 'handle')
        return `${indent}return ${handle}\n`;
    
    return ``;
}

const checkDBC = (indent, code) => {
    const [method, handle, vary] = parseDBC(code);
    if (method === 'link')
        return `${indent}dbc = pymongo.MongoClient(${handle})\n`;
    else if (vary)
        return `${indent}${vary} = dbc[${handle}]\n`;
    
    return `${indent}${code}\n`;
}

// Función para manejar operaciones de archivo
const checkFile = (indent, code) => {
    // Extraer el método y el argumento
    const parts = code.split(/\s*=\s*/);
    if (parts.length < 2) return `${indent}# Invalid file operation: ${code}\n`;
    
    const method = parts[0].trim();
    const args = parts[1].trim();
    
    switch (method) {
        case '@open':
        case 'open':
            return `${indent}file_handle = open(${args}, 'r+')\n`;
        case '@write':
        case 'write':
            const writeArgs = args.split(',');
            return `${indent}with open(${writeArgs[0]}, 'w') as f:\n${indent}    f.write(${writeArgs[1]})\n`;
        case '@read':
        case 'read':
            return `${indent}with open(${args}, 'r') as f:\n${indent}    file_content = f.read()\n`;
        case '@close':
        case 'close':
            return `${indent}${args}.close()\n`;
        default:
            return `${indent}# Unknown file operation: ${method}\n`;
    }
};

const transpileLine = (item) => {
    let indent = '';
    if (item.indent > 0)
        for (let j = 0;  j < item.indent; j++)
            indent += ' ';

//console.log(item)
    if (item.key === 'line')  // enter
        return `\n`;

    if (item.key === 'end')  // ##
        //return ``;  // No generar nada para end en Python
        return `\n`;

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
        // Reemplazar @ con self. para acceder a propiedades de clase en Python
        let code = item.code.replace(/@([a-zA-Z0-9_]+)/g, 'self.$1');
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
        // Reemplazar @ con self. para acceder a propiedades de clase en Python
        let code = item.code.replace(/@([a-zA-Z0-9_]+)/g, 'self.$1');
        // Apply routines to the code
        code = applyRoutines(code, 'py');
        // Handle await expressions
        code = code.replace(/\bawait\s+/g, 'await ');
        return `${indent}${code}\n`;
    }

    if (item.key === 'echo') {  // echo:
        // Reemplazar @ con self. para acceder a propiedades de clase en Python
        let code = item.code.replace(/@([a-zA-Z0-9_]+)/g, 'self.$1');
        
        // Detectar si es una cadena con interpolación
        if (code.includes('{') && code.includes('}') && code.startsWith('"') && code.endsWith('"')) {
            // Python ya soporta este formato de interpolación con f-strings
            return `${indent}print(f${code})\n`;
        }
        
        return `${indent}print(${code})\n`;
    }

    if (item.key === 'read')  // read:
        return checkRead(indent, item.code);

    if (item.key === 'do')  // do:
        return checkSub(indent, item.code);

    if (item.key === 'try')  // try:
        return `${indent}try:\n`;

    if (item.key === 'fail')  // fail:
        return `${indent}except:\n`;

    if (item.key === 'use')  // use:
        return checkUse(indent, item.code)

    if (item.key === 'type')  // type:
        return ``;  // No generar nada para type: en Python

    if (item.key === 'set')  // set:
        return checkSet(indent, item.code);

    if (item.key === 'web')  // web: server, listen, handle, expose, socket, upload, fetch
        return checkWeb(indent, item.code);
        
    if (item.key === 'file')  // file: open, write, read, close
        return checkFile(indent, item.code);

    if (item.key === 'dbc')  // dbc:
        return checkDBC(indent, item.code);

    if (item.key === '@')  // @: (anotaciones)
        return ``;
        
    // Si no coincide con ninguna clave, devolver cadena vacía
    return ``;
}

// Process goal: directive to determine target language
const checkGoal = (script) => {
    const goalMatch = script.match(/goal:\s*(\w+)/i);
    if (goalMatch && goalMatch[1]) {
        const goal = goalMatch[1].toLowerCase();
        if (goal !== 'python') {
            console.log(`@GOAL:${goal}`);
        }
        return goal;
    }
    return 'python';
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

// module.exports = { start }
