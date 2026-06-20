import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPlaybackManager } from '../audio/PlaybackManager';
import { useUIStore } from '../stores/uiStore';

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

  const [mode, setMode] = useState<'shader' | 'milkdrop'>('shader');
  const [presetIndex, setPresetIndex] = useState(0);
  const [milkdropPresetIndex, setMilkdropPresetIndex] = useState(0);
  const [milkdropPresetNames, setMilkdropPresetNames] = useState<string[]>([]);
  const [milkdropReady, setMilkdropReady] = useState(false);
  const [showOverlay, setShowOverlay] = useState(true);

  const overlayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentPreset = SHADER_PRESETS[presetIndex];

  const resetOverlayTimer = useCallback(() => {
    setShowOverlay(true);
    if (overlayTimeoutRef.current) clearTimeout(overlayTimeoutRef.current);
    overlayTimeoutRef.current = setTimeout(() => setShowOverlay(false), 4000);
  }, []);

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

  // Initialize Butterchurn when switching to milkdrop mode
  useEffect(() => {
    if (mode !== 'milkdrop') {
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

          visualizer.render();
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
  }, [mode]);

  // Update milkdrop preset when index changes
  useEffect(() => {
    const bc = butterchurnRef.current;
    if (!bc || mode !== 'milkdrop') return;

    const { visualizer, presets, presetNames } = bc;
    const name = presetNames[milkdropPresetIndex];
    if (name && presets[name]) {
      visualizer.loadPreset(presets[name], 1.0); // 1s blend transition
    }
  }, [milkdropPresetIndex, mode]);

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
    let next: number;
    do {
      next = Math.floor(Math.random() * totalPresets);
    } while (next === activeIndex);
    setActiveIndex(next);
    resetOverlayTimer();
  };

  const handleCanvasClick = () => {
    resetOverlayTimer();
  };

  const handleCanvasDoubleClick = () => {
    randomPreset();
  };

  const displayPresetName = mode === 'shader'
    ? currentPreset.name
    : (milkdropPresetNames[milkdropPresetIndex] || 'Loading...');

  return (
    <div
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

      {/* Milkdrop Canvas (Butterchurn) */}
      <canvas
        ref={milkdropCanvasRef}
        className={`absolute inset-0 h-full w-full ${mode === 'shader' ? 'hidden' : ''}`}
      />

      {/* Milkdrop loading indicator */}
      {mode === 'milkdrop' && !milkdropReady && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-lg text-white/60">Loading Milkdrop...</p>
        </div>
      )}

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

          {/* Preset name */}
          <span className="max-w-[50%] truncate text-sm font-medium text-white/80">
            {displayPresetName}
          </span>

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
      </div>
    </div>
  );
}
