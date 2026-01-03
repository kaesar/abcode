# ABCode Vim Plugin

Syntax highlighting and indentation support for ABCode programming language (.abc files) in Vim/Neovim.

## Features

- Syntax highlighting for ABCode directives (goal:, fun:, if:, etc.)
- String interpolation highlighting with `{variable:format}` syntax
- Comment highlighting with `#`
- Number and function highlighting
- Auto-indentation with 2 spaces
- Filetype detection for `.abc` files

## Installation

### Method 1: Manual Installation
```bash
# Copy to Vim runtime directory
cp -r vim-plugin/* ~/.vim/

# Or for Neovim
cp -r vim-plugin/* ~/.config/nvim/
```

### Method 2: Using vim-plug
Add to your `.vimrc` or `init.vim`:
```vim
Plug 'path/to/abcode-vim-plugin'
```

### Method 3: Using Vundle
Add to your `.vimrc`:
```vim
Plugin 'path/to/abcode-vim-plugin'
```

## Usage

Create a file with `.abc` extension and Vim will automatically:
- Detect the filetype as `abcode`
- Apply syntax highlighting
- Set proper indentation (2 spaces)

```abcode
goal: node

fun: hello name:string
    echo: "Hello {name}!"

var: message = "World"
run: hello(message)
```

## Manual Configuration

Add to your `.vimrc` for additional settings:
```vim
" ABCode specific settings
autocmd FileType abcode setlocal commentstring=#\ %s
autocmd FileType abcode setlocal shiftwidth=2
autocmd FileType abcode setlocal tabstop=2
autocmd FileType abcode setlocal expandtab
```

## Plugin Structure

- `syntax/abcode.vim` - Syntax highlighting rules
- `ftdetect/abcode.vim` - Filetype detection
- `indent/abcode.vim` - Auto-indentation rules

---
© 2026 by César Andres Arcila Buitrago