// © 2021-2025 by César Andres Arcila Buitrago

function start(script, plan) {
    console.log('~~~~~~~~~~~~~~');
    console.log('ABCode for PHP');
    console.log(`~~~~~~~~~~~~~~\n\n${script}`);

    // Determine target language based on plan or goal directive
    let targetLang = 'php';
    
    if (plan && !isNaN(parseInt(plan))) {
        const targetNum = parseInt(plan);
        if (targetMap[targetNum]) {
            targetLang = targetMap[targetNum];
        }
    } else {
        targetLang = checkGoal(script);
    }
    
    const processedScript = checkLike(script, targetLang);
    return transpileLines('PHP', processedScript, transpileLine);
}

const checkLet = (indent, key, code) => {
    let [name, kind, value] = parseVar(code);
    if (value !== null && value.length == 0)
        value = 'null';

    // Apply routines to the value
    if (value && value !== 'null') {
        value = applyRoutines(value, 'php');
    }

    let sentence = `$${name}`;
    if (value != 'null')
        sentence += ` = ${value}`;
    
    return `${indent}${sentence};\n`;
}

const checkFun = (indent, code) => {
    const [name, kind, params, spec, simple] = parseFun(code);
    let sentence = `function ${name} (`;
    
    // PHP doesn't have native async, use ReactPHP or Swoole
    if (spec && spec.includes('async')) {
        // Comment indicating async intent
        sentence = `// @async\nfunction ${name} (`;
    }

    for (let i = 0; i < params.length; i++) {
        if (i > 0)
            sentence += ', ';
        sentence += '$' + params[i].name;
    }
    
    sentence += ') {';
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
        if (stop.indexOf('len(') == 0 && varsize) {
            if (step && step != "1")
                return `${indent}for (${varstep} = ${start}; ${varstep} < ${varsize}.len(); ${varstep} += ${step}) {\n`;
            return `${indent}for (${varstep} = ${start}; ${varstep} < ${varsize}.len(); ${varstep}++) {\n`;
        }
        else
            return `${indent}for (${varstep} = ${start}; ${varstep} < ${stop}; ${varstep}++) {\n`;
    }
    else if (incode)
        return `${indent}for (${code}) {\n`;
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
    return `${indent}require ${code}\n`;
}

const checkSet = (indent, code) => {
    return `${indent}type ${code} struct {\n`;
}

const checkUse = (indent, code) => {
    let lib = parseUse(code)
    if (lib == '@abc')
        return `require_once abc;\n`;
    else if (lib == '@api')
        return `require_once __DIR__ . '/vendor/autoload.php';\n\nuse Mark\\App;\n`;
        //return `require_once __DIR__ . '/vendor/autoload.php';\n\nuse Comet\\Comet;\n`;
    else if (lib == '@mongodb')
        return ``;
    return `${indent}import (${lib});\n`;
}

const checkSub = (indent, code) => {
    const [method, route, name, simple] = parseSub(code);
    if (['get','post','put','delete','head','patch','options'].includes(method))
        return `${indent}$app->${method}(${route}, function ($req, $param) { ${name}($req, $param); });\nfunction ${name}($req, $param) {\n`;
    return `${indent}${code}.forEach {\n`;
}

const checkWeb = (indent, code) => {
    const [method, handle] = parseWeb(code);
    if (method == 'server')
        return `${indent}$${handle} = new App('http://0.0.0.0:3000');\n$${handle}->count = 4;\n`;  // new Comet();
    else if (method == 'listen')
        return `${indent}$app->start();\n`;  // $app->run();
    else if (method == 'handle')
        return `${indent}${code};\n`;
        //return `${indent}$res->with(${handle});\n`;

    return ``;  //`${indent}${code}\n`;
    /*let web = `$app = new Comet();
    $app->get('/', 
    function ($request, $response) {              
        return $response->with("Hi there!");
    });
    $app->run();`;*/
}

const checkDBC = (indent, code) => {
    const [method, handle, vary] = parseDBC(code);
    if (method == 'link')
        return `${indent}$dbc = new MongoClient();\n`;  // ${handle}
    else if (vary)
        return `${indent}${vary} = $dbc->${handle};\n`;
    
    return `${indent}${code}\n`;
}

// Process goal: directive to determine target language
const checkGoal = (script) => {
    const goalMatch = script.match(/goal:\s*(\w+)/i);
    if (goalMatch && goalMatch[1]) {
        const goal = goalMatch[1].toLowerCase();
        if (goal !== 'php') {
            console.log(`@GOAL:${goal}`);
        }
        return goal;
    }
    return 'php';
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

const checkVary = (key, code) => {
console.log('***', key, code.substr(0,1))
    if (key == 'echo' && code.substr(0,1) == '"') return code;
    else if (key == 'send' && code.substr(0,1) == '"') return code;
    let result = '';
    let vary = (code.indexOf(' ') > -1) ? code.split(' ') : [];
    if (vary.length > 0)
        for (let i = 0; i < vary.length; i++) {
            if (['+','-','*','/','='].includes(vary[i])) {
                result += ` ${vary[i]} `;
            }
            else {
                result += `$${vary[i]}`;
            }
        }
    else
        result = `$${code}`;
    return result;
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
        return `${indent}return ${checkVary(item.key, item.code)};\n`;

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
        let code = applyRoutines(item.code, 'php');
        return `${indent}${checkVary(item.key, code)};\n`;
    }

    if (item.key === 'echo')  // echo:
        return `${indent}print_r(${checkVary(item.key, item.code)});\n`;

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
        return `${indent}class ${item.code} {\n`;

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
