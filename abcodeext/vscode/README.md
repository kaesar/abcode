# ABCode Language Support for VSCode

Syntax highlighting extension for ABCode programming language (.abc files).

## Features

- Syntax highlighting for ABCode directives (goal:, fun:, if:, etc.)
- String interpolation support with `{variable}` syntax
- Comment highlighting with `#`
- Number and function highlighting
- Auto-closing pairs for brackets and quotes

## Installation

1. Copy this folder to your VSCode extensions directory:
   - Windows: `%USERPROFILE%\.vscode\extensions\`
   - macOS: `~/.vscode/extensions/`
   - Linux: `~/.vscode/extensions/`

2. Restart VSCode

3. Open any `.abc` file to see syntax highlighting

## Usage

Create a file with `.abc` extension and start coding in ABCode:

```abcode
goal: node

fun: hello name:string
    echo: "Hello {name}!"

var: message = "World"
run: hello(message)
```

---
© 2026 by César Andres Arcila Buitrago