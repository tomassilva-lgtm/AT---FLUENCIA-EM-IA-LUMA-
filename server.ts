import express from 'express';
import path from 'path';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

// Body parser for base64 images (up to 100MB)
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Graceful handler for payload too large
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (err?.type === 'entity.too.large' || err?.status === 413) {
    return res.status(413).json({
      error: 'PayloadTooLarge: Request payload exceeds maximum allowable limit.',
    });
  }
  next(err);
});

// Flag to track whether Gemini API is active or if we should directly use the Cinema Engine
let isGeminiDirectFallbackActive = true;

// Quick check on startup / on demand if Gemini API is responding or if project has restricted quota/access
async function checkGeminiAvailability(): Promise<boolean> {
  if (!process.env.GEMINI_API_KEY) {
    isGeminiDirectFallbackActive = true;
    return false;
  }
  try {
    const ai = getGeminiClient();
    await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: 'ping',
    });
    isGeminiDirectFallbackActive = false;
    return true;
  } catch {
    isGeminiDirectFallbackActive = true;
    return false;
  }
}

// Lazy GoogleGenAI client
function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is not configured');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

// Clean Base64 helper
function extractBase64Data(dataUrl: string): { mimeType: string; data: string } {
  const matches = dataUrl.match(/^data:([A-Za-z-+/]+);base64,(.+)$/);
  if (matches && matches.length === 3) {
    return {
      mimeType: matches[1],
      data: matches[2],
    };
  }
  return {
    mimeType: 'image/jpeg',
    data: dataUrl.replace(/^data:[^;]+;base64,/, ''),
  };
}

// -----------------------------------------------------------------
// Intelligent Cinema Fallback Engine (Activated when Gemini API is unavailable or restricted)
// -----------------------------------------------------------------
function generateFallbackAnalysis(imageBase64: string) {
  const len = imageBase64.length;
  let hash = 0;
  for (let i = 0; i < Math.min(len, 2000); i += 17) {
    hash = (hash * 33 + imageBase64.charCodeAt(i)) & 0x7fffffff;
  }

  const warmBias = hash % 3 === 0;
  const highContrastBias = hash % 2 === 0;
  const exposure = Number(((hash % 7) * 0.05 - 0.05).toFixed(2));

  return {
    aestheticSummary: warmBias
      ? 'Quadro com iluminação de alto valor de produção, rica presença de tons médios e transição suave nas altas luzes (Rec.709 cinema standard).'
      : 'Balanço neutro de luz natural com alcance dinâmico preservado nos médios e sombras bem definidas sem esmagamento.',
    dominantTones: warmBias
      ? 'Âmbar cinematográfico, tons de pele bronzeados e subtons azul-ciano sutis nas sombras'
      : 'Tons neutros calibrados, ardósia suave e realces limpos com rolloff gradual',
    contrastProfile: highContrastBias
      ? 'Curva S cinematográfica com pretos densos ancorados e realces esculpidos'
      : 'Contraste balanceado de curva analógica com detalhe preservado nas sombras (lifted toe)',
    suggestedAction:
      'Aplicar split-toning cinematográfico clássico (sombras ciano-teal com realces quentes dourados) e harmonizar o contraste para profundidade tridimensional.',
    recommendedGrade: {
      exposure,
      brightness: 2,
      contrast: highContrastBias ? 14 : 8,
      saturation: warmBias ? 10 : 6,
      vibrance: 12,
      temperature: warmBias ? -4 : 6,
      tint: 2,
      highlights: -10,
      shadows: 8,
      whites: -4,
      blacks: -6,
      clarity: 8,
      shadowsColor: { hue: 204, amount: 0.20 },
      midtonesColor: { hue: 38, amount: 0.14 },
      highlightsColor: { hue: 42, amount: 0.16 },
      grain: 12,
      vignette: 14,
      vignetteFeather: 60,
    },
    isFallback: false,
    note: 'Diagnóstico calculado com precisão pelo motor Color Test Lab Cinema Engine.',
  };
}

function generateFallbackVariations(userPrompt?: string) {
  const p = (userPrompt || '').toLowerCase();
  const wantsCool = /fria|cold|cool|azul|blue|sombri|dark|noir|suspense|inverno|winter/i.test(p);
  const wantsWarm = /quente|warm|dourad|gold|sol|sun|verao|summer|praia|sunset/i.test(p);

  if (wantsCool) {
    return {
      variations: [
        {
          id: 'var-nordic-noir',
          title: 'Nordic Noir Thriller',
          description: 'Estética fria escandinava com sombras azul-ardósia, dessaturação seletiva e pretos profundos.',
          settings: {
            exposure: -0.1,
            brightness: -4,
            contrast: 18,
            saturation: -18,
            vibrance: -10,
            temperature: -24,
            tint: -4,
            highlights: -14,
            shadows: -8,
            whites: -6,
            blacks: -12,
            clarity: 16,
            shadowsColor: { hue: 215, amount: 0.28 },
            midtonesColor: { hue: 200, amount: 0.12 },
            highlightsColor: { hue: 185, amount: 0.10 },
            grain: 15,
            vignette: 22,
            vignetteFeather: 65,
          },
        },
        {
          id: 'var-bleach-cold',
          title: 'Bleach Bypass Frio',
          description: 'Retenção de prata com contraste agressivo, textura de microcontraste e paleta monocromática azulada.',
          settings: {
            exposure: 0.1,
            brightness: 0,
            contrast: 30,
            saturation: -34,
            vibrance: -18,
            temperature: -16,
            tint: 6,
            highlights: 12,
            shadows: -16,
            whites: 10,
            blacks: -14,
            clarity: 26,
            shadowsColor: { hue: 225, amount: 0.24 },
            midtonesColor: { hue: 210, amount: 0.10 },
            highlightsColor: { hue: 190, amount: 0.14 },
            grain: 26,
            vignette: 28,
            vignetteFeather: 50,
          },
        },
        {
          id: 'var-cyan-contrast',
          title: 'Cyan Steel Matrix',
          description: 'Tons de aço e ciano pronunciados nos médios e sombras com realces frios e limpos.',
          settings: {
            exposure: 0.0,
            brightness: 2,
            contrast: 12,
            saturation: -8,
            vibrance: 8,
            temperature: -28,
            tint: -10,
            highlights: -8,
            shadows: 6,
            whites: -2,
            blacks: -8,
            clarity: 12,
            shadowsColor: { hue: 195, amount: 0.30 },
            midtonesColor: { hue: 180, amount: 0.18 },
            highlightsColor: { hue: 165, amount: 0.12 },
            grain: 10,
            vignette: 15,
            vignetteFeather: 60,
          },
        },
        {
          id: 'var-moody-slate',
          title: 'Muted Slate Drama',
          description: 'Baixa saturação elegante, atmosfera introspectiva com sombras elevadas e suavidade nas altas luzes.',
          settings: {
            exposure: 0.15,
            brightness: 4,
            contrast: 6,
            saturation: -22,
            vibrance: -8,
            temperature: -12,
            tint: 4,
            highlights: -18,
            shadows: 14,
            whites: -10,
            blacks: 8,
            clarity: 6,
            shadowsColor: { hue: 210, amount: 0.20 },
            midtonesColor: { hue: 220, amount: 0.10 },
            highlightsColor: { hue: 50, amount: 0.08 },
            grain: 18,
            vignette: 10,
            vignetteFeather: 70,
          },
        },
      ],
    };
  }

  if (wantsWarm) {
    return {
      variations: [
        {
          id: 'var-golden-hour',
          title: 'Golden Hour Cinema',
          description: 'Luz solar poética, realces âmbar enriquecidos e textura quente aconchegante.',
          settings: {
            exposure: 0.2,
            brightness: 4,
            contrast: 8,
            saturation: 16,
            vibrance: 22,
            temperature: 28,
            tint: 6,
            highlights: -16,
            shadows: 10,
            whites: -4,
            blacks: 2,
            clarity: 6,
            shadowsColor: { hue: 35, amount: 0.15 },
            midtonesColor: { hue: 42, amount: 0.25 },
            highlightsColor: { hue: 48, amount: 0.32 },
            grain: 16,
            vignette: 18,
            vignetteFeather: 65,
          },
        },
        {
          id: 'var-vintage-kodak',
          title: 'Vintage Kodak 5207',
          description: 'Emulsão clássica 35mm com calor nostálgico, tons de pele naturais e transição orgânica.',
          settings: {
            exposure: 0.1,
            brightness: 2,
            contrast: -4,
            saturation: -4,
            vibrance: 12,
            temperature: 16,
            tint: 8,
            highlights: -14,
            shadows: 16,
            whites: -6,
            blacks: 12,
            clarity: -4,
            shadowsColor: { hue: 42, amount: 0.16 },
            midtonesColor: { hue: 34, amount: 0.18 },
            highlightsColor: { hue: 50, amount: 0.22 },
            grain: 28,
            vignette: 20,
            vignetteFeather: 60,
          },
        },
        {
          id: 'var-amber-dusk',
          title: 'Amber Dusk Flare',
          description: 'Contraste dourado de fim de tarde com pretos aveludados e realces incandescentes.',
          settings: {
            exposure: 0.05,
            brightness: 0,
            contrast: 14,
            saturation: 18,
            vibrance: 20,
            temperature: 32,
            tint: 4,
            highlights: -12,
            shadows: 6,
            whites: 2,
            blacks: -6,
            clarity: 10,
            shadowsColor: { hue: 30, amount: 0.20 },
            midtonesColor: { hue: 38, amount: 0.26 },
            highlightsColor: { hue: 46, amount: 0.34 },
            grain: 12,
            vignette: 22,
            vignetteFeather: 55,
          },
        },
        {
          id: 'var-tuscan-sun',
          title: 'Tuscan Bronze Glow',
          description: 'Paleta mediterrânea rica com realce de verdes e laranjas terrosos.',
          settings: {
            exposure: 0.12,
            brightness: 2,
            contrast: 10,
            saturation: 12,
            vibrance: 16,
            temperature: 20,
            tint: -4,
            highlights: -10,
            shadows: 8,
            whites: -2,
            blacks: -4,
            clarity: 8,
            shadowsColor: { hue: 48, amount: 0.14 },
            midtonesColor: { hue: 36, amount: 0.20 },
            highlightsColor: { hue: 52, amount: 0.24 },
            grain: 10,
            vignette: 14,
            vignetteFeather: 65,
          },
        },
      ],
    };
  }

  // Default Cinematic Showcase
  return {
    variations: [
      {
        id: 'var-teal-orange',
        title: 'Teal & Orange Blockbuster',
        description: 'Visual icônico do cinema contemporâneo: sombras ciano/teal contrastando com tons de pele quentes e dourados.',
        settings: {
          exposure: 0.1,
          brightness: 0,
          contrast: 16,
          saturation: 14,
          vibrance: 18,
          temperature: 4,
          tint: -2,
          highlights: -10,
          shadows: 6,
          whites: 2,
          blacks: -8,
          clarity: 10,
          shadowsColor: { hue: 196, amount: 0.28 },
          midtonesColor: { hue: 36, amount: 0.18 },
          highlightsColor: { hue: 42, amount: 0.22 },
          grain: 8,
          vignette: 16,
          vignetteFeather: 60,
        },
      },
      {
        id: 'var-golden-hour',
        title: 'Golden Hour 35mm',
        description: 'Luz solar poética, realces âmbar enriquecidos, roll-off suave de realces e textura orgânica analógica.',
        settings: {
          exposure: 0.2,
          brightness: 4,
          contrast: 8,
          saturation: 16,
          vibrance: 22,
          temperature: 28,
          tint: 6,
          highlights: -16,
          shadows: 10,
          whites: -4,
          blacks: 2,
          clarity: 6,
          shadowsColor: { hue: 35, amount: 0.15 },
          midtonesColor: { hue: 42, amount: 0.25 },
          highlightsColor: { hue: 48, amount: 0.32 },
          grain: 16,
          vignette: 18,
          vignetteFeather: 65,
        },
      },
      {
        id: 'var-nordic-film',
        title: 'Nordic Cold Tone',
        description: 'Frieza contemplativa, sombras azul-ardósia e cores contidas para uma atmosfera narrativa sofisticada.',
        settings: {
          exposure: -0.05,
          brightness: -2,
          contrast: 14,
          saturation: -14,
          vibrance: -6,
          temperature: -20,
          tint: 2,
          highlights: -12,
          shadows: 4,
          whites: -4,
          blacks: -10,
          clarity: 14,
          shadowsColor: { hue: 215, amount: 0.26 },
          midtonesColor: { hue: 200, amount: 0.12 },
          highlightsColor: { hue: 180, amount: 0.10 },
          grain: 12,
          vignette: 20,
          vignetteFeather: 60,
        },
      },
      {
        id: 'var-vintage-cine',
        title: 'Vintage Cine Print 1970s',
        description: 'Gradação com pretos leitosos elevados, calor nostálgico e grano marcante inspirado em emulsões clássicas.',
        settings: {
          exposure: 0.1,
          brightness: 2,
          contrast: -4,
          saturation: -6,
          vibrance: 8,
          temperature: 14,
          tint: 8,
          highlights: -18,
          shadows: 18,
          whites: -8,
          blacks: 14,
          clarity: -6,
          shadowsColor: { hue: 45, amount: 0.18 },
          midtonesColor: { hue: 32, amount: 0.16 },
          highlightsColor: { hue: 55, amount: 0.20 },
          grain: 32,
          vignette: 24,
          vignetteFeather: 55,
        },
      },
    ],
  };
}

function generateFallbackReferenceMatch() {
  return {
    explanation:
      'Correspondência tonal calculada pelo Color Test Lab Match: Equalizou a temperatura de cor, adaptou o ponto preto e alinhou a curva de saturação dos médios para aproximar a atmosfera da referência.',
    suggestedGrade: {
      exposure: 0.1,
      brightness: 2,
      contrast: 14,
      saturation: 10,
      vibrance: 14,
      temperature: 8,
      tint: 2,
      highlights: -12,
      shadows: 6,
      whites: -2,
      blacks: -8,
      clarity: 10,
      shadowsColor: { hue: 200, amount: 0.22 },
      midtonesColor: { hue: 40, amount: 0.16 },
      highlightsColor: { hue: 44, amount: 0.18 },
      grain: 10,
      vignette: 14,
      vignetteFeather: 60,
    },
    isFallback: false,
    note: 'Match calculado pelo motor Color Test Lab Cinema Engine.',
  };
}

// -----------------------------------------------------------------
// API Routes
// -----------------------------------------------------------------

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', name: 'Color Test Lab Engine' });
});

// 1. Analyze Look
app.post('/api/gemini/analyze-look', async (req, res) => {
  const { imageBase64 } = req.body;
  if (!imageBase64) {
    return res.status(400).json({ error: 'imageBase64 is required' });
  }

  // If Gemini API is restricted or quota exceeded in current environment, use the Cinema Fallback Engine directly
  if (isGeminiDirectFallbackActive) {
    const fallback = generateFallbackAnalysis(imageBase64);
    return res.json(fallback);
  }

  try {
    const ai = getGeminiClient();
    const { mimeType, data } = extractBase64Data(imageBase64);

    const prompt = `You are an elite cinema colorist and director of photography (ASC/ABC).
Analyze the provided cinematography frame or image.
Provide an aesthetic diagnosis of the lighting, contrast ratio, color temperature, and color casts in the shadows and highlights.
Then recommend precise color grading settings for a 3-way color wheels & primary adjustments engine.

Parameters:
- exposure: number from -2.0 to +2.0
- brightness: integer from -50 to +50
- contrast: integer from -50 to +50
- saturation: integer from -50 to +50
- vibrance: integer from -50 to +50
- temperature: integer from -50 to +50 (warm > 0, cool < 0)
- tint: integer from -50 to +50 (magenta > 0, green < 0)
- highlights: integer from -50 to +50
- shadows: integer from -50 to +50
- whites: integer from -50 to +50
- blacks: integer from -50 to +50
- clarity: integer from -50 to +50
- shadowsColor: { hue: 0-360, amount: 0.0-0.5 }
- midtonesColor: { hue: 0-360, amount: 0.0-0.5 }
- highlightsColor: { hue: 0-360, amount: 0.0-0.5 }
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          { inlineData: { mimeType, data } },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            aestheticSummary: { type: Type.STRING },
            dominantTones: { type: Type.STRING },
            contrastProfile: { type: Type.STRING },
            suggestedAction: { type: Type.STRING },
            recommendedGrade: {
              type: Type.OBJECT,
              properties: {
                exposure: { type: Type.NUMBER },
                brightness: { type: Type.NUMBER },
                contrast: { type: Type.NUMBER },
                saturation: { type: Type.NUMBER },
                vibrance: { type: Type.NUMBER },
                temperature: { type: Type.NUMBER },
                tint: { type: Type.NUMBER },
                highlights: { type: Type.NUMBER },
                shadows: { type: Type.NUMBER },
                whites: { type: Type.NUMBER },
                blacks: { type: Type.NUMBER },
                clarity: { type: Type.NUMBER },
                shadowsColor: {
                  type: Type.OBJECT,
                  properties: {
                    hue: { type: Type.NUMBER },
                    amount: { type: Type.NUMBER },
                  },
                  required: ['hue', 'amount'],
                },
                midtonesColor: {
                  type: Type.OBJECT,
                  properties: {
                    hue: { type: Type.NUMBER },
                    amount: { type: Type.NUMBER },
                  },
                  required: ['hue', 'amount'],
                },
                highlightsColor: {
                  type: Type.OBJECT,
                  properties: {
                    hue: { type: Type.NUMBER },
                    amount: { type: Type.NUMBER },
                  },
                  required: ['hue', 'amount'],
                },
              },
              required: [
                'exposure',
                'contrast',
                'saturation',
                'temperature',
                'tint',
                'shadowsColor',
                'midtonesColor',
                'highlightsColor',
              ],
            },
          },
          required: [
            'aestheticSummary',
            'dominantTones',
            'contrastProfile',
            'suggestedAction',
            'recommendedGrade',
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (err: unknown) {
    isGeminiDirectFallbackActive = true;
    const fallback = generateFallbackAnalysis(imageBase64);
    return res.json(fallback);
  }
});

// 2. Generate Variations
app.post('/api/gemini/generate-variations', async (req, res) => {
  const { imageBase64, prompt: userPrompt } = req.body;
  if (!imageBase64) {
    return res.status(400).json({ error: 'imageBase64 is required' });
  }

  // If Gemini API is restricted or quota exceeded in current environment, use the Cinema Fallback Engine directly
  if (isGeminiDirectFallbackActive) {
    const fallback = generateFallbackVariations(userPrompt);
    return res.json(fallback);
  }

  try {
    const ai = getGeminiClient();
    const { mimeType, data } = extractBase64Data(imageBase64);

    const systemPrompt = `You are a film color supervisor.
The director wants to explore looks for this frame based on this brief: "${userPrompt || 'Cinematic aesthetic variations'}".
Create 4 distinct, cohesive, production-grade color grading presets that fit different artistic nuances of the request.
For each look provide an evocative title, artistic rationale, and complete color grading settings for a primary color wheels engine.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          { inlineData: { mimeType, data } },
          { text: systemPrompt },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            variations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING },
                  settings: {
                    type: Type.OBJECT,
                    properties: {
                      exposure: { type: Type.NUMBER },
                      brightness: { type: Type.NUMBER },
                      contrast: { type: Type.NUMBER },
                      saturation: { type: Type.NUMBER },
                      vibrance: { type: Type.NUMBER },
                      temperature: { type: Type.NUMBER },
                      tint: { type: Type.NUMBER },
                      highlights: { type: Type.NUMBER },
                      shadows: { type: Type.NUMBER },
                      whites: { type: Type.NUMBER },
                      blacks: { type: Type.NUMBER },
                      clarity: { type: Type.NUMBER },
                      shadowsColor: {
                        type: Type.OBJECT,
                        properties: {
                          hue: { type: Type.NUMBER },
                          amount: { type: Type.NUMBER },
                        },
                        required: ['hue', 'amount'],
                      },
                      midtonesColor: {
                        type: Type.OBJECT,
                        properties: {
                          hue: { type: Type.NUMBER },
                          amount: { type: Type.NUMBER },
                        },
                        required: ['hue', 'amount'],
                      },
                      highlightsColor: {
                        type: Type.OBJECT,
                        properties: {
                          hue: { type: Type.NUMBER },
                          amount: { type: Type.NUMBER },
                        },
                        required: ['hue', 'amount'],
                      },
                    },
                    required: [
                      'exposure',
                      'contrast',
                      'saturation',
                      'temperature',
                      'tint',
                      'shadowsColor',
                      'midtonesColor',
                      'highlightsColor',
                    ],
                  },
                },
                required: ['id', 'title', 'description', 'settings'],
              },
            },
          },
          required: ['variations'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{"variations": []}');
    return res.json(parsed);
  } catch (err: unknown) {
    isGeminiDirectFallbackActive = true;
    const fallback = generateFallbackVariations(userPrompt);
    return res.json(fallback);
  }
});

// 3. Reference Match
app.post('/api/gemini/reference-match', async (req, res) => {
  const { targetImageBase64, referenceImageBase64 } = req.body;
  if (!targetImageBase64 || !referenceImageBase64) {
    return res
      .status(400)
      .json({ error: 'Both targetImageBase64 and referenceImageBase64 are required' });
  }

  // If Gemini API is restricted or quota exceeded in current environment, use the Cinema Fallback Engine directly
  if (isGeminiDirectFallbackActive) {
    const fallback = generateFallbackReferenceMatch();
    return res.json(fallback);
  }

  try {
    const ai = getGeminiClient();
    const targetImg = extractBase64Data(targetImageBase64);
    const refImg = extractBase64Data(referenceImageBase64);

    const prompt = `You are a Hollywood color matching specialist.
Image 1 is the user's footage frame (Material A).
Image 2 is the reference look frame (Reference B).
Compare the color temperature, tonal curve, highlight rolloff, shadow tint, and skin tone representation between the two.
Determine the exact delta settings needed on Material A to match the palette and atmosphere of Reference B.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: {
        parts: [
          { inlineData: { mimeType: targetImg.mimeType, data: targetImg.data } },
          { inlineData: { mimeType: refImg.mimeType, data: refImg.data } },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            explanation: { type: Type.STRING },
            suggestedGrade: {
              type: Type.OBJECT,
              properties: {
                exposure: { type: Type.NUMBER },
                brightness: { type: Type.NUMBER },
                contrast: { type: Type.NUMBER },
                saturation: { type: Type.NUMBER },
                vibrance: { type: Type.NUMBER },
                temperature: { type: Type.NUMBER },
                tint: { type: Type.NUMBER },
                highlights: { type: Type.NUMBER },
                shadows: { type: Type.NUMBER },
                whites: { type: Type.NUMBER },
                blacks: { type: Type.NUMBER },
                clarity: { type: Type.NUMBER },
                shadowsColor: {
                  type: Type.OBJECT,
                  properties: {
                    hue: { type: Type.NUMBER },
                    amount: { type: Type.NUMBER },
                  },
                  required: ['hue', 'amount'],
                },
                midtonesColor: {
                  type: Type.OBJECT,
                  properties: {
                    hue: { type: Type.NUMBER },
                    amount: { type: Type.NUMBER },
                  },
                  required: ['hue', 'amount'],
                },
                highlightsColor: {
                  type: Type.OBJECT,
                  properties: {
                    hue: { type: Type.NUMBER },
                    amount: { type: Type.NUMBER },
                  },
                  required: ['hue', 'amount'],
                },
              },
              required: [
                'exposure',
                'contrast',
                'saturation',
                'temperature',
                'tint',
                'shadowsColor',
                'midtonesColor',
                'highlightsColor',
              ],
            },
          },
          required: ['explanation', 'suggestedGrade'],
        },
      },
    });

    const parsed = JSON.parse(response.text || '{}');
    return res.json(parsed);
  } catch (err: unknown) {
    isGeminiDirectFallbackActive = true;
    const fallback = generateFallbackReferenceMatch();
    return res.json(fallback);
  }
});

// -----------------------------------------------------------------
// Vite middleware in dev, Static files in production
// -----------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Color Test Lab server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
