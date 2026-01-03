// © 2021-2025 by César Andres Arcila Buitrago

const sentences = [];
const words = ['fun:','if:','when:','else:','for:','do:','try:','fail:','use:','run:','pass:','var:','val:','set:','type:','echo:','read:','save:','web:','dbc:','goal','like:','form:','plug:','case:','each:'];  // 'plug:play','make:show','fix','pair'?
//const breaks = ['fun:','if:','when:','else:','for:','do:','try:','fail:','case:','each:'];
let isMainModule = false;

const targetMap = { 0: 'rust', 1: 'node', 2: 'deno', 3: 'wasm', 4: 'kotlin', 5: 'java', 6: 'python', 7: 'go', 8: 'php', 9: 'csharp' };

// Built-in matches (routines) - Organized by categories: native, same, abc
const routines = [
    // NATIVE FUNCTIONS (with parentheses)
    { name: 'len',      match: { py: 'len',               js: '.length',            kt: '.size',                java: '.size()',                              go: 'len',                         deno: '.length',            wasm: '.length',            php: 'count',         rust: '.len()',              cs: '.Length'                        }, native: true },
    { name: 'str',      match: { py: 'str',               js: '.toString()',        kt: '.toString()',          java: '.toString()',                          go: 'strconv.Itoa',                deno: '.toString()',        wasm: '.toString()',        php: 'strval',        rust: '.to_string()',        cs: '.ToString()'                    }, native: true },
    { name: 'int',      match: { py: 'int',               js: 'parseInt',           kt: '.toInt()',             java: 'Integer.parseInt',                     go: 'strconv.Atoi',                deno: 'parseInt',           wasm: 'parseInt',           php: 'intval',        rust: '.parse::<i32>()',     cs: 'int.Parse'                      }, native: true },
    { name: 'float',    match: { py: 'float',             js: 'parseFloat',         kt: '.toDouble()',          java: 'Double.parseDouble',                   go: 'strconv.ParseFloat',          deno: 'parseFloat',         wasm: 'parseFloat',         php: 'floatval',      rust: '.parse::<f64>()',     cs: 'double.Parse'                   }, native: true },
    { name: 'list',     match: { py: 'list',              js: 'new Array',          kt: 'mutableListOf',        java: 'Arrays.asList',                        go: 'make([]interface{}',          deno: 'new Array',          wasm: 'new Array',          php: 'array',         rust: 'vec!',                cs: 'new List<object>'               }, native: true },
    { name: 'dict',     match: { py: 'dict',              js: 'new Object',         kt: 'mutableMapOf',         java: 'new HashMap',                          go: 'make(map[string]interface{})',deno: 'new Object',         wasm: 'new Object',         php: 'array',         rust: 'HashMap::new',        cs: 'new Dictionary<string, object>' }, native: true },
    { name: 'pow',      match: { py: 'pow',               js: 'Math.pow',           kt: 'Math.pow',             java: 'Math.pow',                             go: 'math.Pow',                    deno: 'Math.pow',           wasm: 'Math.pow',           php: 'pow',           rust: '.pow',                cs: 'Math.Pow'                       }, native: true },
    { name: 'chr',      match: { py: 'chr',               js: 'String.fromCharCode',kt: 'Char',                 java: 'Character.toString',                   go: 'string(rune',                 deno: 'String.fromCharCode',wasm: 'String.fromCharCode',php: 'chr',           rust: 'char::from',          cs: '(char)'                         }, native: true },

    // SAME METHODS (with dots)
    { name: '.find',    match: { py: '.find',             js: '.indexOf',           kt: '.indexOf',             java: '.indexOf',                             go: 'strings.Index',               deno: '.indexOf',           wasm: '.indexOf',           php: 'strpos',        rust: '.find',               cs: '.IndexOf'                       }, same: true },
    { name: '.upper',   match: { py: '.upper',            js: '.toUpperCase',       kt: '.uppercase',           java: '.toUpperCase',                         go: 'strings.ToUpper',             deno: '.toUpperCase',       wasm: '.toUpperCase',       php: 'strtoupper',    rust: '.to_uppercase',       cs: '.ToUpper'                       }, same: true },
    { name: '.lower',   match: { py: '.lower',            js: '.toLowerCase',       kt: '.lowercase',           java: '.toLowerCase',                         go: 'strings.ToLower',             deno: '.toLowerCase',       wasm: '.toLowerCase',       php: 'strtolower',    rust: '.to_lowercase',       cs: '.ToLower'                       }, same: true },
    { name: '.strip',   match: { py: '.strip',            js: '.trim',              kt: '.trim',                java: '.trim',                                go: 'strings.TrimSpace',           deno: '.trim',              wasm: '.trim',              php: 'trim',          rust: '.trim',               cs: '.Trim'                          }, same: true },
    { name: '.append',  match: { py: '.append',           js: '.push',              kt: '.add',                 java: '.add',                                 go: 'append',                      deno: '.push',              wasm: '.push',              php: 'array_push',    rust: '.push',               cs: '.Add'                           }, same: true },
    { name: '.remove',  match: { py: '.remove',           js: '.pop',               kt: '.remove',              java: '.remove',                              go: 'abc.remove',                  deno: '.pop',               wasm: '.pop',               php: 'array_pop',     rust: '.pop',                cs: '.Remove'                        }, same: true },
    { name: '.insert',  match: { py: '.insert',           js: '.splice',            kt: '.add',                 java: '.add',                                 go: 'abc.insert',                  deno: '.splice',            wasm: '.splice',            php: 'array_splice',  rust: '.insert',             cs: '.Insert'                        }, same: true },
    { name: '.pop',     match: { py: '.pop',              js: '.pop',               kt: '.removeAt',            java: '.remove',                              go: 'abc.pop',                     deno: '.pop',               wasm: '.pop',               php: 'array_pop',     rust: '.pop',                cs: '.RemoveAt'                      }, same: true },
    { name: '.sort',    match: { py: '.sort',             js: '.sort',              kt: '.sortBy',              java: 'Collections.sort',                     go: 'sort.Strings',                deno: '.sort',              wasm: '.sort',              php: 'sort',          rust: '.sort',               cs: '.Sort'                          }, same: true },
    { name: '.split',   match: { py: '.split',            js: '.split',             kt: '.split',               java: '.split',                               go: 'strings.Split',               deno: '.split',             wasm: '.split',             php: 'explode',       rust: '.split',              cs: '.Split'                         }, same: true },

    // ABC FUNCTIONS (ABCode specific)
    { name: 'replace',  match: { py: '.replace',          js: 'abc.replace',        kt: '.replace',             java: '.replace',                             go: 'strings.Replace',             deno: 'abc.replace',        wasm: 'abc.replace',        php: 'str_replace',   rust: '.replace',            cs: '.Replace'                       }, abc: true },
    { name: 'count',    match: { py: 'abc.count',         js: 'abc.count',          kt: 'abc.count',            java: 'abc.count',                            go: 'strings.Count',               deno: 'abc.count',          wasm: 'abc.count',          php: 'substr_count',  rust: '.matches().count()',  cs: 'abc.count'                      }, abc: true },
    { name: 'join',     match: { py: 'abc.join',          js: '.join',              kt: '.joinToString',        java: 'String.join',                          go: 'strings.Join',                deno: '.join',              wasm: '.join',              php: 'implode',       rust: '.join',               cs: 'string.Join'                    }, abc: true },
    { name: 'slice',    match: { py: 'abc.slice',         js: '.slice',             kt: '.slice',               java: '.substring',                           go: 'abc.slice',                   deno: '.slice',             wasm: '.slice',             php: 'array_slice',   rust: '.get()',              cs: '.Substring'                     }, abc: true },
    { name: 'jsonload', match: { py: 'json.loads',        js: 'JSON.parse',         kt: 'Json.decodeFromString',java: 'new ObjectMapper().readValue',         go: 'json.Unmarshal',              deno: 'JSON.parse',         wasm: 'JSON.parse',         php: 'json_decode',   rust: 'serde_json::from_str',cs: 'JsonSerializer.Deserialize'     }, abc: true },
    { name: 'jsondump', match: { py: 'json.dumps',        js: 'JSON.stringify',     kt: 'Json.encodeToString',  java: 'new ObjectMapper().writeValueAsString',go: 'json.Marshal',                deno: 'JSON.stringify',     wasm: 'JSON.stringify',     php: 'json_encode',   rust: 'serde_json::to_string',cs: 'JsonSerializer.Serialize'      }, abc: true },
    { name: 'datetime', match: { py: 'datetime.datetime', js: 'new Date',           kt: 'LocalDateTime.now',    java: 'LocalDateTime.now',                    go: 'time.Now',                    deno: 'new Date',           wasm: 'new Date',           php: 'new DateTime',  rust: 'chrono::Utc::now',    cs: 'DateTime.Now'                   }, abc: true },
    { name: 'monthend', match: { py: 'abc.monthend',      js: 'abc.monthend',       kt: 'abc.monthend',         java: 'abc.monthend',                         go: 'abc.monthend',                deno: 'abc.monthend',       wasm: 'abc.monthend',       php: 'abc.monthend',  rust: 'abc.monthend',        cs: 'abc.monthend'                   }, abc: true },
    { name: 'monthname',match: { py: 'abc.monthname',     js: 'abc.monthname',      kt: 'abc.monthname',        java: 'abc.monthname',                        go: 'abc.monthname',               deno: 'abc.monthname',      wasm: 'abc.monthname',      php: 'abc.monthname', rust: 'abc.monthname',       cs: 'abc.monthname'                  }, abc: true }
];

// Apply routines to code based on target language
const applyRoutines = (code, targetLang) => {
    if (!code || !targetLang) return code;
    
    let processedCode = code;
    const langKey = targetLang === 'node' ? 'js' : targetLang === 'python' ? 'py' : targetLang === 'kotlin' ? 'kt' : targetLang;
    
    routines.forEach(routine => {
        if (routine.name && routine.match[langKey]) {
            const replacement = routine.match[langKey];
            
            if (routine.native) {
                // Para native: len(x) -> x.length (js) o len(x) -> len(x) (py)
                const regex = new RegExp(`\\b${routine.name}\\(([^)]+)\\)`, 'g');
                if (langKey === 'js' || langKey === 'deno' || langKey === 'wasm' || langKey === 'tstl') {
                    if (routine.name === 'len') {
                        processedCode = processedCode.replace(regex, '$1' + replacement);
                    } else {
                        processedCode = processedCode.replace(regex, replacement + '($1)');
                    }
                } else {
                    processedCode = processedCode.replace(regex, replacement + '($1)');
                }
            }
            else if (routine.same) {
                // Para same: x.upper() -> x.toUpperCase() (js)
                const regex = new RegExp(`\\${routine.name}\\(`, 'g');
                processedCode = processedCode.replace(regex, replacement + '(');
            }
            else if (routine.abc) {
                // Para abc: jsonload(x) -> JSON.parse(x) (js)
                const regex = new RegExp(`\\b${routine.name}\\(`, 'g');
                processedCode = processedCode.replace(regex, replacement + '(');
            }
        }
    });
    
    return processedCode;
}

const search = (list, key) => {  // Sequential search
    let value = null
    for (let i = 0; i < list.length; i++)
        if (list[i].key === key)
            return list[i].value;
    return value;
}

const get = (key) => {  // Standard way to get key/value pair
    if (!key) return null;
    return search(sentences, key);
}

const setPairs = (lines, keySeparator) => {  // For fixing key/value pairs
    let key = null;
    let value = null;
    let indent = 0;
    let grade = 0;
    let pos = 0;
    let keypre = 0;
    let keypos = 0;
    let trimed = null;
    let ready = false;

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i];
        pos = line.indexOf(keySeparator || ':');
        keypre = keypos;
        keypos = line.search(/\S/);
        trimed = line.trim();
        ready = false;

        if (keypos < keypre) {
            let closes =  Math.ceil((keypre - keypos)/2);
            for (let j = 0; j < closes; j++) {
                indent = keypre - (j * 2) - 2;
                grade = Math.ceil(indent / 2);
                sentences.push({ key: 'end', code: '##', line: i, indent: indent, grade: grade });
            }
        }

        // Check comments
        if (trimed && trimed.length > 3) {
            trimed = trimed.substring(0,3);
            indent = line.indexOf(trimed);
            grade = Math.ceil(indent / 2);
            if (trimed === '#to' || trimed === '#if' || trimed === '##') {
                key = trimed;
                if (key === '##') {
                    key = 'end';
                    line = trimed;
                    indent = line.indexOf(trimed);
                    grade = Math.ceil(indent / 2);
                }
                value = line;
                pos = 0;
                ready = true;
                sentences.push({ key: key, code: value, line: i, indent: indent, grade: grade });
            }
            else if (trimed.substring(0,1) === '#') {
                key = 'doc';
                value = line.trim().substring(1).trim();
                pos = 0;
                sentences.push({ key: key, code: value, line: i, indent: indent, grade: grade });
                ready = true;
            }
        }
    
        if (pos > 0) {
            key = line.substring(0,pos).trim();
            value = line.substring(pos + 1).trim();
            indent = line.indexOf(key);
            grade = Math.ceil(indent / 2);

            if (value === 'true')
                value = true;
            else if (value === 'false')
                value = false;
            else if (value === 'null' || value.trim() === '')
                value = null;
            
                sentences.push({ key: key, code: value, line: i, indent: indent, grade: grade });
        }
        else if (pos < 0) {
            key = 'line';
            value = null;
            indent = 0;
            grade = 0;
            if (trimed === '##') {
                key = 'end';
                value = trimed;
                indent = line.indexOf(trimed);
                grade = Math.ceil(indent / 2);
            }
            sentences.push({ key: key, code: value, line: i, indent: indent, grade: grade });
        }
    };

    return sentences;
}

const global = (lang, source) => {
    let hasType = false;
    for (let i = 0; i < source.length; i++) {
        let item = source[i].key; 
        if (item === 'type')
            hasType = true;
    }

    if (lang === 'C#' && !hasType) {
        console.error('ERROR => missing class for C# program');
        return false;
    }

    return true;
}

const rules = (item) => {
    if (item.grade * 2 !== item.indent)
        console.warn(`[line ${item.line}] ALERT => wrong indentation: ${item.code}`);

    let keys = words.map(x => x.replace(':',''));
    let keysOk = keys.concat(['doc','line','end','@']);  // ¿ doc ?

    if (!keysOk.includes(item.key))
        console.warn(`[line ${item.line}] ALERT => keyword unknown: ${item.key}`);

    if (item.key === 'var' && item.code.indexOf('=') < 0)
        console.warn(`[line ${item.line}] ALERT => missing assignment: ${item.code}`);
    
    if (item.key === 'var' && item.code.indexOf(':') < 0)
        console.warn(`[line ${item.line}] ALERT => consider datatype if you want to transpile for certain languages: ${item.code}`);
    
    if (item.key === 'fun' && item.code.indexOf(':') < 0 && item.code.indexOf('main') < 0)
        console.warn(`[line ${item.line}] INFO => consider datatype if you want to transpile for certain languages: ${item.code}`);
    
    if (item.key === 'fun' && item.code.indexOf('(') < 0) {
        console.error(`[line ${item.line}] ERROR => missing left parentesis: ${item.code}`);
        return false;
    }
    
    if (item.key === 'fun' && item.code.trim().indexOf('(') === 0) {
        console.error(`[line ${item.line}] ERROR => missing function name: ${item.code}`);
        return false;
    }

    if (item.key === 'fun' && item.code.indexOf(')') < 0) {
        console.error(`[line ${item.line}] ERROR => missing right parentesis: ${item.code}`);
        return false;
    }

    if (item.key === 'fun' && item.code.indexOf('main') === 0)
        isMainModule = true
    
    return true;
}

// var:
const parseVar = (code) => {
    let left = code.indexOf('=');
    let name = null;
    let value = '';
    if (left > 0) {
        name = code.substr(0, left).trim();
        value = code.substr(left + 1).trim();
    }
    let kind = 'any';
    if (name && name.indexOf(':') > 0) {
        // Remove spaces before splitting, like in parseFun
        name = name.replace(new RegExp(' ','g'),'');
        let x = name.split(':');
        name = x[0].trim();
        kind = x[1].trim();
    }
    return [name, kind, value];
}

// fun:
const parseFun = (code) => {
    // Check for async at the beginning
    let isAsync = false;
    if (code.trim().startsWith('async ')) {
        isAsync = true;
        code = code.trim().substring(6); // Remove 'async '
    }
    
    let left = code.indexOf('(');
    let right = code.indexOf(')');
    let name = code.substr(0, left).trim();
    let kind = 'void';
    if (code.indexOf('):') > -1)
        kind = code.substring(code.indexOf('):') + 2).trim();
    let spec = isAsync ? 'async' : null;
    let params = code.substring(left + 1, right).replace(new RegExp(' ','g'),'').split(',');
    if (params.length === 1 && params[0].length === 0)
        params = [];
    for (let i = 0; i < params.length; i++) {
        let x = params[i].split(':');
        params[i] = { name: x[0] };
        if (x.length > 1)
            params[i].kind = x[1];
        else
            params[i].kind = 'any';
    }
    let simple = name + ' (';
    for (let j =0; j < params.length; j++) {
        simple += params[j].name;
        if (params.length - 1 > j) simple += ', ';
    }
    simple += ')';
    return [ name, kind, params, spec, simple ];
}

// if: ... when: ... else:
const parseIf = (key, code) => {
    let sentence = `${code}`;
    if (key === 'if')
        sentence = `${code}`;
    else if (key === 'when')
        sentence = `${code}`;
    else if (key === 'else')
        sentence = `${code}`;
    return sentence;
}

// for:
const parseFor = (code) => {
    let left = code.indexOf('(');
    let right = code.lastIndexOf(')');
    let hasRange = (code.indexOf('range(') > -1);
    let hasLen = code.indexOf('len(');
    let varstep = null;
    let start = null;
    let stop = null;
    let step = 1;
    let varsize = null;
    let incode = null;
    let inrange = null;

    if (hasLen > 0)
        varsize = code.substring(hasLen + 4, code.indexOf(')', hasLen)).trim();

    if (hasRange) {
        inrange = code.substring(left + 1, right).trim();
        let pos = inrange.indexOf(',');

        if (pos === -1) {
            start = '0';
            stop = inrange.trim();
        }
        else {
            let rangex = inrange.split(',');
            start = rangex[0].trim();
            stop = rangex[1].trim();

            if (rangex.length >= 3)
                step = rangex[2];
        }
        
        incode = 'in ' + start + '..' + stop;
        varstep = code.substr(0, code.indexOf(' in ')).trim();
    }
    else if (code.indexOf(' in ') > 0) {
        incode = code.substr(code.indexOf(' in ')).trim();
        //varstep = code.substr(0, code.indexOf(' in ')).trim();
    }
    return [ start, stop, step, varstep, varsize, incode ];
}

// doc:
const parseDoc = (indent, code) => {
    let sentence = `${indent}# ${code}\n`;
    if (code === '##')
        sentence = `${indent}##\n`;
    return sentence;
}

// use:
const parseUse = (code) => {
    let lib = code;
    if (code === 'sys')
        lib = '@sys';
    else if (code === 'api')
        lib = '@api';
    else if (code === 'cli')
        lib = '@cli';
    else if (code === 'mongodb')
        lib = '@mongodb';
    //else if (code === 'mariadb')
    //    lib = '@mariadb';
    //else if (code === 'sqlite')
    //    lib = '@sqlite';
    return `${lib}`;
}

// do:
const parseSub = (code) => {
    let method = null;
    let route = null;
    let name = null;
    let simple = null;
    let left = code.indexOf('(');
    let right = code.indexOf(')');

    if (code.trim().indexOf('get(') === 0)
        sub('get');
    else if (code.trim().indexOf('post(') === 0)
        sub('post');
    else if (code.trim().indexOf('put(') === 0)
        sub('put');
    else if (code.trim().indexOf('delete(') === 0)
        sub('delete');
    else if (code.trim().indexOf('head(') === 0)
        sub('head');

    return [ method, route, name, simple ];

    function sub (way) {
        method = way;
        route = code.substring(left + 1, right);
        name = code.substring(code.indexOf('=') + 1).trim();
        if (name)
            simple = `${name} ()`;
    }
}

// web: server, listen, handle, expose, socket, upload, fetch
const parseWeb = (code) => {
    let method = null;
    let handle = null;
    //let vary = null

    if (code.trim().indexOf('@server') === 0) {
        method = 'server'
        handle = code.substring(code.indexOf('=') + 1).trim();
    }
    else if (code.trim().indexOf('@listen') === 0) {
        method = 'listen'
        handle = code.substring(code.indexOf('=') + 1).trim();
    }
    else if (code.trim().indexOf('@handle') === 0) {
        method = 'handle'
        handle = code.substring(code.indexOf('=') + 1).trim();
    }
    else if (code.trim().indexOf('@routes') === 0) {
        method = 'routes'
        handle = code.substring(code.indexOf('=') + 1).trim();
    }

    return [ method, handle ];
}

// dbc:
const parseDBC = (code) => {
    let method = null;  // (code.indexOf('=') > 0) ? code.split('=')[0].trim() : null;
    let handle = null;
    let vary = null;

    if (code.trim().indexOf('@link') === 0) {
        method = 'link'
        handle = code.split('=')[1].trim();
    }
    else if (code.indexOf(':=') > 0) {
        let part = code.split(':=');
        handle = part[1].trim();
        vary = part[0].trim();
    }

    return [ method, handle, vary ];
}

const mapScript = (script) => {
    let lines = script.split('\n').filter(Boolean);
    if (lines.length === 0) return [];
    if (lines.length === 1) script.split('\r').filter(Boolean);
//lines.map( l => console.log('*=>', l) );
    let source = setPairs(lines);
//sentences.map( x => console.log('=>', x.key, x.code, x.line, x.indent, x.grade) );
    return source;
}

const transpileLines = (language, script, transpileLine) => {
    let source = mapScript(script);
    let target = '';
    let ok = global(language, source);
    
    if (!ok) {
        return '';
    }
    for (let i = 0; i < source.length; i++) {
        ok = rules(source[i]);
        if (ok) {
            target += transpileLine(source[i]);
        }
    }
    return target
}

