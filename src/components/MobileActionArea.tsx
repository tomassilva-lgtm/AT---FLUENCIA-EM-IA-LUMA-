import React from 'react';
import { Layers, Sparkles, Bookmark, RotateCcw } from 'lucide-react';
import { CompareMode } from '../types';

export interface MobileActionAreaProps {
  compareMode: CompareMode;
  onToggleCompare: () => void;
  onOpenAiTools: () => void;
  isAiToolsOpen: boolean;
  onOpenSaveLook: () => void;
  onResetAll: () => void;
}

export const MobileActionArea: React.FC<MobileActionAreaProps> = ({
  compareMode,
  onToggleCompare,
  onOpenAiTools,
  isAiToolsOpen,
  onOpenSaveLook,
  onResetAll,
}) => {
  return (
    <div
      id="mobile-tablet-actions-area"
      className="mobile-tablet-action-area w-full bg-[#0f1014] border-y border-[#3b3756] px-3 sm:px-4 py-2 sm:py-2.5 shadow-md select-none shrink-0"
    >
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-2.5 w-full max-w-5xl mx-auto">
        {/* 1. A/B Compare */}
        <button
          id="btn-mobile-ab-compare"
          type="button"
          onClick={onToggleCompare}
          className={`flex items-center justify-between px-3 py-2 sm:py-2.5 rounded-lg border text-xs font-medium transition-all cursor-pointer shadow-sm active:scale-[0.98] ${
            compareMode !== 'single'
              ? 'bg-[#dcd2fa]/20 text-[#dcd2fa] border-[#dcd2fa] shadow-[0_0_12px_rgba(220,210,250,0.25)]'
              : 'bg-[#222131] hover:bg-[#2c2a3e] border-[#3b3756] text-[#f5f3fe]'
          }`}
          title="Alternar visualização dividida A/B"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Layers className="w-4 h-4 text-[#dcd2fa] shrink-0" />
            <span className="font-semibold truncate">Comparar A/B</span>
          </div>
          <span
            className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-semibold uppercase tracking-wider ${
              compareMode !== 'single'
                ? 'bg-[#dcd2fa] text-[#0f1014]'
                : 'bg-[#0f1014] text-[#9a96b4]'
            }`}
          >
            {compareMode !== 'single' ? 'Divisão' : 'Desl.'}
          </span>
        </button>

        {/* 2. Gemini AI Looking */}
        <button
          id="btn-mobile-gemini-looking"
          type="button"
          onClick={onOpenAiTools}
          className={`flex items-center justify-between px-3 py-2 sm:py-2.5 rounded-lg border text-xs font-medium transition-all cursor-pointer shadow-sm active:scale-[0.98] ${
            isAiToolsOpen
              ? 'bg-[#dcd2fa]/25 text-[#dcd2fa] border-[#dcd2fa] shadow-[0_0_12px_rgba(220,210,250,0.25)]'
              : 'bg-[#222131] hover:bg-[#2c2a3e] border-[#3b3756] text-[#f5f3fe]'
          }`}
          title="Gerar Look Cinematográfico com IA Gemini"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="w-4 h-4 text-[#dcd2fa] shrink-0" />
            <span className="font-semibold truncate">IA Gemini</span>
          </div>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#0f1014] text-[#dcd2fa] border border-[#3b3756] font-semibold uppercase">
            IA
          </span>
        </button>

        {/* 3. Save Look */}
        <button
          id="btn-mobile-save-look"
          type="button"
          onClick={onOpenSaveLook}
          className="flex items-center justify-between px-3 py-2 sm:py-2.5 rounded-lg bg-[#222131] hover:bg-[#2c2a3e] border border-[#3b3756] hover:border-[#dcd2fa] text-[#f5f3fe] text-xs font-medium transition-all cursor-pointer shadow-sm active:scale-[0.98]"
          title="Salvar Look na Biblioteca / Presets"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Bookmark className="w-4 h-4 text-[#dcd2fa] shrink-0" />
            <span className="font-semibold truncate">Salvar Look</span>
          </div>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#0f1014] text-[#dcd2fa] border border-[#3b3756] font-semibold uppercase">
            Salvar
          </span>
        </button>

        {/* 4. Reset */}
        <button
          id="btn-mobile-reset"
          type="button"
          onClick={onResetAll}
          className="flex items-center justify-between px-3 py-2 sm:py-2.5 rounded-lg bg-[#222131] hover:bg-[#2c2a3e] border border-[#3b3756] text-[#9a96b4] hover:text-[#f5f3fe] text-xs font-medium transition-all cursor-pointer shadow-sm active:scale-[0.98]"
          title="Redefinir ajustes de color grading para o neutro"
        >
          <div className="flex items-center gap-2 min-w-0">
            <RotateCcw className="w-4 h-4 text-[#9a96b4] shrink-0" />
            <span className="font-semibold truncate">Redefinir</span>
          </div>
          <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-[#0f1014] text-[#9a96b4] border border-[#3b3756] font-semibold uppercase">
            Reset
          </span>
        </button>
      </div>
    </div>
  );
};
