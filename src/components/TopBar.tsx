import React, { useRef } from 'react';
import {
  Upload,
  RotateCcw,
  Download,
  Bookmark,
  Sparkles,
  Layers,
  Camera,
  Film,
  Undo2,
  Redo2,
  Keyboard,
} from 'lucide-react';
import { CompareMode, MediaType } from '../types';

interface TopBarProps {
  onImportMedia: (file: File) => void;
  onResetAll: () => void;
  onUndo: () => void;
  canUndo: boolean;
  onRedo?: () => void;
  canRedo?: boolean;
  onOpenSaveLook: () => void;
  onExportImage: (format: 'png' | 'jpeg') => void;
  compareMode: CompareMode;
  onToggleCompare: () => void;
  onOpenAiTools: () => void;
  isAiToolsOpen: boolean;
  mediaType?: MediaType;
  onOpenShortcuts?: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onImportMedia,
  onResetAll,
  onUndo,
  canUndo,
  onRedo,
  canRedo,
  onOpenSaveLook,
  onExportImage,
  compareMode,
  onToggleCompare,
  onOpenAiTools,
  isAiToolsOpen,
  mediaType = 'image',
  onOpenShortcuts,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImportMedia(e.target.files[0]);
      e.target.value = '';
    }
  };

  return (
    <header
      id="app-topbar"
      className="flex flex-col bg-[#0f1014] border-b border-[#3b3756] select-none z-30 shrink-0"
    >
      {/* Top Section Header: Reorganized with LUMA Design System */}
      <div
        id="top-section-header"
        className="flex items-center justify-between px-3 sm:px-4 py-2 gap-2"
      >
        {/* Brand & Studio Title: LUMA */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="flex items-center gap-2.5">
            {/* LUMA Split-Circle Brand Icon */}
            <div className="w-7 h-7 rounded-full flex items-center justify-center relative shadow-sm">
              <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#3b3756" strokeWidth="1.5" />
                <path d="M12 2 A10 10 0 0 1 12 22 Z" fill="#dcd2fa" />
              </svg>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <h1 className="text-xs sm:text-sm font-bold tracking-[0.25em] text-[#f5f3fe] uppercase whitespace-nowrap">
                  L U M A
                </h1>
                <span className="text-[8px] sm:text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-[#222131] text-[#dcd2fa] border border-[#3b3756] font-medium hidden xs:inline-block">
                  {mediaType === 'video' ? 'VÍDEO' : 'IMAGEM'}
                </span>
              </div>
              <span className="text-[10px] text-[#9a96b4] hidden lg:block tracking-wide whitespace-nowrap">
                Luz. Cor. Detalhe.
              </span>
            </div>
          </div>
        </div>

        {/* Hidden media file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,.mp4"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Options in Top Section */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Import Media Button */}
          <button
            id="btn-top-import"
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Importar imagem (JPG, PNG, WebP) ou vídeo (MP4)"
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#222131] hover:bg-[#2c2a3e] border border-[#3b3756] text-[#f5f3fe] text-xs font-medium transition-colors cursor-pointer shadow-sm whitespace-nowrap"
          >
            <Upload className="w-3.5 h-3.5 text-[#dcd2fa]" />
            <span className="hidden sm:inline">Importar Mídia</span>
            <span className="sm:hidden">Importar</span>
          </button>

          {/* Undo & Redo History Controls */}
          <div className="flex items-center bg-[#222131] border border-[#3b3756] rounded-lg p-0.5">
            <button
              id="btn-top-undo"
              type="button"
              onClick={onUndo}
              disabled={!canUndo}
              title={canUndo ? "Desfazer última ação (Ctrl+Z)" : "Nada para desfazer"}
              className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                canUndo
                  ? 'text-[#f5f3fe] hover:bg-[#2c2a3e] cursor-pointer active:scale-95'
                  : 'text-[#5a5575] cursor-not-allowed opacity-40'
              }`}
            >
              <Undo2 className="w-3.5 h-3.5 text-[#dcd2fa]" />
              <span className="hidden md:inline">Desfazer</span>
            </button>

            {onRedo && (
              <button
                id="btn-top-redo"
                type="button"
                onClick={onRedo}
                disabled={!canRedo}
                title={canRedo ? "Refazer ação (Ctrl+Shift+Z)" : "Nada para refazer"}
                className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  canRedo
                    ? 'text-[#f5f3fe] hover:bg-[#2c2a3e] cursor-pointer active:scale-95'
                    : 'text-[#5a5575] cursor-not-allowed opacity-40'
                }`}
              >
                <Redo2 className="w-3.5 h-3.5 text-[#dcd2fa]" />
                <span className="hidden md:inline">Refazer</span>
              </button>
            )}
          </div>

          {/* Desktop Only: Options retained in single row on large desktop displays */}
          <div className="desktop-topbar-actions hidden items-center gap-1.5 sm:gap-2">
            <button
              id="btn-top-ab-compare"
              type="button"
              onClick={onToggleCompare}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                compareMode !== 'single'
                  ? 'bg-[#dcd2fa]/20 text-[#dcd2fa] border-[#dcd2fa] shadow-sm'
                  : 'bg-[#222131] hover:bg-[#2c2a3e] border-[#3b3756] text-[#f5f3fe]'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-[#dcd2fa]" />
              <span>Comparar A/B</span>
            </button>

            <button
              id="btn-top-gemini-tools"
              type="button"
              onClick={onOpenAiTools}
              className={`flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                isAiToolsOpen
                  ? 'bg-[#dcd2fa]/25 text-[#dcd2fa] border-[#dcd2fa] shadow-sm'
                  : 'bg-[#222131] hover:bg-[#2c2a3e] border-[#3b3756] text-[#f5f3fe]'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-[#dcd2fa]" />
              <span>IA Gemini</span>
            </button>

            <button
              id="btn-top-save-look"
              type="button"
              onClick={onOpenSaveLook}
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#222131] hover:bg-[#2c2a3e] border border-[#3b3756] text-[#f5f3fe] text-xs font-medium transition-colors cursor-pointer whitespace-nowrap"
            >
              <Bookmark className="w-3.5 h-3.5 text-[#dcd2fa]" />
              <span>Salvar Look</span>
            </button>

            <button
              id="btn-top-reset-grade"
              type="button"
              onClick={onResetAll}
              title="Redefinir todos os ajustes de cor para o neutro"
              className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#222131] hover:bg-[#2c2a3e] border border-[#3b3756] text-[#9a96b4] hover:text-[#f5f3fe] text-xs font-medium transition-colors cursor-pointer whitespace-nowrap"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#dcd2fa]" />
              <span>Redefinir</span>
            </button>
          </div>

          {/* Export Button - LUMA Primary Accent (#dcd2fa) */}
          <div className="flex items-center bg-[#dcd2fa] hover:bg-[#c9bcf5] text-[#0f1014] rounded-lg shadow font-semibold text-xs transition-colors overflow-hidden shrink-0">
            <button
              id="btn-top-export-png"
              type="button"
              onClick={() => onExportImage('png')}
              className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 cursor-pointer hover:bg-black/10"
              title="Exportar imagem PNG em resolução total"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Exportar PNG</span>
              <span className="sm:hidden">Exportar</span>
            </button>
            <button
              id="btn-top-export-jpg"
              type="button"
              onClick={() => onExportImage('jpeg')}
              className="px-2 py-1.5 border-l border-[#0f1014]/20 cursor-pointer hover:bg-black/10 text-[11px]"
              title="Exportar JPEG (Alta Qualidade)"
            >
              JPG
            </button>
          </div>

          {/* Keyboard Shortcuts Trigger Button */}
          {onOpenShortcuts && (
            <button
              id="btn-top-keyboard-shortcuts"
              type="button"
              onClick={onOpenShortcuts}
              title="Atalhos do Teclado (?)"
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1.5 rounded-lg bg-[#222131] hover:bg-[#2c2a3e] border border-[#3b3756] text-[#9a96b4] hover:text-[#dcd2fa] text-xs font-medium transition-colors cursor-pointer shadow-sm shrink-0"
            >
              <Keyboard className="w-3.5 h-3.5 text-[#dcd2fa]" />
              <span className="hidden lg:inline">Atalhos</span>
              <kbd className="hidden sm:inline-block px-1.5 py-0.2 rounded bg-[#0f1014] border border-[#3b3756] text-[10px] font-mono text-[#dcd2fa] font-bold">
                ?
              </kbd>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
