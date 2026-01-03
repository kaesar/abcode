# ABCode Ace Editor Mode

Syntax highlighting mode for ABCode language in Ace Editor.

## Installation

1. Include the mode file in your project:
```html
<script src="path/to/abcode-mode.js"></script>
```

> `path/to/` meaning the location of `abcode-mode.js` file

2. Set the editor mode:
```javascript
const editor = ace.edit("editor");
editor.session.setMode("ace/mode/abcode");
```

## Syntax Highlighting

The mode provides highlighting for:

- **Keywords**: `goal:`, `fun:`, `echo:`, `like:`, `run:`, etc.
- **Comments**: Lines starting with `#`
- **Strings**: Text in quotes `"hello"` or `'world'`
- **Numbers**: Integer and decimal values
- **Functions**: Common output functions like `System.out.print`, `console.log`

## ABCode Example

```abcode
goal: any
#type: Hello

fun: myFunction()
  echo: "Hello there!"
  like: System.out.print("Hola mundo") #in: java

run: myFunction()
```

## Integration

Works with any Ace Editor setup. Perfect for ABCode web IDEs and online compilers.

---
© 2026 by César Andres Arcila Buitrago