// App-only frozen-frame crossfade helpers for the projectM/WebGPU visualizer.
//
// On a preset change we capture the current canvas as a still image, hard-cut to
// the new preset underneath, and fade the still out over the new live preset.
// No second engine, no extra GPU context, no projectM-rs change.

export type PresetTransition = 'hard-cut' | 'fade';

/**
 * Decide whether a preset change should crossfade. Fade only when:
 * - the user picked 'fade',
 * - reduced motion is NOT active (in-app setting or OS preference),
 * - a previous preset has already rendered (so there's an old frame to capture),
 * - a canvas is available.
 * Otherwise the caller hard-cuts.
 */
export function shouldCrossfade(opts: {
  transition: PresetTransition;
  motionReduced: boolean;
  armed: boolean;
  hasCanvas: boolean;
}): boolean {
  return opts.transition === 'fade' && !opts.motionReduced && opts.armed && opts.hasCanvas;
}

/**
 * Capture the current canvas frame as a data URL for the crossfade.
 *
 * Uses synchronous `toDataURL('image/jpeg', …)` — the validated, portable capture
 * path: `toDataURL`/`toBlob` are the only methods that work on BOTH real GPU and
 * software/fallback WebGPU (`drawImage`/`createImageBitmap` come back blank on
 * software WebGPU). Synchronous so the still is guaranteed ready *before* the
 * hard-cut (no async race / mis-ordered frame); JPEG keeps the one-off encode
 * cheap (PNG is the expensive part). Calls back with the data URL, or `null` if
 * capture failed/threw so the caller hard-cuts. Never captures per-frame — only
 * once per transition. Data URLs need no revoking.
 */
export function captureSnapshot(
  canvas: HTMLCanvasElement,
  cb: (url: string | null) => void,
  quality = 0.55,
): void {
  try {
    const url = canvas.toDataURL('image/jpeg', quality);
    cb(typeof url === 'string' && url.startsWith('data:image') ? url : null);
  } catch {
    cb(null);
  }
}
