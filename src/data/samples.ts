import { SampleMedia } from '../types';

export const sampleFrames: SampleMedia[] = [
  {
    id: 'cinematic-portrait',
    name: 'Retrato Filme 35mm (Foto 3:2)',
    category: 'Retrato',
    url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1200&auto=format&fit=crop',
    type: 'image',
    resolution: '1200 × 800 (3:2)',
  },
  {
    id: 'vertical-neon-reel',
    name: 'Moda Neon Tóquio (Vertical 9:16)',
    category: 'Reel Vertical',
    url: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=720&auto=format&fit=crop',
    type: 'image',
    resolution: '720 × 1280 (9:16)',
  },
  {
    id: 'square-macro-still',
    name: 'Prisma de Espectro de Cor (Quadrado 1:1)',
    category: 'Estúdio',
    url: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?q=80&w=1000&auto=format&fit=crop',
    type: 'image',
    resolution: '1000 × 1000 (1:1)',
  },
  {
    id: 'cyberpunk-neon',
    name: 'Chuva e Noite Urbana em Tóquio (HD 16:9)',
    category: 'Urbano / Noir',
    url: 'https://images.unsplash.com/photo-1509198397868-475647b2a1e5?q=80&w=1280&auto=format&fit=crop',
    type: 'image',
    resolution: '1280 × 720 (16:9)',
  },
  {
    id: 'coastal-mist',
    name: 'Falésia Oceânica Nórdica (Anamórfico 2.39:1)',
    category: 'Cinema Scope',
    url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1200&auto=format&fit=crop',
    type: 'image',
    resolution: '1200 × 502 (2.39:1)',
  },
  {
    id: 'vintage-interior',
    name: 'Interior com Luz Suave de Janela (3:2)',
    category: 'Interior',
    url: 'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=1200&auto=format&fit=crop',
    type: 'image',
    resolution: '1200 × 800 (3:2)',
  },
];

export const sampleVideos: SampleMedia[] = [
  {
    id: 'tears-of-steel',
    name: 'Tears of Steel (Cinema Ficção Científica)',
    category: 'Cinema / VFX',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/TearsOfSteel.mp4',
    type: 'video',
    duration: '12:14',
    resolution: '1920 × 1080 (HD)',
  },
  {
    id: 'for-bigger-blazes',
    name: 'Comercial de Ação (High Key)',
    category: 'Comercial / Ação',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
    type: 'video',
    duration: '00:15',
    resolution: '1280 × 720 (720p)',
  },
  {
    id: 'big-buck-bunny',
    name: 'Luz Diurna e Prado (Natureza Vibrante)',
    category: 'Animação / Luz do Dia',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    type: 'video',
    duration: '09:56',
    resolution: '1280 × 720 (720p)',
  },
  {
    id: 'elephants-dream',
    name: 'Elephants Dream (Ficção Sombria)',
    category: 'Ficção / Sombrio',
    url: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    type: 'video',
    duration: '10:53',
    resolution: '1280 × 720 (720p)',
  },
];

/**
 * Creates a high-fidelity synthetic cinema calibration frame if network images fail or for offline tests.
 */
export function generateCalibrationFrame(width = 1280, height = 720): ImageData {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;

  // 1. Cinematic gradient background
  const bgGrad = ctx.createLinearGradient(0, 0, width, height);
  bgGrad.addColorStop(0, '#0c121e');
  bgGrad.addColorStop(0.3, '#19283c');
  bgGrad.addColorStop(0.7, '#382218');
  bgGrad.addColorStop(1, '#0e0b08');
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, width, height);

  // 2. Diffuse warm keylight sphere (simulating subject lighting)
  const keyLight = ctx.createRadialGradient(
    width * 0.45,
    height * 0.45,
    30,
    width * 0.45,
    height * 0.45,
    height * 0.42
  );
  keyLight.addColorStop(0, 'rgba(255, 235, 205, 0.95)');
  keyLight.addColorStop(0.35, 'rgba(230, 160, 110, 0.7)');
  keyLight.addColorStop(0.7, 'rgba(120, 50, 40, 0.35)');
  keyLight.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = keyLight;
  ctx.beginPath();
  ctx.arc(width * 0.45, height * 0.45, height * 0.42, 0, Math.PI * 2);
  ctx.fill();

  // 3. Cool rim/kicker light from opposite side
  const rimLight = ctx.createRadialGradient(
    width * 0.75,
    height * 0.3,
    10,
    width * 0.75,
    height * 0.3,
    height * 0.35
  );
  rimLight.addColorStop(0, 'rgba(100, 210, 255, 0.85)');
  rimLight.addColorStop(0.5, 'rgba(20, 100, 180, 0.3)');
  rimLight.addColorStop(1, 'rgba(0, 0, 0, 0)');
  ctx.fillStyle = rimLight;
  ctx.beginPath();
  ctx.arc(width * 0.75, height * 0.3, height * 0.35, 0, Math.PI * 2);
  ctx.fill();

  // 4. SMPTE Macbeth-style color chips at bottom for calibration testing
  const chipColors = [
    '#735244', '#c29682', '#627a9d', '#576c43', '#8580b1', '#67bdaa',
    '#d67e2c', '#505ba6', '#c15a63', '#5e3c6c', '#9dbc40', '#e0a32e',
    '#383f96', '#469449', '#af363c', '#e7c71f', '#bb5695', '#0885a1',
    '#ffffff', '#c8c8c8', '#a0a0a0', '#7a7a7a', '#555555', '#1a1a1a',
  ];
  const chipW = Math.floor((width * 0.8) / 12);
  const chipH = 24;
  const startX = (width - chipW * 12) / 2;
  const startY = height - 70;

  chipColors.slice(0, 12).forEach((c, idx) => {
    ctx.fillStyle = c;
    ctx.fillRect(startX + idx * chipW, startY, chipW - 2, chipH);
  });
  chipColors.slice(12, 24).forEach((c, idx) => {
    ctx.fillStyle = c;
    ctx.fillRect(startX + idx * chipW, startY + chipH + 2, chipW - 2, chipH);
  });

  // Cinema frame guides
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.lineWidth = 1;
  ctx.strokeRect(width * 0.05, height * 0.05, width * 0.9, height * 0.9);

  return ctx.getImageData(0, 0, width, height);
}
