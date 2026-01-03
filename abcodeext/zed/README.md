# ABCode Language Support for Zed

Syntax highlighting extension for ABCode programming language (.abc files) in Zed editor.

## Features

- Syntax highlighting for ABCode directives (goal:, fun:, if:, etc.)
- String interpolation support with `{variable:format}` syntax
- Comment highlighting with `#`
- Number and function highlighting
- Auto-closing pairs for brackets and quotes
- Proper indentation with 2 spaces

## Installation

1. Copy this folder to your Zed extensions directory:
   - macOS: `~/.config/zed/extensions/`
   - Linux: `~/.config/zed/extensions/`

2. Restart Zed

3. Open any `.abc` file to see syntax highlighting

## Usage

Create a file with `.abc` extension:

```abcode
goal: node

fun: hello name:string
    echo: "Hello {name}!"

var: message = "World"
run: hello(message)
```

## Zed Extension Structure

- `extension.json` - Extension manifest
- `languages/abcode.json` - Language configuration
- `grammars/abcode.json` - Syntax highlighting rules

---
© 2026 by César Andres Arcila Buitrago