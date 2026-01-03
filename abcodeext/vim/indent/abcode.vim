" Vim indent file
" Language: ABCode
" Maintainer: ABCode Team

if exists("b:did_indent")
  finish
endif
let b:did_indent = 1

setlocal indentexpr=GetABCodeIndent()
setlocal indentkeys=o,O,*<Return>,<>>,{,},:
setlocal autoindent
setlocal smartindent
setlocal shiftwidth=2
setlocal tabstop=2
setlocal softtabstop=2
setlocal expandtab

function! GetABCodeIndent()
  let line = getline(v:lnum)
  let prevline = getline(v:lnum - 1)
  
  " Don't indent comments
  if line =~ '^\s*#'
    return indent(v:lnum - 1)
  endif
  
  " Increase indent after directive lines
  if prevline =~ '^\s*\(goal\|type\|fun\|if\|when\|else\|for\|do\|try\|fail\|use\):'
    return indent(v:lnum - 1) + &shiftwidth
  endif
  
  " Decrease indent for else/when
  if line =~ '^\s*\(else\|when\):'
    return indent(v:lnum - 1) - &shiftwidth
  endif
  
  " Default: same as previous line
  return indent(v:lnum - 1)
endfunction