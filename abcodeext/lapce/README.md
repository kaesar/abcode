# ABCode Language Support for Lapce

Syntax highlighting plugin for ABCode programming language (.abc files) in Lapce editor.

## Features

- Tree-sitter based syntax highlighting
- ABCode directives highlighting (goal:, fun:, if:, etc.)
- String interpolation with `{variable:format}` syntax
- Comment highlighting with `#`
- Number and function highlighting
- 2-space indentation

## Installation

### Method 1: Lapce Native Plugin
1. Copy this folder to your Lapce plugins directory:
   - macOS: `~/.local/share/lapce-stable/plugins/`
   - Linux: `~/.local/share/lapce-stable/plugins/`
   - Windows: `%APPDATA%\lapce-stable\plugins\`

2. Restart Lapce

### Method 2: VSCode Extension Compatibility
Lapce can also use VSCode extensions directly:

1. Install the VSCode ABCode extension in Lapce
2. Go to Settings → Extensions → Install from VSIX
3. Select the VSCode extension package

## Usage

Create a file with `.abc` extension:

```abcode
goal: node

fun: hello name:string
    echo: "Hello {name}!"

var: message = "World"
run: hello(message)
```

## Plugin Structure

- `volt.toml` - Plugin manifest (Lapce format)
- `grammar.js` - Tree-sitter grammar definition
- `queries/highlights.scm` - Syntax highlighting queries
- Compatible with VSCode extension format

## VSCode Compatibility

Lapce supports VSCode extensions, so you can also use:
- The VSCode ABCode extension directly
- Same TextMate grammar files
- Same language configuration

---
© 2026 by César Andres Arcila Buitrago