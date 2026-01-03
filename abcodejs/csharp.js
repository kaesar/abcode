// © 2021-2025 by César Andres Arcila Buitrago

// Variable to store current script for framework detection
let currentScript = '';

function start(script, plan) {
    console.log('~~~~~~~~~~~~~');
    console.log('ABCode for C#');
    console.log(`~~~~~~~~~~~~~\n\n${script}`);
    
    // Store script for framework detection
    currentScript = script;

    // Determine target language based on plan or goal directive
    let targetLang = 'csharp';
    
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
    let transpiled = transpileLines('C#', processedScript, transpileLine);
    
    // Process the transpiled code into sections
    const codeSections = processTranspiledCode(transpiled);
    
    // Assemble the final C# code
    return assembleCSharpCode(className, codeSections);
}

// Process transpiled code into separate sections
const processTranspiledCode = (transpiled) => {
    const usingLines = [];
    const functionLines = [];
    const codeLines = [];
    
    let inFunctionDefinition = false;
    let functionIndent = "    "; // 4 spaces for class-level indentation
    let currentFunction = [];
    
    transpiled.split('\n').forEach(line => {
        if (line.trim().startsWith("using ")) {
            usingLines.push(line);
        } 
        // Check for function definition start
        else if (line.match(/^\s*public\s+static\s+\w+\s+\w+\s*\([^)]*\)\s*\{/)) {
            inFunctionDefinition = true;
            currentFunction = [functionIndent + line.trim()]; // Start collecting the function
        }
        // If we're inside a function definition
        else if (inFunctionDefinition) {
            // Check if this line ends the function
            if (line.trim() === "}") {
                currentFunction.push(functionIndent + line.trim());
                functionLines.push(...currentFunction);
                currentFunction = [];
                inFunctionDefinition = false;
            } else {
                // Add line to current function with proper indentation
                currentFunction.push(functionIndent + "    " + line.trim());
            }
        }
        // Regular code (not function definition or using)
        else if (line.trim() !== '') {
            codeLines.push("        " + line.trim()); // 8 spaces for main method
        }
    });
    
    return { usingLines, functionLines, codeLines };
}

// Assemble the final C# code
const assembleCSharpCode = (className, { usingLines, functionLines, codeLines }) => {
    const isWebApp = currentScript && (currentScript.includes('@api') || currentScript.includes('web:'));
    
    let imports = ['using System;'];
    
    if (isWebApp) {
        imports.push('using Microsoft.AspNetCore.Builder;');
        imports.push('using Microsoft.Extensions.DependencyInjection;');
        imports.push('using Microsoft.Extensions.Hosting;');
    }
    
    imports.push(...usingLines.filter(line => !imports.includes(line)));
    
    const importsSection = imports.join('\n') + '\n\n';
    const classWrapper = `public class ${className} {\n\n`;
    const functions = functionLines.length > 0 ? functionLines.join('\n') + '\n\n' : '';
    const mainMethod = "    public static void Main(string[] args) {\n" + 
                       codeLines.join('\n') + 
                       "\n    }\n";
    const closing = "}";
    
    return importsSection + classWrapper + functions + mainMethod + closing;
}

// Extract class name from script using @class directive or type: directive
const extractClassName = (script) => {
    let className = "Program";
    
    const classDirectiveMatch = script.match(/#\s*@class\s+([a-zA-Z][a-zA-Z0-9]*)/i);
    if (classDirectiveMatch && classDirectiveMatch[1]) {
        className = classDirectiveMatch[1];
        console.log(`@CLASSNAME:${className}`);
        return className;
    }
    
    const typeDirectiveMatch = script.match(/type:\s*([a-zA-Z][a-zA-Z0-9]*)/i);
    if (typeDirectiveMatch && typeDirectiveMatch[1]) {
        className = typeDirectiveMatch[1];
        console.log(`@CLASSNAME:${className}`);
    }
    
    return className;
}

const checkLet = (indent, key, code) => {
    let [name, kind, value] = parseVar(code);
    if (value !== null && value.length === 0)
        value = 'null';
    else if (value === 'nil')
        value = 'null';

    // Apply routines to the value
    if (value && value !== 'null') {
        value = applyRoutines(value, 'cs');
    }

    let sentence = `var ${name} = ${value}`;
    
    if (key === 'val')
        sentence = `const ${name} = ${value}`;

    if (sentence.indexOf('int') > -1)
        sentence = sentence.replace(new RegExp('int','g'), 'int');
    else if (sentence.indexOf('string') > -1)
        sentence = sentence.replace(new RegExp('string','g'), 'string');
    else if (sentence.indexOf('any') > -1)
        sentence = sentence.replace(new RegExp('any','g'), 'dynamic');
    else if (sentence.indexOf('float') > -1)
        sentence = sentence.replace(new RegExp('float','g'), 'double');

    return `${indent}${sentence};\n`;
}

const checkFun = (indent, code) => {
    const [name, kind, params, spec, simple] = parseFun(code);
    let sentence = `public static ${kind || 'void'} ${name}(`;
    
    // Handle async functions
    if (spec && spec.includes('async')) {
        sentence = `public static async Task<${kind || 'void'}> ${name}(`;
    }

    for (let i = 0; i < params.length; i++) {
        if (i > 0)
            sentence += ', ';
        sentence += `${params[i].kind} ${params[i].name}`;
    }

    sentence += ') {';

    if (sentence.indexOf('int') > -1)
        sentence = sentence.replace(new RegExp('int','g'), 'int');
    else if (sentence.indexOf('string') > -1)
        sentence = sentence.replace(new RegExp('string','g'), 'string');
    else if (sentence.indexOf('any') > -1)
        sentence = sentence.replace(new RegExp('any','g'), 'dynamic');
    else if (sentence.indexOf('float') > -1)
        sentence = sentence.replace(new RegExp('float','g'), 'double');
    
    if (name === 'main')
        sentence = 'public static void Main(string[] args) {';

    return `${indent}${sentence}\n`;
}

const checkIf = (indent, key, code) => {
    let sentence = parseIf(key, code);

    if (key === 'if') {
        return `${indent}if (${sentence}) {\n`;
    }
    
    if (key === 'when') {
        if (sentence.toLowerCase() === 'no')
            return `${indent}} else {\n`;
        else
            return `${indent}} else if (${sentence}) {\n`;
    }
    
    if (key === 'else') {
        return `${indent}} else {\n`;
    }
}

const checkFor = (indent, code) => {
    const [ start, stop, step, varstep, varsize, incode ] = parseFor(code);
    if (incode && varstep) {
        if (stop.indexOf('len(') === 0 && varsize) {
            if (step && step !== "1")
                return `${indent}for (int ${varstep} = ${start}; ${varstep} < ${varsize}.Length; ${varstep} += ${step}) {\n`;
            return `${indent}for (int ${varstep} = ${start}; ${varstep} < ${varsize}.Length; ${varstep}++) {\n`;
        }
        else
            return `${indent}for (int ${varstep} = ${start}; ${varstep} < ${stop}; ${varstep}++) {\n`;
    }
    else if (incode)
        return `${indent}foreach (${code}) {\n`;
    else if (varsize)
        return `${indent}while (${code.replace('len(' + varsize + ')', varsize + '.Length')}) {\n`;
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
    return `${indent}using ${code};\n`;
}

const checkSet = (indent, code) => {
    return `${indent}var ${code};\n`;
}

const checkUse = (indent, code) => {
    let lib = parseUse(code);
    if (lib === '@abc')
        lib = 'abc';
    else if (lib === '@api')
        lib = 'Microsoft.AspNetCore.Builder\nusing Microsoft.Extensions.DependencyInjection\nusing Microsoft.Extensions.Hosting';
    else if (lib === '@mongodb')
        lib = 'MongoDB.Driver';
    
    return `${indent}using ${lib};\n`;
}

const checkSub = (indent, code) => {
    const [method, route, name, simple] = parseSub(code);
    if (['get','post','put','delete','head','patch','options'].includes(method)) {
        const methodName = method.charAt(0).toUpperCase() + method.slice(1);
        return `${indent}app.Map${methodName}(${route}, ${name});\n${indent}static string ${name}() {\n`;
    }
    return `${indent}${code}.ForEach {\n`;
}

const checkWeb = (indent, code) => {
    const [method, handle] = parseWeb(code);
    if (method === '@server' || method === 'server')
        return `${indent}var builder = WebApplication.CreateBuilder(args);\n${indent}var ${handle} = builder.Build();\n`;
    else if (method === '@listen' || method === 'listen')
        return `${indent}app.Run();\n`;
    else if (method === '@handle' || method === '@handler' || method === 'handle')
        return `${indent}return ${handle};\n`;
    
    return ``;
}

const checkDBC = (indent, code) => {
    const [method, handle, vary] = parseDBC(code);
    if (method === 'link')
        return `${indent}var client = new MongoClient(${handle});\n`;
    else if (vary)
        return `${indent}var ${vary} = client.GetDatabase(${handle});\n`;

    return `${indent}${code}\n`;
}

// Process goal: directive to determine target language
const checkGoal = (script) => {
    const goalMatch = script.match(/goal:\s*(\w+)/i);
    if (goalMatch && goalMatch[1]) {
        const goal = goalMatch[1].toLowerCase();
        if (goal !== 'csharp') {
            console.log(`@GOAL:${goal}`);
        }
        return goal;
    }
    return 'csharp';
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

const checkFile = (indent, code) => {
    const parts = code.split(/\s*=\s*/);
    if (parts.length < 2) return `${indent}// Invalid file operation: ${code}\n`;
    
    const method = parts[0].trim();
    const args = parts[1].trim();
    
    switch (method) {
        case '@open':
        case 'open':
            return `${indent}var fileHandle = File.OpenRead(${args});\n`;
        case '@write':
        case 'write':
            const writeArgs = args.split(',');
            return `${indent}File.WriteAllText(${writeArgs[0]}, ${writeArgs[1]});\n`;
        case '@read':
        case 'read':
            return `${indent}var fileContent = File.ReadAllText(${args});\n`;
        case '@close':
        case 'close':
            return `${indent}${args}.Close();\n`;
        default:
            return `${indent}// Unknown file operation: ${method}\n`;
    }
};

const transpileLine = (item) => {
    let indent = '';
    if (item.indent > 0)
        for (let j = 0; j < item.indent; j++)
            indent += '    '; // 4 spaces for C#

    if (item.key === 'line')
        return `\n`;

    if (item.key === 'end')
        return `${indent}}\n`;

    if (item.key === 'doc') {
        if (item.code.startsWith('[') && item.code.endsWith(']')) {
            return `${indent}[${item.code.substring(1, item.code.length-1)}]\n`;
        }
        return checkDoc(indent, item.code);
    }

    if (item.key === 'var')
        return checkLet(indent, item.key, item.code);
    
    if (item.key === 'val')
        return checkLet(indent, item.key, item.code);
    
    if (item.key === 'fun')
        return checkFun(indent, item.code);

    if (item.key === 'pass') {
        let code = item.code.replace(/@([a-zA-Z0-9_]+)/g, 'this.$1');
        code = applyRoutines(code, 'cs');
        return `${indent}return ${code};\n`;
    }

    if (item.key === 'if')
        return checkIf(indent, item.key, item.code);

    if (item.key === 'when')
        return checkIf(indent, item.key, item.code);

    if (item.key === 'else')
        return checkIf(indent, item.key, item.code);

    if (item.key === 'for')
        return checkFor(indent, item.code);

    if (item.key === 'run') {
        let code = item.code.replace(/@([a-zA-Z0-9_]+)/g, 'this.$1');
        code = applyRoutines(code, 'cs');
        return `${indent}${code};\n`;
    }

    if (item.key === 'echo') {
        let code = item.code.replace(/@([a-zA-Z0-9_]+)/g, 'this.$1');
        
        if (code.includes('{') && code.includes('}') && code.startsWith('"') && code.endsWith('"')) {
            code = code.substring(1, code.length - 1);
            code = code.replace(/{([^{}:]+)(?::([^{}]+))?}/g, (match, varName, format) => {
                if (!format) return '{' + varName.trim() + '}';
                
                if (format.includes('.')) {
                    const [width, precision] = format.split('.');
                    return '{' + varName.trim() + ':F' + precision + '}';
                }
                return '{' + varName.trim() + ',' + format + '}';
            });
            return `${indent}Console.WriteLine($"${code}");\n`;
        }
        
        code = applyRoutines(code, 'cs');
        return `${indent}Console.WriteLine(${code});\n`;
    }

    if (item.key === 'read')
        return checkRead(indent, item.code);

    if (item.key === 'do')
        return checkSub(indent, item.code);

    if (item.key === 'try')
        return `${indent}try {\n`;

    if (item.key === 'fail')
        return `${indent}catch (Exception ex) {\n`;

    if (item.key === 'use')
        return checkUse(indent, item.code);

    if (item.key === 'type')
        return ``; // Skip type directive in transpilation

    if (item.key === 'set')
        return checkSet(indent, item.code);

    if (item.key === 'web')
        return checkWeb(indent, item.code);
        
    if (item.key === 'file')
        return checkFile(indent, item.code);

    if (item.key === 'dbc')
        return checkDBC(indent, item.code);

    if (item.key === '@')
        return '';
    
    return '';
}

// module.exports = { start }