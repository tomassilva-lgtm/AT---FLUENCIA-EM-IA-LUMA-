import React, { useRef, useEffect, useState } from 'react';
import { ScopeType } from '../types';
import {
  drawWaveform,
  drawRGBParade,
  drawVectorscope,
  drawHistogram,
} from '../color-engine';
import { Activity, BarChart2, Compass, Layers, ChevronDown, ChevronUp, Maximize2, Minimize2 } from 'lucide-react';

interface ScopeViewerProps {
  imageData: ImageData | null;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export const ScopeViewer: React.FC<ScopeViewerProps> = ({
  imageData,
  isExpanded = false,
  onToggleExpand,
}) => {
  const [activeScope, setActiveScope] = useState<ScopeType>('waveform');
  const [waveformMode, setWaveformMode] = useState<'green' | 'luma'>('green');
  const [histogramMode, setHistogramMode] = useState<'all' | 'rgb' | 'luma'>('all');
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const renderFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!imageData || !canvasRef.current || !isExpanded) return;
    const canvas = canvasRef.current;

    if (renderFrameRef.current !== null) {
      cancelAnimationFrame(renderFrameRef.current);
    }

    renderFrameRef.current = requestAnimationFrame(() => {
      switch (activeScope) {
        case 'waveform':
          drawWaveform(imageData, canvas, waveformMode);
          break;
        case 'parade':
          drawRGBParade(imageData, canvas);
          break;
        case 'vectorscope':
          drawVectorscope(imageData, canvas);
          break;
        case 'histogram':
          drawHistogram(imageData, canvas, histogramMode);
          break;
      }
    });

    return () => {
      if (renderFrameRef.current !== null) {
        cancelAnimationFrame(renderFrameRef.current);
      }
    };
  }, [imageData, activeScope, waveformMode, histogramMode, isExpanded]);

  // Dimensions adapt when expanded
  const canvasWidth = activeScope === 'parade' ? 440 : 340;
  const canvasHeight = 150;

  return (
    <div
      id="scope-viewer-panel"
      className="flex flex-col bg-[#0f1014] border border-[#3b3756] rounded-xl overflow-hidden shadow-lg h-full transition-all duration-200"
    >
      {/* Scope Navigation & Header bar */}
      <div className="flex items-center justify-between px-2.5 sm:px-3 py-1.5 bg-[#222131] border-b border-[#3b3756] gap-1 shrink-0">
        {/* If collapsed, show clean clickable title bar to expand */}
        {!isExpanded ? (
          <div
            className="flex items-center justify-between w-full cursor-pointer group select-none py-0.5"
            onClick={onToggleExpand}
          >
            <div className="flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-[#dcd2fa] group-hover:text-white transition-colors" />
              <span className="text-xs font-semibold text-[#f5f3fe] group-hover:text-[#dcd2fa] transition-colors">
                Osciloscópios &amp; Telemetria de Sinal
              </span>
              <span className="text-[10px] text-[#9a96b4] hidden sm:inline">
                (Waveform • RGB Parade • Vectorscópio • Histograma)
              </span>
            </div>

            <button
              id="btn-expand-scopes-header"
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand?.();
              }}
              className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium bg-[#0f1014] hover:bg-[#3b3756] text-[#dcd2fa] border border-[#3b3756] transition-colors cursor-pointer"
            >
              <span>Ampliar</span>
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
              <button
                id="tab-scope-waveform"
                type="button"
                onClick={() => setActiveScope('waveform')}
                className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded text-xs font-medium transition-all shrink-0 cursor-pointer ${
                  activeScope === 'waveform'
                    ? 'bg-[#dcd2fa] text-[#0f1014] font-semibold shadow-sm'
                    : 'text-[#9a96b4] hover:text-[#f5f3fe] hover:bg-[#3b3756]/40'
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
                <span>Waveform</span>
              </button>

              <button
                id="tab-scope-parade"
                type="button"
                onClick={() => setActiveScope('parade')}
                className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded text-xs font-medium transition-all shrink-0 cursor-pointer ${
                  activeScope === 'parade'
                    ? 'bg-[#dcd2fa] text-[#0f1014] font-semibold shadow-sm'
                    : 'text-[#9a96b4] hover:text-[#f5f3fe] hover:bg-[#3b3756]/40'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>RGB Parade</span>
              </button>

              <button
                id="tab-scope-vectorscope"
                type="button"
                onClick={() => setActiveScope('vectorscope')}
                className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded text-xs font-medium transition-all shrink-0 cursor-pointer ${
                  activeScope === 'vectorscope'
                    ? 'bg-[#dcd2fa] text-[#0f1014] font-semibold shadow-sm'
                    : 'text-[#9a96b4] hover:text-[#f5f3fe] hover:bg-[#3b3756]/40'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Vectorscópio</span>
              </button>

              <button
                id="tab-scope-histogram"
                type="button"
                onClick={() => setActiveScope('histogram')}
                className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded text-xs font-medium transition-all shrink-0 cursor-pointer ${
                  activeScope === 'histogram'
                    ? 'bg-[#dcd2fa] text-[#0f1014] font-semibold shadow-sm'
                    : 'text-[#9a96b4] hover:text-[#f5f3fe] hover:bg-[#3b3756]/40'
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5" />
                <span>Histograma</span>
              </button>
            </div>

            {/* Sub-options for waveform & histogram & Minimize Toggle */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {activeScope === 'waveform' && (
                <div className="flex items-center bg-[#0f1014] p-0.5 rounded border border-[#3b3756] text-[10px] font-mono">
                  <button
                    type="button"
                    onClick={() => setWaveformMode('green')}
                    className={`px-1.5 py-0.5 rounded cursor-pointer ${
                      waveformMode === 'green' ? 'bg-[#3b3756] text-[#dcd2fa] font-semibold' : 'text-[#9a96b4]'
                    }`}
                  >
                    FÓSFORO
                  </button>
                  <button
                    type="button"
                    onClick={() => setWaveformMode('luma')}
                    className={`px-1.5 py-0.5 rounded cursor-pointer ${
                      waveformMode === 'luma' ? 'bg-[#3b3756] text-[#f5f3fe] font-semibold' : 'text-[#9a96b4]'
                    }`}
                  >
                    LUMA
                  </button>
                </div>
              )}

              {activeScope === 'histogram' && (
                <div className="flex items-center bg-[#0f1014] p-0.5 rounded border border-[#3b3756] text-[10px] font-mono">
                  <button
                    type="button"
                    onClick={() => setHistogramMode('all')}
                    className={`px-1.5 py-0.5 rounded cursor-pointer ${
                      histogramMode === 'all' ? 'bg-[#3b3756] text-[#dcd2fa] font-semibold' : 'text-[#9a96b4]'
                    }`}
                  >
                    TODOS
                  </button>
                  <button
                    type="button"
                    onClick={() => setHistogramMode('rgb')}
                    className={`px-1.5 py-0.5 rounded cursor-pointer ${
                      histogramMode === 'rgb' ? 'bg-[#3b3756] text-[#dcd2fa] font-semibold' : 'text-[#9a96b4]'
                    }`}
                  >
                    RGB
                  </button>
                  <button
                    type="button"
                    onClick={() => setHistogramMode('luma')}
                    className={`px-1.5 py-0.5 rounded cursor-pointer ${
                      histogramMode === 'luma' ? 'bg-[#3b3756] text-[#f5f3fe] font-semibold' : 'text-[#9a96b4]'
                    }`}
                  >
                    LUMA
                  </button>
                </div>
              )}

              {/* Minimize Action Button */}
              {onToggleExpand && (
                <button
                  id="btn-collapse-scopes"
                  type="button"
                  onClick={onToggleExpand}
                  title="Minimizar área de osciloscópios"
                  className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono bg-[#0f1014] hover:bg-[#3b3756] text-[#9a96b4] hover:text-[#f5f3fe] border border-[#3b3756] transition-colors cursor-pointer"
                >
                  <ChevronDown className="w-3.5 h-3.5 text-[#dcd2fa]" />
                  <span className="hidden xs:inline">MINIMIZAR</span>
                </button>
              )}
            </div>
          </>
        )}
      </div>

      {/* Canvas Scope Display Area - Only mounted/rendered when expanded */}
      {isExpanded && (
        <div className="flex-1 bg-[#0f1014] flex items-center justify-center relative overflow-hidden p-1 min-h-[110px] transition-all duration-200">
          <canvas
            id="scope-canvas"
            ref={canvasRef}
            width={canvasWidth}
            height={canvasHeight}
            className="w-full h-full object-contain rounded transition-all max-h-[180px]"
          />

          {!imageData && (
            <div className="absolute inset-0 flex items-center justify-center text-xs text-[#5a5575] font-mono">
              AGUARDANDO SINAL DO FRAME...
            </div>
          )}
        </div>
      )}
    </div>
  );
};

