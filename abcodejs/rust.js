// © 2021-2025 by César Andres Arcila Buitrago

function start(script, plan) {
    console.log('~~~~~~~~~~~~~~~');
    console.log('ABCode for Rust');
    console.log(`~~~~~~~~~~~~~~~\n\n${script}`);

    // Determine target language based on plan or goal directive
    let targetLang = 'rust';
    
    if (plan && !isNaN(parseInt(plan))) {
        const targetNum = parseInt(plan);
        if (targetMap[targetNum]) {
            targetLang = targetMap[targetNum];
        }
    } else {
        targetLang = checkGoal(script);
    }
    
    const processedScript = checkLike(script, targetLang);
    return transpileLines('Rust', processedScript, transpileLine);
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
        
        // Apply routines to the value
        if (value && value !== 'null') {
            value = applyRoutines(value, 'rust');
        }
    }
    else {
        variable = code;
        value = 'null';
    }

    sentence = `let mut ${variable} = ${value};`;

    if (sentence.indexOf('int') > -1)
        sentence = sentence.replace(new RegExp('int','g'), 'i32');

    return `${indent}${sentence}\n`;
}

const checkFun = (indent, code) => {
    const [name, kind, params, spec, simple] = parseFun(code);
    let sentence = `fn ${name} (`;
    
    // Rust async functions
    if (spec && spec.includes('async')) {
        sentence = `async fn ${name} (`;
    }

    for (let i = 0; i < params.length; i++) {
        if (i > 0)
            sentence += ', ';
        sentence += params[i].name + ': ' + params[i].kind;
    }

    if (kind && kind != 'void')
        sentence += `) -> ${kind} {`;
    else
        sentence += ') {';

    if (sentence.indexOf('int') > -1)
        sentence = sentence.replace(new RegExp('int','g'), 'i32');

    if (code == 'new')
        sentence = sentence.replace('fn', 'new');

    return `${indent}${sentence}\n`;
}

const checkIf = (indent, key, code) => {
    let sentence = parseIf(key, code);

    if (key === 'if') {  // if:
        return `${indent}if ${sentence} {\n`;
    }

    if (key === 'when') {  // when:
        if (sentence.toLowerCase() === 'no')
            return `${indent}} else {\n`;
        else
            return `${indent}} else if ${sentence} {\n`;
    }

    if (key === 'else') {  // else:
        return `${indent}} else {\n`;
    }
}

const checkFor = (indent, code) => {
    const [ start, stop, step, varstep, varsize, incode ] = parseFor(code);
    if (incode && varstep) {
        if (stop.indexOf('len(') == 0 && varsize) {
            return `${indent}for ${varstep} in ${start}..${varsize}.len() {\n`;
        }
        else
            return `${indent}for ${varstep} in ${start}..${stop} {\n`;
    }
    else if (incode)
        return `${indent}for ${varstep} in ${varsize}.iter() {\n`;
    else
        return `${indent}while ${code} {\n`;
}

const checkDoc = (indent, code) => {
    let sentence = `${indent}# ${code}\n`;
    if (code == 'end')
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
    if (lib == '@abc')
        return `${indent}use abc;\n`;
    else if (lib == '@api')
        return `use feather::*;\n`;
    else if (lib == "@mongodb")
        return `use mongodb::{bson::doc, options::ClientOptions, Client};\n`;
    return `${indent}mod ${lib}\n`;
}

const checkSub = (indent, code) => {
    const [method, route, name, simple] = parseSub(code);
    if (['get','post','put','delete','head','patch','options'].includes(method)) {
        return `${indent}//@ app.${method}(${route}, middleware!(${name}));\n${indent}fn ${name}() {\n`;
    }
    return `${indent}${code}.iter() {\n`;
}

const checkWeb = (indent, code) => {
    const [method, handle] = parseWeb(code);
    if (method === '@server' || method === 'server') {
        return `${indent}let mut ${handle} = Feather::new();\n`;
    }
    else if (method === '@listen' || method === 'listen')
        return `${indent}app.listen("127.0.0.1:${handle}").await;\n`;
    else if (method === '@handle' || method === 'handle')
        return `${indent}return ${handle};\n`;
    
    return ``;
}

const checkDBC = (indent, code) => {
    const [method, handle, vary] = parseDBC(code);
    if (method == 'link')
        return `${indent}let dbc = Client::with_uri_str(${handle}).await?;\n`;
    else if (vary)
        return ``;
    
    return `${indent}${code}\n`;
}

// Process goal: directive to determine target language
const checkGoal = (script) => {
    const goalMatch = script.match(/goal:\s*(\w+)/i);
    if (goalMatch && goalMatch[1]) {
        const goal = goalMatch[1].toLowerCase();
        if (goal !== 'rust') {
            console.log(`@GOAL:${goal}`);
        }
        return goal;
    }
    return 'rust';
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
            indent += ' ';

    if (item.key === 'line')  // enter
        return `\n`;

    if (item.key === 'end') {  // ##
        // Check if this closes a block that needs extra line break
        const needsBreak = item.indent === 0 || 
                          (item.grade && item.grade < (item.prevGrade || 0));
        return needsBreak ? `${indent}}\n\n` : `${indent}}\n`;
    }

    if (item.key === 'doc')  // #
        return checkDoc(indent, item.code);

    if (item.key === 'var')  // var:
        return checkLet(indent, item.key, item.code);
    
    if (item.key === 'val')  // val:
        return checkLet(indent, item.key, item.code);
    
    if (item.key === 'fun')  // fun:
        return checkFun(indent, item.code);

    if (item.key === 'pass')  // pass:
        return `${indent}return ${item.code};\n`;

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
        let code = applyRoutines(item.code, 'rust');
        code = code.replace(/\bawait\s+/g, '.await');
        return `${indent}${code};\n`;
    }

    if (item.key === 'echo')  // echo:
        return `${indent}println!("{}", ${item.code});\n`;

    if (item.key === 'read')  // read:
        return checkRead(indent, item.code);

    if (item.key === 'do')  // do:
        return checkSub(indent, item.code);

    if (item.key === 'try')  // try:
        return `${indent}try {\n`;

    if (item.key === 'fail')  // fail:
        return `${indent}catch(err) {\n`;

    if (item.key === 'use')  // use:
        return checkUse(indent, item.code);

    if (item.key === 'type')  // type:
        return `${indent}impl ${item.code} {\n`;

    if (item.key === 'set')  // set:
        return checkSet(indent, item.code);

    if (item.key === 'web')  // web:
        return checkWeb(indent, item.code);

    if (item.key === 'dbc')  // dbc:
        return checkDBC(indent, item.code);

    if (item.key === '@')  // @:
        return ``;
        
    return ''; // Return empty string instead of undefined
}

// module.exports = { start }