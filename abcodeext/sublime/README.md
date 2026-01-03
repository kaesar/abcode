# ABCode Language Support for Sublime Text

Syntax highlighting package for ABCode programming language (.abc files) in Sublime Text.

## Features

- Syntax highlighting for ABCode directives (goal:, fun:, if:, etc.)
- String interpolation support with `{variable}` syntax
- Comment highlighting with `#`
- Number and function highlighting
- Auto-completion triggers for directives
- Proper indentation with 2 spaces
- Comment toggling with Ctrl+/

## Installation

### Method 1: Manual Installation
1. Copy this folder to your Sublime Text packages directory:
   - Windows: `%APPDATA%\Sublime Text\Packages\ABCode\`
   - macOS: `~/Library/Application Support/Sublime Text/Packages/ABCode/`
   - Linux: `~/.config/sublime-text/Packages/ABCode/`

2. Restart Sublime Text

### Method 2: Package Control (if published)
1. Open Command Palette (Ctrl+Shift+P)
2. Type "Package Control: Install Package"
3. Search for "ABCode"
4. Install

## Usage

Create a file with `.abc` extension:

```abcode
goal: node

fun: hello name:string
    echo: "Hello {name}!"

var: message = "World"
run: hello(message)
```

## Files Structure

- `ABCode.sublime-syntax` - Main syntax definition (YAML format)
- `ABCode.sublime-settings` - Language preferences
- `Comments.tmPreferences` - Comment configuration
- `Indentation Rules.tmPreferences` - Auto-indentation rules

---
© 2026 by César Andres Arcila Buitrago