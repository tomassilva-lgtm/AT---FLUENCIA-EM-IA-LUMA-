import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { CompareMode, MediaType, VideoPlaybackState } from '../types';
import { VideoTransportBar } from './VideoTransportBar';
import {
  Maximize2,
  SplitSquareVertical,
  Layers,
  Upload,
  Eye,
  EyeOff,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Film,
  Image as ImageIcon,
  RectangleHorizontal,
  RectangleVertical,
  Square,
  Grid,
} from 'lucide-react';

interface FormatDetails {
  ratio: number;
  aspectString: string;
  label: string;
  type: 'landscape' | 'portrait' | 'square' | 'ultrawide';
}

function computeFormatDetails(
  width: number,
  height: number,
  isSideBySide: boolean
): FormatDetails {
  if (!width || !height) {
    return {
      ratio: 16 / 9,
      aspectString: '16:9',
      label: '16:9 Widescreen',
      type: 'landscape',
    };
  }

  const effectiveW = isSideBySide ? width * 2 : width;
  const effectiveH = height;
  const ratio = effectiveW / effectiveH;

  // Recognized industry standards
  if (Math.abs(ratio - 16 / 9) < 0.04) {
    return { ratio, aspectString: '16:9', label: '16:9 Widescreen', type: 'landscape' };
  }
  if (Math.abs(ratio - 9 / 16) < 0.04) {
    return { ratio, aspectString: '9:16', label: '9:16 Vertical / Reels', type: 'portrait' };
  }
  if (Math.abs(ratio - 4 / 3) < 0.04) {
    return { ratio, aspectString: '4:3', label: '4:3 Academy / Padrão', type: 'landscape' };
  }
  if (Math.abs(ratio - 3 / 4) < 0.04) {
    return { ratio, aspectString: '3:4', label: '3:4 Retrato', type: 'portrait' };
  }
  if (Math.abs(ratio - 3 / 2) < 0.04) {
    return { ratio, aspectString: '3:2', label: '3:2 Foto 35mm', type: 'landscape' };
  }
  if (Math.abs(ratio - 2 / 3) < 0.04) {
    return { ratio, aspectString: '2:3', label: '2:3 Retrato', type: 'portrait' };
  }
  if (Math.abs(ratio - 1.0) < 0.04) {
    return { ratio, aspectString: '1:1', label: '1:1 Quadrado', type: 'square' };
  }
  if (Math.abs(ratio - 4 / 5) < 0.04) {
    return { ratio, aspectString: '4:5', label: '4:5 Retrato Social', type: 'portrait' };
  }
  if (Math.abs(ratio - 2.39) < 0.06 || Math.abs(ratio - 2.35) < 0.06) {
    return { ratio, aspectString: '2.39:1', label: '2.39:1 Cinema Anamórfico', type: 'ultrawide' };
  }
  if (Math.abs(ratio - 21 / 9) < 0.05) {
    return { ratio, aspectString: '21:9', label: '21:9 UltraWide', type: 'ultrawide' };
  }
  if (Math.abs(ratio - 32 / 9) < 0.08) {
    return { ratio, aspectString: '32:9', label: '32:9 Comparação Dupla', type: 'ultrawide' };
  }

  // Simplified ratio fallback
  const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b));
  const d = gcd(Math.round(effectiveW), Math.round(effectiveH));
  const simW = Math.round(effectiveW / d);
  const simH = Math.round(effectiveH / d);

  if (simW < 40 && simH < 40) {
    return {
      ratio,
      aspectString: `${simW}:${simH}`,
      label: `${simW}:${simH} Nativo`,
      type: ratio > 1.2 ? 'landscape' : ratio < 0.85 ? 'portrait' : 'square',
    };
  }

  return {
    ratio,
    aspectString: `${ratio.toFixed(2)}:1`,
    label: `Formato ${ratio.toFixed(2)}:1`,
    type: ratio > 1.2 ? 'landscape' : ratio < 0.85 ? 'portrait' : 'square',
  };
}

interface ImageViewerProps {
  originalImageData: ImageData | null;
  gradedImageData: ImageData | null;
  imageFileName: string;
  compareMode: CompareMode;
  onCompareModeChange: (mode: CompareMode) => void;
  onImageUploaded: (file: File) => void;
  onSelectSample: () => void;
  mediaType: MediaType;
  videoPlaybackState?: VideoPlaybackState;
  onTogglePlay?: () => void;
  onSeek?: (time: number) => void;
  onStepFrame?: (direction: 'prev' | 'next') => void;
  onToggleLoop?: () => void;
  onToggleMute?: () => void;
  onVolumeChange?: (volume: number) => void;
  onSpeedChange?: (speed: number) => void;
  onQualityChange?: (quality: '540p' | '720p' | 'native') => void;
  onCaptureStill?: () => void;
}

export const ImageViewer: React.FC<ImageViewerProps> = ({
  originalImageData,
  gradedImageData,
  imageFileName,
  compareMode,
  onCompareModeChange,
  onImageUploaded,
  onSelectSample,
  mediaType,
  videoPlaybackState,
  onTogglePlay,
  onSeek,
  onStepFrame,
  onToggleLoop,
  onToggleMute,
  onVolumeChange,
  onSpeedChange,
  onQualityChange,
  onCaptureStill,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  const [splitPos, setSplitPos] = useState(0.5); // 0.0 to 1.0
  const [isDraggingSplit, setIsDraggingSplit] = useState(false);
  const [isAbHold, setIsAbHold] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isDragOver, setIsDragOver] = useState(false);
  const [showFramingGuides, setShowFramingGuides] = useState(false);
  const splitTempCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Measure available container dimensions via ResizeObserver
  const [containerSize, setContainerSize] = useState<{ width: number; height: number }>({
    width: 800,
    height: 480,
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleResize = () => {
      const rect = container.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        setContainerSize({ width: rect.width, height: rect.height });
      }
    };

    handleResize();

    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setContainerSize({ width, height });
        }
      }
    });

    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  // Compute media format details (aspect ratio, label, orientation)
  const formatDetails = useMemo(() => {
    if (!originalImageData) {
      return computeFormatDetails(1920, 1080, compareMode === 'side-by-side');
    }
    return computeFormatDetails(
      originalImageData.width,
      originalImageData.height,
      compareMode === 'side-by-side'
    );
  }, [originalImageData, compareMode]);

  // Dynamically calculate the preview stage dimensions matching the exact media format
  const stageDimensions = useMemo(() => {
    const paddingX = 24; // 12px outer spacing each side
    const paddingY = 24; // 12px outer spacing top & bottom
    const availW = Math.max(120, containerSize.width - paddingX);
    const availH = Math.max(120, containerSize.height - paddingY);

    const targetRatio = formatDetails.ratio;
    let w = availW;
    let h = w / targetRatio;

    if (h > availH) {
      h = availH;
      w = h * targetRatio;
    }

    return {
      width: Math.round(w),
      height: Math.round(h),
    };
  }, [containerSize, formatDetails.ratio]);

  // Redraw canvas whenever gradedImageData, originalImageData, compareMode, or splitPos changes
  const renderFrame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas || !gradedImageData || !originalImageData) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = gradedImageData.width;
    const h = gradedImageData.height;

    if (compareMode === 'side-by-side') {
      if (canvas.width !== w * 2 || canvas.height !== h) {
        canvas.width = w * 2;
        canvas.height = h;
      }
    } else {
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
    }

    if (isAbHold) {
      // Force preview original
      if (compareMode === 'side-by-side') {
        ctx.putImageData(originalImageData, 0, 0);
        ctx.putImageData(originalImageData, w, 0);
      } else {
        ctx.putImageData(originalImageData, 0, 0);
      }
      return;
    }

    switch (compareMode) {
      case 'single':
      case 'ab-toggle':
        ctx.putImageData(gradedImageData, 0, 0);
        break;

      case 'split-vertical': {
        // Draw graded full frame
        ctx.putImageData(gradedImageData, 0, 0);

        // Draw original on left half
        const splitX = Math.round(w * splitPos);
        if (splitX > 0) {
          if (!splitTempCanvasRef.current) {
            splitTempCanvasRef.current = document.createElement('canvas');
          }
          const tempCanvas = splitTempCanvasRef.current;
          if (tempCanvas.width !== w || tempCanvas.height !== h) {
            tempCanvas.width = w;
            tempCanvas.height = h;
          }
          const tempCtx = tempCanvas.getContext('2d');
          if (tempCtx) {
            tempCtx.putImageData(originalImageData, 0, 0);

            ctx.save();
            ctx.beginPath();
            ctx.rect(0, 0, splitX, h);
            ctx.clip();
            ctx.drawImage(tempCanvas, 0, 0);
            ctx.restore();
          }

          // Draw split line
          ctx.strokeStyle = '#38bdf8';
          ctx.lineWidth = 2;
          ctx.beginPath();
          ctx.moveTo(splitX, 0);
          ctx.lineTo(splitX, h);
          ctx.stroke();

          // Labels
          ctx.font = 'bold 15px "JetBrains Mono", monospace';
          ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
          ctx.fillRect(Math.max(10, splitX - 100), 16, 90, 24);
          ctx.fillRect(splitX + 10, 16, 92, 24);

          ctx.fillStyle = '#9ca3af';
          ctx.fillText('A: ORIG', Math.max(18, splitX - 92), 33);
          ctx.fillStyle = '#38bdf8';
          ctx.fillText('B: GRADE', splitX + 18, 33);
        }
        break;
      }

      case 'side-by-side': {
        ctx.putImageData(originalImageData, 0, 0);
        ctx.putImageData(gradedImageData, w, 0);

        // Separator line
        ctx.strokeStyle = '#38bdf8';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(w, 0);
        ctx.lineTo(w, h);
        ctx.stroke();

        ctx.font = 'bold 15px "JetBrains Mono", monospace';
        ctx.fillStyle = 'rgba(0,0,0,0.7)';
        ctx.fillRect(16, 16, 110, 24);
        ctx.fillRect(w + 16, 16, 110, 24);
        ctx.fillStyle = '#9ca3af';
        ctx.fillText('ORIGINAL', 26, 33);
        ctx.fillStyle = '#38bdf8';
        ctx.fillText('GRADED LOOK', w + 26, 33);
        break;
      }
    }
  }, [gradedImageData, originalImageData, compareMode, splitPos, isAbHold]);

  useEffect(() => {
    renderFrame();
  }, [renderFrame]);

  // Split-screen drag handler mapped directly to formatted preview frame
  const handleSplitPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (compareMode !== 'split-vertical') return;
    setIsDraggingSplit(true);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleSplitPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingSplit || !stageRef.current) return;
    const rect = stageRef.current.getBoundingClientRect();
    const newPos = Math.max(0.02, Math.min(0.98, (e.clientX - rect.left) / rect.width));
    setSplitPos(newPos);
  };

  const handleSplitPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsDraggingSplit(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignored
    }
  };

  // Drag & drop file uploads
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };
  const handleDragLeave = () => {
    setIsDragOver(false);
  };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      onImageUploaded(e.dataTransfer.files[0]);
    }
  };

  const resolutionText = originalImageData
    ? `${originalImageData.width} × ${originalImageData.height}`
    : 'NO FRAME';

  return (
    <div
      id="main-image-viewer"
      className="flex flex-col h-full bg-[#0a0c11] border border-[#1d222e] rounded-xl overflow-hidden shadow-2xl relative select-none"
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Top Media Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#0f1014] border-b border-[#3b3756] z-20 text-xs flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-mono text-[#9a96b4]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {mediaType === 'video' ? (
              <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-[#222131] text-[#dcd2fa] font-semibold border border-[#3b3756]">
                <Film className="w-3 h-3" />
                VÍDEO MP4
              </span>
            ) : (
              <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-[#222131] text-[#dcd2fa] font-semibold border border-[#3b3756]">
                <ImageIcon className="w-3 h-3" />
                IMAGEM
              </span>
            )}
            <span className="font-semibold text-[#f5f3fe] truncate max-w-[150px] sm:max-w-[200px]">
              {imageFileName}
            </span>
            <span className="text-[#5a5575]">|</span>
            {/* Format and Aspect Ratio Pill */}
            <span
              id="media-format-pill"
              className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-[#222131] text-[#dcd2fa] text-[11px] font-semibold border border-[#3b3756]"
              title={`Formato: ${formatDetails.label} (${resolutionText})`}
            >
              {formatDetails.type === 'portrait' ? (
                <RectangleVertical className="w-3 h-3 text-[#dcd2fa]" />
              ) : formatDetails.type === 'square' ? (
                <Square className="w-3 h-3 text-[#dcd2fa]" />
              ) : (
                <RectangleHorizontal className="w-3 h-3 text-[#dcd2fa]" />
              )}
              <span>{formatDetails.aspectString}</span>
              <span className="text-[10px] text-[#9a96b4] hidden sm:inline">({resolutionText})</span>
            </span>
            <span className="text-[#5a5575]">|</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#0f1014] text-[#dcd2fa] font-semibold border border-[#3b3756]">
              REC.709
            </span>
          </div>

          <button
            id="btn-switch-sample-media"
            type="button"
            onClick={onSelectSample}
            className="text-[11px] px-2 py-0.5 rounded bg-[#222131] text-[#9a96b4] hover:text-[#f5f3fe] hover:bg-[#3b3756] transition-colors cursor-pointer border border-[#3b3756]"
          >
            Mídias de Amostra
          </button>
        </div>

        {/* Comparison, Format Guides, and View Controls */}
        <div className="flex items-center gap-1.5">
          {/* Format Framing Guides Toggle */}
          <button
            id="btn-toggle-framing-guides"
            type="button"
            onClick={() => setShowFramingGuides((g) => !g)}
            title="Alternar Linhas Guia de Enquadramento (Margens de Ação/Título e Regra dos Terços)"
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-all cursor-pointer ${
              showFramingGuides
                ? 'bg-[#dcd2fa]/20 text-[#dcd2fa] border border-[#dcd2fa]/50'
                : 'bg-[#222131] text-[#9a96b4] hover:text-[#f5f3fe] hover:bg-[#3b3756] border border-[#3b3756]'
            }`}
          >
            <Grid className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Guias</span>
          </button>

          {/* A/B Hold Button */}
          <button
            id="btn-ab-hold"
            type="button"
            onPointerDown={() => setIsAbHold(true)}
            onPointerUp={() => setIsAbHold(false)}
            onPointerLeave={() => setIsAbHold(false)}
            title="Pressione e segure para ver o quadro original"
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-mono font-medium transition-all cursor-pointer ${
              isAbHold
                ? 'bg-[#dcd2fa] text-[#0f1014] font-bold shadow-md scale-95'
                : 'bg-[#222131] text-[#f5f3fe] hover:bg-[#3b3756] border border-[#3b3756]'
            }`}
          >
            {isAbHold ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            <span>{isAbHold ? 'ORIGINAL' : 'SEGURAR A/B'}</span>
          </button>

          {/* Split Screen Mode */}
          <button
            id="btn-mode-split"
            type="button"
            onClick={() =>
              onCompareModeChange(
                compareMode === 'split-vertical' ? 'single' : 'split-vertical'
              )
            }
            title="Alternar Comparação com Divisor de Tela (S)"
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-all cursor-pointer ${
              compareMode === 'split-vertical'
                ? 'bg-[#dcd2fa]/20 text-[#dcd2fa] border border-[#dcd2fa]/40'
                : 'bg-[#222131] text-[#9a96b4] hover:text-[#f5f3fe] hover:bg-[#3b3756] border border-[#3b3756]'
            }`}
          >
            <SplitSquareVertical className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Dividir</span>
          </button>

          {/* Side by Side Mode */}
          <button
            id="btn-mode-sidebyside"
            type="button"
            onClick={() =>
              onCompareModeChange(
                compareMode === 'side-by-side' ? 'single' : 'side-by-side'
              )
            }
            title="Alternar Comparação Lado a Lado (B)"
            className={`flex items-center gap-1 px-2 py-1 rounded text-xs transition-all cursor-pointer ${
              compareMode === 'side-by-side'
                ? 'bg-[#dcd2fa]/20 text-[#dcd2fa] border border-[#dcd2fa]/40'
                : 'bg-[#222131] text-[#9a96b4] hover:text-[#f5f3fe] hover:bg-[#3b3756] border border-[#3b3756]'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Lado a Lado</span>
          </button>

          {/* Zoom & Fit Format controls */}
          <div className="flex items-center bg-[#222131] p-0.5 rounded border border-[#3b3756] text-xs">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(0.5, Number((z - 0.2).toFixed(1))))}
              className="p-1 text-[#9a96b4] hover:text-[#f5f3fe] cursor-pointer"
              title="Reduzir zoom"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="font-mono text-[10px] px-1 text-[#9a96b4]">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(3, Number((z + 0.2).toFixed(1))))}
              className="p-1 text-[#9a96b4] hover:text-[#f5f3fe] cursor-pointer"
              title="Aumentar zoom"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            {zoomLevel !== 1 && (
              <button
                type="button"
                onClick={() => setZoomLevel(1)}
                className="p-1 text-[#dcd2fa] hover:text-[#f5f3fe] cursor-pointer"
                title="Ajustar ao Formato (100%)"
              >
                <RotateCcw className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Canvas Viewport Area */}
      <div
        ref={containerRef}
        className="flex-1 w-full flex items-center justify-center p-3 relative overflow-hidden bg-[#0a0a0e]"
        onPointerMove={handleSplitPointerMove}
        onPointerUp={handleSplitPointerUp}
      >
        {/* File Preview Window strictly set to the same format (aspect ratio) as imported media */}
        <div
          id="file-preview-window"
          ref={stageRef}
          className="relative rounded-lg shadow-2xl overflow-hidden border border-[#3b3756] bg-[#030407] transition-all duration-150 flex items-center justify-center select-none group"
          style={{
            width: `${stageDimensions.width}px`,
            height: `${stageDimensions.height}px`,
            aspectRatio: `${formatDetails.ratio}`,
            transform: `scale(${zoomLevel})`,
          }}
        >
          {/* Main Color Grading Canvas */}
          <canvas
            id="grading-preview-canvas"
            ref={canvasRef}
            className="w-full h-full block object-contain"
          />

          {/* Split Screen interactive Handle Overlay strictly inside the preview format window */}
          {compareMode === 'split-vertical' && (
            <div
              className="absolute top-0 bottom-0 pointer-events-none z-20"
              style={{ left: `${splitPos * 100}%` }}
            >
              <div className="w-0.5 h-full bg-[#dcd2fa] shadow-[0_0_10px_rgba(220,210,250,0.9)]" />
              <div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-[#dcd2fa] border-2 border-white shadow-xl flex items-center justify-center cursor-ew-resize pointer-events-auto hover:scale-110 active:scale-95 transition-transform"
                onPointerDown={handleSplitPointerDown}
              >
                <div className="flex gap-0.5">
                  <div className="w-0.5 h-2.5 bg-[#0f1014]" />
                  <div className="w-0.5 h-2.5 bg-[#0f1014]" />
                </div>
              </div>
            </div>
          )}

          {/* Format Framing Guides Overlay */}
          {showFramingGuides && (
            <div className="absolute inset-0 pointer-events-none z-10">
              {/* 90% Action Safe Boundary */}
              <div className="absolute inset-[5%] border border-[#dcd2fa]/40 border-dashed rounded-sm">
                <span className="absolute top-1 left-1.5 text-[9px] font-mono text-[#dcd2fa]/80 bg-[#0f1014]/80 px-1 rounded">
                  SEGURANÇA DE AÇÃO 90%
                </span>
              </div>
              {/* 80% Title Safe Boundary */}
              <div className="absolute inset-[10%] border border-[#8e82ba]/50 border-dashed rounded-sm">
                <span className="absolute top-1 left-1.5 text-[9px] font-mono text-[#dcd2fa]/80 bg-[#0f1014]/80 px-1 rounded">
                  SEGURANÇA DE TÍTULO 80%
                </span>
              </div>
              {/* 3x3 Rule of Thirds Grid */}
              <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white/15" />
              <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white/15" />
              <div className="absolute top-1/3 left-0 right-0 h-px bg-white/15" />
              <div className="absolute top-2/3 left-0 right-0 h-px bg-white/15" />
              {/* Center Crosshair */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-5 h-5">
                <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/50 -translate-x-1/2" />
                <div className="absolute top-1/2 left-0 right-0 h-px bg-white/50 -translate-y-1/2" />
              </div>
            </div>
          )}

          {/* Broadcast Monitor Corner Reticles */}
          <div className="absolute top-1.5 left-1.5 w-3 h-3 border-t-2 border-l-2 border-white/30 pointer-events-none" />
          <div className="absolute top-1.5 right-1.5 w-3 h-3 border-t-2 border-r-2 border-white/30 pointer-events-none" />
          <div className="absolute bottom-1.5 left-1.5 w-3 h-3 border-b-2 border-l-2 border-white/30 pointer-events-none" />
          <div className="absolute bottom-1.5 right-1.5 w-3 h-3 border-b-2 border-r-2 border-white/30 pointer-events-none" />

          {/* Format Watermark in bottom-left corner of preview window */}
          <div className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded bg-[#0f1014]/85 backdrop-blur-sm border border-[#3b3756] text-[10px] font-mono text-[#f5f3fe] pointer-events-none opacity-60 group-hover:opacity-100 transition-opacity flex items-center gap-1.5 z-10">
            <span className="text-[#dcd2fa] font-semibold">{formatDetails.aspectString}</span>
            <span className="text-[#5a5575]">•</span>
            <span>{formatDetails.label}</span>
          </div>
        </div>

        {/* Drag & Drop Overlay */}
        {isDragOver && (
          <div className="absolute inset-0 bg-[#0f1014]/90 border-2 border-dashed border-[#dcd2fa] backdrop-blur-sm z-30 flex flex-col items-center justify-center text-[#dcd2fa]">
            <Upload className="w-12 h-12 mb-2 animate-bounce" />
            <span className="text-base font-semibold">Solte a foto ou vídeo MP4 aqui para importar</span>
            <span className="text-xs text-[#dcd2fa]">Suporta MP4, WebM, JPG, PNG, WebP</span>
          </div>
        )}
      </div>

      {/* Video Transport Player Bar (Only shown for video media) */}
      {mediaType === 'video' && videoPlaybackState && onTogglePlay && onSeek && onStepFrame && onToggleLoop && onToggleMute && onVolumeChange && onSpeedChange && onQualityChange && onCaptureStill && (
        <VideoTransportBar
          playbackState={videoPlaybackState}
          onTogglePlay={onTogglePlay}
          onSeek={onSeek}
          onStepFrame={onStepFrame}
          onToggleLoop={onToggleLoop}
          onToggleMute={onToggleMute}
          onVolumeChange={onVolumeChange}
          onSpeedChange={onSpeedChange}
          onQualityChange={onQualityChange}
          onCaptureStill={onCaptureStill}
        />
      )}

      {/* Subtle bottom telemetry bar */}
      <div className="hidden sm:flex items-center justify-between px-3 py-1 bg-[#0f1014] border-t border-[#3b3756] text-[11px] font-mono text-[#9a96b4]">
        <div className="flex items-center gap-2">
          <span>{mediaType === 'video' ? 'PIPELINE DE VÍDEO' : 'PIPELINE DE IMAGEM'}</span>
          <span>•</span>
          <span className="text-[#dcd2fa]">
            {mediaType === 'video'
              ? videoPlaybackState?.isPlaying
                ? 'SINCRONIA EM TEMPO REAL 60FPS'
                : 'PAUSADO / NAVEGÁVEL'
              : 'DETERMINÍSTICO 60FPS'}
          </span>
          <span>•</span>
          <span className="text-[#dcd2fa]">
            FORMATO: {formatDetails.aspectString} ({formatDetails.label})
          </span>
        </div>
        <div className="flex items-center gap-3">
          {mediaType === 'video' && videoPlaybackState && (
            <span className="text-[#dcd2fa]">
              VELOCIDADE: {videoPlaybackState.playbackRate}x | ESCALA: {videoPlaybackState.quality.toUpperCase()}
            </span>
          )}
          {compareMode === 'split-vertical' && (
            <span>DIVISÃO: {Math.round(splitPos * 100)}%</span>
          )}
          <span>LUT 3D PRONTO</span>
        </div>
      </div>
    </div>
  );
};

