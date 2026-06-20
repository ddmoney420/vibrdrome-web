import { useEffect, useRef } from 'react';
import { getPlaybackManager } from '../../audio/PlaybackManager';

/**
 * Optional, lightweight particle layer drawn on a separate 2D canvas above the
 * visualizer engines and below the controls/HUD. App-only polish — it never
 * touches projectM/butterchurn/shader rendering.
 *
 * Deliberately conservative: a small, capped pool of gently drifting dots whose
 * brightness/drift is modulated by overall audio energy (from the existing
 * analyser). No beat explosions, no flashes. Trails fade via destination-out so
 * the canvas stays transparent (never darkens the underlying visualizer).
 *
 * Safety: silently no-ops if `getContext('2d')` is unavailable; idles calmly
 * with no audio; caps particle count and DPR (lower on small screens);
 * self-throttles when its own frame rate drops; cancels rAF and clears on
 * unmount. The parent only mounts this when enabled and motion is not reduced.
 */
export default function ParticleOverlay() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return; // silent disable (e.g. context unavailable)

    const small = window.innerWidth <= 480;
    const dprCap = small ? 1 : 1.5;
    const maxParticles = small ? 28 : 60;
    let activeCap = maxParticles; // self-throttled down if FPS drops

    interface P { x: number; y: number; vx: number; vy: number; r: number; base: number; }
    const particles: P[] = [];

    const rand = (a: number, b: number) => a + Math.random() * (b - a);

    let w = 0, h = 0;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, dprCap);
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    const spawn = (): P => ({
      x: rand(0, w || 1),
      y: rand(0, h || 1),
      vx: rand(-0.15, 0.15),
      vy: rand(-0.35, -0.05), // gentle upward drift
      r: rand(0.8, 2.2),
      base: rand(0.15, 0.4),
    });
    for (let i = 0; i < maxParticles; i++) particles.push(spawn());

    let audioBuf: Uint8Array<ArrayBuffer> | null = null;
    const energy = (): number => {
      const analyser = getPlaybackManager().getAnalyser();
      if (!analyser) return 0; // no audio → calm idle
      const n = analyser.frequencyBinCount;
      if (!audioBuf || audioBuf.length !== n) audioBuf = new Uint8Array(n);
      analyser.getByteFrequencyData(audioBuf);
      // Average the lower half (bass/mids drive the motion), normalised 0..1.
      const half = Math.max(1, n >> 1);
      let sum = 0;
      for (let i = 0; i < half; i++) sum += audioBuf[i];
      return Math.min(1, sum / (half * 255));
    };

    let raf = 0;
    let last = performance.now();
    let smoothedDt = 16;
    let smoothedEnergy = 0;

    const frame = () => {
      const now = performance.now();
      const dt = now - last;
      last = now;
      // Self-throttle: if our own frame interval is sustained-slow (<~30fps),
      // shrink the active particle cap; recover gently when it improves.
      smoothedDt = smoothedDt * 0.9 + dt * 0.1;
      if (smoothedDt > 33 && activeCap > 10) activeCap -= 1;
      else if (smoothedDt < 22 && activeCap < maxParticles) activeCap += 1;

      const e = energy();
      smoothedEnergy = smoothedEnergy * 0.85 + e * 0.15;

      // Fade existing trails toward transparent (keeps overlay non-darkening).
      ctx.globalCompositeOperation = 'destination-out';
      ctx.fillStyle = 'rgba(0,0,0,0.10)';
      ctx.fillRect(0, 0, w, h);

      // Additive, soft white dots.
      ctx.globalCompositeOperation = 'lighter';
      const speed = 0.5 + smoothedEnergy * 1.8;
      const glow = 0.6 + smoothedEnergy * 0.9;
      for (let i = 0; i < activeCap; i++) {
        const p = particles[i];
        p.x += p.vx * speed;
        p.y += p.vy * speed;
        // wrap around edges
        if (p.y < -4) { p.y = h + 4; p.x = rand(0, w); }
        if (p.x < -4) p.x = w + 4;
        else if (p.x > w + 4) p.x = -4;
        const a = Math.min(0.85, p.base * glow);
        ctx.fillStyle = `rgba(255,255,255,${a})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalCompositeOperation = 'source-over';
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    let resizeRaf = 0;
    const onResize = () => { cancelAnimationFrame(resizeRaf); resizeRaf = requestAnimationFrame(resize); };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(resizeRaf);
      window.removeEventListener('resize', onResize);
      try { ctx.clearRect(0, 0, canvas.width, canvas.height); } catch { /* ignore */ }
    };
  }, []);

  return <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full" />;
}
