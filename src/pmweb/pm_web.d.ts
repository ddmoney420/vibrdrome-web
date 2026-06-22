/* tslint:disable */
/* eslint-disable */

/**
 * A live visualizer bound to one canvas. Owned and driven by the host:
 *
 * ```text
 * const engine = await PmEngine.create(canvas, w, h);
 * engine.load_preset(milkText);          // returns false on parse failure
 * function frame(tMs) {
 *   engine.push_audio(analyserSamples);  // optional, each frame
 *   engine.render(tMs / 1000);
 *   raf = requestAnimationFrame(frame);  // host owns the loop
 * }
 * // teardown: cancelAnimationFrame(raf); engine.free();
 * ```
 */
export class PmEngine {
    private constructor();
    free(): void;
    [Symbol.dispose](): void;
    /**
     * Initialise wgpu on `canvas` (WebGPU, or WebGL2 fallback). No preset is
     * loaded yet — call [`PmEngine::load_preset`] before [`PmEngine::render`].
     */
    static create(canvas: HTMLCanvasElement, width: number, height: number): Promise<PmEngine>;
    /**
     * Parse and **hard-cut** to a `.milk` preset at the current resolution.
     * Returns `false` (without disturbing the current preset) if the text fails
     * to parse, so the host can skip it and advance. Behaviour is unchanged
     * from before engine-level transitions existed: this is always an instant
     * cut (with feedback inheritance, so feedback presets don't start black).
     */
    load_preset(text: string): boolean;
    /**
     * Feed the latest mono, time-domain audio samples (e.g. from a Web Audio
     * `AnalyserNode.getFloatTimeDomainData`). Optional; call once per frame.
     */
    push_audio(samples: Float32Array): void;
    /**
     * Render one frame at `time_seconds` and present it. No-op until a preset
     * is loaded. The host calls this from its own `requestAnimationFrame`.
     */
    render(time_seconds: number): void;
    /**
     * Resize the surface (and rebuild the engine at the new resolution so the
     * internal render targets match). Call when the canvas's pixel size changes.
     */
    resize(width: number, height: number): void;
    /**
     * Like [`PmEngine::load_preset`], but **crossfades** from the current preset
     * over `duration_ms` milliseconds: both presets keep rendering live and
     * their composited outputs are blended (an engine-level transition, not a
     * frozen still). `duration_ms <= 0`, NaN, or any non-finite value falls
     * back to a hard cut, so it never panics. The host chooses the duration —
     * pm-web invents no default. Returns `false` on parse failure, leaving the
     * current preset untouched.
     */
    transition_to_preset(text: string, duration_ms: number): boolean;
}

/**
 * One-time browser setup: route panics and `log` to the devtools console.
 */
export function start(): void;

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_pmengine_free: (a: number, b: number) => void;
    readonly pmengine_create: (a: any, b: number, c: number) => any;
    readonly pmengine_load_preset: (a: number, b: number, c: number) => number;
    readonly pmengine_push_audio: (a: number, b: number, c: number) => void;
    readonly pmengine_render: (a: number, b: number) => void;
    readonly pmengine_resize: (a: number, b: number, c: number) => void;
    readonly pmengine_transition_to_preset: (a: number, b: number, c: number, d: number) => number;
    readonly start: () => void;
    readonly wasm_bindgen__convert__closures_____invoke__h52736e2325688b52: (a: number, b: number, c: any) => [number, number];
    readonly wasm_bindgen__convert__closures_____invoke__h6bbcfc28ee49126f: (a: number, b: number, c: any, d: any) => void;
    readonly wasm_bindgen__convert__closures_____invoke__h0a5a8074da6f290a: (a: number, b: number, c: any) => void;
    readonly __wbindgen_malloc: (a: number, b: number) => number;
    readonly __wbindgen_realloc: (a: number, b: number, c: number, d: number) => number;
    readonly __wbindgen_exn_store: (a: number) => void;
    readonly __externref_table_alloc: () => number;
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __wbindgen_destroy_closure: (a: number, b: number) => void;
    readonly __externref_table_dealloc: (a: number) => void;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
