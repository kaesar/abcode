" Vim syntax file
" Language: ABCode
" Maintainer: ABCode Team
" Latest Revision: 2025

if exists("b:current_syntax")
  finish
endif

" Keywords (ABCode directives)
syn keyword abcodeDirective goal type fun if when else for do try fail use run pass var val set echo read save web dbc like form plug case each file
syn match abcodeDirectiveColon /\<\(goal\|type\|fun\|if\|when\|else\|for\|do\|try\|fail\|use\|run\|pass\|var\|val\|set\|echo\|read\|save\|web\|dbc\|like\|form\|plug\|case\|each\|file\):/

" Comments
syn match abcodeComment /#.*$/

" Strings
syn region abcodeString start=/"/ skip=/\\"/ end=/"/ contains=abcodeInterpolation
syn region abcodeString start=/'/ skip=/\\'/ end=/'/

" String interpolation
syn region abcodeInterpolation start=/{/ end=/}/ contained contains=abcodeVariable,abcodeFormat
syn match abcodeVariable /[a-zA-Z_][a-zA-Z0-9_]*/ contained
syn match abcodeFormat /:[^}]*/ contained

" Numbers
syn match abcodeNumber /\<\d\+\>/
syn match abcodeFloat /\<\d\+\.\d\+\>/

" Built-in functions
syn keyword abcodeBuiltin System.out.print System.out.println console.log print println puts fmt.Println

" Operators
syn match abcodeOperator /[=+\-*/%<>!&|]/
syn match abcodeOperator /[<>]=\?/
syn match abcodeOperator /[!=]=/
syn match abcodeOperator /&&\|||\|!/

" Delimiters
syn match abcodeDelimiter /[()[\]{}]/
syn match abcodeDelimiter /[,:;]/

" Identifiers
syn match abcodeIdentifier /\<[a-zA-Z_][a-zA-Z0-9_]*\>/

" Define highlighting
hi def link abcodeDirective Keyword
hi def link abcodeDirectiveColon Keyword
hi def link abcodeComment Comment
hi def link abcodeString String
hi def link abcodeInterpolation Special
hi def link abcodeVariable Identifier
hi def link abcodeFormat Type
hi def link abcodeNumber Number
hi def link abcodeFloat Float
hi def link abcodeBuiltin Function
hi def link abcodeOperator Operator
hi def link abcodeDelimiter Delimiter
hi def link abcodeIdentifier Normal

let b:current_syntax = "abcode"