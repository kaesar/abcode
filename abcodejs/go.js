// © 2021-2025 by César Andres Arcila Buitrago

function start(script, plan) {
    console.log('~~~~~~~~~~~~~');
    console.log('ABCode for Go');
    console.log(`~~~~~~~~~~~~~\n\n${script}`);

    // Determine target language based on plan or goal directive
    let targetLang = 'go';
    
    if (plan && !isNaN(parseInt(plan))) {
        const targetNum = parseInt(plan);
        
        if (targetMap[targetNum]) {
            targetLang = targetMap[targetNum];
        }
    } else {
        targetLang = checkGoal(script);
    }
    
    const processedScript = checkLike(script, targetLang);
    return transpileLines('Go', processedScript, transpileLine) || '';
}

const isObjectType = (kind) => {
    return kind && kind[0] === kind[0].toUpperCase() && 
           !['int', 'string', 'bool', 'float64', 'interface{}'].includes(kind);
}

const checkLet = (indent, key, code) => {
    let [name, kind, value] = parseVar(code);
    if (value !== null && value.length == 0)
        value = 'nil';

    // Apply routines to the value
    if (value && value !== 'nil') {
        value = applyRoutines(value, 'go');
    }

    let sentence = `${name} := ${value}`;
    
    // For object types, use address operator when creating new instances
    if (kind && isObjectType(kind) && value && value.includes('{')) {
        sentence = `${name} := &${kind}${value}`;
    }
    
    if (sentence.indexOf(':=') < 0 && sentence.indexOf(':') > -1)
        sentence = sentence.replace(':', ' ');
   
    return `${indent}${sentence}\n`;
}

const checkFun = (indent, code) => {
    const [name, kind, params, spec, simple] = parseFun(code);
    let sentence = `func ${name}(`;

    for (let i = 0; i < params.length; i++) {
        if (i > 0)
            sentence += ', ';
        
        const paramType = params[i].kind || 'interface{}';
        if (isObjectType(paramType)) {
            sentence += `${params[i].name} *${paramType}`;
        } else {
            sentence += `${params[i].name} ${paramType}`;
        }
    }

    if (kind && kind !== 'void') {
        sentence += `) ${kind} {`;
    } else {
        sentence += ') {';
    }

    return `${indent}${sentence}\n`;
}

const checkIf = (indent, key, code) => {
    let sentence = parseIf(key, code);

    if (key === 'if') {
        return `${indent}if ${sentence} {\n`;
    }
    
    if (key === 'when') {
        if (sentence.toLowerCase() === 'no')
            return `${indent}} else {\n`;
        else
            return `${indent}} else if ${sentence} {\n`;
    }
    
    if (key === 'else') {
        return `${indent}} else {\n`;
    }
}

const checkFor = (indent, code) => {
    const [ start, stop, step, varstep, varsize, incode ] = parseFor(code);
    if (incode && varstep) {
        if (stop.indexOf('len(') == 0 && varsize) {
            if (step && step != "1")
                return `${indent}for ${varstep} := ${start}; ${varstep} < len(${varsize}); ${varstep} += ${step} {\n`;
            return `${indent}for ${varstep} := ${start}; ${varstep} < len(${varsize}); ${varstep}++ {\n`;
        }
        else
            return `${indent}for ${varstep} := ${start}; ${varstep} < ${stop}; ${varstep}++ {\n`;
    }
    else if (incode)
        return `${indent}for ${code} {\n`;
    else
        return `${indent}for ${code} {\n`;
}

const checkDoc = (indent, code) => {
    if (code.startsWith('[') && code.endsWith(']')) {
        return `${indent}// ${code}\n`;
    }
    
    let sentence = `${indent}# ${code}\n`;
    if (code === 'end')
        sentence = `${indent}}\n`;
    sentence = sentence.replace('# ', '//');
    return sentence;
}

const checkRead = (indent, code) => {
    return `${indent}// Import: ${code}\n`;
}

const checkSet = (indent, code) => {
    return `${indent}var ${code}\n`;
}

const checkUse = (indent, code) => {
    let lib = parseUse(code)
    if (lib === '@abc')
        return `${indent}import "abc"\n`;
    else if (lib === '@api')
        return `package main\n\nimport (\n\t"fmt"\n\t"net/http"\n)\n`;
    else if (lib == "@mongodb")
        return `import (\n\t"go.mongodb.org/mongo-driver/bson"\n\t"go.mongodb.org/mongo-driver/mongo"\n\t"go.mongodb.org/mongo-driver/mongo/options"\n\t"context"\n)\n`;
    return `${indent}import "${lib}"\n`;
}

const checkSub = (indent, code) => {
    const [method, route, name, simple] = parseSub(code);
    if (['get','post','put','delete','head','patch','options'].includes(method)) {
        return `${indent}http.HandleFunc(${route}, ${name})\n`;
    }
    return `${indent}for _, item := range ${code} {\n`;
}

const checkWeb = (indent, code) => {
    const [method, handle] = parseWeb(code);
    if (method === '@server' || method === 'server')
        return `${indent}// HTTP server setup\n`;
    else if (method === '@listen' || method === 'listen')
        return `${indent}http.ListenAndServe(":${handle}", nil)\n`;
    else if (method === '@handle' || method === '@handler' || method === 'handle')
        return `${indent}fmt.Fprintf(w, ${handle})\n`;
    
    return ``;
}

const checkFile = (indent, code) => {
    const parts = code.split(/\s*=\s*/);
    if (parts.length < 2) return `${indent}// Invalid file operation: ${code}\n`;
    
    const method = parts[0].trim();
    const args = parts[1].trim();
    
    switch (method) {
        case '@open':
        case 'open':
            return `${indent}file, err := os.Open(${args})\n`;
        case '@write':
        case 'write':
            const writeArgs = args.split(',');
            return `${indent}ioutil.WriteFile(${writeArgs[0]}, []byte(${writeArgs[1]}), 0644)\n`;
        case '@read':
        case 'read':
            return `${indent}data, err := ioutil.ReadFile(${args})\n`;
        case '@close':
        case 'close':
            return `${indent}${args}.Close()\n`;
        default:
            return `${indent}// Unknown file operation: ${method}\n`;
    }
};

const checkDBC = (indent, code) => {
    const [method, handle, vary] = parseDBC(code);
    if (method === 'link')
        return `${indent}client, err := mongo.Connect(context.TODO(), options.Client().ApplyURI(${handle}))\n`;
    else if (vary)
        return `${indent}${vary} := client.Database(${handle})\n`;

    return `${indent}${code}\n`;
}

const checkGoal = (script) => {
    const goalMatch = script.match(/goal:\s*(\w+)/i);
    if (goalMatch && goalMatch[1]) {
        const goal = goalMatch[1].toLowerCase();
        if (goal !== 'go') {
            console.log(`@GOAL:${goal}`);
        }
        return goal;
    }
    return 'go';
}

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

let openBlocks = 0;

const transpileLine = (item) => {
    let indent = '';
    if (item.indent > 0)
        for (let j = 0; j < item.indent; j++)
            indent += '\t'; // Go uses tabs

    if (item.key === 'line')  // enter
        return `\n`;

    if (item.key === 'end') {  // ##
        if (openBlocks > 0) {
            openBlocks--;
            const needsBreak = item.indent === 0 || 
                              (item.grade && item.grade < (item.prevGrade || 0));
            return needsBreak ? `${indent}}\n\n` : `${indent}}\n`;
        }
        return `\n`;
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
    
    if (item.key === 'fun') {  // fun:
        openBlocks++;
        return checkFun(indent, item.code);
    }

    if (item.key === 'pass') {  // pass:
        let code = item.code.replace(/@([a-zA-Z0-9_]+)/g, 'this.$1');
        code = applyRoutines(code, 'go');
        return `${indent}return ${code}\n`;
    }

    if (item.key === 'if') {  // if:
        openBlocks++;
        return checkIf(indent, item.key, item.code);
    }

    if (item.key === 'when')  // when:
        return checkIf(indent, item.key, item.code);

    if (item.key === 'else')  // else:
        return checkIf(indent, item.key, item.code);

    if (item.key === 'for') {  // for:
        openBlocks++;
        return checkFor(indent, item.code);
    }

    if (item.key === 'run') {  // run:
        let code = item.code.replace(/@([a-zA-Z0-9_]+)/g, 'this.$1');
        code = applyRoutines(code, 'go');
        return `${indent}${code}\n`;
    }

    if (item.key === 'echo') {  // echo:
        let code = item.code.replace(/@([a-zA-Z0-9_]+)/g, 'this.$1');
        code = applyRoutines(code, 'go');
        return `${indent}fmt.Println(${code})\n`;
    }

    if (item.key === 'read')  // read:
        return checkRead(indent, item.code);

    if (item.key === 'do') {  // do:
        openBlocks++;
        return checkSub(indent, item.code);
    }

    if (item.key === 'try') {  // try:
        openBlocks++;
        return `${indent}// try block\n`;
    }

    if (item.key === 'fail') {  // fail:
        openBlocks++;
        return `${indent}if err != nil {\n`;
    }

    if (item.key === 'use')  // use:
        return checkUse(indent, item.code);

    if (item.key === 'type') {  // type:
        openBlocks++;
        return `${indent}type ${item.code} struct {\n`;
    }

    if (item.key === 'set')  // set:
        return checkSet(indent, item.code);

    if (item.key === 'web')  // web:
        return checkWeb(indent, item.code);
        
    if (item.key === 'file')  // file:
        return checkFile(indent, item.code);

    if (item.key === 'dbc')  // dbc:
        return checkDBC(indent, item.code);

    if (item.key === '@')  // @:
        return ``;
    
    return '';
}