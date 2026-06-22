import { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPlaybackManager } from '../audio/PlaybackManager';
import { useUIStore } from '../stores/uiStore';
import { usePlayerStore } from '../stores/playerStore';
import { usePresetStore } from '../stores/presetStore';
import VisualizerTransport from '../components/visualizer/VisualizerTransport';
import VisualizerHud from '../components/visualizer/VisualizerHud';
import ParticleOverlay from '../components/visualizer/ParticleOverlay';
import PresetSearch from '../components/visualizer/PresetSearch';
import { useMediaQuery } from '../hooks/useMediaQuery';
import { shouldCrossfade, captureSnapshot } from '../utils/presetCrossfade';
import { usePresetFavoritesStore } from '../stores/presetFavoritesStore';
import {
  favoriteKeyForIndex as resolveFavoriteKey,
  favoritedIndicesIn,
  randomFavoriteIndex,
  nextFavoriteIndex,
} from '../utils/presetFavorites';
import type { PresetIndexEntry } from '../types/presets';

// projectM preset category that is excluded from normal selection: these are
// transition effects that fade to black by design, not standalone visuals.
const TRANSITION_CATEGORY = '! Transition';

// Preset crossfade length (ms) for the projectM/WebGPU 'fade' setting. Matches
// the existing frozen-frame fallback fade in `runSnapshotFade` so the two paths
// feel the same; not a new user-facing setting.
const PRESET_CROSSFADE_MS = 1400;

// --- Shader Presets ---

const VERTEX_SHADER = `
attribute vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

const SHADER_PRESETS = [
  {
    name: 'Plasma',
    fragment: `precision mediump float;
uniform float uTime;
uniform float uEnergy;
uniform float uBass;
uniform float uMid;
uniform float uTreble;
uniform vec2 uResolution;
#define PI 3.14159265359
void main(){vec2 uv=gl_FragCoord.xy/uResolution;vec2 p=uv*2.0-1.0;p.x*=uResolution.x/uResolution.y;float t=uTime*0.5+uEnergy*2.0;float v=0.0;v+=sin(p.x*3.0+t);v+=sin((p.y*3.0+t)*0.7);v+=sin((p.x*3.0+p.y*3.0+t)*0.5);v+=sin(length(p)*5.0-t*2.0)*uBass;v*=0.5;vec3 col=vec3(sin(v*PI+uBass*3.0)*0.5+0.5,sin(v*PI+2.094+uMid*3.0)*0.5+0.5,sin(v*PI+4.188+uTreble*3.0)*0.5+0.5);col*=0.7+uEnergy*0.5;gl_FragColor=vec4(col,1.0);}`,
  },
  {
    name: 'Kaleidoscope',
    fragment: `precision mediump float;
uniform float uTime;
uniform float uEnergy;
uniform float uBass;
uniform float uMid;
uniform float uTreble;
uniform vec2 uResolution;
#define PI 3.14159265359
void main(){vec2 uv=gl_FragCoord.xy/uResolution;vec2 p=uv*2.0-1.0;p.x*=uResolution.x/uResolution.y;float a=atan(p.y,p.x);float r=length(p);float segments=6.0+uBass*4.0;a=mod(a,2.0*PI/segments);a=abs(a-PI/segments);vec2 mp=vec2(cos(a),sin(a))*r;float t=uTime*0.3;float v=0.0;v+=sin(mp.x*8.0+t)*0.5;v+=sin(mp.y*6.0-t*1.3)*0.5;v+=sin((mp.x+mp.y)*4.0+t*0.7)*uMid;v+=sin(r*12.0-t*3.0)*uBass*0.5;vec3 col=vec3(sin(v*3.0+t)*0.5+0.5,sin(v*3.0+t+2.094)*0.5+0.5,sin(v*3.0+t+4.188)*0.5+0.5);col*=smoothstep(1.5,0.2,r);col*=0.6+uEnergy*0.6;gl_FragColor=vec4(col,1.0);}`,
  },
  {
    name: 'Tunnel',
    fragment: `precision mediump float;
uniform float uTime;
uniform float uEnergy;
uniform float uBass;
uniform float uMid;
uniform float uTreble;
uniform vec2 uResolution;
#define PI 3.14159265359
void main(){vec2 uv=gl_FragCoord.xy/uResolution;vec2 p=uv*2.0-1.0;p.x*=uResolution.x/uResolution.y;float a=atan(p.y,p.x)/PI;float r=1.0/(length(p)+0.001);float t=uTime*0.5;vec2 tc=vec2(a+t*0.1,r+t*(0.5+uBass*0.5));float v=sin(tc.x*8.0*PI)*sin(tc.y*4.0);v+=sin(tc.x*4.0*PI+uTime)*uMid;float pulse=sin(r*2.0-uTime*4.0)*uBass;vec3 col=vec3(0.2+v*0.3+pulse*0.4,0.1+v*0.2+uMid*0.3,0.4+v*0.4+uTreble*0.3);col*=r*0.15;col=clamp(col,0.0,1.0);col*=0.5+uEnergy*0.8;gl_FragColor=vec4(col,1.0);}`,
  },
  {
    name: 'Fractal Pulse',
    fragment: `precision mediump float;
uniform float uTime;
uniform float uEnergy;
uniform float uBass;
uniform float uMid;
uniform float uTreble;
uniform vec2 uResolution;
#define PI 3.14159265359
void main(){vec2 uv=gl_FragCoord.xy/uResolution;vec2 c=uv*3.0-1.5;c.x*=uResolution.x/uResolution.y;c+=vec2(sin(uTime*0.2)*0.3,cos(uTime*0.15)*0.3);c*=1.0+uBass*0.5;vec2 z=vec2(0.0);float iter=0.0;for(int i=0;i<64;i++){z=vec2(z.x*z.x-z.y*z.y,2.0*z.x*z.y)+c;if(dot(z,z)>4.0)break;iter+=1.0;}iter/=64.0;iter=pow(iter,0.5);float t=uTime*0.3;vec3 col=vec3(sin(iter*10.0+t)*0.5+0.5,sin(iter*10.0+t+2.0)*0.5+0.5,sin(iter*10.0+t+4.0)*0.5+0.5);col*=iter*2.0;col*=0.5+uEnergy*0.8;gl_FragColor=vec4(col,1.0);}`,
  },
  {
    name: 'Nebula',
    fragment: `precision mediump float;
uniform float uTime;
uniform float uEnergy;
uniform float uBass;
uniform float uMid;
uniform float uTreble;
uniform vec2 uResolution;
#define PI 3.14159265359
float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float noise(vec2 p){vec2 i=floor(p);vec2 f=fract(p);f=f*f*(3.0-2.0*f);float a=hash(i);float b=hash(i+vec2(1.0,0.0));float c=hash(i+vec2(0.0,1.0));float d=hash(i+vec2(1.0,1.0));return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);}
float fbm(vec2 p){float v=0.0;float a=0.5;for(int i=0;i<5;i++){v+=a*noise(p);p*=2.0;a*=0.5;}return v;}
void main(){vec2 uv=gl_FragCoord.xy/uResolution;vec2 p=uv*2.0-1.0;p.x*=uResolution.x/uResolution.y;float t=uTime*0.15;float n1=fbm(p*2.0+t+uBass*2.0);float n2=fbm(p*3.0-t*0.7+n1*1.5+uMid);float n3=fbm(p*1.5+t*0.5+n2*1.5);vec3 col=vec3(0.0);col+=vec3(0.7,0.2,1.0)*n1*1.5;col+=vec3(0.2,0.5,1.0)*n2*1.3;col+=vec3(1.0,0.3,0.6)*n3*uTreble*1.5;col+=vec3(0.3,0.8,0.5)*pow(n1*n2,0.5)*uBass*2.0;float stars=step(0.97,hash(floor(uv*300.0)));float twinkle=sin(uTime*3.0+hash(floor(uv*300.0))*50.0)*0.5+0.5;col+=stars*(0.8+uTreble)*twinkle;col*=0.8+uEnergy*0.8;col=pow(col,vec3(0.85));gl_FragColor=vec4(col,1.0);}`,
  },
  {
    name: 'Warp Speed',
    fragment: `precision mediump float;
uniform float uTime;
uniform float uEnergy;
uniform float uBass;
uniform float uMid;
uniform float uTreble;
uniform vec2 uResolution;
#define PI 3.14159265359
void main(){vec2 uv=gl_FragCoord.xy/uResolution;vec2 p=uv-0.5;p.x*=uResolution.x/uResolution.y;float t=uTime*(0.5+uBass*1.5);float a=atan(p.y,p.x);float r=length(p);float streak=0.0;for(int i=0;i<20;i++){float fi=float(i)/20.0;float angle=fi*2.0*PI+t*0.5;float dist=abs(a-angle);dist=min(dist,2.0*PI-dist);float brightness=smoothstep(0.15,0.0,dist);brightness*=smoothstep(0.0,0.3+uEnergy*0.2,r);brightness*=1.0-smoothstep(0.3,0.5,r);streak+=brightness*(0.5+sin(fi*30.0+t*3.0)*0.5);}float ring=abs(r-0.2-uBass*0.1);ring=smoothstep(0.02,0.0,ring);vec3 col=vec3(0.3,0.5,1.0)*streak;col+=vec3(0.8,0.4,1.0)*ring;col+=vec3(1.0,0.8,0.3)*smoothstep(0.1,0.0,r)*uEnergy;col*=0.7+uEnergy*0.5;gl_FragColor=vec4(col,1.0);}`,
  },
];

// --- WebGL Helpers ---

function createShader(gl: WebGLRenderingContext, type: number, source: string): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Shader compile error:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

function createProgram(gl: WebGLRenderingContext, vertexSource: string, fragmentSource: string): WebGLProgram | null {
  const vs = createShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fs = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  if (!vs || !fs) return null;

  const program = gl.createProgram();
  if (!program) return null;
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Program link error:', gl.getProgramInfoLog(program));
    gl.deleteProgram(program);
    return null;
  }

  gl.deleteShader(vs);
  gl.deleteShader(fs);
  return program;
}

// --- Component ---

function EpilepsyWarning({ onContinue, onDontShowAgain, onExit }: {
  onContinue: () => void;
  onDontShowAgain: () => void;
  onExit: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4">
      <div className="w-full max-w-md rounded-2xl bg-bg-secondary p-6 text-center shadow-xl">
        <div className="mb-4 text-4xl">⚠️</div>
        <h2 className="mb-2 text-lg font-bold text-text-primary">Photosensitivity Warning</h2>
        <p className="mb-2 text-sm text-text-secondary">
          The visualizer contains flashing lights, rapid color changes, and strobing effects that may cause discomfort or trigger seizures in people with photosensitive epilepsy.
        </p>
        <p className="mb-6 text-xs text-text-muted">
          You can disable visual effects anytime in <strong className="text-text-secondary">Settings &gt; Accessibility &gt; Reduce Motion</strong>.
        </p>
        <div className="flex flex-col gap-2">
          <button
            onClick={onContinue}
            className="w-full rounded-lg bg-accent py-2.5 text-sm font-semibold text-white transition-colors hover:bg-accent-hover"
          >
            Continue
          </button>
          <button
            onClick={onDontShowAgain}
            className="w-full rounded-lg bg-bg-tertiary py-2.5 text-sm font-medium text-text-secondary transition-colors hover:text-text-primary"
          >
            Don't Show Again
          </button>
          <button
            onClick={onExit}
            className="w-full rounded-lg py-2.5 text-sm font-medium text-text-muted transition-colors hover:text-text-primary"
          >
            Exit
          </button>
        </div>
      </div>
    </div>
  );
}

export default function VisualizerScreen() {
  const navigate = useNavigate();
  const { epilepsyWarningDismissed, setEpilepsyWarningDismissed } = useUIStore();
  const [showWarning, setShowWarning] = useState(!epilepsyWarningDismissed);
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const milkdropCanvasRef = useRef<HTMLCanvasElement>(null);
  const glRef = useRef<WebGLRenderingContext | null>(null);
  const programRef = useRef<WebGLProgram | null>(null);
  const animFrameRef = useRef<number>(0);
  const milkdropFrameRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const butterchurnRef = useRef<any>(null);
  const fallbackCtxRef = useRef<AudioContext | null>(null);

  // projectM-rs (WASM/WebGPU) engine — the primary Milkdrop engine when WebGPU
  // is available. Renders on its own canvas; butterchurn stays the fallback.
  const projectmCanvasRef = useRef<HTMLCanvasElement>(null);
  const pmEngineRef = useRef<import('../pmweb/pm_web').PmEngine | null>(null);
  const pmFrameRef = useRef<number>(0);
  const projectmEntriesRef = useRef<PresetIndexEntry[]>([]);

  // Freeze/step + FPS, read by the (closure-captured) render loops via refs.
  const frozenRef = useRef(false);
  const stepRef = useRef(0);
  const clockRef = useRef(0); // projectM time in seconds (held while frozen)
  const lastTickRef = useRef(0);
  const frameCountRef = useRef(0);
  const fpsLastRef = useRef(0);
  const showFpsRef = useRef(false);

  // Visualizer settings (persisted) + the keyboard-shortcuts master toggle.
  const {
    visualizerForceButterchurn,
    visualizerAutoAdvance, setVisualizerAutoAdvance,
    visualizerAutoAdvanceInterval, setVisualizerAutoAdvanceInterval,
    visualizerShuffle, setVisualizerShuffle,
    visualizerFavoritesOnly, setVisualizerFavoritesOnly,
    visualizerShowTransport,
    visualizerTransitionPolish,
    visualizerParticles,
    visualizerPinControls, setVisualizerPinControls,
    visualizerPresetTransition,
    reduceMotion,
    keyboardShortcutsEnabled,
  } = useUIStore();

  // Motion safety: suppress the transition polish under either the in-app
  // reduce-motion setting or the OS prefers-reduced-motion media query.
  const prefersReducedMotion = useMediaQuery('(prefers-reduced-motion: reduce)');
  const motionReduced = reduceMotion || prefersReducedMotion;

  // Frozen-frame crossfade (projectM path). Refs keep the preset-load effect from
  // re-running when the setting/motion changes (toggling must not reload presets).
  const fadeImgRef = useRef<HTMLImageElement>(null);
  const fadeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pmFadeArmedRef = useRef(false); // a projectM preset has rendered → safe to capture
  const transitionRef = useRef(visualizerPresetTransition);
  const motionReducedRef = useRef(motionReduced);
  useEffect(() => { transitionRef.current = visualizerPresetTransition; }, [visualizerPresetTransition]);
  useEffect(() => { motionReducedRef.current = motionReduced; }, [motionReduced]);

  // Show the captured old frame (a JPEG data URL), then fade it out over the new
  // live preset. Pure DOM on a ref'd <img> — no React state churn during the
  // fade, and data URLs need no revoking. A monotonic token guards against rapid
  // switches superseding an in-flight fade.
  const fadeTokenRef = useRef(0);
  const runSnapshotFade = useCallback((url: string, hardCut: () => void) => {
    const img = fadeImgRef.current;
    if (!img) { hardCut(); return; }
    const token = ++fadeTokenRef.current;
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
    img.style.transition = 'none';
    img.style.opacity = '1';
    img.style.display = 'block';
    img.src = url;

    const begin = () => {
      if (fadeTokenRef.current !== token || !fadeImgRef.current) { hardCut(); return; }
      // The still is decoded and covering the canvas at full opacity → hard-cut
      // the new preset underneath it, then fade the still out to reveal it.
      hardCut();
      requestAnimationFrame(() => requestAnimationFrame(() => {
        if (fadeTokenRef.current !== token || !fadeImgRef.current) return;
        fadeImgRef.current.style.transition = 'opacity 1400ms ease-out';
        fadeImgRef.current.style.opacity = '0';
      }));
      fadeTimerRef.current = setTimeout(() => {
        if (fadeTokenRef.current !== token) return;
        if (fadeImgRef.current) { fadeImgRef.current.style.display = 'none'; fadeImgRef.current.removeAttribute('src'); }
      }, 1500);
    };

    // Decode the still BEFORE hard-cutting. A large JPEG data URL decodes
    // asynchronously; showing it pre-decode would leave the new preset visible
    // underneath and read as a hard cut. decode() guarantees it actually paints.
    if (typeof img.decode === 'function') img.decode().then(begin).catch(begin);
    else { img.onload = begin; }
  }, []);

  // Clean up any in-flight fade timer on unmount.
  useEffect(() => () => {
    if (fadeTimerRef.current) clearTimeout(fadeTimerRef.current);
  }, []);

  // Subscribed only to decide whether the in-overlay transport renders (so the
  // bottom control bar / FPS overlay can shift up to make room for it).
  const transportSong = usePlayerStore((s) => s.currentSong);
  const transportRadio = usePlayerStore((s) => s.radioMode);
  const transportVisible = visualizerShowTransport && (!!transportSong || !!transportRadio);

  const [mode, setMode] = useState<'shader' | 'milkdrop'>('shader');
  const [frozen, setFrozen] = useState(false);
  const [showFps, setShowFps] = useState(false);
  const [fps, setFps] = useState(0);
  const [presetIndex, setPresetIndex] = useState(0);
  const [milkdropPresetIndex, setMilkdropPresetIndex] = useState(0);
  const [milkdropPresetNames, setMilkdropPresetNames] = useState<string[]>([]);
  // Render-reactive mirror of the projectM entries (paths) for the favorite-key
  // resolver; the preset-switch effect still uses projectmEntriesRef (effect-time
  // ref read). Empty for butterchurn (it keys favorites by name, not path).
  const [milkdropEntries, setMilkdropEntries] = useState<PresetIndexEntry[]>([]);
  const [milkdropReady, setMilkdropReady] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  // Transient toast showing the preset name when it changes.
  const [presetToast, setPresetToast] = useState<string | null>(null); // controls visibility
  const [toastText, setToastText] = useState(''); // retained during the toast's fade-out
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const vignetteRef = useRef<HTMLDivElement>(null);
  // Set just before an auto-advance preset change so the toast + overlay stay
  // silent for that change (the optional vignette still plays).
  const suppressNextToastRef = useRef(false);
  // Which Milkdrop engine is active: 'projectm' (WebGPU) or 'butterchurn'
  // (fallback), decided when milkdrop mode activates.
  const [milkdropEngine, setMilkdropEngine] = useState<'projectm' | 'butterchurn' | null>(null);
  // Preset search/jump overlay (milkdrop only — opened with '/' or the HUD button).
  const [presetSearchOpen, setPresetSearchOpen] = useState(false);
  // Local preset favorites (engine-prefixed keys; persisted to localStorage).
  const favoriteKeys = usePresetFavoritesStore((s) => s.favoriteKeys);
  const toggleFavorite = usePresetFavoritesStore((s) => s.toggleFavorite);
  const favoriteKeyForIndex = useCallback(
    (index: number) => resolveFavoriteKey(milkdropEngine, index, milkdropEntries, milkdropPresetNames),
    [milkdropEngine, milkdropEntries, milkdropPresetNames],
  );

  const overlayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentPreset = SHADER_PRESETS[presetIndex];

  const resetOverlayTimer = useCallback(() => {
    setShowOverlay(true);
    if (overlayTimeoutRef.current) clearTimeout(overlayTimeoutRef.current);
    overlayTimeoutRef.current = setTimeout(() => setShowOverlay(false), 4000);
  }, []);

  // Fullscreen support is feature-detected once. iOS Safari (iPhone) only allows
  // fullscreen on <video>, not arbitrary elements, so neither flag is set there
  // and the toggle button is hidden entirely. Older WebKit uses the webkit prefix.
  const fullscreenSupported = useMemo(() => {
    if (typeof document === 'undefined') return false;
    const doc = document as Document & { webkitFullscreenEnabled?: boolean };
    return !!(doc.fullscreenEnabled || doc.webkitFullscreenEnabled);
  }, []);

  // Toggle fullscreen on the visualizer root container. Click-only (no shortcut),
  // never auto-entered. requestFullscreen needs the click's user gesture; we
  // swallow any rejection so it can never surface as a console error.
  const toggleFullscreen = useCallback(() => {
    const el = containerRef.current as
      | (HTMLDivElement & { webkitRequestFullscreen?: () => void | Promise<void> })
      | null;
    if (!el) return;
    const doc = document as Document & {
      webkitFullscreenElement?: Element | null;
      webkitExitFullscreen?: () => void | Promise<void>;
    };
    const active = document.fullscreenElement || doc.webkitFullscreenElement;
    const run = active
      ? (document.exitFullscreen ?? doc.webkitExitFullscreen)?.call(document)
      : (el.requestFullscreen ?? el.webkitRequestFullscreen)?.call(el);
    if (run && typeof (run as Promise<void>).catch === 'function') {
      (run as Promise<void>).catch(() => { /* user gesture / unsupported — ignore */ });
    }
    resetOverlayTimer();
  }, [resetOverlayTimer]);

  // Keep the button state in sync with the actual fullscreen state, including
  // when the user exits via ESC or the browser chrome.
  useEffect(() => {
    if (!fullscreenSupported) return;
    const onChange = () => {
      const doc = document as Document & { webkitFullscreenElement?: Element | null };
      setIsFullscreen(!!(document.fullscreenElement || doc.webkitFullscreenElement));
    };
    document.addEventListener('fullscreenchange', onChange);
    document.addEventListener('webkitfullscreenchange', onChange);
    return () => {
      document.removeEventListener('fullscreenchange', onChange);
      document.removeEventListener('webkitfullscreenchange', onChange);
    };
  }, [fullscreenSupported]);

  // Keep loop-read refs in sync with state.
  useEffect(() => { frozenRef.current = frozen; }, [frozen]);
  useEffect(() => { showFpsRef.current = showFps; }, [showFps]);

  // Shared FPS counter, called once per rendered frame by the active loop.
  const tickFps = useCallback(() => {
    frameCountRef.current++;
    const now = performance.now();
    if (now - fpsLastRef.current >= 500) {
      const value = (frameCountRef.current * 1000) / (now - fpsLastRef.current);
      frameCountRef.current = 0;
      fpsLastRef.current = now;
      if (showFpsRef.current) setFps(Math.round(value));
    }
  }, []);

  const toggleFreeze = useCallback(() => { setFrozen((f) => !f); resetOverlayTimer(); }, [resetOverlayTimer]);
  const stepFrame = useCallback(() => { stepRef.current += 1; resetOverlayTimer(); }, [resetOverlayTimer]);
  const toggleFps = useCallback(() => { setShowFps((s) => !s); resetOverlayTimer(); }, [resetOverlayTimer]);

  // Set start time on mount
  useEffect(() => {
    startTimeRef.current = performance.now();
  }, []);

  // Initialize WebGL and fullscreen quad buffer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const gl = canvas.getContext('webgl', { antialias: false, alpha: false });
    if (!gl) return;
    glRef.current = gl;

    // Fullscreen quad
    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]),
      gl.STATIC_DRAW,
    );

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Compile shader program when preset changes
  useEffect(() => {
    const gl = glRef.current;
    if (!gl || mode !== 'shader') return;

    if (programRef.current) {
      gl.deleteProgram(programRef.current);
      programRef.current = null;
    }

    const program = createProgram(gl, VERTEX_SHADER, currentPreset.fragment);
    if (!program) return;
    programRef.current = program;

    gl.useProgram(program);

    // Bind position attribute
    const posLoc = gl.getAttribLocation(program, 'aPosition');
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);
  }, [presetIndex, mode, currentPreset.fragment]);

  // Render loop
  useEffect(() => {
    if (mode !== 'shader') {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      return;
    }

    const gl = glRef.current;
    const canvas = canvasRef.current;
    if (!gl || !canvas) return;

    const render = () => {
      const program = programRef.current;
      if (!program) {
        animFrameRef.current = requestAnimationFrame(render);
        return;
      }

      // Resize canvas to display size
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth * dpr;
      const h = canvas.clientHeight * dpr;
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
        gl.viewport(0, 0, w, h);
      }

      const now = performance.now();
      const time = (now - startTimeRef.current) / 1000;

      // Mock audio data (slowly varying sin waves)
      const bass = Math.sin(time * 0.7) * 0.3 + 0.5;
      const mid = Math.sin(time * 1.1 + 1.0) * 0.3 + 0.5;
      const treble = Math.sin(time * 1.6 + 2.0) * 0.3 + 0.5;
      const energy = Math.sin(time * 0.4) * 0.2 + 0.6;

      gl.useProgram(program);

      const uTime = gl.getUniformLocation(program, 'uTime');
      const uEnergy = gl.getUniformLocation(program, 'uEnergy');
      const uBass = gl.getUniformLocation(program, 'uBass');
      const uMid = gl.getUniformLocation(program, 'uMid');
      const uTreble = gl.getUniformLocation(program, 'uTreble');
      const uResolution = gl.getUniformLocation(program, 'uResolution');

      gl.uniform1f(uTime, time);
      gl.uniform1f(uEnergy, energy);
      gl.uniform1f(uBass, bass);
      gl.uniform1f(uMid, mid);
      gl.uniform1f(uTreble, treble);
      gl.uniform2f(uResolution, canvas.width, canvas.height);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [mode, presetIndex]);

  // Decide the Milkdrop engine when the mode activates: projectM-rs when WebGPU
  // is available, else butterchurn. A projectM failure flips this to
  // 'butterchurn' from the projectM effect below.
  useEffect(() => {
    /* eslint-disable react-hooks/set-state-in-effect -- engine choice derives from mode + WebGPU availability */
    if (mode !== 'milkdrop') {
      setMilkdropEngine(null);
      return;
    }
    const hasWebGPU = typeof navigator !== 'undefined' && 'gpu' in navigator;
    setMilkdropPresetIndex(0);
    setFrozen(false);
    setMilkdropEngine(hasWebGPU && !visualizerForceButterchurn ? 'projectm' : 'butterchurn');
    /* eslint-enable react-hooks/set-state-in-effect */
  }, [mode, visualizerForceButterchurn]);

  // Initialize Butterchurn when it's the chosen Milkdrop engine (fallback).
  useEffect(() => {
    if (mode !== 'milkdrop' || milkdropEngine !== 'butterchurn') {
      if (milkdropFrameRef.current) cancelAnimationFrame(milkdropFrameRef.current);
      return;
    }

    let cancelled = false;

    async function initButterchurn() {
      try {
        const [butterchurnModule, presetsModule] = await Promise.all([
          import('butterchurn'),
          import('butterchurn-presets'),
        ]);

        if (cancelled) return;

        // Vite CJS interop can double-wrap UMD: module.default.default
        let butterchurn = butterchurnModule.default || butterchurnModule;
        if (butterchurn.default) butterchurn = butterchurn.default;
        const presetsObj = presetsModule.default || presetsModule;
        const getPresets = presetsObj.getPresets || presetsObj.default?.getPresets;
        const presets = getPresets();
        const presetNames = Object.keys(presets).sort();

        setMilkdropPresetNames(presetNames);
        setMilkdropEntries([]); // butterchurn keys favorites by name, not path

        const canvas = milkdropCanvasRef.current;
        if (!canvas) return;

        const dpr = window.devicePixelRatio || 1;
        canvas.width = canvas.clientWidth * dpr;
        canvas.height = canvas.clientHeight * dpr;

        // Get or create AudioContext + AnalyserNode from PlaybackManager
        const pm = getPlaybackManager();
        let analyser = pm.getAnalyser();

        // If no analyser yet (no audio playing), create a fallback so butterchurn can render
        if (!analyser) {
          const fallbackCtx = new AudioContext();
          fallbackCtxRef.current = fallbackCtx;
          analyser = fallbackCtx.createAnalyser();
          analyser.fftSize = 2048;
          const osc = fallbackCtx.createOscillator();
          const silentGain = fallbackCtx.createGain();
          silentGain.gain.value = 0;
          osc.connect(silentGain);
          silentGain.connect(analyser);
          analyser.connect(fallbackCtx.destination);
          osc.start();
        }

        const visualizer = butterchurn.createVisualizer(analyser.context, canvas, {
          width: canvas.width,
          height: canvas.height,
        });

        visualizer.connectAudio(analyser);

        // Load initial preset
        const initialPresetName = presetNames[milkdropPresetIndex] || presetNames[0];
        if (initialPresetName && presets[initialPresetName]) {
          visualizer.loadPreset(presets[initialPresetName], 0);
        }

        butterchurnRef.current = { visualizer, presets, presetNames };
        setMilkdropReady(true);

        // Render loop
        const renderMilkdrop = () => {
          if (cancelled) return;

          const c = milkdropCanvasRef.current;
          if (c) {
            const dpRatio = window.devicePixelRatio || 1;
            const w = c.clientWidth * dpRatio;
            const h = c.clientHeight * dpRatio;
            if (c.width !== w || c.height !== h) {
              c.width = w;
              c.height = h;
              visualizer.setRendererSize(w, h);
            }
          }

          // Freeze skips render() so the last frame holds; a step renders once.
          let doRender = true;
          if (frozenRef.current) {
            if (stepRef.current > 0) stepRef.current -= 1;
            else doRender = false;
          }
          if (doRender) {
            visualizer.render();
            tickFps();
          }
          milkdropFrameRef.current = requestAnimationFrame(renderMilkdrop);
        };

        milkdropFrameRef.current = requestAnimationFrame(renderMilkdrop);
      } catch (err) {
        console.error('[Visualizer] Butterchurn init error:', err);
      }
    }

    initButterchurn();

    return () => {
      cancelled = true;
      if (milkdropFrameRef.current) cancelAnimationFrame(milkdropFrameRef.current);
      butterchurnRef.current = null;
      if (fallbackCtxRef.current) {
        fallbackCtxRef.current.close().catch(() => { /* ignore */ });
        fallbackCtxRef.current = null;
      }
      setMilkdropReady(false);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, milkdropEngine]);

  // Initialize projectM-rs (WASM, WebGPU) when it's the chosen Milkdrop engine.
  useEffect(() => {
    if (mode !== 'milkdrop' || milkdropEngine !== 'projectm') return;
    let cancelled = false;

    async function initProjectM() {
      const canvas = projectmCanvasRef.current;
      if (!canvas) return;

      // Lazy-load the WASM module only now (code-split chunk + .wasm).
      const wasm = await import('../pmweb/pm_web.js');
      if (cancelled) return;
      await wasm.default();
      wasm.start();

      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(canvas.clientWidth * dpr);
      canvas.height = Math.floor(canvas.clientHeight * dpr);

      const engine = await wasm.PmEngine.create(canvas, canvas.width, canvas.height);
      if (cancelled) { engine.free(); return; }
      pmEngineRef.current = engine;
      pmFadeArmedRef.current = false; // fresh engine: don't fade from a blank first frame

      // Preset library from the preset store (manifest only — shards lazy-load).
      // Exclude the "! Transition" category from the selectable list: those are
      // transition effects that fade to black by design, not standalone visuals.
      // They stay in the bundle/manifest/IndexedDB cache — only filtered out of
      // normal next/prev/random/startup selection.
      // TODO: stray black presets *outside* this category aren't caught here.
      // Async GPU black-frame detection (a non-blocking readback) could skip
      // those later if it becomes a real problem in practice.
      const store = usePresetStore.getState();
      await store.init();
      const entries = store.listPresets().filter((e) => e.category !== TRANSITION_CATEGORY);
      if (entries.length === 0) throw new Error('no selectable presets in manifest');
      projectmEntriesRef.current = entries;
      if (!cancelled) {
        setMilkdropPresetNames(entries.map((e) => e.name));
        setMilkdropEntries(entries);
      }

      // Start on a RANDOM non-transition preset (index 0 is alphabetical — the
      // worst case, the "! Transition" black presets). Set the index so the
      // overlay name + nav stay consistent, then load it (hard cut).
      const startIdx = Math.floor(Math.random() * entries.length);
      if (!cancelled) setMilkdropPresetIndex(startIdx);
      const text = await store.getPresetText(entries[startIdx].path);
      if (cancelled) return;
      if (text) engine.load_preset(text);
      if (!cancelled) setMilkdropReady(true);

      // Render loop — React owns rAF; feed the app's real playback audio.
      // Freeze holds the clock (and skips rendering so the last frame stays);
      // a single step advances exactly one 1/60s frame while frozen.
      let audioBuf: Float32Array<ArrayBuffer> | null = null;
      clockRef.current = 0;
      lastTickRef.current = 0;
      const loop = (tMs: number) => {
        if (cancelled) return;
        const c = projectmCanvasRef.current;
        if (c) {
          const w = Math.floor(c.clientWidth * dpr);
          const h = Math.floor(c.clientHeight * dpr);
          if (c.width !== w || c.height !== h) {
            c.width = w;
            c.height = h;
            engine.resize(w, h);
          }
        }

        const dt = lastTickRef.current ? Math.min((tMs - lastTickRef.current) / 1000, 0.1) : 1 / 60;
        lastTickRef.current = tMs;

        let doRender = true;
        if (frozenRef.current) {
          if (stepRef.current > 0) {
            clockRef.current += 1 / 60;
            stepRef.current -= 1;
          } else {
            doRender = false;
          }
        } else {
          clockRef.current += dt;
        }

        if (doRender) {
          const analyser = getPlaybackManager().getAnalyser();
          if (analyser) {
            if (!audioBuf || audioBuf.length !== analyser.fftSize) {
              audioBuf = new Float32Array(analyser.fftSize);
            }
            analyser.getFloatTimeDomainData(audioBuf);
            engine.push_audio(audioBuf);
          }
          engine.render(clockRef.current);
          tickFps();
        }
        pmFrameRef.current = requestAnimationFrame(loop);
      };
      pmFrameRef.current = requestAnimationFrame(loop);
    }

    initProjectM().catch((err) => {
      console.error('[Visualizer] projectM-rs init failed → falling back to butterchurn', err);
      if (!cancelled) setMilkdropEngine('butterchurn');
    });

    return () => {
      cancelled = true;
      if (pmFrameRef.current) cancelAnimationFrame(pmFrameRef.current);
      pmFrameRef.current = 0;
      if (pmEngineRef.current) {
        try { pmEngineRef.current.free(); } catch { /* ignore */ }
        pmEngineRef.current = null;
      }
      projectmEntriesRef.current = [];
      setMilkdropEntries([]);
      setMilkdropReady(false);
    };
  }, [mode, milkdropEngine, tickFps]);

  // Update milkdrop preset when index changes (butterchurn).
  useEffect(() => {
    const bc = butterchurnRef.current;
    if (!bc || mode !== 'milkdrop') return;

    const { visualizer, presets, presetNames } = bc;
    const name = presetNames[milkdropPresetIndex];
    if (name && presets[name]) {
      visualizer.loadPreset(presets[name], 1.0); // 1s blend transition
    }
  }, [milkdropPresetIndex, mode]);

  // Hard-cut preset switch for projectM-rs when the index changes.
  useEffect(() => {
    if (mode !== 'milkdrop' || milkdropEngine !== 'projectm') return;
    const engine = pmEngineRef.current;
    const entries = projectmEntriesRef.current;
    if (!engine || entries.length === 0) return;
    const entry = entries[milkdropPresetIndex];
    if (!entry) {
      // Index out of range (e.g. a stale/filtered selection) → jump to a random
      // valid non-transition preset; this effect re-runs with the new index.
      setMilkdropPresetIndex(Math.floor(Math.random() * entries.length));
      return;
    }
    let cancelled = false;
    usePresetStore
      .getState()
      .getPresetText(entry.path)
      .then((text) => {
        if (cancelled || !text) return;
        const canvas = projectmCanvasRef.current;
        const fade = shouldCrossfade({
          transition: transitionRef.current,
          motionReduced: motionReducedRef.current,
          armed: pmFadeArmedRef.current,
          hasCanvas: !!canvas,
        });
        // First load of a projectM session has no prior frame to fade from.
        pmFadeArmedRef.current = true;
        const hardCut = () => { if (!cancelled) engine.load_preset(text); };
        if (fade && canvas) {
          if (typeof engine.transition_to_preset === 'function') {
            // Engine-level live crossfade: both presets keep rendering and their
            // outputs are blended in the engine (no frozen still). On a parse
            // failure it returns false and the engine keeps the current preset —
            // same outcome as a failed load_preset, so nothing extra to do here.
            if (!cancelled) engine.transition_to_preset(text, PRESET_CROSSFADE_MS);
          } else {
            // Fallback for an older vendored WASM without the engine transition:
            // capture the OLD frame (synchronous), decode the still, hard-cut the
            // new preset underneath, and fade the still out. Capture failure →
            // silent hard-cut.
            captureSnapshot(canvas, (url) => {
              if (url) runSnapshotFade(url, hardCut);
              else hardCut();
            });
          }
        } else {
          hardCut();
        }
      })
      .catch((err) => console.error('[Visualizer] projectM preset load failed', err));
    return () => {
      cancelled = true;
    };
  }, [milkdropPresetIndex, milkdropEngine, mode, runSnapshotFade]);

  // Optional deep-link: `?preset=<name substring>` jumps to a matching preset
  // once milkdrop is ready (handy for bug repros / sharing a specific preset).
  // Read-only — it never writes the URL and only runs on first-ready.
  useEffect(() => {
    if (mode !== 'milkdrop' || !milkdropReady) return;
    const q = new URLSearchParams(window.location.search).get('preset');
    if (!q) return;
    const idx = milkdropPresetNames.findIndex((n) => n.toLowerCase().includes(q.toLowerCase()));
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot deep-link jump on ready
    if (idx >= 0) setMilkdropPresetIndex(idx);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- run once when milkdrop becomes ready
  }, [milkdropReady, mode]);

  // Auto-hide overlay
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- show overlay on mount
    resetOverlayTimer();
    return () => {
      if (overlayTimeoutRef.current) clearTimeout(overlayTimeoutRef.current);
    };
  }, [resetOverlayTimer]);

  const totalPresets = mode === 'shader' ? SHADER_PRESETS.length : milkdropPresetNames.length;
  const activeIndex = mode === 'shader' ? presetIndex : milkdropPresetIndex;
  const setActiveIndex = mode === 'shader' ? setPresetIndex : setMilkdropPresetIndex;

  // Favorite state for the currently-active milkdrop preset (null in shader mode).
  const currentFavoriteKey = favoriteKeyForIndex(milkdropPresetIndex);
  const currentIsFavorite = currentFavoriteKey != null && favoriteKeys.has(currentFavoriteKey);

  // Active-engine favorited indices, for favorites-only random / auto-advance.
  const favoritedIndices = useMemo(
    () => favoritedIndicesIn(milkdropPresetNames, favoriteKeys, favoriteKeyForIndex),
    [milkdropPresetNames, favoriteKeys, favoriteKeyForIndex],
  );
  const hasActiveFavorites = favoritedIndices.length > 0;
  // Refs so the interval-captured auto-advance always reads current values
  // (favorites can change while it runs without re-subscribing the interval).
  const favoritesOnlyRef = useRef(visualizerFavoritesOnly);
  const favoritedIndicesRef = useRef<number[]>(favoritedIndices);
  useEffect(() => { favoritesOnlyRef.current = visualizerFavoritesOnly; }, [visualizerFavoritesOnly]);
  useEffect(() => { favoritedIndicesRef.current = favoritedIndices; }, [favoritedIndices]);

  const nextPreset = () => {
    setActiveIndex((i) => (i + 1) % totalPresets);
    resetOverlayTimer();
  };

  const prevPreset = () => {
    setActiveIndex((i) => (i - 1 + totalPresets) % totalPresets);
    resetOverlayTimer();
  };

  const randomPreset = () => {
    if (totalPresets <= 1) return;
    // Favorites-only: pick a favorited preset; fall back to global if none.
    if (visualizerFavoritesOnly) {
      const fav = randomFavoriteIndex(favoritedIndices, activeIndex);
      if (fav != null) {
        setActiveIndex(fav);
        resetOverlayTimer();
        return;
      }
    }
    let next: number;
    do {
      next = Math.floor(Math.random() * totalPresets);
    } while (next === activeIndex);
    setActiveIndex(next);
    resetOverlayTimer();
  };

  // Silent preset change driven by the auto-advance timer: changes the preset
  // without waking the overlay or showing the toast (the vignette still plays).
  // Uses the functional updater so it never reads a stale index from the interval.
  const autoAdvance = () => {
    suppressNextToastRef.current = true;
    setActiveIndex((i) => {
      if (totalPresets <= 1) return i;
      // Favorites-only: advance within favorites (random when shuffle, else the
      // next favorite in list order). Falls back to global if no favorites.
      if (favoritesOnlyRef.current) {
        const favIdx = favoritedIndicesRef.current;
        const pick = visualizerShuffle ? randomFavoriteIndex(favIdx, i) : nextFavoriteIndex(favIdx, i);
        if (pick != null) return pick;
      }
      if (visualizerShuffle) {
        let next: number;
        do {
          next = Math.floor(Math.random() * totalPresets);
        } while (next === i);
        return next;
      }
      return (i + 1) % totalPresets;
    });
  };

  // Auto-advance: cycle presets on the configured interval while in Milkdrop.
  useEffect(() => {
    if (mode !== 'milkdrop' || !milkdropReady || !visualizerAutoAdvance) return;
    const ms = Math.max(1, visualizerAutoAdvanceInterval) * 1000;
    const id = setInterval(autoAdvance, ms);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, milkdropReady, visualizerAutoAdvance, visualizerAutoAdvanceInterval, visualizerShuffle]);

  // Visualizer-scoped keyboard controls. A no-deps effect keeps the latest
  // logic in a ref so the document listener (added once) always sees current
  // state without re-subscribing every render. Mirrors the app's conventions:
  // honors the master shortcuts toggle and ignores typing in form fields.
  const keyHandlerRef = useRef<(e: KeyboardEvent) => void>(() => {});
  useEffect(() => {
    keyHandlerRef.current = (e: KeyboardEvent) => {
      if (!keyboardShortcutsEnabled) return;
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;
      switch (e.key) {
        case 'n': case 'N': nextPreset(); break;
        case 'p': case 'P': prevPreset(); break;
        case 'a': case 'A': setVisualizerAutoAdvance(!visualizerAutoAdvance); resetOverlayTimer(); break;
        case '[': setVisualizerAutoAdvanceInterval(Math.max(5, visualizerAutoAdvanceInterval - 5)); resetOverlayTimer(); break;
        case ']': setVisualizerAutoAdvanceInterval(Math.min(60, visualizerAutoAdvanceInterval + 5)); resetOverlayTimer(); break;
        case 'k': case 'K': toggleFreeze(); break;
        case '.': stepFrame(); break;
        case 'f': case 'F': toggleFps(); break;
        case '/':
          if (mode === 'milkdrop' && milkdropReady) {
            e.preventDefault();
            setPresetSearchOpen(true);
            resetOverlayTimer();
          }
          break;
        default: break;
      }
    };
  });
  useEffect(() => {
    const h = (e: KeyboardEvent) => keyHandlerRef.current(e);
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, []);

  const handleCanvasClick = () => {
    resetOverlayTimer();
  };

  const handleCanvasDoubleClick = () => {
    randomPreset();
  };

  const displayPresetName = mode === 'shader'
    ? currentPreset.name
    : (milkdropPresetNames[milkdropPresetIndex] || 'Loading...');

  // On preset change: show a brief name toast, and (when enabled and motion is
  // not reduced) pulse a subtle DOM/CSS vignette over the still-hard-cut switch.
  // The actual preset switch is unchanged — this is purely cosmetic overlay.
  const prevPresetNameRef = useRef<string | null>(null);
  useEffect(() => {
    const name = displayPresetName;
    const prev = prevPresetNameRef.current;
    prevPresetNameRef.current = name;
    // Skip the initial mount and the transient "Loading..." placeholder.
    if (prev === null || !name || name === 'Loading...' || name === prev) return;

    // Auto-advance changes are silent: no toast (and the timer never woke the
    // overlay). The vignette below still plays for smooth slideshow transitions.
    const silent = suppressNextToastRef.current;
    suppressNextToastRef.current = false;
    if (!silent) {
      setToastText(name);
      setPresetToast(name);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
      toastTimerRef.current = setTimeout(() => setPresetToast(null), 1800);
    }

    if (visualizerTransitionPolish && !motionReduced) {
      const el = vignetteRef.current;
      if (el && typeof el.animate === 'function') {
        // A short darken-edges pulse (0 → subtle → 0). No white flash.
        el.animate(
          [{ opacity: 0 }, { opacity: 0.55, offset: 0.35 }, { opacity: 0 }],
          { duration: 260, easing: 'ease-out' },
        );
      }
    }
  }, [displayPresetName, visualizerTransitionPolish, motionReduced]);

  useEffect(() => () => { if (toastTimerRef.current) clearTimeout(toastTimerRef.current); }, []);

  const ctrlBtn = (on: boolean, disabled = false) =>
    `rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
      on ? 'bg-accent text-white' : 'bg-white/10 text-white/80 hover:bg-white/20'
    } ${disabled ? 'opacity-40' : ''}`;

  return (
    <div
      ref={containerRef}
      className="relative h-screen w-screen bg-black"
      onClick={handleCanvasClick}
      onDoubleClick={handleCanvasDoubleClick}
    >
      {showWarning && (
        <EpilepsyWarning
          onContinue={() => setShowWarning(false)}
          onDontShowAgain={() => {
            setEpilepsyWarningDismissed(true);
            setShowWarning(false);
          }}
          onExit={() => navigate(-1)}
        />
      )}
      {/* WebGL Canvas (Shader mode) */}
      <canvas
        ref={canvasRef}
        className={`absolute inset-0 h-full w-full ${mode === 'milkdrop' ? 'hidden' : ''}`}
      />

      {/* Milkdrop Canvas (Butterchurn — fallback when WebGPU is unavailable) */}
      <canvas
        ref={milkdropCanvasRef}
        className={`absolute inset-0 h-full w-full ${
          mode === 'shader' || milkdropEngine === 'projectm' ? 'hidden' : ''
        }`}
      />

      {/* projectM-rs Canvas (WebGPU — primary Milkdrop engine when available) */}
      <canvas
        ref={projectmCanvasRef}
        className={`absolute inset-0 h-full w-full ${
          mode === 'milkdrop' && milkdropEngine === 'projectm' ? '' : 'hidden'
        }`}
      />

      {/* Frozen-frame crossfade still — sits above the projectM canvas, briefly
          shown then faded out on a preset change (driven imperatively via ref). */}
      <img
        ref={fadeImgRef}
        alt=""
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 h-full w-full object-cover"
        style={{ display: 'none', opacity: 0 }}
      />

      {/* Milkdrop loading indicator */}
      {mode === 'milkdrop' && !milkdropReady && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-lg text-white/60">Loading Milkdrop...</p>
        </div>
      )}

      {/* Optional particle layer — above the engine canvases, below the
          controls/HUD. Opt-in and force-suppressed under reduced motion. */}
      {visualizerParticles && !motionReduced && <ParticleOverlay />}

      {/* Overlay */}
      <div
        className={`pointer-events-none absolute inset-0 transition-opacity duration-500 ${
          showOverlay ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Top bar */}
        <div className="pointer-events-auto absolute top-0 right-0 left-0 flex items-center justify-between bg-gradient-to-b from-black/70 to-transparent px-4 py-3">
          {/* Close */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              navigate(-1);
            }}
            className="flex h-10 w-10 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Close visualizer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6">
              <path strokeLinecap="round" d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>

          {/* Preset name + status badges (engine · index/total · auto/shuffle/frozen) */}
          <VisualizerHud
            presetName={displayPresetName}
            engine={mode === 'milkdrop' ? milkdropEngine : null}
            index={milkdropPresetIndex + 1}
            total={totalPresets}
            autoAdvance={visualizerAutoAdvance}
            shuffle={visualizerShuffle}
            frozen={frozen}
          />

          {/* Right controls: fullscreen toggle (when supported) + mode toggle */}
          <div className="flex items-center gap-2">
            {fullscreenSupported && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFullscreen();
                }}
                className="flex h-10 w-10 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
                aria-label={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                title={isFullscreen ? 'Exit fullscreen' : 'Enter fullscreen'}
              >
                {isFullscreen ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9 3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5 5.25 5.25" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-5 w-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
                  </svg>
                )}
              </button>
            )}

            {/* Mode toggle */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMode((m) => (m === 'shader' ? 'milkdrop' : 'shader'));
                resetOverlayTimer();
              }}
              className="rounded-full bg-white/10 px-3 py-1.5 text-xs font-medium text-white/80 transition-colors hover:bg-white/20"
            >
              {mode === 'shader' ? 'Milkdrop' : 'Shader'}
            </button>
          </div>
        </div>

        {/* Arrow navigation */}
        {(mode === 'shader' || (mode === 'milkdrop' && milkdropReady)) && (
          <>
            <button
              onClick={(e) => {
                e.stopPropagation();
                prevPreset();
              }}
              className="pointer-events-auto absolute top-1/2 left-4 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full text-white/50 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Previous preset"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                nextPreset();
              }}
              className="pointer-events-auto absolute top-1/2 right-4 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full text-white/50 transition-colors hover:bg-white/10 hover:text-white"
              aria-label="Next preset"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="h-6 w-6">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}

        {/* Milkdrop control bar — shifts up when the transport occupies the bottom */}
        {mode === 'milkdrop' && milkdropReady && (
          <div className={`pointer-events-auto absolute left-1/2 flex -translate-x-1/2 flex-wrap items-center justify-center gap-2 rounded-full bg-black/60 px-3 py-2 ${transportVisible ? 'bottom-28' : 'bottom-6'}`}>
            <button onClick={(e) => { e.stopPropagation(); setPresetSearchOpen(true); resetOverlayTimer(); }} title="Search presets (/)" className={ctrlBtn(presetSearchOpen)}>
              🔍 Find
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); if (currentFavoriteKey) toggleFavorite(currentFavoriteKey); resetOverlayTimer(); }}
              disabled={!currentFavoriteKey}
              title={currentIsFavorite ? 'Unfavorite this preset' : 'Favorite this preset'}
              aria-label={currentIsFavorite ? 'Unfavorite preset' : 'Favorite preset'}
              aria-pressed={currentIsFavorite}
              className={ctrlBtn(currentIsFavorite, !currentFavoriteKey)}
            >
              {currentIsFavorite ? '★ Favorited' : '☆ Favorite'}
            </button>
            <button onClick={(e) => { e.stopPropagation(); toggleFreeze(); }} title="Freeze / unfreeze (K)" className={ctrlBtn(frozen)}>
              {frozen ? '▶ Resume' : '⏸ Freeze'}
            </button>
            <button onClick={(e) => { e.stopPropagation(); stepFrame(); }} disabled={!frozen} title="Step one frame while frozen (.)" className={ctrlBtn(false, !frozen)}>
              ⏭ Step
            </button>
            <button onClick={(e) => { e.stopPropagation(); setVisualizerAutoAdvance(!visualizerAutoAdvance); resetOverlayTimer(); }} title="Auto-advance (A)" className={ctrlBtn(visualizerAutoAdvance)}>
              ⏩ Auto
            </button>
            <button onClick={(e) => { e.stopPropagation(); setVisualizerShuffle(!visualizerShuffle); resetOverlayTimer(); }} title="Shuffle on advance" className={ctrlBtn(visualizerShuffle)}>
              🔀 Shuffle
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setVisualizerFavoritesOnly(!visualizerFavoritesOnly); resetOverlayTimer(); }}
              disabled={!hasActiveFavorites}
              title={hasActiveFavorites ? 'Random / auto-advance only among favorites' : 'Favorite some presets first'}
              aria-pressed={visualizerFavoritesOnly}
              className={ctrlBtn(visualizerFavoritesOnly, !hasActiveFavorites)}
            >
              ★ Only
            </button>
            <button onClick={(e) => { e.stopPropagation(); toggleFps(); }} title="FPS overlay (F)" className={ctrlBtn(showFps)}>
              FPS
            </button>
            {visualizerShowTransport && (
              <button onClick={(e) => { e.stopPropagation(); setVisualizerPinControls(!visualizerPinControls); resetOverlayTimer(); }} title="Keep player controls on screen" className={ctrlBtn(visualizerPinControls)}>
                📌 Pin
              </button>
            )}
          </div>
        )}
      </div>

      {/* In-visualizer playback transport (opt-in; self-hides with no song).
          Lives outside the auto-hiding overlay so the Pin toggle can keep just
          the player controls on screen while the rest of the HUD still fades. */}
      {visualizerShowTransport && (
        <div
          className={`transition-opacity duration-500 ${
            showOverlay || visualizerPinControls ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
        >
          <VisualizerTransport onInteract={resetOverlayTimer} />
        </div>
      )}

      {/* FPS overlay — persists regardless of the auto-hiding controls */}
      {showFps && (
        <div className={`pointer-events-none absolute left-2 rounded bg-black/60 px-2 py-1 font-mono text-xs text-green-400 ${transportVisible ? 'bottom-24' : 'bottom-2'}`}>
          {fps} fps · {milkdropEngine === 'projectm' ? 'projectM/WebGPU' : mode === 'milkdrop' ? 'butterchurn/WebGL' : 'shader/WebGL'}
        </div>
      )}

      {/* Transition polish: subtle vignette pulse on preset change (opacity
          animated via WAAPI only when enabled + motion not reduced). Hard cut
          underneath is unchanged. */}
      <div
        ref={vignetteRef}
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0"
        style={{ background: 'radial-gradient(ellipse at center, transparent 55%, rgba(0,0,0,0.7) 100%)' }}
      />

      {/* Preset-name toast — brief, independent of the auto-hiding overlay */}
      <div
        className={`pointer-events-none absolute top-[22%] left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-4 py-1.5 text-sm font-medium text-white/90 backdrop-blur-sm transition-opacity ${
          motionReduced ? '' : 'duration-300'
        } ${presetToast ? 'opacity-100' : 'opacity-0'}`}
      >
        {toastText}
      </div>

      {/* Preset search/jump overlay — selecting a result sets the active index,
          reusing the normal switch path (hard-cut / live crossfade / etc.). */}
      {presetSearchOpen && (
        <PresetSearch
          names={milkdropPresetNames}
          favoriteKeys={favoriteKeys}
          favoriteKeyForIndex={favoriteKeyForIndex}
          onToggleFavorite={toggleFavorite}
          onSelect={(i) => {
            setMilkdropPresetIndex(i);
            resetOverlayTimer();
            setPresetSearchOpen(false);
          }}
          onClose={() => setPresetSearchOpen(false)}
        />
      )}
    </div>
  );
}
