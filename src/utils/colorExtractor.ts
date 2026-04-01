const colorCache = new Map<string, { r: number; g: number; b: number }>();

let sharedCanvas: HTMLCanvasElement | null = null;

function getCanvas(): HTMLCanvasElement {
  if (!sharedCanvas) {
    sharedCanvas = document.createElement('canvas');
    sharedCanvas.width = 50;
    sharedCanvas.height = 50;
  }
  return sharedCanvas;
}

/**
 * Extract the dominant color from an image URL.
 * Uses a small offscreen canvas to sample pixels.
 * Results are cached by key.
 */
export async function extractDominantColor(
  imageUrl: string,
  cacheKey: string,
): Promise<{ r: number; g: number; b: number }> {
  const cached = colorCache.get(cacheKey);
  if (cached) return cached;

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';

    img.onload = () => {
      try {
        const canvas = getCanvas();
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) { reject(new Error('No canvas context')); return; }

        ctx.drawImage(img, 0, 0, 50, 50);
        const data = ctx.getImageData(0, 0, 50, 50).data;

        let rSum = 0, gSum = 0, bSum = 0, count = 0;

        // Sample every 4th pixel, weighting toward saturated colors
        for (let i = 0; i < data.length; i += 16) {
          const r = data[i];
          const g = data[i + 1];
          const b = data[i + 2];
          const a = data[i + 3];

          if (a < 128) continue; // skip transparent

          // Calculate saturation to weight vibrant colors higher
          const max = Math.max(r, g, b);
          const min = Math.min(r, g, b);
          const saturation = max === 0 ? 0 : (max - min) / max;
          const weight = 0.3 + saturation * 0.7;

          rSum += r * weight;
          gSum += g * weight;
          bSum += b * weight;
          count += weight;
        }

        if (count === 0) {
          const fallback = { r: 139, g: 92, b: 246 }; // default purple
          colorCache.set(cacheKey, fallback);
          resolve(fallback);
          return;
        }

        const result = {
          r: Math.round(rSum / count),
          g: Math.round(gSum / count),
          b: Math.round(bSum / count),
        };

        // Clamp to avoid very dark or very bright colors
        const brightness = (result.r + result.g + result.b) / 3;
        if (brightness < 30) {
          result.r = Math.min(255, result.r + 40);
          result.g = Math.min(255, result.g + 40);
          result.b = Math.min(255, result.b + 40);
        }

        colorCache.set(cacheKey, result);
        resolve(result);
      } catch {
        reject(new Error('Color extraction failed'));
      }
    };

    img.onerror = () => reject(new Error('Image load failed'));
    img.src = imageUrl;
  });
}
