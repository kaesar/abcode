// © 2021-2025 by César Andres Arcila Buitrago

function start(script, plan) {

    console.log('~~~~~~~~~~~~~~~~~~~~~~');
    console.log('ABCode for WebAssembly');
    console.log(`~~~~~~~~~~~~~~~~~~~~~~\n\n${script}`);

    return transpileLines('Wasm', script, transpileLine);
}

const checkLet = (indent, key, code) => {
    let [name, kind, value] = parseVar(code);
    if (value !== null && value.length == 0)
        value = 'null';
    else if (value == 'nil')
        value = 'null';

    let sentence = `let ${name} = ${value}`;

    if (sentence.indexOf('int') > -1)
        sentence = sentence.replace(new RegExp('int','g'), 'i32');
    else if (sentence.indexOf('float') > -1)
        sentence = sentence.replace(new RegExp('float','g'), 'f64');
    else if (sentence.indexOf('boolean') > -1)
        sentence = sentence.replace(new RegExp('boolean','g'), 'bool');
    
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

    if (kind && kind != 'void')
        sentence += `): ${kind} {`;
    else
        sentence += ') {';

    if (sentence.indexOf('int') > -1)
        sentence = sentence.replace(new RegExp('int','g'), 'i32');
    else if (sentence.indexOf('float') > -1)
        sentence = sentence.replace(new RegExp('float','g'), 'f64');
    else if (sentence.indexOf('boolean') > -1)
        sentence = sentence.replace(new RegExp('boolean','g'), 'bool');
    else if (sentence == 'function main () {')
        sentence = 'async function main () {';
    
    if (code == 'new')
        setence = sentence.replace('new', 'constructor');

    return `${indent}${sentence}\n`;
}

const checkIf = (indent, key, code) => {
    let sentence = parseIf(key, code);

    if (key == 'if') {  // if:
        return `${indent}if (${sentence}) {\n`;
    }
    
    if (key == 'when') {  // when:
        if (sentence.toLowerCase() == 'no')
            return `${indent}} else {\n`;
        else
            return `${indent}} else if (${sentence}) {\n`;
    }
    
    if (key == 'else') {  // else:
        return `${indent}} else {\n`;
    }
}

const checkFor = (indent, code) => {
    const [ start, stop, step, varstep, varsize, incode ] = parseFor(code);
    if (incode && varstep) {
        if (stop.indexOf('len(') == 0 && varsize) {
            if (step && step != "1")
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
        return `{ abc } from 'abc.js';\n`;
    else if (lib == '@api')
        return ``;
    else if (lib == "@mongodb")
        return ``;
    
    return `${indent}import ${lib};\n`;
}

const checkSub = (indent, code) => {
    const [method, route, name, simple] = parseSub(code);
    if (['get','post','put','delete','head','patch','options'].includes(method))
        return `${indent}app.${method}(${route}, ${name})\n${indent}function ${name} (ctx: Context) {\n`;  //req: any, res: any
    
    return `${indent}${item.code}.forEach {\n`;
}

const checkWeb = (indent, code) => {
    const [method, handle] = parseWeb(code);
    if (method == 'server')
        return `${indent}const ${handle} = new Application();\n`;
        //return `${indent}const ${handle} = new Aqua(8080);\n`;
        //return `${indent}const ${handle} = Fastro();\n`;
        //return `${indent}const ${handle} = opine();\n`;
    else if (method == 'listen')
        return `${indent}app.start({ port: ${handle} });\n`;
        //return ``;
        //return `${indent}app.listen({ port: ${handle} });\n`;  // "127.0.0.1:" + ${handle}
    else if (method == 'handle')
        return `${indent}return ${handle};\n`;
        //return `${indent}res.send(${handle});\n`;
    
    return ``;  //`${indent}${code}\n`;
}

const checkDBC = (indent, code) => {
    const [method, handle, vary] = parseDBC(code);
    if (method == 'link')
        return `${indent}const dbc = new MongoClient();\n${indent}dbc.connect(${handle});\n`;
    else if (vary)
        return `${indent}let ${vary} = dbc.database(${handle});\n`;
        //return `let ${indent}${vary} = dbc.db(${handle})\n`;

    return `${indent}${code}\n`;
}

const transpileLine = (item) => {
    let indent = '';
    if (item.indent > 0)
        for (let j = 0;  j < item.indent; j++)
            indent += ' ';

//console.log(item)
    if (item.key == 'line')  // enter
        return `\n`;

    if (item.key == 'end')  // ##
        return `${indent}}\n`;

    if (item.key == 'doc')  // #
        return checkDoc(indent, item.code);

    if (item.key == 'var')  // var:
        return checkLet(indent, item.key, item.code);
    
    if (item.key == 'let')  // let:
        return checkLet(indent, item.key, item.code);
    
    if (item.key == 'fun')  // fun:
        return checkFun(indent, item.code);

    if (item.key == 'send')  // send:
        return `${indent}return ${item.code};\n`;

    if (item.key == 'if')  // if:
        return checkIf(indent, item.key, item.code);

    if (item.key == 'when')  // when:
        return checkIf(indent, item.key, item.code);

    if (item.key == 'else')  // else:
        return checkIf(indent, item.key, item.code);

    if (item.key == 'for')  // for:
        return checkFor(indent, item.code);

    if (item.key == 'run')  // run:
        return `${indent}${item.code}\n`;

    if (item.key == 'echo')  // echo:
        return `${indent}console.log(${item.code});\n`;

    if (item.key == 'read')  // read:
        return checkRead(indent, item.code);

    if (item.key == 'sub')  // sub:
        return checkSub(indent, item.code);

    if (item.key == 'try')  // try:
        return `${indent}try {\n`;

    if (item.key == 'fail')  // fail:
        return `${indent}catch(err) {\n`;

    if (item.key == 'use')  // use:
        return checkUse(indent, item.code)

    if (item.key == 'type')  // type:
        return `${indent}class ${item.code} {\n`;

    if (item.key == 'set')  // set:
        return checkSet(indent, item.code);

    if (item.key == 'web')  // web: server, listen, handle, expose, socket, upload, fetch
        return ``;  //return checkWeb(indent, item.code);

    if (item.key == 'dbc')  // dbc:
        return checkDBC(indent, item.code);

    if (item.key == '@')  // @:
        return ``;
}

// module.exports = { start }
