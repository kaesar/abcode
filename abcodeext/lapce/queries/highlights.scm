; Comments
(comment) @comment

; ABCode directives
(directive
  name: (identifier) @keyword
  ":" @punctuation.delimiter)

; Strings
(string) @string
(string_interpolation
  "{" @punctuation.special
  "}" @punctuation.special) @variable

; Numbers
(number) @constant.numeric

; Functions
(function_call
  name: (identifier) @function.call)

; Built-in functions
((identifier) @function.builtin
 (#match? @function.builtin "^(System\\.out\\.print|System\\.out\\.println|console\\.log|print|println|puts|fmt\\.Println)$"))

; Operators
["=" "+" "-" "*" "/" "%" "&&" "||" "!" "<" ">" "<=" ">=" "==" "!="] @operator

; Punctuation
["(" ")" "[" "]" "{" "}"] @punctuation.bracket
["," ";" ":"] @punctuation.delimiter

; Variables
(identifier) @variable