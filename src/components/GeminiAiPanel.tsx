import React, { useState } from 'react';
import { ColorGradeSettings, GeminiLookAnalysis, GeminiVariationItem } from '../types';
import { Sparkles, Wand2, Image as ImageIcon, Check, Loader2, AlertCircle, ArrowRight } from 'lucide-react';

interface GeminiAiPanelProps {
  currentSettings: ColorGradeSettings;
  getCanvasImageDataUrl: () => string | undefined;
  onApplyGrade: (settings: ColorGradeSettings) => void;
}

export const GeminiAiPanel: React.FC<GeminiAiPanelProps> = ({
  currentSettings,
  getCanvasImageDataUrl,
  onApplyGrade,
}) => {
  const [activeTab, setActiveTab] = useState<'analyze' | 'variations' | 'reference'>('analyze');

  // Analyze Look State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<GeminiLookAnalysis | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  // Variations State
  const [variationPrompt, setVariationPrompt] = useState(
    'Quero testar esse frame com uma estética mais fria e dramática'
  );
  const [isGeneratingVariations, setIsGeneratingVariations] = useState(false);
  const [variationsList, setVariationsList] = useState<GeminiVariationItem[]>([]);
  const [variationsError, setVariationsError] = useState<string | null>(null);

  // Reference Match State
  const [refImageBase64, setRefImageBase64] = useState<string | null>(null);
  const [isMatching, setIsMatching] = useState(false);
  const [matchResult, setMatchResult] = useState<{
    explanation: string;
    suggestedGrade: ColorGradeSettings;
  } | null>(null);
  const [matchError, setMatchError] = useState<string | null>(null);

  // Safe apply helper
  const handleSafeApplyGrade = (grade: ColorGradeSettings) => {
    onApplyGrade({
      ...currentSettings,
      ...grade,
      shadowsColor: { ...currentSettings.shadowsColor, ...(grade.shadowsColor || {}) },
      midtonesColor: { ...currentSettings.midtonesColor, ...(grade.midtonesColor || {}) },
      highlightsColor: { ...currentSettings.highlightsColor, ...(grade.highlightsColor || {}) },
    });
  };

  // 1. Analyze Look
  const handleAnalyzeLook = async () => {
    const dataUrl = getCanvasImageDataUrl();
    if (!dataUrl) {
      setAnalysisError('No frame signal available to analyze.');
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);
    try {
      const res = await fetch('/api/gemini/analyze-look', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: dataUrl }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server error ${res.status}`);
      }

      const data: GeminiLookAnalysis = await res.json();
      setAnalysisResult(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Analysis failed';
      setAnalysisError(message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 2. Generate Variations
  const handleGenerateVariations = async (e: React.FormEvent) => {
    e.preventDefault();
    const dataUrl = getCanvasImageDataUrl();
    if (!dataUrl) {
      setVariationsError('No frame signal available.');
      return;
    }

    setIsGeneratingVariations(true);
    setVariationsError(null);
    try {
      const res = await fetch('/api/gemini/generate-variations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: dataUrl,
          prompt: variationPrompt,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server error ${res.status}`);
      }

      const data: { variations: GeminiVariationItem[] } = await res.json();
      setVariationsList(data.variations || []);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to generate variations';
      setVariationsError(message);
    } finally {
      setIsGeneratingVariations(false);
    }
  };

  // 3. Reference Match
  const handleReferenceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Use Image + Canvas to downscale high-res reference photos gracefully
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      const maxDim = 1280;
      let width = img.width;
      let height = img.height;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0, width, height);
        setRefImageBase64(canvas.toDataURL('image/jpeg', 0.85));
      } else {
        const reader = new FileReader();
        reader.onload = (ev) => {
          setRefImageBase64(ev.target?.result as string);
        };
        reader.readAsDataURL(file);
      }
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      const reader = new FileReader();
      reader.onload = (ev) => {
        setRefImageBase64(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    };
    img.src = objectUrl;
  };

  const handleRunMatch = async () => {
    const targetFrame = getCanvasImageDataUrl();
    if (!targetFrame || !refImageBase64) {
      setMatchError('Please ensure both target frame and reference image are loaded.');
      return;
    }

    setIsMatching(true);
    setMatchError(null);
    try {
      const res = await fetch('/api/gemini/reference-match', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetImageBase64: targetFrame,
          referenceImageBase64: refImageBase64,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server error ${res.status}`);
      }

      const data = await res.json();
      setMatchResult(data);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Matching failed';
      setMatchError(message);
    } finally {
      setIsMatching(false);
    }
  };

  return (
    <div id="gemini-ai-panel" className="flex flex-col gap-3 text-xs bg-[#222131] border border-[#3b3756] rounded-xl p-3 shadow-md">
      {/* Tab Selector */}
      <div className="flex items-center justify-between border-b border-[#3b3756] pb-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('analyze')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'analyze'
                ? 'bg-[#dcd2fa] text-[#0f1014] font-semibold shadow-sm'
                : 'text-[#9a96b4] hover:text-[#f5f3fe] hover:bg-[#3b3756]/40'
            }`}
          >
            Analisar Look
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('variations')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'variations'
                ? 'bg-[#dcd2fa] text-[#0f1014] font-semibold shadow-sm'
                : 'text-[#9a96b4] hover:text-[#f5f3fe] hover:bg-[#3b3756]/40'
            }`}
          >
            Gerar Variações
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('reference')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all cursor-pointer ${
              activeTab === 'reference'
                ? 'bg-[#dcd2fa] text-[#0f1014] font-semibold shadow-sm'
                : 'text-[#9a96b4] hover:text-[#f5f3fe] hover:bg-[#3b3756]/40'
            }`}
          >
            Harmonizar com Referência
          </button>
        </div>

        <div className="flex items-center gap-1 text-[10px] font-mono text-[#dcd2fa] bg-[#0f1014] px-2 py-0.5 rounded border border-[#3b3756]">
          <Sparkles className="w-3 h-3" />
          <span>GEMINI 3.8 FLASH</span>
        </div>
      </div>

      {/* 1. Tab: Analisar Look */}
      {activeTab === 'analyze' && (
        <div className="flex flex-col gap-3">
          <p className="text-[#9a96b4] text-[11px] leading-relaxed">
            O Gemini analisa a iluminação, contraste, balanço cromático das sombras e altas luzes do frame atual, e sugere parâmetros de color grading para o motor local.
          </p>

          <button
            id="btn-trigger-analyze"
            type="button"
            disabled={isAnalyzing}
            onClick={handleAnalyzeLook}
            className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-[#dcd2fa] hover:bg-[#c9bcf5] text-[#0f1014] font-semibold transition-all cursor-pointer shadow-lg disabled:opacity-50"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Analisando Fotografia do Frame...</span>
              </>
            ) : (
              <>
                <Wand2 className="w-4 h-4" />
                <span>Analisar Look do Frame</span>
              </>
            )}
          </button>

          {analysisError && (
            <div className="p-2.5 rounded-lg bg-red-950/40 border border-red-800/50 text-red-300 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span className="text-[11px]">{analysisError}</span>
            </div>
          )}

          {analysisResult && (
            <div className="flex flex-col gap-2.5 p-3 rounded-xl bg-[#0f1014] border border-[#3b3756]">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-[#dcd2fa] text-xs">
                  Diagnóstico Cinematográfico
                </span>
                <button
                  id="btn-apply-gemini-grade"
                  type="button"
                  onClick={() => handleSafeApplyGrade(analysisResult.recommendedGrade)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#dcd2fa] hover:bg-[#c9bcf5] text-[#0f1014] font-semibold text-xs cursor-pointer shadow transition-all"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Aplicar Parâmetros</span>
                </button>
              </div>

              {analysisResult.note && (
                <div className="text-[10px] text-amber-300/90 bg-amber-950/30 border border-amber-800/40 rounded px-2 py-1 leading-tight">
                  {analysisResult.note}
                </div>
              )}

              <div className="text-[11px] text-[#f5f3fe] space-y-1.5 leading-relaxed bg-[#222131] p-2.5 rounded-lg border border-[#3b3756]">
                <p>
                  <strong className="text-[#dcd2fa]">Resumo: </strong>
                  {analysisResult.aestheticSummary}
                </p>
                <p>
                  <strong className="text-[#dcd2fa]">Tons Dominantes: </strong>
                  {analysisResult.dominantTones}
                </p>
                <p>
                  <strong className="text-[#dcd2fa]">Contraste: </strong>
                  {analysisResult.contrastProfile}
                </p>
                <p>
                  <strong className="text-[#dcd2fa]">Ação Sugerida: </strong>
                  {analysisResult.suggestedAction}
                </p>
              </div>

              <div className="grid grid-cols-3 gap-1.5 text-[10px] font-mono text-[#9a96b4] bg-[#0f1014] p-2 rounded border border-[#3b3756]">
                <div>Exp: {analysisResult.recommendedGrade.exposure > 0 ? '+' : ''}{analysisResult.recommendedGrade.exposure}</div>
                <div>Contrast: {analysisResult.recommendedGrade.contrast}</div>
                <div>Temp: {analysisResult.recommendedGrade.temperature}</div>
                <div>Shadows: {analysisResult.recommendedGrade.shadowsColor.hue}° / {Math.round(analysisResult.recommendedGrade.shadowsColor.amount * 100)}%</div>
                <div>Midtones: {analysisResult.recommendedGrade.midtonesColor.hue}° / {Math.round(analysisResult.recommendedGrade.midtonesColor.amount * 100)}%</div>
                <div>Highlights: {analysisResult.recommendedGrade.highlightsColor.hue}° / {Math.round(analysisResult.recommendedGrade.highlightsColor.amount * 100)}%</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 2. Tab: Gerar Variações */}
      {activeTab === 'variations' && (
        <div className="flex flex-col gap-3">
          <p className="text-[#9a96b4] text-[11px]">
            Descreva a intenção de direção de arte para gerar 4 propostas de look com parâmetros prontos para o motor.
          </p>

          <form onSubmit={handleGenerateVariations} className="flex flex-col gap-2">
            <input
              type="text"
              required
              value={variationPrompt}
              onChange={(e) => setVariationPrompt(e.target.value)}
              placeholder="Ex: Clima sombrio de suspense nórdico, desaturado com sombras azul-aço..."
              className="w-full px-3 py-2 rounded-lg bg-[#0f1014] border border-[#3b3756] text-[#f5f3fe] text-xs placeholder-[#5a5575] focus:outline-none focus:border-[#dcd2fa]"
            />

            <button
              type="submit"
              disabled={isGeneratingVariations}
              className="flex items-center justify-center gap-2 py-2 px-4 rounded-lg bg-[#dcd2fa] hover:bg-[#c9bcf5] text-[#0f1014] font-semibold transition-all cursor-pointer shadow disabled:opacity-50"
            >
              {isGeneratingVariations ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Gerando 4 Looks Cinematográficos...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Gerar Variações de Look</span>
                </>
              )}
            </button>
          </form>

          {variationsError && (
            <div className="p-2 rounded-lg bg-red-950/40 border border-red-800/50 text-red-300 text-[11px]">
              {variationsError}
            </div>
          )}

          {variationsList.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-1">
              {variationsList.map((v) => (
                <div
                  key={v.id}
                  className="flex flex-col justify-between p-2.5 rounded-xl bg-[#0f1014] border border-[#3b3756] hover:border-[#dcd2fa]/50 transition-all group"
                >
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-xs text-[#f5f3fe] group-hover:text-[#dcd2fa] truncate">
                        {v.title}
                      </span>
                    </div>
                    <p className="text-[10px] text-[#9a96b4] leading-relaxed mb-2">
                      {v.description}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSafeApplyGrade(v.settings)}
                    className="flex items-center justify-center gap-1 w-full py-1 rounded bg-[#222131] hover:bg-[#dcd2fa] text-[#f5f3fe] hover:text-[#0f1014] text-[11px] font-medium transition-colors cursor-pointer"
                  >
                    <span>Carregar Este Look</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 3. Tab: Reference Match */}
      {activeTab === 'reference' && (
        <div className="flex flex-col gap-3">
          <p className="text-[#9a96b4] text-[11px] leading-relaxed">
            Carregue uma imagem de referência visual (filme, pintura ou fotografia). O Gemini calculará os parâmetros para aproximar a colorimetria do seu material à referência.
          </p>

          <div className="flex items-center gap-3">
            <label className="flex-1 flex flex-col items-center justify-center p-4 rounded-xl border border-dashed border-[#3b3756] hover:border-[#dcd2fa] bg-[#0f1014] cursor-pointer transition-colors">
              {refImageBase64 ? (
                <img
                  src={refImageBase64}
                  alt="Reference"
                  className="max-h-24 object-contain rounded border border-[#3b3756]"
                />
              ) : (
                <div className="flex flex-col items-center text-center">
                  <ImageIcon className="w-6 h-6 text-[#9a96b4] mb-1" />
                  <span className="text-xs text-[#f5f3fe] font-medium">
                    Upload Frame de Referência
                  </span>
                  <span className="text-[10px] text-[#5a5575]">
                    PNG, JPG ou WebP
                  </span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleReferenceUpload}
                className="hidden"
              />
            </label>

            <button
              type="button"
              disabled={!refImageBase64 || isMatching}
              onClick={handleRunMatch}
              className="px-4 py-3 rounded-xl bg-[#dcd2fa] hover:bg-[#c9bcf5] disabled:opacity-40 text-[#0f1014] font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-lg"
            >
              {isMatching ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <Wand2 className="w-4 h-4" />
                  <span>Match Reference</span>
                </>
              )}
            </button>
          </div>

          {matchError && (
            <div className="p-2 rounded-lg bg-red-950/40 border border-red-800/50 text-red-300 text-[11px]">
              {matchError}
            </div>
          )}

          {matchResult && (
            <div className="flex flex-col gap-2 p-3 rounded-xl bg-[#0f1014] border border-[#3b3756]">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-[#dcd2fa]">
                  Parâmetros de Match Calculados
                </span>
                <button
                  type="button"
                  onClick={() => handleSafeApplyGrade(matchResult.suggestedGrade)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#dcd2fa] hover:bg-[#c9bcf5] text-[#0f1014] font-semibold text-xs cursor-pointer shadow"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>Aplicar Match</span>
                </button>
              </div>

              <p className="text-[11px] text-[#f5f3fe] bg-[#222131] p-2.5 rounded border border-[#3b3756] leading-relaxed">
                {matchResult.explanation}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
