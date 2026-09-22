import React, { useEffect } from 'react';
import {
  Keyboard,
  X,
  Undo2,
  Redo2,
  Play,
  RotateCcw,
  SkipBack,
  SkipForward,
  Repeat,
  Volume2,
  Eye,
  Sliders,
  Layers,
  SplitSquareVertical,
  Maximize2,
  Command,
} from 'lucide-react';

interface KeyboardShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutItem {
  keys: string[];
  description: string;
  category: 'editing' | 'playback' | 'viewer';
}

const SHORTCUTS: ShortcutItem[] = [
  // Editing & History
  {
    keys: ['↑', '↓'],
    description: 'Ajuste fino (+/- 0.01) no slider ou campo numérico focado',
    category: 'editing',
  },
  {
    keys: ['Shift', '↑ / ↓'],
    description: 'Ajuste moderado (+/- 0.10) no controle focado',
    category: 'editing',
  },
  {
    keys: ['Ctrl', 'Z'],
    description: 'Desfazer último ajuste de cor',
    category: 'editing',
  },
  {
    keys: ['Ctrl', 'Shift', 'Z'],
    description: 'Refazer ajuste desfeito',
    category: 'editing',
  },
  {
    keys: ['Ctrl', 'Y'],
    description: 'Refazer (padrão alternativo do Windows)',
    category: 'editing',
  },
  {
    keys: ['R'],
    description: 'Redefinir grading para o neutro (com controles sem foco)',
    category: 'editing',
  },

  // Playback (Videos)
  {
    keys: ['Espaço'],
    description: 'Reproduzir / Pausar reprodução do vídeo',
    category: 'playback',
  },
  {
    keys: ['←', 'Seta Esquerda'],
    description: 'Recuar 1 quadro (1/30s)',
    category: 'playback',
  },
  {
    keys: ['→', 'Seta Direita'],
    description: 'Avançar 1 quadro (1/30s)',
    category: 'playback',
  },
  {
    keys: ['L'],
    description: 'Alternar repetição contínua (loop)',
    category: 'playback',
  },
  {
    keys: ['M'],
    description: 'Silenciar / Ativar áudio',
    category: 'playback',
  },

  // Viewer & Comparison
  {
    keys: ['Segurar', 'A/B'],
    description: 'Pressionar para ver temporariamente o quadro original',
    category: 'viewer',
  },
  {
    keys: ['S'],
    description: 'Alternar comparação com divisor de tela vertical',
    category: 'viewer',
  },
  {
    keys: ['B'],
    description: 'Alternar modo de comparação lado a lado',
    category: 'viewer',
  },
  {
    keys: ['W'],
    description: 'Expandir / Recolher Osciloscópios e Telemetria',
    category: 'viewer',
  },
  {
    keys: ['?'],
    description: 'Exibir ou ocultar este guia de atalhos',
    category: 'viewer',
  },
  {
    keys: ['Esc'],
    description: 'Fechar janela modal ou sobreposição ativa',
    category: 'viewer',
  },
];

export const KeyboardShortcutsModal: React.FC<KeyboardShortcutsModalProps> = ({
  isOpen,
  onClose,
}) => {
  // Listen for Escape key to close
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const editingShortcuts = SHORTCUTS.filter((s) => s.category === 'editing');
  const playbackShortcuts = SHORTCUTS.filter((s) => s.category === 'playback');
  const viewerShortcuts = SHORTCUTS.filter((s) => s.category === 'viewer');

  return (
    <div
      id="modal-keyboard-shortcuts-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        id="modal-keyboard-shortcuts-content"
        className="w-full max-w-xl bg-[#0f1014] border border-[#3b3756] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-5 py-3.5 border-b border-[#3b3756] bg-[#222131] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#3b3756]/50 text-[#dcd2fa] border border-[#3b3756] flex items-center justify-center">
              <Keyboard className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-[#f5f3fe] tracking-wide">
                Atalhos de Teclado &amp; Ajustes Finos
              </h3>
              <p className="text-[11px] text-[#9a96b4]">
                Teclas rápidas para navegação e ajuste fino (+/- 0.01) nos controles
              </p>
            </div>
          </div>
          <button
            id="btn-close-shortcuts-modal"
            type="button"
            onClick={onClose}
            aria-label="Fechar modal de atalhos"
            className="p-1.5 rounded-lg text-[#9a96b4] hover:text-[#f5f3fe] hover:bg-[#3b3756]/40 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto p-4 sm:p-5 space-y-5 custom-scrollbar">
          {/* History & Color Grading Section */}
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#dcd2fa] mb-2.5">
              <Sliders className="w-3.5 h-3.5" />
              <span>Gradação de Cor &amp; Ajustes Finos</span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {editingShortcuts.map((s, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-lg bg-[#222131] border border-[#3b3756] hover:border-[#dcd2fa]/50 transition-colors"
                >
                  <span className="text-xs text-[#f5f3fe] font-medium pr-2">
                    {s.description}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    {s.keys.map((k, kIdx) => (
                      <kbd
                        key={kIdx}
                        className="px-2 py-0.5 rounded bg-[#0f1014] border border-[#3b3756] text-[11px] font-mono font-semibold text-[#dcd2fa] shadow-sm"
                      >
                        {k}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Video Playback Section */}
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#dcd2fa] mb-2.5">
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>Reprodução de Vídeo &amp; Navegação</span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {playbackShortcuts.map((s, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-lg bg-[#222131] border border-[#3b3756] hover:border-[#dcd2fa]/50 transition-colors"
                >
                  <span className="text-xs text-[#f5f3fe] font-medium pr-2">
                    {s.description}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    {s.keys.map((k, kIdx) => (
                      <kbd
                        key={kIdx}
                        className="px-2 py-0.5 rounded bg-[#0f1014] border border-[#3b3756] text-[11px] font-mono font-semibold text-[#dcd2fa] shadow-sm"
                      >
                        {k}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Viewer & Inspection Section */}
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[#dcd2fa] mb-2.5">
              <Layers className="w-3.5 h-3.5" />
              <span>Inspeção &amp; Comparação</span>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {viewerShortcuts.map((s, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2 rounded-lg bg-[#222131] border border-[#3b3756] hover:border-[#dcd2fa]/50 transition-colors"
                >
                  <span className="text-xs text-[#f5f3fe] font-medium pr-2">
                    {s.description}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    {s.keys.map((k, kIdx) => (
                      <kbd
                        key={kIdx}
                        className="px-2 py-0.5 rounded bg-[#0f1014] border border-[#3b3756] text-[11px] font-mono font-semibold text-[#dcd2fa] shadow-sm"
                      >
                        {k}
                      </kbd>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 sm:px-5 py-3 border-t border-[#3b3756] bg-[#222131] flex items-center justify-between text-xs text-[#9a96b4] shrink-0">
          <span className="flex items-center gap-1.5">
            Dica: Pressione <kbd className="px-1.5 py-0.5 rounded bg-[#0f1014] border border-[#3b3756] text-[10px] font-mono text-[#dcd2fa]">?</kbd> em qualquer lugar para abrir ou fechar
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-[#dcd2fa] hover:bg-[#c9bcf5] text-[#0f1014] font-semibold text-xs cursor-pointer transition-colors shadow-sm"
          >
            Entendido
          </button>
        </div>
      </div>
    </div>
  );
};
