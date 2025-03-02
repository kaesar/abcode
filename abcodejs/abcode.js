// © 2021-2025 by César Andres Arcila Buitrago

const sentences = [];
const words = ['fun:','if:','when:','else:','for:','sub:','try:','fail:','use:','run:','send:','var:','let:','set:','type:','echo:','read:','save:','web:','dbc:','make:','form:','plug:','case:','each:'];  // 'echo:puts','plug:play','make:show','fix','pair'?
//const breaks = ['fun:','if:','when:','else:','for:','sub:','try:','fail:','case:','each:'];
let isMainModule = false;

// Built-in matches (routines)
const routines = [
    { name: 'len',      match: { py: 'len',              js: '.lenght',       kt: '.size',            go: '' }, native: true },
    { name: 'str',      match: { py: 'str',              js: '.toString()',   kt: '.toString()',      go: '' }, native: true },
    { name: 'int',      match: { py: 'int',              js: 'parseInt',      kt: '.toInt()',         go: '' }, native: true },
    { name: 'float',    match: { py: 'float',            js: 'parseFloat',    kt: '.toDouble()',      go: '' }, native: true },
    { name: 'list',     match: { py: 'list',             js: 'new Array',     kt: 'mutableListOf',    go: '' }, native: true },
    { name: 'dict',     match: { py: 'dict',             js: 'new Object',    kt: '',                 go: '' }, native: true },
    { name: 'pow',      match: { py: 'pow',              js: 'Math.pow',      kt: '',                 go: '' }, native: true },
    { name: 'chr',      match: { py: 'chr',              js: 'String.char',   kt: '',                 go: '' }, native: true },

    { name: '.find',    match: { py: '.find',            js: '.indexOf',      kt: '.indexOf',         go: '' }, same: true },
    { name: '.upper',   match: { py: '.upper',           js: '.toUpperCase',  kt: '.uppercase',       go: '' }, same: true },
    { name: '.lower',   match: { py: '.lower',           js: '.toLowerCase',  kt: '.lowercase',       go: '' }, same: true },
    { name: '.strip',   match: { py: '.strip',           js: '.trim',         kt: '.trim',            go: '' }, same: true },
    { name: '.append',  match: { py: '.append',          js: '.push',         kt: '.add',             go: '' }, same: true },
    { name: '.remove',  match: { py: '.remove',          js: '.pop',          kt: '.remove',          go: '' }, same: true },
    { name: '.insert',  match: { py: '.insert',          js: '.splice',       kt: '',                 go: '' }, same: true },
    { name: '.pop',     match: { py: '.pop',             js: '.pop',          kt: '',                 go: '' }, same: true },
    { name: '.sort',    match: { py: '.sort',            js: '.sort',         kt: '.sortBy',          go: '' }, same: true },
    { name: '.split',   match: { py: '.split',           js: '.split',        kt: '.split',           go: '' }, same: true },

    { name: 'replace',  match: { py: '.replace',         js: 'abc.replace',   kt: '.replace',         go: '' }, abc: true },
    { name: 'count',    match: { py: 'abc.count',        js: '',              kt: '',                 go: '' }, abc: true },
    { name: 'join',     match: { py: 'abc.join',         js: '.join',         kt: '',                 go: '' }, abc: true },
    { name: 'slice',    match: { py: 'abc.slice',        js: '.slice',        kt: '',                 go: '' }, abc: true },
    { name: 'jsonload', match: { py: 'json.loads',       js: 'JSON.parse',    kt: 'abc.jsonEncode',   go: '' }, abc: true },  // Json.encodeToString
    { name: 'jsondump', match: { py: 'json.dumps',       js: 'JSON.stringify',kt: 'abc.jsonDecode',   go: '' }, abc: true },  // Json.decodeFromString
    { name: 'datetime', match: { py: 'datetime.datetime',js: 'new Date',      kt: 'LocalDateTime.now',go: '' }, abc: true },
    { name: 'monthend', match: { py: '',                 js: '',              kt: '',                 go: '' }, abc: true },
    { name: 'monthname',match: { py: '',                 js: '',              kt: '',                 go: '' }, abc: true },

    { name: '', match: { py: '', js: '', kt: '', go: '' } }
];

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
    let hasKind = false;
    for (let i = 0; i < source.length; i++) {
        let item = source[i].key; 
        if (item === 'kind')
            hastype = true;
    }

    if (lang === 'C#' && !hasKind) {
        console.error('ERROR => missing class for C# program');
        return false;
    }

    return true;
}

const rules = (item) => {
    if (item.grade * 2 != item.indent)
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
    if (name.indexOf(':') > 0) {
        let x = name.split(':');
        name = x[0].trim();
        kind = x[1].trim();
    }
    return [name, kind, value];
}

// fun:
const parseFun = (code) => {
    let left = code.indexOf('(');
    let right = code.indexOf(')');
    let name = code.substr(0, left).trim();
    let kind = 'void';
    if (code.indexOf('):') > -1)
        kind = code.substring(code.indexOf('):') + 2).trim();
    let spec = null;
    let pos = code.indexOf(' async', right);
    if (pos > -1) {
        spec = code.substr(pos + 1).trim();  // + 4
        if (kind != 'void')
            kind = kind.substring(0, kind.indexOf(' async'));
    }
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

// sub:
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

    if (code.trim().indexOf(':server') === 0) {
        method = 'server'
        handle = code.substring(code.indexOf('=') + 1).trim();
    }
    else if (code.trim().indexOf(':listen') === 0) {
        method = 'listen'
        handle = code.substring(code.indexOf('=') + 1).trim();
    }
    else if (code.trim().indexOf(':handle') === 0) {
        method = 'handle'
        handle = code.substring(code.indexOf('=') + 1).trim();
    }
    else if (code.trim().indexOf(':routes') === 0) {
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

    if (code.trim().indexOf(':link') === 0) {
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

