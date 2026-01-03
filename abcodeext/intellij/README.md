# ABCode Plugin for IntelliJ IDEA

This plugin provides syntax highlighting and language support for ABCode programming language (`.abc` files) in IntelliJ IDEA.

## Installation

### Method 1: Manual Installation (Recommended)

1. **Build the plugin:**
   ```bash
   cd plug/intellij-plugin
   ./gradlew buildPlugin
   ```

2. **Install in IntelliJ IDEA:**
   - Open IntelliJ IDEA
   - Go to `File` → `Settings` (Windows/Linux) or `IntelliJ IDEA` → `Preferences` (macOS)
   - Navigate to `Plugins`
   - Click the gear icon ⚙️ and select `Install Plugin from Disk...`
   - Browse to `plug/intellij-plugin/build/distributions/` and select the generated `.zip` file
   - Click `OK` and restart IntelliJ IDEA

### Method 2: Development Mode

1. **Open the plugin project:**
   - Open IntelliJ IDEA
   - Select `File` → `Open` and choose the `plug/intellij-plugin` directory
   - Wait for Gradle to sync

2. **Run the plugin:**
   - In the Gradle tool window, navigate to `Tasks` → `intellij` → `runIde`
   - This will launch a new IntelliJ IDEA instance with the plugin loaded

## Usage

### Creating ABCode Files

1. **New File:**
   - Right-click in the Project Explorer
   - Select `New` → `File`
   - Name your file with `.abc` extension (e.g., `hello.abc`)

2. **File Recognition:**
   - The plugin automatically recognizes `.abc` files
   - ABCode icon appears next to `.abc` files in the project tree
   - Syntax highlighting is applied automatically

### Writing ABCode

The plugin supports syntax highlighting for ABCode language constructs:

```abcode
goal: any
#type: Hello

fun: myFunction()
  echo: "Hello there!"
  like: System.out.print("Hola mundo") #in: java

run: myFunction()
```

### Features

- **Syntax Highlighting:** Keywords, strings, comments, and language constructs
- **File Type Recognition:** Automatic detection of `.abc` files
- **Icon Support:** Custom ABCode file icons in project explorer

### Supported Keywords

The plugin highlights these ABCode language elements:
- `goal`, `fun`, `run`, `echo`, `like`
- `#type`, `#in` (comments/directives)
- String literals in quotes
- Function definitions and calls

## Compiling ABCode Files

While the plugin provides editing support, you'll need the ABCode compiler to run your code:

1. **Using the compiler:**
   ```bash
   ./abcodec -s your-file.abc
   ```

2. **Integration with IntelliJ:**
   - You can set up external tools to compile ABCode files
   - Go to `File` → `Settings` → `Tools` → `External Tools`
   - Add a new tool with the ABCode compiler path

## Troubleshooting

### Plugin Not Loading
- Ensure IntelliJ IDEA version is 2022.1 or later
- Check that the plugin was installed correctly
- Restart IntelliJ IDEA after installation

### Syntax Highlighting Not Working
- Verify the file has `.abc` extension
- Check that the ABCode plugin is enabled in `Settings` → `Plugins`
- Try closing and reopening the file

### Building Issues
- Ensure you have Java 11+ installed
- Make sure Gradle wrapper has execute permissions: `chmod +x gradlew`

## Development

To contribute to the plugin:

1. **Setup:**
   ```bash
   cd plug/intellij-plugin
   ./gradlew build
   ```

2. **Testing:**
   ```bash
   ./gradlew test
   ```

3. **Running:**
   ```bash
   ./gradlew runIde
   ```

## Requirements

- IntelliJ IDEA 2022.1 or later
- Java 17 or later (for building the plugin)
- ABCode compiler (for running `.abc` files)

---
© 2026 by César Andres Arcila Buitrago