# ABCode Programming Language - Version 1 (Preview/Alpha)

> Mitigating the Software Tower of Babel to a great degree  
> [**Download...**](https://github.com/kaesar/abcode/releases) | [Video](https://www.youtube.com/embed/GuPJzq43FbY)  

![](https://assets.onmind.net/know/abcode-logo.png)

![](https://assets.onmind.net/know/onmind22-abcode.gif)

Just download and uncompress according to your system and run something like...

```bash
./abcodec -s abc/hello.abc
```

> `abcodec` is the compiler and `abc/hello.abc` represent your source code with **ABCode**.  
> Go to [`ABCode`](https://onmind.co/doc/code/en/ABCode.md) topic in my blog.

---
<!--
Compiling with `cargo` and running...

```bash
cargo run -- -s abc/hello.abc -t 6
cargo build --release && ./target/release/abcodec -s abc/hello.abc -t 6
```

Prepare for building...

```bash
rustup target add aarch64-apple-darwin
rustup target add x86_64-pc-windows-msvc
rustup target add x86_64-unknown-linux-gnu
rustup target add aarch64-unknown-linux-gnu
```

Building script with: `build.sh`
-->

> © 2021-2025 by César Andres Arcila Buitrago
