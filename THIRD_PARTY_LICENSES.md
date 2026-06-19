# Third-party licenses

vibrdrome-web itself is MIT-licensed (see `LICENSE`). It bundles the following
component under a different license:

## projectM-rs (Milkdrop visualizer engine) — LGPL-2.1

`src/pmweb/` contains a compiled WebAssembly build of **projectM-rs**, a Rust
port and derivative of projectM / Milkdrop, licensed under the **GNU Lesser
General Public License, version 2.1**.

- License text: [`src/pmweb/COPYING`](src/pmweb/COPYING)
- Build details + corresponding-source link: [`src/pmweb/NOTICE.md`](src/pmweb/NOTICE.md)
- Source: https://github.com/ddmoney420/projectM-rs

npm dependencies retain their own licenses as declared in `package.json` /
`node_modules`.
