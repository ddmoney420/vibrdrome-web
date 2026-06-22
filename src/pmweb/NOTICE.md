# projectM-rs WebAssembly engine — license notice

The files in this directory (`src/pmweb/`) —

- `pm_web_bg.wasm`
- `pm_web.js`
- `pm_web.d.ts`, `pm_web_bg.wasm.d.ts`

— are a **compiled WebAssembly build of [projectM-rs](https://github.com/ddmoney420/projectM-rs)**,
produced with `wasm-pack`. projectM-rs is a Rust port and **derivative work of
projectM / Milkdrop**, and is licensed under the **GNU Lesser General Public
License, version 2.1 (LGPL-2.1)**.

## License

This vendored engine is **LGPL-2.1**, independent of the rest of vibrdrome-web
(which is MIT). The full license text is in [`COPYING`](./COPYING) alongside
these files.

Copyright © the projectM-rs authors. projectM-rs is itself derived from the
LGPL-2.1 projectM / libprojectM and projectm-eval projects.

## Corresponding source

As required by the LGPL, the corresponding source for this build is available at:

> **https://github.com/ddmoney420/projectM-rs**

- Build branch: `wasm-web-engine`
- Source commit (pm-web): `b88697f` ("refactor(pm-web): handle-based PmEngine API")
- Built with: `wasm-pack build crates/pm-web --target web --release`

To rebuild from source, clone the repository above, install
[`wasm-pack`](https://rustwasm.github.io/wasm-pack/), run the build command, and
copy the resulting `pkg/` artifacts here.

> The projectM-rs repository linked above is **public**, so the corresponding
> source for this build is available to recipients, satisfying the LGPL
> corresponding-source obligation.
