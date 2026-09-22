import { ColorGradeSettings, ColorPreset } from '../types';

export const defaultGrade: ColorGradeSettings = {
  exposure: 0,
  brightness: 0,
  contrast: 0,
  saturation: 0,
  vibrance: 0,
  temperature: 0,
  tint: 0,
  highlights: 0,
  shadows: 0,
  whites: 0,
  blacks: 0,
  clarity: 0,
  shadowsColor: { hue: 0, amount: 0 },
  midtonesColor: { hue: 0, amount: 0 },
  highlightsColor: { hue: 0, amount: 0 },
  grain: 0,
  vignette: 0,
  vignetteFeather: 50,
};

export const presets: ColorPreset[] = [
  {
    id: 'original',
    name: 'Original (Neutro)',
    category: 'Standard',
    description: 'Ignora todas as modificações de cor. Sinal bruto puro.',
    settings: { ...defaultGrade },
  },
  {
    id: 'cinematic-teal-orange',
    name: 'Teal & Orange (Cinema)',
    category: 'Film',
    description: 'Paleta cinematográfica de Hollywood: tons de pele quentes e sombras em ciano profundo.',
    settings: {
      ...defaultGrade,
      exposure: 0.1,
      contrast: 18,
      saturation: 12,
      temperature: 15,
      highlights: -10,
      shadows: 8,
      clarity: 15,
      shadowsColor: { hue: 195, amount: 0.35 },
      midtonesColor: { hue: 28, amount: 0.15 },
      highlightsColor: { hue: 42, amount: 0.28 },
    },
  },
  {
    id: 'warm-golden-hour',
    name: 'Hora Dourada (Golden Hour)',
    category: 'Standard',
    description: 'Luz solar âmbar rica, sombras suaves, médios elevados e calor envolvente.',
    settings: {
      ...defaultGrade,
      exposure: 0.2,
      brightness: 5,
      contrast: 10,
      saturation: 14,
      vibrance: 12,
      temperature: 38,
      tint: 6,
      highlights: 12,
      shadows: 5,
      midtonesColor: { hue: 35, amount: 0.22 },
      highlightsColor: { hue: 48, amount: 0.3 },
    },
  },
  {
    id: 'cold-nordic',
    name: 'Nordic Noir (Frio)',
    category: 'Creative',
    description: 'Clima dessaturado e sombrio de suspense escandinavo com nuances em azul metálico.',
    settings: {
      ...defaultGrade,
      exposure: -0.15,
      contrast: 22,
      saturation: -28,
      vibrance: -15,
      temperature: -45,
      tint: -8,
      blacks: -12,
      shadowsColor: { hue: 215, amount: 0.32 },
      midtonesColor: { hue: 200, amount: 0.18 },
      highlightsColor: { hue: 185, amount: 0.15 },
    },
  },
  {
    id: 'high-contrast-punch',
    name: 'Alto Contraste Intenso',
    category: 'Standard',
    description: 'Piso de pretos profundos, altas luzes especulares nítidas e impacto visual marcante.',
    settings: {
      ...defaultGrade,
      exposure: 0.05,
      contrast: 42,
      saturation: 8,
      highlights: 18,
      shadows: -22,
      whites: 15,
      blacks: -25,
      clarity: 25,
    },
  },
  {
    id: 'bleach-bypass',
    name: 'Bleach Bypass',
    category: 'Film',
    description: 'Efeito de retenção de prata analógica: contraste extremo, pretos esmagados e croma suave.',
    settings: {
      ...defaultGrade,
      contrast: 38,
      saturation: -55,
      clarity: 35,
      highlights: 20,
      shadows: -15,
      whites: 18,
      blacks: -20,
      shadowsColor: { hue: 210, amount: 0.15 },
      highlightsColor: { hue: 45, amount: 0.1 },
    },
  },
  {
    id: 'desaturated-documentary',
    name: 'Documentário Indie',
    category: 'Creative',
    description: 'Estilo sutil e orgânico com paleta de cores contida e elegante.',
    settings: {
      ...defaultGrade,
      exposure: -0.05,
      contrast: 8,
      saturation: -35,
      temperature: -8,
      shadows: 12,
      blacks: 8,
    },
  },
  {
    id: 'vintage-kodachrome',
    name: 'Filme Vintage 35mm',
    category: 'Stylized',
    description: 'Calor analógico clássico, pretos leitosos ligeiramente elevados e brilho âmbar-magenta.',
    settings: {
      ...defaultGrade,
      exposure: 0.1,
      contrast: 14,
      saturation: 16,
      temperature: 20,
      tint: 15,
      shadows: 18,
      blacks: 15,
      clarity: 10,
      shadowsColor: { hue: 280, amount: 0.18 },
      midtonesColor: { hue: 32, amount: 0.2 },
      highlightsColor: { hue: 52, amount: 0.22 },
    },
  },
  {
    id: 'cyberpunk-neon',
    name: 'Cyberpunk Neon',
    category: 'Stylized',
    description: 'Sombras em magenta e violeta elétrico contrastadas com altas luzes vívidas em ciano.',
    settings: {
      ...defaultGrade,
      exposure: 0.05,
      contrast: 30,
      saturation: 35,
      vibrance: 25,
      temperature: -15,
      tint: 22,
      shadowsColor: { hue: 290, amount: 0.45 },
      midtonesColor: { hue: 320, amount: 0.2 },
      highlightsColor: { hue: 175, amount: 0.38 },
    },
  },
];

/**
 * Converts polar coordinates (hue in degrees, amount 0..1)
 * into an RGB delta offset vector normalized around 0.
 */
function wheelToRGBVector(hue: number, amount: number) {
  if (amount <= 0.001) return { r: 0, g: 0, b: 0 };
  const rad = (hue * Math.PI) / 180;
  // Standard 3-phase color projection
  const r = Math.cos(rad);
  const g = Math.cos(rad - (2 * Math.PI) / 3);
  const b = Math.cos(rad - (4 * Math.PI) / 3);
  // Scale by amount
  return {
    r: r * amount * 0.8,
    g: g * amount * 0.8,
    b: b * amount * 0.8,
  };
}

/**
 * High performance deterministic color grading pixel processor.
 * Accepts source ImageData and full grade settings, returns a new graded ImageData.
 * Allows passing an existing targetBuffer to prevent GC allocations during high frame-rate video playback.
 */
export function applyColorGrade(
  srcImageData: ImageData,
  settings: ColorGradeSettings,
  targetBuffer?: ImageData
): ImageData {
  const width = srcImageData.width;
  const height = srcImageData.height;
  const src = srcImageData.data;

  // If settings are completely neutral and no destination is provided, fast copy
  const isNeutral =
    Math.abs(settings.exposure) < 0.001 &&
    settings.brightness === 0 &&
    settings.contrast === 0 &&
    settings.saturation === 0 &&
    settings.vibrance === 0 &&
    settings.temperature === 0 &&
    settings.tint === 0 &&
    settings.highlights === 0 &&
    settings.shadows === 0 &&
    settings.whites === 0 &&
    settings.blacks === 0 &&
    settings.clarity === 0 &&
    settings.shadowsColor.amount <= 0.001 &&
    settings.midtonesColor.amount <= 0.001 &&
    settings.highlightsColor.amount <= 0.001 &&
    (!settings.grain || settings.grain === 0) &&
    (!settings.vignette || settings.vignette === 0);

  let output: ImageData;
  if (targetBuffer && targetBuffer.width === width && targetBuffer.height === height) {
    output = targetBuffer;
    if (isNeutral) {
      output.data.set(src);
      return output;
    }
  } else {
    if (isNeutral) {
      return new ImageData(new Uint8ClampedArray(src), width, height);
    }
    output = new ImageData(width, height);
  }

  const dst = output.data;

  // Pre-calculate constants for fast inner loop
  const exposureMult = Math.pow(2, settings.exposure);
  const brightnessOffset = (settings.brightness / 100) * 0.4;
  const contrastFactor =
    settings.contrast >= 0
      ? 1 + settings.contrast / 100
      : 1 / (1 - settings.contrast / 100);

  // White balance coefficients
  // Temperature: positive warms (more red, less blue), negative cools
  const tempShift = settings.temperature / 100;
  const tempR = tempShift > 0 ? 1 + tempShift * 0.3 : 1 + tempShift * 0.15;
  const tempB = tempShift < 0 ? 1 - tempShift * 0.35 : 1 - tempShift * 0.2;

  // Tint: positive adds magenta (more R, more B, less G), negative adds green
  const tintShift = settings.tint / 100;
  const tintG = 1 - tintShift * 0.25;
  const tintR = 1 + Math.max(0, tintShift * 0.15);
  const tintB = 1 + Math.max(0, tintShift * 0.15);

  const satMult = 1 + settings.saturation / 100;
  const vibranceAmount = settings.vibrance / 100;

  // 3-way color wheel offset vectors
  const shVec = wheelToRGBVector(settings.shadowsColor.hue, settings.shadowsColor.amount);
  const midVec = wheelToRGBVector(settings.midtonesColor.hue, settings.midtonesColor.amount);
  const hiVec = wheelToRGBVector(settings.highlightsColor.hue, settings.highlightsColor.amount);

  const highlightsFactor = (settings.highlights / 100) * 0.4;
  const shadowsFactor = (settings.shadows / 100) * 0.4;
  const whitesFactor = (settings.whites / 100) * 0.3;
  const blacksFactor = (settings.blacks / 100) * 0.3;
  const clarityFactor = (settings.clarity / 100) * 0.3;

  // Vignette & Grain Precalculations
  const imgW = width;
  const imgH = height;
  const halfW = imgW / 2;
  const halfH = imgH / 2;
  const invHalfW = 1 / Math.max(1, halfW);
  const invHalfH = 1 / Math.max(1, halfH);

  const grainAmount = Math.max(0, Math.min(100, settings.grain || 0)) / 100;
  const vignetteAmount = Math.max(0, Math.min(100, settings.vignette || 0)) / 100;
  const vignetteFeather = Math.max(10, Math.min(100, settings.vignetteFeather ?? 50)) / 100;
  const hasGrain = grainAmount > 0;
  const hasVignette = vignetteAmount > 0;

  // Vignette falloff geometry: feather shifts the inner boundary from center to outer radius
  const innerVignetteRadius = Math.max(0.1, 0.95 - vignetteFeather * 0.65);
  const outerVignetteRadius = 1.4142; // Distance to corner in normalized aspect space
  const vignetteRange = Math.max(0.05, outerVignetteRadius - innerVignetteRadius);

  let px = 0;
  let py = 0;

  const len = src.length;
  for (let i = 0; i < len; i += 4) {
    let r = src[i] / 255;
    let g = src[i + 1] / 255;
    let b = src[i + 2] / 255;

    // 1. Exposure
    r *= exposureMult;
    g *= exposureMult;
    b *= exposureMult;

    // 2. White Balance (Temperature & Tint)
    r = r * tempR * tintR;
    g = g * tintG;
    b = b * tempB * tintB;

    // 3. Brightness
    r += brightnessOffset;
    g += brightnessOffset;
    b += brightnessOffset;

    // Rec.709 Luminance for tonal separation
    let luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;

    // Tonal weights:
    // Shadows: strongest near 0, decays to 0 above 0.5
    const wShadows = Math.max(0, 1 - luma * 2);
    // Highlights: strongest near 1, decays to 0 below 0.5
    const wHighlights = Math.max(0, (luma - 0.5) * 2);
    // Midtones: bell curve centered at 0.5
    const wMidtones = Math.max(0, 1 - Math.abs(luma - 0.5) * 2);

    // 4. 3-Way Color Wheels
    r += shVec.r * wShadows + midVec.r * wMidtones + hiVec.r * wHighlights;
    g += shVec.g * wShadows + midVec.g * wMidtones + hiVec.g * wHighlights;
    b += shVec.b * wShadows + midVec.b * wMidtones + hiVec.b * wHighlights;

    // 5. Dynamic range tone adjustments (Highlights, Shadows, Whites, Blacks)
    const highlightTonal = wHighlights * highlightsFactor;
    const shadowTonal = wShadows * shadowsFactor;
    const whiteTonal = Math.pow(Math.max(0, luma), 2) * whitesFactor;
    const blackTonal = Math.pow(Math.max(0, 1 - luma), 2) * blacksFactor;

    r += highlightTonal + shadowTonal + whiteTonal + blackTonal;
    g += highlightTonal + shadowTonal + whiteTonal + blackTonal;
    b += highlightTonal + shadowTonal + whiteTonal + blackTonal;

    // 6. Contrast (pivot around 0.5)
    r = (r - 0.5) * contrastFactor + 0.5;
    g = (g - 0.5) * contrastFactor + 0.5;
    b = (b - 0.5) * contrastFactor + 0.5;

    // 7. Clarity (mid-frequency midtone punch)
    if (clarityFactor !== 0) {
      const midPunch = wMidtones * clarityFactor * (luma - 0.5);
      r += midPunch;
      g += midPunch;
      b += midPunch;
    }

    // 8. Saturation and Vibrance
    luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    const maxChannel = Math.max(r, g, b);
    const minChannel = Math.min(r, g, b);
    const currentSat = maxChannel > 0 ? (maxChannel - minChannel) / maxChannel : 0;

    // Vibrance increases saturation on less-saturated pixels more
    const vibMult = 1 + vibranceAmount * (1 - currentSat);
    const totalSat = satMult * vibMult;

    r = luma + (r - luma) * totalSat;
    g = luma + (g - luma) * totalSat;
    b = luma + (b - luma) * totalSat;

    // 9. Lens Vignette (around the video or photo frame)
    if (hasVignette) {
      const dx = (px - halfW) * invHalfW;
      const dy = (py - halfH) * invHalfH;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist > innerVignetteRadius) {
        const t = Math.min(1, (dist - innerVignetteRadius) / vignetteRange);
        // Hermite smoothstep for gentle optical lens falloff
        const smoothT = t * t * (3 - 2 * t);
        const vigFactor = Math.max(0, 1 - smoothT * vignetteAmount);
        r *= vigFactor;
        g *= vigFactor;
        b *= vigFactor;
      }
    }

    // 10. Film Grain (authentic silver halide noise weighted across midtones)
    if (hasGrain) {
      const postLuma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      // Film grain naturally peaks in the midtones and softens in pure whites/deep blacks
      const grainWeight = Math.max(0.2, 1 - Math.abs(postLuma - 0.5) * 1.5);
      const noise = (Math.random() - 0.5) * 2 * grainAmount * 0.22 * grainWeight;
      r += noise;
      g += noise;
      b += noise;
    }

    // Clamping to [0, 255]
    dst[i] = r < 0 ? 0 : r > 1 ? 255 : (r * 255 + 0.5) | 0;
    dst[i + 1] = g < 0 ? 0 : g > 1 ? 255 : (g * 255 + 0.5) | 0;
    dst[i + 2] = b < 0 ? 0 : b > 1 ? 255 : (b * 255 + 0.5) | 0;
    // Alpha channel preserved
    dst[i + 3] = src[i + 3];

    px++;
    if (px === imgW) {
      px = 0;
      py++;
    }
  }

  return output;
}

// -------------------------------------------------------------
// Scopes generation utilities (Real-time Canvas Rendering)
// -------------------------------------------------------------

/**
 * Draws an industry-standard Waveform scope with IRE scale (0 to 100)
 */
export function drawWaveform(
  imageData: ImageData,
  canvas: HTMLCanvasElement,
  mode: 'green' | 'luma' | 'color' = 'green'
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;

  // Clear background (deep studio black)
  ctx.fillStyle = '#0a0c10';
  ctx.fillRect(0, 0, w, h);

  // Draw IRE grid lines: 100, 75, 50, 25, 0 IRE
  const ireLevels = [
    { ire: 100, y: 0.08 * h },
    { ire: 75, y: 0.3 * h },
    { ire: 50, y: 0.52 * h },
    { ire: 25, y: 0.74 * h },
    { ire: 0, y: 0.92 * h },
  ];

  ctx.strokeStyle = '#1e2433';
  ctx.lineWidth = 1;
  ctx.font = '9px "JetBrains Mono", monospace';
  ctx.fillStyle = '#4b5563';

  ireLevels.forEach(({ ire, y }) => {
    ctx.beginPath();
    ctx.moveTo(30, y);
    ctx.lineTo(w, y);
    ctx.stroke();
    ctx.fillText(`${ire}`, 6, y + 3);
  });

  const imgW = imageData.width;
  const imgH = imageData.height;
  const data = imageData.data;
  const usableW = w - 35;
  const usableH = 0.84 * h;
  const topOffset = 0.08 * h;

  // Subsample columns for high frame rates
  const stepX = Math.max(1, Math.floor(imgW / usableW));
  const stepY = Math.max(1, Math.floor(imgH / 180));

  ctx.fillStyle = mode === 'green' ? 'rgba(74, 222, 128, 0.12)' : 'rgba(214, 220, 235, 0.12)';

  for (let x = 0; x < imgW; x += stepX) {
    const targetX = 35 + (x / imgW) * usableW;
    for (let y = 0; y < imgH; y += stepY) {
      const idx = (y * imgW + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const luma = (0.2126 * r + 0.7152 * g + 0.0722 * b) / 255;
      const targetY = topOffset + (1 - luma) * usableH;
      ctx.fillRect(targetX, targetY, 1.2, 1.2);
    }
  }
}

/**
 * Draws an RGB Parade scope (Red, Green, Blue channels displayed side-by-side)
 */
export function drawRGBParade(
  imageData: ImageData,
  canvas: HTMLCanvasElement
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;

  ctx.fillStyle = '#0a0c10';
  ctx.fillRect(0, 0, w, h);

  const channelWidth = (w - 40) / 3;
  const channels = [
    { name: 'R', color: 'rgba(239, 68, 68, 0.18)', xOffset: 35 },
    { name: 'G', color: 'rgba(34, 197, 94, 0.18)', xOffset: 35 + channelWidth },
    { name: 'B', color: 'rgba(59, 130, 246, 0.18)', xOffset: 35 + channelWidth * 2 },
  ];

  // Grid
  ctx.strokeStyle = '#1e2433';
  ctx.lineWidth = 1;
  ctx.font = '9px "JetBrains Mono", monospace';
  ctx.fillStyle = '#4b5563';

  const ireLevels = [
    { ire: 100, y: 0.08 * h },
    { ire: 50, y: 0.52 * h },
    { ire: 0, y: 0.92 * h },
  ];

  ireLevels.forEach(({ ire, y }) => {
    ctx.beginPath();
    ctx.moveTo(30, y);
    ctx.lineTo(w, y);
    ctx.stroke();
    ctx.fillText(`${ire}`, 6, y + 3);
  });

  // Channel separators and titles
  channels.forEach((c, idx) => {
    ctx.fillStyle = c.color.replace('0.18', '0.9');
    ctx.fillText(c.name, c.xOffset + channelWidth / 2 - 4, 14);
    if (idx > 0) {
      ctx.strokeStyle = '#222736';
      ctx.beginPath();
      ctx.moveTo(c.xOffset, 0);
      ctx.lineTo(c.xOffset, h);
      ctx.stroke();
    }
  });

  const imgW = imageData.width;
  const imgH = imageData.height;
  const data = imageData.data;
  const usableH = 0.84 * h;
  const topOffset = 0.08 * h;

  const stepX = Math.max(1, Math.floor(imgW / (channelWidth * 0.9)));
  const stepY = Math.max(1, Math.floor(imgH / 140));

  for (let x = 0; x < imgW; x += stepX) {
    const normX = x / imgW;
    for (let y = 0; y < imgH; y += stepY) {
      const idx = (y * imgW + x) * 4;
      const r = data[idx] / 255;
      const g = data[idx + 1] / 255;
      const b = data[idx + 2] / 255;

      // Red
      ctx.fillStyle = channels[0].color;
      ctx.fillRect(
        channels[0].xOffset + normX * (channelWidth - 4),
        topOffset + (1 - r) * usableH,
        1.2,
        1.2
      );

      // Green
      ctx.fillStyle = channels[1].color;
      ctx.fillRect(
        channels[1].xOffset + normX * (channelWidth - 4),
        topOffset + (1 - g) * usableH,
        1.2,
        1.2
      );

      // Blue
      ctx.fillStyle = channels[2].color;
      ctx.fillRect(
        channels[2].xOffset + normX * (channelWidth - 4),
        topOffset + (1 - b) * usableH,
        1.2,
        1.2
      );
    }
  }
}

/**
 * Draws an industry-standard Vectorscope with chrominance targets (R, Y, G, C, B, M)
 * and the standard Skin Tone Line (I-axis).
 */
export function drawVectorscope(
  imageData: ImageData,
  canvas: HTMLCanvasElement
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;
  const cx = w / 2;
  const cy = h / 2;
  const radius = Math.min(cx, cy) - 16;

  ctx.fillStyle = '#0a0c10';
  ctx.fillRect(0, 0, w, h);

  // Outer circles (75% and 100% saturation graticules)
  ctx.strokeStyle = '#1e2433';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.arc(cx, cy, radius, 0, Math.PI * 2);
  ctx.stroke();

  ctx.beginPath();
  ctx.arc(cx, cy, radius * 0.75, 0, Math.PI * 2);
  ctx.stroke();

  // Crosshairs
  ctx.beginPath();
  ctx.moveTo(cx - radius, cy);
  ctx.lineTo(cx + radius, cy);
  ctx.moveTo(cx, cy - radius);
  ctx.lineTo(cx, cy + radius);
  ctx.stroke();

  // Standard Skin-Tone Line (I-axis at ~103° from +X axis / top-left quadrant)
  const skinAngle = -Math.PI * 0.57; // around 103 degrees counter-clockwise from bottom or standard SMPTE angle
  ctx.strokeStyle = '#f59e0b88';
  ctx.setLineDash([3, 3]);
  ctx.beginPath();
  ctx.moveTo(cx, cy);
  ctx.lineTo(cx + Math.cos(skinAngle) * radius, cy + Math.sin(skinAngle) * radius);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.font = '8px "JetBrains Mono", monospace';
  ctx.fillStyle = '#f59e0baa';
  ctx.fillText('SKIN', cx + Math.cos(skinAngle) * (radius * 0.75) + 4, cy + Math.sin(skinAngle) * (radius * 0.75));

  // Color targets (R, Y, G, C, B, M) at 75% saturation
  const targets = [
    { label: 'R', angle: -0.58, color: '#ef4444' },
    { label: 'M', angle: -1.63, color: '#ec4899' },
    { label: 'B', angle: -2.68, color: '#3b82f6' },
    { label: 'C', angle: 2.56, color: '#06b6d4' },
    { label: 'G', angle: 1.51, color: '#22c55e' },
    { label: 'Y', angle: 0.46, color: '#eab308' },
  ];

  targets.forEach((t) => {
    const tx = cx + Math.cos(t.angle) * (radius * 0.75);
    const ty = cy + Math.sin(t.angle) * (radius * 0.75);
    ctx.strokeStyle = t.color + 'aa';
    ctx.strokeRect(tx - 4, ty - 4, 8, 8);
    ctx.fillStyle = t.color;
    ctx.fillText(t.label, tx + 6, ty + 3);
  });

  // Plot chrominance cloud from pixels (Cb/Cr or U/V)
  const imgW = imageData.width;
  const imgH = imageData.height;
  const data = imageData.data;
  const step = Math.max(1, Math.floor((imgW * imgH) / 6000));

  ctx.fillStyle = 'rgba(74, 222, 128, 0.15)';

  for (let i = 0; i < data.length; i += step * 4) {
    const r = data[i] / 255;
    const g = data[i + 1] / 255;
    const b = data[i + 2] / 255;

    // YCbCr chrominance coordinates
    // Cb = -0.168736*R - 0.331264*G + 0.5*B
    // Cr = 0.5*R - 0.418688*G - 0.081312*B
    const cb = -0.1687 * r - 0.3313 * g + 0.5 * b;
    const cr = 0.5 * r - 0.4187 * g - 0.0813 * b;

    // Map to canvas coordinates
    const px = cx + (cb * 2.2) * radius;
    const py = cy - (cr * 2.2) * radius;

    ctx.fillRect(px, py, 1.2, 1.2);
  }
}

/**
 * Calculates 256-bin histogram for R, G, B, and Luminance
 */
export function calculateHistogram(imageData: ImageData) {
  const rBins = new Array(256).fill(0);
  const gBins = new Array(256).fill(0);
  const bBins = new Array(256).fill(0);
  const lumaBins = new Array(256).fill(0);

  const data = imageData.data;
  const len = data.length;

  for (let i = 0; i < len; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const luma = Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);

    rBins[r]++;
    gBins[g]++;
    bBins[b]++;
    lumaBins[luma]++;
  }

  let maxVal = 1;
  for (let i = 0; i < 256; i++) {
    if (rBins[i] > maxVal) maxVal = rBins[i];
    if (gBins[i] > maxVal) maxVal = gBins[i];
    if (bBins[i] > maxVal) maxVal = bBins[i];
    if (lumaBins[i] > maxVal) maxVal = lumaBins[i];
  }

  return { r: rBins, g: gBins, b: bBins, luma: lumaBins, maxVal };
}

/**
 * Draws histogram directly on a canvas
 */
export function drawHistogram(
  imageData: ImageData,
  canvas: HTMLCanvasElement,
  channel: 'all' | 'rgb' | 'luma' = 'all'
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;
  const w = canvas.width;
  const h = canvas.height;

  ctx.fillStyle = '#0a0c10';
  ctx.fillRect(0, 0, w, h);

  const { r, g, b, luma, maxVal } = calculateHistogram(imageData);

  // Background grid
  ctx.strokeStyle = '#1e2433';
  ctx.lineWidth = 1;
  for (let i = 1; i < 4; i++) {
    const x = (w / 4) * i;
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, h);
    ctx.stroke();
  }

  const drawChannelPath = (bins: number[], color: string, fill: string) => {
    ctx.beginPath();
    ctx.moveTo(0, h);
    for (let i = 0; i < 256; i++) {
      const x = (i / 255) * w;
      const normalizedHeight = (bins[i] / maxVal) * (h - 8);
      const y = h - normalizedHeight;
      ctx.lineTo(x, y);
    }
    ctx.lineTo(w, h);
    ctx.closePath();
    ctx.fillStyle = fill;
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.stroke();
  };

  if (channel === 'luma' || channel === 'all') {
    drawChannelPath(luma, 'rgba(255, 255, 255, 0.7)', 'rgba(255, 255, 255, 0.1)');
  }
  if (channel === 'rgb' || channel === 'all') {
    drawChannelPath(r, 'rgba(239, 68, 68, 0.8)', 'rgba(239, 68, 68, 0.12)');
    drawChannelPath(g, 'rgba(34, 197, 94, 0.8)', 'rgba(34, 197, 94, 0.12)');
    drawChannelPath(b, 'rgba(59, 130, 246, 0.8)', 'rgba(59, 130, 246, 0.12)');
  }
}
