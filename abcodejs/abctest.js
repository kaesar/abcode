// © 2021-2025 by César Andres Arcila Buitrago

const fs = require('fs')
const path = require('path')
const abcodec = require('../run/abcodec')

function test() {
    let source = path.join(__dirname, '../abc/hello.abc')
    let script = fs.readFileSync(source)?.toString()
    abcodec.start(script)
}

test()
