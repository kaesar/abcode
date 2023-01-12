# ABCode Programming Language - Version 1 (Preview/Alpha)

> Mitigating the Software Tower of Babel to a great degree  
> **EXPERIMENTAL**

![](./img/abcode-logo.png)

![](./img/onmind22-abcode.gif)

Before I talk about a new specification and programming language **ABCode**, let me tell you a little experience about the platform I am the author of, whose name is [**OnMind**](https://onmind.co)...

> Noting certain abilities to interact with different programming languages (as if I were a computer polyglot) it occurred to me to look for a way to achieve an abstract language for the component that takes care of what happens on the server (**backend**), accompanying a database manager ([**OnMind-XDB**](https://onmind.co/doc/code/en/OnMind-XDB)) that I also made along with my own platform [**OnMind**](https://onmind.co). So I decided to create a language specification that would convert the code to another language of interest. Finally, the programming language [`ABCode`](https://onmind.co/doc/code/en/ABCode.md) was born.

Indeed I found similar ideas but it required something different and as I have emphasized: "abstract". Then it occurred to me to combine [**YAML**](https://onmind.co/doc/code/en/YAML.md) (a markup language for data) and [**Python**](https://onmind.co/doc/code/en/Python.md) (with a restricted syntax), where each line starts with an attribute (distinguished by ending with a colon `:`) that indents every two spaces (according to [**YAML**](https://onmind.co/doc/code/en/YAML.md)), the rest of the line could be code. I validated the idea of this programming language with a great friend and colleague, he found it interesting, enthusiastic, and at the time expressed that he wanted to learn and even collaborate.
<!--What do you think?-->

<as-video url="https://www.youtube.com/embed/GuPJzq43FbY"></as-video>

> As a curious fact, before thinking about [`YAML`](https://onmind.co/doc/code/en/YAML.md), the idea was originally conceived using as code editor a spreadsheet and its layout by columns (as an indentation), applying color to the cells with sentences.

## What is ABCode?

> A language for many and a specification as a bridge.

It is a specification and interpreted programming language (created by Cesar A. Arcila) that combines the style of a markup language like [`YAML`](https://onmind.co/doc/code/en/YAML.md) with [`Python`](https://onmind.co/doc/code/en/Python.md) and some [`Javascript`](https://onmind.co/doc/code/en/Javascript.md), under the premise of being abstract and with an initial focus on server-side code, in order to generate (transpile) mainly [`Javascript`](https://onmind.co/doc/code/en/Javascript.md) and [`Python`](https://onmind.co/doc/code/en/Python.md) code, plus some other experimental language.

`ABCode` supposes an additional layer to interact with different programming languages looking for a unifying or conciliatory sense, perhaps reducing it to two dialects with the same root.

The initial strategy of `ABCode` is oriented where `Javascript` and `Python` operates, mainly in the **Backend**, that is, in the portability, replacing the last layer of code or persistence (database access).

In other words and in principle, you can associate `ABCode` with....

> more internal logic (or persistence logic)  
> whose functions compose a **Backend**  
> embedded and portable mode (also **script** mode)  
> being invoked by another language or environment (or by itself)

Each line of code starts with a reserved word or defined statement that would correspond to an attribute in [`YAML`](https://onmind.co/doc/code/en/YAML.md) with indentation, the rest of the line could be code close to [`Python`](https://onmind.co/doc/code/en/Python.md) and [`Javascript`](https://onmind.co/doc/code/en/Javascript.md).
<!--In sophisticated terms but simplifying:

> `ABCode` = `YAML` + `Python-Like` (also aliased `ABCode:py`)  
> `ABCode:js` = `YAML` + `Javascript-Like` (for the visual aspect)

![](./img/abcode-plus.png)

> Think simply of two dialects with the same root, the difference basically consists in the functions used when targeting the browser (for **frontend**).-->

**INDICATION**: In the world of web application development using the Internet, the word **Backend** is used for what is behind the network (on a server), and with the word **Frontend** we refer to the visual aspect that the user sees, this can be seen in the browser or on a mobile device (example: native mobile development). `ABCode` starts with emphasis on the server and proposes a conciliatory path for the browser (dominated by the **Javascript** language).

### Language considerations

> Multi-paradigm, multi-environment, multi-platform, multi-language translation.

- `ABCode` is synonymous with the portability of your code.  
- `ABCode` focuses in principle on server-side code (**backend**) combining [`YAML`](https://onmind.co/doc/code/en/YAML.md) with [`Python`](https://onmind.co/doc/code/en/Python.md) and some [`Javascript`](https://onmind.co/doc/code/en/Javascript.md), using a restricted syntax of these languages.
- `ABCode` is intended to be easy to learn by being close to an algorithm. You can also make an agile transition when coming from a language like `Python`. On the other hand, `YAML` is an expressive and human-readable markup language, so `ABCode` is too. It may be advisable to check the `YAML` reference before starting but it is also not required.
- `ABCode` is synonymous with the portability of your code.  
- The `ABCode` language supports the [**OnMind Method**](https://onmind.co/web/blog/es/fundamentals.md) of the same author.
- `ABCode` can alternatively function as a specification in which `YAML` is combined with another language (other than `Python`). This would seek to keep readability even if the implementation is specific to one language and not to many, and it also achieves customization when a technology requires the potential of a particular programming language.
- It can be thought of in the future as a translator or bridge between programming languages, environments and platforms, or multi-language, multi-environment and multi-platform, perhaps multi-purpose or multi-paradigm.
- Modernization and innovation often involve technology migration, projects that can take years. With the use of `ABCode` the impact may be less, having the potential to facilitate the change between technologies (in principle, on the server side).
- A great potential of this language can be found in projects with mixed technologies, allowing to add an abstract layer with a unifying sense. An application case is what is known as smart cities (**Smart Cities**), as well as for the operation with servers in the cloud (**DevOps**), or when thinking of incorporating machine learning (**Machine Learning**) with management software using a uniform semantics, or failing that, with a similar style for reading the work team. Perhaps we have the basis to explore in the future the case of the visual aspect (**frontend**).
- Other languages would be in mind and may be introduced gradually on an experimental basis, but the goal is to keep mainly 2 or 3 official targets, i.e. `Python` and `Deno`, plus `ABCode:js` (the `ABCode` for the browser in `Javascript`). Already starting and preparing targets for experimental environments such as `Deno`, `Nodejs`, `Kotlin`, `Dart`, `Lua`, `Java`, `Ruby`, `Nim`, `Go`, `Swift` and `C#`.

> **Python** is also a specification, which is why you can find projects that support this language. The above suggests that, for environments or experimental languages and as long as `ABCode` code in `Python` is achieved, the interested party can refer to the respective projects (`GraalVM`, `IronPython`, etc.).

### What other language for?

> Thinking about business logic code portability

I think the reason has been stated between the previous lines, but we can emphasize that it is sought to mitigate something... because of: **"the tower of Babel of Software "**.

It is also understood that the idea has originated from requiring a level of abstraction or layer for a technology that also used components with generic orientation (the [**OnMind**](onmind.co) database and platform), in addition to supporting the [**OnMind Method**](https://onmind.co/web/blog/es/fundamentals.md). Surely others can identify a similar need as well as interest in something **multiplatform**, or perhaps observe the fatigue of the commercial and community battle over the best language or technology.

Personally, I would have to tell another part of the story. The platform I authored was built with `Javacript` and `Kotlin`. I then identified that if I were to involve **Machine Learning**, even **DevOps**, it would be great to learn `Python`. So I thought it might be useful to learn other languages and improve my skills in them by applying `ABCode`, and what was coded in [**OnMind**](onmind.co) could be left in `Javascript` and `Kotlin` respectively, being the new stuff introduced with `ABCode` (until it comes to replace `Javascript` in **Backend**). Thus, in [**OnMind**](onmind.co) `Kotlin` and `ABCode` (in **Backend**) would be used to complement projects and target environments, **oriented as a cross-platform technology**.

### How do you pronounce it?

The first two letters ("ab") are spelled with their English pronunciation, when you get to the "c" you say the word "code". And by the way, it is encouraged to write it with the first three letters capitalized.

### ABCode programming language vs. natural language

In a general and spontaneous sense, a natural language can be seen as an agreement that comes to be accepted to communicate, express or indicate something. `ABCode` usually uses English words of 3 or 4 letters. Knowing its meaning can give us an understanding of this language, i.e. what a computer would be told to do.

## Essential example

```yaml
echo: "Hello World!"
```

> This program in `ABCode` prints a greeting on the screen using `echo:`. Keep in mind that, in principle, each logic instruction in `ABCode` would correspond to one line of code.

A more complete variation would be for example:

```yaml
fun: hello()
  echo: "Hello World!"

run: hello()
```

> Note that in this case `echo:` is derived from or belongs to `fun:` (which we will see moving forward) and this is why two spaces are left as indentation.

## Essential language tips

For those who have skills, programming expertise and/or require agility in technical concepts, the following **essential language tips** can be summarized:

1. Basic **data types**: `int`, `float`, `boolean`, `string`, `array`, `object`, `any`. Variables are defined by starting with the `var:` attribute, the variable name, a colon again (`:`), the data type and a value can be assigned. The indication of the data type can be omitted when it is a basic or generic one.
2. The **functions** are defined or start with the `fun:` attribute to the function name, then the parameters are enclosed in parentheses `(...)`, continuing with the parameter name, the `:` character separating the data type afterwards (and separating the parameters with comma `,`). The data type to return is also followed by `:`. In addition, `send:` is used to return a value. The main function of a program is called `main` (`fun: main()`).
3. For the **block** of the function or control flow, the `YAML` indentation is used and each line of a block corresponds to a statement with an attribute, i.e. the lines start with a `YAML` attribute corresponding to the language specification. Neither the brackets of other languages nor the semicolon are applied, so the indentation of the code becomes more important for readability and impact.
4. The **control flow** varies with respect to languages such as `C`, `Java`, `Javascript`, `Kotlin`, but you find an equivalent form for the use of `if` and `for`, even for exception handling (`try`), whose keywords must be followed by the `:` character.
5. The **constructor** of a class is expressed with the `fun:` attribute and the `new` value (`fun: new()`) and the class is defined with the `type:` attribute.
6. The **data structures** are defined with the `set:` attribute followed by the name and applying `YAML` on the associated attributes. However, when using `YAML` and `Python`, the use of **JSON** is practically native, understanding that it is not a natural type or structure of the language.

> The declaration of variables and functions presents a variation with respect to `Python`. `ABCode` handles generic data types to keep compatibility with other languages, so it is a typed language. However, you can omit the data type indication in the variable declaration when initializing a value with a basic or generic type.

## Basic data types

Since programming is associated with information, data is typed to identify whether it is a text, number or other type. The following data types can be cited.

Type | Description
-- | --
string | Character string or text
int | Iteger number
float | Floating number (with decimals)
boolean | Boolean (True/False)
array | Array or vector, represented as square brackets **[]**
object | Object, represented as curly brackets **{}**
any | For cases where multiple types may apply (dynamic)
void | Empty (for methods or functions)

> Several of these data types are inspired by `Typescript`, except that `int` and `float` are used for numbers and there is no `number`.

## Variables

Remembering that the variable is like data to be held (in memory), you can express a variable by assigning a value with the equals operator (`=`). Each time the variable is mentioned or used later, it must appear with the same original name (respecting upper and lower case). However, the convention for declaring variables starts the line with `var:` or `let:` (the latter for constant or immutable values), the variable name, colon again (`:`) the data type, then a value can be assigned (with `=`). The indication of the data type can be omitted in the variable declaration when it is a basic or generic one.

Example:

```yaml
  var: variable = "Ana"
  var: i = 0
  let: list = [10, 20, 30]
  echo: variable
```

> `echo:` is a statement that comes in the language to display something on the screen (in this case it prints the value of the variable). In a language like `Python` you would use `printer()`.

In computer programming variables have a data type that indicates the nature of the content, for example, if a variable contains a text (`string`) or if it is an integer (`int`) or float (`float`), even if it is a true or false value (`boolean`) or a list (`array`). Let's see the example indicating the data type.

```yaml
  var: variable:string = "Ana"
  var: i:int = 0
  let: list:array = [10, 20, 30]
```

If you prefer the `Python` style, you can use the simple functions to set the data type with `str()`, `int()`, `float()`, `bool()`, `list()`.

```yaml
  var: variable = str()
  var: i = int()
  var: f = float()
  var: imagine = bool()
  let: list = list()
```

> Instead, it could be assigned respectively `""`, `0`, `0.0`, `False`, `[]`. However, the data type is required for compatibility with certain languages.

## Functions

Functions perform something or define a series of instructions that fulfill a purpose, that is, they are logically related in well-defined blocks as they are organized. In the case of `ABCode`, `fun:` is prefixed to the function name, then the parameters are enclosed in parentheses `(...)`, followed by the parameter name, the `:` character separating the data type afterwards (and separating the parameters with a comma `,`). The data type to return is also followed by `:`. Here is an example.

```yaml
fun: myFunction()
  echo: "Hi there!"

run: myFunction()
```

> Who knows `Python` can observe that the reserved word `def` is omitted being unnecessary when using `fun:`. Also, in this case it does not require returning a data type (although `:void` could be used at the end of the function declaration).  
> The `run:` is used to invoke operations, functions or statements. In most languages something like `run:` is not prepended to operations or statements, these being the common lines, but here an attribute is required to preserve the `YAML` style.

Let's look at another example.

```yaml
fun: sayMyName(name:string):string
  send: name

echo: sayMyName("Andrey")
```

> In this case `send` is used to return the value contained in the variable (which in other languages is usually `return`).  

If you are just starting out with computer programming, you may not want to distinguish certain aspects of functions. But if you already have some knowledge, it is good to clarify that the functions in `ABCode` are public in nature. To indicate that a function is private, in the context of a given class, the sign `@` must be prefixed to the name, for example: `@sayMyName`.

## Language operators

Mainly, operators are those that allow us to perform operations, although there are also those that allow us to evaluate something (based on tautology or truth table). With operators, two expressions or numbers can be added together, as well as the other mathematical operations. This is also associated with the essential algebra that refers to functions and variables. On the other hand, in the operators that allow you to evaluate something, you can compare or determine if two values are different, or define complex conditions (and, or, or, not).

Let's look at the language operators below.

Operator | Description
-- | --
`=` | equals (assignment)
`+` | addition
`-` | subtraction
`*` | multiplication
`/` | division
`%` | modulus of a division
`+=` | increment
`-=` | decrement
`==` | exact comparison (equal to)
`!=` | difference comparison (different from)
`>` | greater than
`<` | less than
`>=` | greater than or equal to
`<=` | less than or equal to
`&&` | and (also: and)
`||` | or (also: or)
`!` | not, negation (also: not)
`@` | replacement for `self` or `this` for use of class properties in other languages, also indicates whether a function is private in the context of a class.
<!--`+:` | string or text concatenation. reserved for compatibility with `PHP`, otherwise `+` or a function (`concat`) may be used-->

> Although `ABCode` accepts the logical operators `and`, `or` and `not` from `Python`, it promotes instead `&&`, `||` and `!` in favor of `ABCode:js` and several languages.  
> A distinction must be made between the `@:` attribute (used as a decorator) and the use of `@` in classes. It may be questioned whether it is an operator or not, in this case it operates for reference in classes (which is an advanced topic).  

### Remembering truth tables with operators

The operators of inclusion `and` (also: `&&`) and of option `or` (also: `||`) have incidence in the evaluation of a condition in a program. We start from the following table, where `p` is the first variable and the second is `q`, and `True` and `False` are used to indicate whether it is true or false (respectively).

p | q | p `and` q | p `or` q
-- | -- | -- | --
True | True | True | True | True | True
True | False | False | True | True
False | True | False | False | True
False | False | False | False | False | False

> If a variable or expression is negated with `not` (also: `!`) then its value is inverted: if it is true it is interpreted as false and if it is false it is interpreted as true.

## Conditional if / when (else)

The conditions allow you to determine the validation points in the logic you propose. For example, imagine that you are going to buy a drink for someone who ordered it for you and you have some possible scenarios in case the originally ordered drink is not found.

You use `if:` to establish a validation point with a condition and `when: no`, or simply `else:`, when something is not fulfilled. Let's look at an example.

```yaml
  let: i = 1
  if: i == 1
    echo: "coffee"
  when: no
    echo: "tea"
```

> When `when: no` or `else:` correspond to what would happen when a condition is not met and should always be left as the last condition, indicating what happens otherwise.

You use `when:` with a condition (which would be like `else if` in other languages) to evaluate other given conditions. Let's see the following example.

```yaml
  let: i = 3
  if: i == 1
    echo: "coffee"
  when: i == 2
    echo: "tea"
  else:
    echo: "aha"
```

> Note that double equals (`==`) is used as a comparison operator, distinguishing it from assignment which naturally uses an equals sign (`=`). In that order of ideas, to evaluate different values (negative comparison) the exclamation point and an equals sign (`!=`) would be used.  

There may be scenarios in which no alternative is evaluated, i.e. a simple condition (`if:`). For example:

```yaml
  let: i = 2
  if: i == 1
    echo: "coffee"
```

## The For Cycle

Cycles refer to instructions that repeat or where some iterations take place. Keep in mind that the `for:` line usually includes `in`, see below.

```yaml
  var: names = ["Ana", "Alex", "Janeth"]
  for: x in names
    echo: x
    if: x == "Alex"
      run: break
```

> Note that the variable `names` is a list of text values (also known as arrays) whose convention uses square brackets `[]` separating each value by a comma. When using `break` the loop is interrupted, since it is under a condition the names would be printed until the condition is met (therefore *Janeth* would not be printed).

You can use the `range` function to traverse a range, even combine it with `len` which gets the size of an array. Let's look at a couple of examples:

```yaml
  for: i in range(10)
    echo: i

  var: n = [10, 20, 30, 40] 
  for: i in range(len(n))
    echo: n[i]
```

> In these cases the loop is terminated when the stop is reached (by subtracting 1). `range` can also be used two parameters indicating the first the start and the second the stop. Its third way of being called is with a third parameter that would indicate an increment (in case it is different from 1).

A third variation would be including a condition and avoiding the use of `in`, that is, without `in` it would be interpreted as `while` in other languages. Let's look at the example:

```yaml
  var: i = 0
  for: i < 10
    run: i += 1
    echo: i
```

> Note that `for:` receives in this case a condition and does not carry `in`.

An additional variation would be to enter a loop and interrupt it (using: `break`) when it meets a given condition. Let's look at the example:

```yaml
  var: i = 0
  for: True
    run: i += 1
    echo: i
    if: i < 10
      run: break
```

> Who already has knowledge in programming can associate this with the `do...while` statement of other languages, being the way to emulate it.

## Exceptions

Exceptions originate when the expected logic is interrupted due to an error in the middle of the program execution so that we could handle them, in other words, they are useful for handling errors generaly of a technical nature.

```yaml
  try:
    echo: n
  fail:
    echo: "error"
```

> The `try:` indicates that a controlled block of code is started and that in case of an exception it is passed to the block corresponding to `fail:`.

## Statements and Operations (run)

`run:` is used to invoke operations, functions or statements. In most languages it does not prepend something like `run:` with operations or statements being the common lines, but here an attribute is required to preserve the `YAML` style. It is also used to invoke `break`, `continue`, increments. Let's see below a couple of clarifications on this point.

### Operations vs Statements

In `ABCode` `var:` is used to declare variables and they can be initialized right there. On the other hand, when it comes to subsequent operations `run:` is used, so it is possible to find similar code in both cases, but in one it fulfills an initialization function and the other would correspond to the common flow (subsequent to the definition). Let's see the example:


```yaml
  var: i = 0
  echo: i
  run: i = 1
  echo: i
```

> We have not mentioned `let:`, which is used for immutable variables or constants, since an assignment with `run:` on immutable variables should not be supported.

### Complementary statements and macros

In theory, lines that do not correspond to attributes such as `fun:`, `send:`, `if:`, `when:`, `for:`, `try:`, `fail:`, `type:`, would correspond to a statement that use `run:`. However, variations may exist for specific cases that it is appropriate for the language to distinguish. Such is the case of `echo:` which is used to print something on the screen. Thinking of future implementation, there would also be `read`, `file:`, `link:`, `web:`, `dbc:`, `ask:`, `page:`, `jsx:`, `html:`, `css:`, `code:` as complementary statements to `run:`, known as well as macros.

## Comments

Comments provide hints for readability and understanding of the code but have no effect on the execution of the program, i.e. they are directed to the code documentation or to the team.

```yaml
# This is a comment
```

> If you have knowledge of `YAML` or `Python`, you should know that the use of the padding (`#`) for comments matches `ABCode`.  
> Unlike `YAML`, `ABCode` supports full-line comments, i.e., it is not interpreted at the end of a line except for special language comment exceptions (e.g. `#$:`).

### Comments and special tags

If you are just starting with computer programming, you might understand this topic better by advancing in program coding. `ABCode` introduces three types of special comments that are actually more than comments, since they provide guidance in the language. Let's see:

Label | Description
-- | --
`goal:` | indicates the target mode or the language (any, cli, api, fun, dbs or a language environment: python, deno, etc.).
`#if:` | comment indicating the language for which the following line is translated
`#in:` | comment indicating literal language expressed on the following line
<!--`#$:` | for `PHP` purposes, used at the end of the line, indicates a comma-separated list of variables when you want to ensure the interpretation of variables-->

> `#goal:` is not a comment but is a tag (or attribute) that does not operate as a statement. For example, `goal: fun` is used for more internal functions or embbedded scripts (e.g. `Lua`), and `goal: dbs` is like `fun` for databases with `sql`.

Let's review the following:

- `goal:` determines the language that is expressed in the code and is omitted when using the strict `ABCode` syntax to generate code in multiple languages.
- `goal:` would currently support values such as `any` and `cli` (`ABCode` for flat programs), plus the `python`, `deno` (`typescript`), `ruby`, `rust`, `kotlin` and `nodejs` languages. Additionally, `api` to indicate web server library compatible targets, and perhaps in the future, `pwa` to indicate visual (`javascript` in the browser) compatible targets.
- `goal:` can be used to report a target other than `any`, `cli`, `api`, `fun` or `dbs` (even `pwa` in the future), so it should be understood as a bridging mode for another language. In this way the expressive structure (`YAML`) is preserved and the code part is targeted for translation to a particular language. This is useful for implementing specific solutions in a given language or environment.
- `#if:` is useful when the syntax corresponds to the `ABCode` standard and you want to translate a line of code with a particular language (e.g. due to differences in libraries), always referring to the next line, i.e. applying a literal translation. It would be like using `goal:` for the next line of code instead of making it global. The above suggests that if `goal:` is used with a destination other than `any`, `cli`, `api`, `fun` or `dbs`, it is not required to use `#if:`, in which case they are mutually exclusive.
- `#if:` can be assigned with the `else` value (`#if: else`), indicating that for other languages the code reported on the next line (in `ABCode`) would apply.
- The `#in:` does not currently operate and is reserved as a specification for future implementation. This would serve to do a literal translation, expressing the next line directly in the target language as its syntax corresponds, i.e., similar to `if:` but instead of using `ABCode` it would literally use the target language (as an escape to the standard code). You could also use the `else` value (`#in: else`), indicating that for the other languages you would apply the code reported in the following line (in `ABCode`).

> `goal: any` is used for flat programs where no dependencies (libraries) are required, which is why `goal: cli` and `goal: api` are being prepared to support an official target-compatible library. `goal: fun` is used to indicate that the content corresponds to more internal functions or scripts (e.g. `Lua`). `goal: dbs` is like `fun` for databases with `sql`.  
> There may be restrictions on the use of `#if` and `#in` with some statements, for example, `fun:`, `if:`, `for:`, `try:` and `fail:` must follow the `ABCode` proposal.

## Data structures

Data structures represent a model or tuples, and can be defined under the `set:` attribute as follows:

```yaml
  set: Person
    name: string
    age: int
```

> The same `YAML` layout is used indicating the data types of each attribute.

## Importing program libraries

Libraries or program libraries allow you to organize and use code found in another file. The reserved word `use:` is used to indicate the library that is being imported and where it is located (path), or alternatively one that is built into the system. This is similar to what is known as `import` in other languages.


> Currently, `use:` is awaiting details of the usage mode to be defined while the actual built-in functions or essential libraries for the language are being implemented.

## Classes

Classes allow a paradigm that is known as object-oriented programming, seeking to represent everything as an object. If you know `Python`, when handling classes this must be reinterpreted according to `ABCode`, finding variations or differences in this aspect.

```yaml
type: Circle
  var: @radious

  fun: new(radious)
    run: @radious = radious

  fun: print()
    echo: @radious
```

> The `new` is the name of the function with which the class is initialized, that is, the constructor of the class is expressed as: `fun: new()`. This differs from `Python` and is inspired by `Rust`.  
> `@` is used to reference a direct property of the class, as distinguished from a common variable. This differs from `Python` which uses `self` or others which use `this`, and is inspired by `Ruby`, but must be declared using `var:`.

### Other aspects

To indicate that a function is private, in the context of a given class, the `@` sign must be prefixed to the name, for example: `@print()`.

In languages such as `C#` or `Java` (even `PHP` and `Kotlin`), classes are organized or grouped with either `namespace` or `package` (respectively). In `ABCode` you find the `root:` reserved word for these cases and it is usually placed in the first lines of the program, before defining a class. For example:

```yaml
root: awesome

type: Circle
...
```

`cast:` is reserved to other concept known as interfaces. For example:

```yaml
root: awesome

cast: Area
...
```

## Web server and its internal mechanism

The `web:` statement uses methods for the Web implementing code for each language (according to the library used internally). `web:` has three basic methods which are: `:server`, `:listen` and `:handle`. Let's see an example...

```yaml
use: api

web: :server = app

sub: get("/") = index
  web: :handle = "Hi there!"

fun: main()
  let: port:int = 8000
  echo: port
  web: :listen = port

run: main()
```

Note that `web: :server =` sets server variable, then `web: :handle =` assigns a request handler, which in this case returns a text, and `web: :listen =` starts the service on the specified port.

On the other hand, instead of `fun:` use `sub: get(...) = ...` to define the functions associated with a web request according to the path. Thus, it could be `get`, `post`, `put` or `delete`.
<!--
## Database connection (MongoDB)

To simplify the implementation and given its current popularity, the [**MongoDB**](https://onmind.co/doc/code/es/MongoDB.md) database engine is supported in principle and the database connection is implemented with the `dbc:` (Database Connection/Command/Client) statement, but the standard library must be imported first (using `use: mongodb`). Let's see an example...

```yaml
use: mongodb
dbc: :link = "mongodb://localhost:27017/"
dbc: mydb := "test"
echo: "Database connected!"
```

`dbc: :link =` internally sets a `dbc` variable to handle the database connection. Note that an address is reported with database controller, domain (or server) and port: `"mongodb://localhost:27017/"`

Then `dbc: mydb := "test"` points to the specific database name (`test`) by assigning it to a variable (`mydb`) with `:=`.
-->
## Query pattern to database

In the case of `ask:` we would look for a database query structure to be translated internally to `SQL` (Structured Query Language) keeping the `YAML` style and a pattern, using the database [**OnMind-XDB**](https://onmind.co/doc/code/en/OnMind-XDB). For example:
<!--
```yaml
  ask:
    way: mql
    what: find
    some: db.persons
    with: {name:"peter"}
    how: {order:age}
```

Either:
-->

```yaml
  ask:
    what: find
    some: persons
    with: name = 'peter'
    how: order age
```

With `ask:` you would use `way:`, `what:`, `some:`, `with:`, `puts:`, `show:` or `how:` attributes to set a pattern in the query. `way:` indicates whether `mql` or `sql` is specified (the latter being the default and could be omitted), `to:` for the collection or table, `what:` for the action (`find`, `insert`, `update`, `delete`), `with:` for the search criteria or filter, and `how:` for supplementary indications (e.g. `order`, `limit`). `show:` when you find something and `puts:` could be included for insert or update operations. Lets see another examples:

```yaml
  ask:
    what: find
    some: persons
    with: name = 'peter'
    show: name,age
```

> For `find` uses `show:` separating with `,`, and `with:` uses a mode close to `SQL`.  
> Instead of using `LIKE` inside `with:` the `begins_with(field, value)` or `contains(field, value)` function is used (reporting field and value).

```yaml
  ask:
    what: insert
    some: persons
    puts: {name:'peter',age:25}
```

> For `insert` uses `puts:` with `{}` (**JSON**).

```yaml
  ask:
    what: update
    some: persons
    with: name = 'peter'
    puts: {age:20}
```

> In this case, `puts:` set `age = 20`, and `with:` use `SQL` way.

```yaml
  ask:
    what: delete
    some: persons
    with: name = 'peter'
```

Additionally, `dbc:` to indicate the specific connection, `keys:` to set named parameters corresponding to a key-value list (`{}`), `call:` to launch functions, `user:` and `auth:` to report user and session **token**. Also `from:` when it refers to a repository oriented with the [**OnMind Method**](https://onmind.co/web/blog/en/fundamentals.md).

## Summary of language reserved words

Essentially we can cite the following reserved words or type of statement.

Sentence | Description
-- | --
`root:` | package or program module (referred to by compatibility, for example with `package` or `namespace`)
`fun:` | sets a function or method (routine that fulfills a function)
`set:` | set data structure (template)
`var:` | variable declaration (includes initial assignment)
`let:` | declaration to set immutables (includes assignment)
`run:` | statement, operation or assignment (also for break, continue)
`send:` | return or terminate a function with a value (if applicable)
`if:` | set condition or start of validation
`when:` | additional condition (`else if`). `when: no` or simply `else:` when something is not fulfilled.
`for:` | conventional cycle (the respective code can include `in`)
`sub:` | | code block, to iterate or derive as a subroutine
`try:` | starts block for exceptions
`fail:` | indicates generated event for exception control
`use:` | imports library (functions from another program file, `import`)
`type:` | defines a class, as class constructor use `fun: new()`.
`echo:` | print something on the screen (with parameters use: `${param}`)
`read:` | read data input from console
`file` | manage local files (`open`, `write`, `close`)
`@:` | decorator (@) used in certain languages (router, component, tag, widget, etc.)

> A distinction must be made between the `@:` attribute (used as decorator) and the use of `@` in classes.  
> The `sub:` statement is currently not implemented and is reserved as a language specification to be incorporated in future versions.

## Parallel of reserved words with other languages

For those who have knowledge of other languages, a quick way to understand `ABCode` is to quote the following parallel or comparative list:

`ABCode` | Other languages
-- | --
`root:` | `package`, `namespace`
`fun:` | `function`, `func`, `def`, `proc`
`set:` | `struct`, `type`, `data class`, `data class`
`var:` | `let`, `var`, `let mut`
`let:` | `const`, `val`, `let`, `let`
`send:` | `return`
`if:` | `if`
`when:` | `else if`, `elif`, `elsif`, `else`, `else`
`for:` | `for`, `while`, `return`.
`try:` | `try`, `while`
`fail:` | `catch`, `exception`, `rescue`, `rescue`
`use:` | `import`, `include`, `using`, `require`
`type:` | `class`
`echo:` | `print`, `echo`, `puts`, `console.log`
`read:` | `input`
`#` | `//` (line comments)
`@:` | `@` (decorator)

> `run:` is usually not parallelized and therefore not found in the above table. In most languages something like `run:` is not prepended to operations or statements, these being the common lines, but here an attribute is required to preserve the `YAML` style.

## Main variations with respect to Python

For those who are familiar with `Python`, and without mentioning the impact of `YAML`, the main differences are listed below:

1. Functions in `ABCode` start with `fun:` (inspired by `Kotlin`) and the `def` reserved word of `Python` is omitted.
2. Functions can specify the type of data to return by adding a colon (`:`) at the end and the respective data type.
3. The `return` reserved word of the `Python` language is omitted when using `send:`.
4. Variables can specify the data type when defining them by adding a colon (`:`) after the name and the respective data type, before assigning a value (before `=`).
5. Some reserved words are simplified with respect to `Python` or other languages. Such is the case of `while` that does not exist and `for:` is used (inspired by `Go`), or `switch...case` that do not exist either and `if:` and `when:` must be used. In principle, it is also not thought to implement `finally` which would correspond to `try:`, in order to keep simplicity and compatibility with certain languages.
6. Classes are named after starting with `type:`, replacing the `class` reserved word of `Python`, and the class constructor must be called `new` (inspired by `Rust`).
7. Classes use the `@` character (inspired by `Ruby`) instead of the `self` reserved word of `Python`, which in other languages would be `this`. This will be reflected in statements such as `run:` when using a property, i.e., when handling classes this must be reinterpreted according to `ABCode`, which has variations on this theme with respect to `Python`.
8. `Python` incorporates `print()` while `ABCode` uses `echo:` to display something on screen (inspired by `PHP`).

> Although `ABCode` accepts the logical operators `and`, `or` and `not` from `Python`, it promotes instead `&&`, `||` and `!` in favor of several languages.  
<!--
### Considerations for PHP target

In the case of joining strings (concatenating) it has been mentioned that if `PHP` is used as target you should use `+:` for this type of operation. We must add a particular consideration in case you want to standardize applications for `PHP`. That is, the rules of the specification have been defined, but when you want to involve `PHP` as a target you must apply another variation that consists of introducing comment `#$:` to check variables list. Let us see below what this would mean:

1. In statements (especially other than `var:` and `let:`) with comment `#$:` would be used to check variables list, by example: `run: i = j + 1  #$: i,j`.
2. In the case of `var:` and `let:` it would also be used but after the assignment, that is, if there is initialization the reference would apply after the `=` sign (and not in the definition of the variable name itself).
3. This would affect statements where a variable is referenced, such as `run:`, `send:`, `if:`, `when:`, `for:`, `fail:`, `echo:`. This would have no impact on other statements, such as `fun:`, `try:` and `set:`.
4. Also, it is omitted when using `@` (which corresponds to the private property domain of a class).
5. If `PHP` is not intended to be used as a target, the use of the `#$:` comment is unnecessary. The other alternative to avoid this would be to later convert `Python` to `PHP` with some Internet project (such as `py2php`). However, that might work for flat programs but not when you require certain libraries. If what you are looking for is to operate with a conventional and inexpensive service for web sites, the `Ruby` target is finally an alternative (but you must identify the vendor well since not all of them support it).

> The intention of the `PHP` destination is to consider the conventional and economic service for web sites (shared web hosting that includes `PHP`), where neither `Java` nor `C#` operate, since multi-platform technologies do not cover this aspect, even for `Python` and `Nodejs` it is difficult to find providers where `PHP` is offered.  
> The `ABCode:js` variant or flavor is browser oriented and not server oriented, hence the `PHP` target and its considerations do not apply.

We dont know the reception that these considerations may have, however, it is clear that with this we address more to those who like `PHP` and want the alternative of moving to other paradigms, or to those who come from other technologies and find interest in addressing also to the sector that `PHP` covers. If you think that converting to `Python` is enough, you can discard the `PHP` destination.
-->

## About YAML

So far, no variations to `YAML` are mentioned, since in a practical sense its style is respected. It can be seen, for example, that the reserved word `run:` is introduced because of the `YAML` style, since this concept does not exist in other languages in the case of statements or operations.

On the other hand, it is possible that in early versions the `YAML` notation was introduced for long texts using the `>` character, for example, in the case of the `echo:` or `send:` statement.

```yaml
  echo: >
    This text
    is wrapped
    as a paragraph
```

However, in other cases (such as `var:`, `let:`, `run:`) the appropriate way to proceed is under review since proposals could be combined. For example, let a string assignment (with `var:` or `let:`) end in `>` (thinking `=>`), and on the following lines set the value, something like the following:

```yaml
  var: text =>
    This text
    is wrapped
    as a paragraph
```
<!--
## Differences with ABCode:js (the browser dialect)

> Think simply of two dialects with the same root, the difference basically consists in the functions used when targeting the browser (for **frontend**).

Understanding that the `YAML` style is still preserved with the reserved words (sentences) of the `ABCode` language, what is sought with `ABCode:js` is to express itself in a language close to `Javascript`, or rather, to `Typescript` (which is a superset of `Javascript`), and keep a pattern.

The main difference would be to use `Javascript` functions and not `Python` functions. Therefore, statements like `var:`, `let:`, `fun:` and `for:` would retain the standard `ABCode` (or `ABCode:py`) specification. While statements like `use:`, `run:`, `send:`, `echo:`, `if:`, `when:` can be expressed in `Javascript` (even with their functions, and allowing use of `this` instead of `@`). The reserved words `page:` (for code based on [`javascript/mitosis`](https://github.com/BuilderIO/mitosis)), `jsx:` (thinking about rendering `jsx`), `html:` (for template), `css:` (for styles), `code:` (for code with logic linked to the template) would be added. The last three (3) tags or trinomial (`html`, `css`, `code`) would be used posibly with the `Svelte` library (whose template is close to `HTML`) and should be exclusive with respect to `jsx`, seeking to offer two (2) official alternatives and leaving open implementations with the language base.

The `ABCode:js` proposal would avoid creating a series of libraries to operate in the browser, it is still `ABCode` but close to `Javascript` and the browser, with the possibility of using `React` and `Capacitor` (**Ionic** technology for mobile devices). The internal code to identify the target type would be `pwa` (Progressive Web Application).

Finally, the `ABCode:js` target language would be `Javascript`. This excludes the `Nodejs` or other server-side targets that are covered with `ABCode:py`.

### Why the ABCode:js language dialect?

Simply one thing leads to another. `ABCode` starts with an emphasis on the server and proposes a conciliatory path for the browser. With `ABCode:js` the same philosophy is intended for the browser, reaching out to mobile devices as well. This could be unnecessary and you can use `Javascript` directly with the browser, but whoever likes the `ABCode` proposal and alternative can identify a useful standard for their work team. Surely this will open doors to other features not currently covered by `Javascript`, What do you think about [**"wasm"**](https://wasmtime.dev/)? (`WebAssembly`)
-->

## Thinking in UI

`page:` would in the future be the reserved word to represent a web component, while the rest of the program determines the functional logic (code) by compiling to `Javascript`. Let's see an example:

```yaml
page:
  init: {...}
  view:
    tag:
      name: my-button
      props: { onclick: onClick }
      slots: "Click-me"
  node: document.body

fun: onClick()
  echo: "aha!"
```

This layout is inspired by the [**hyperapp**](https://github.com/JorgeBucaran/hyperapp) library, which sets an initial state (`init`), the visual aspect (`view`) and the root element of the template (`node`) to render it.

> `view:` (the template) requires `tag:` with `name:`, `props:` and `slots:`, the latter can be derived in more nodes or tags (`tag:`) when instead of a text (`"..."`) it corresponds to a list (`[...]`).

You can also think of using `html/js` directly instead of `ABCode`, in which case I bet for the library **Svelte** as it is close to `html`, or finally [**Riot**](https://onmind.co/doc/code/en/Riot.md) (for native web components). In any case the example could be translated into a template like the following:

```html
<template is="my-button">
    <button onclick="{onClick}">Click-me</button>
</template>

<script page="my-button">
  function onClick() {
    console.log('aha!')
  }
</script>
```

> The expression `${expr}` would be used as escape, where `expr` is controlled by the internal mechanism or associated library.  
> The differentiating factor of using `page:` would be to become to generate `WebAssembly`).

## Current status

> Specification ready, work in progress, sponsors are welcome

The present document is already a specification of the `ABCode` programming language proposed and elaborated by César Andrés Arcila Buitrago (© 2022 by César Arcila). In 2022, inside the platform [**OnMind**](//onmind. co) platform has a transpiler (translator from source language to another source language) as a proof of concept that allows to execute simple programs that do not require dependencies in `Python` and other languages or environments (`Deno`, `Nodejs`, `Kotlin`, `Dart`, `Lua`, `Java`, `Ruby`, `Nim`, `Go`, `Swift` and `C#`).

To write with `ABCode` you don't need a new application, that is, you use an editor (like `VSCode` or `Sublime` that you download from Internet) associating the `YAML` format with `.abc` extension files. However, an editor is already being prepared for better integration with the transpiler.

![](./img/abcode-edit.png)

### About the intention of support

If we talk about a technology that can become **Open Source** we would already be thinking about some support but not imposing, precisely because of the type of license. I think that in order to distinguish target languages and their level of support, the most coherent thing to do is to talk about a level of support intention by target language or priority, where five (5) is a remote possibility. It is true that the word experimental is often used for non-priority features and may not be attended. Let us now look at the proposed support level intent.

#### Main targets (goal)

Item | Target | Level | Feature of Interest or Estrategy
-- | -- | -- | --
1 | NodeJS | 1 | Web Server and Microservices
2 | Deno | 2 | Multiplataform, Typescript
3 | Python | 2 | Multiparadigm, Machine Learning, DevOps, Web, IoT

> `0` is reserved for direct compilation from `ABCode` in the future. `4` could correspond to `Lambdas`, `Kotlin`, `Go` or `WebAssembly` (it will be seen later).  
<!--
The priority target language for `ABCode` (or `ABCode:py`) is `Python`, then additional effort is estimated, for example, to obtain `wasm` (**WebAssembly**), `Typescript/JS` or a binary.

Item | Target | Level | Feature of Interest or Estrategy
-- | -- | -- | --
1 | NodeJS | 1 | Web Server and Microservices
2 | Deno | 2 | Multiplataform, Typescript
3 | Kotlin | 3 | JVM (Cross-Platform) and Mobile (Native)
4 | Python | 3 | Multiparadigm, Machine Learning, DevOps, Web, IoT
5 | Wasm (AssemblyScript) | 4 | WebAssembly based on Typescript (wasm)

> These targets are oriented to **backend** and correspond to `ABCode:py` (including items 2, 3, 5).
-->
#### Origins that count as much as the targets

Since the initial strategy of `ABCode` is to operate as a portable and embedded language in another language or in an environment highlighted for **Backend**, it should be understood that it could be used from `PHP`, `NodeJS`, `Java`, `C`, `Python`, `Ruby`, `Dart`, `Deno`, `Rust`, `Go`, `Swift`, `Kotlin`, `C#`, `Pascal`, `PostgreSQL` and perhaps more.
<!--
> It would not only be a matter of thinking about the **destination** (target) but also about the possibilities of **originating** languages and environments that integrate `wasm` (**WebAssembly**).
-->
Python is also a specification, which is why you can find projects that host this language in an environment (such as `GraalVM`, `Jython`, `IronPython`, `Python.Net`, `PyScript`), or translate `Python` to another language (such as: `transcrypt`, `javascripthon`, `pscript`, `py2many`, `py2rb`, `py2php`, `py2dart`, `pytocs`, `py2nim`, `rustpython`, [`pytago`](https://github.com/nottheswimmer/pytago), `peryton`, `python-lua`, `scoder/lupa`, `dragon/haxe`, [`prometeo`](https://github.com/zanellia/prometeo)), and some project for mobile devices (such as `BeeWare`, `Kivy`).
<!--
#### Other targets to consider

Item | Target | Level | Feature of Interest or Estrategy
-- | -- | -- | --
5 | Groovy | 3 | JVM (Cross-Platform) and Script (e.g. Jenkins, Spring)
6 | Dart | 3 | Multiplatform and UI
7 | Lua | 3 | Script language and WebAssembly (e.g. Wasmoon)
8 | Go | 4 | DevOps, Cross Platform, IoT, WebAssembly
9 | PWA (JS) | 4 | UI, Browser (PWA/Capacitor) and Mobile
10 | Kotlin | 4 | JVM (Cross-Platform) and Mobile (Native)
11 | Ruby | 5 | Web Server (web hosting)
12 | Nim | 5 | Multiplatform, Javascript, IoT
13 | C# | 5 | Multiplatform and Games
14 | Java | 5 | JVM (Cross-Platform) and Microservices
15 | Swift | 5 | Multiplatform and Mobile (Native)

> `PWA` refers to **Progressive Web Application** with `Capacitor 3`, and is used to distinguish it from `Nodejs` (both being `Javascript`).  
> For experimental languages (level 2 to 5) and as long as `ABCode` code is achieved in `Python`, the interested party can refer to the respective projects...

### Why not PHP or other languages?

As for other languages, it is considered that the strategy has a more than sufficient and very broad scope. In the case of `PHP`, it is left as a remote possibility due to the difficulty to translate the code, for example, by the use of the `$` sign in variables and similar considerations that would be impediment to obtain a clear target. It can also be replaced using `Ruby` and `Python`, or the `py2php` project. Although, one could think int the feature about a lightweight web layer in `PHP` that invokes functions in `Lua` or `wasm` (thanks to [`wasmer-php`](https://github.com/wasmerio/wasmer-php)).
-->
### The technical advance

As a technical detail, a package manager is not required (as this is left to each target language) but neither has a standard library or official **SDK** of the language been implemented. However, some essential software has started to be reviewed with a very specific simple and lightweight library (example: `Bottle`). Web applications are considered for some `API` of classic or flat mode (without requiring library), that is, a main controller (`endpoint`) without `url` routing (it would be done by `POST` with parameter indicating the function to invoke and a token for security), so it can be implemented natively for several languages, leaving open for the programmer the faculty to add some technology (**Framework** or Library) when it is needed.

Although the transpiler code to be produced is expected to be released under the `MIT` (Open Source) license, it has not yet been published in Internet repositories (for example in `GitHub`) and this may change until the last moment (perhaps by `Apache` or other license). 

### Support this work

I already came from producing a platform that has cost a huge investment (time, money, intellectual, additional and personal effort), a project like this is not to be taken lightly and it is necessary to cover the financial factor, so...

> We are looking for ways of income that are welcome to support this work.  
> Specs ready, Work In Progress, Let's...

![](./img/abcode-logo.png)

---

> © 2022 by César Arcila
