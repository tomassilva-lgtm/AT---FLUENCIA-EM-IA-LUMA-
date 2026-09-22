import React, { useState, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Repeat,
  Volume2,
  VolumeX,
  Camera,
  Gauge,
} from 'lucide-react';
import { VideoPlaybackState } from '../types';

interface VideoTransportBarProps {
  playbackState: VideoPlaybackState;
  onTogglePlay: () => void;
  onSeek: (time: number) => void;
  onStepFrame: (direction: 'prev' | 'next') => void;
  onToggleLoop: () => void;
  onToggleMute: () => void;
  onVolumeChange: (volume: number) => void;
  onSpeedChange: (speed: number) => void;
  onQualityChange: (quality: '540p' | '720p' | 'native') => void;
  onCaptureStill: () => void;
}

function formatSMPTETimecode(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00:00:00';
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const frames = Math.floor((seconds % 1) * 30); // Assume 30fps standard reference

  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${pad(hrs)}:${pad(mins)}:${pad(secs)}:${pad(frames)}`;
}

function formatShortTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export const VideoTransportBar: React.FC<VideoTransportBarProps> = ({
  playbackState,
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
  const progressBarRef = useRef<HTMLDivElement>(null);
  const [isScrubbing, setIsScrubbing] = useState(false);
  const [hoverTime, setHoverTime] = useState<number | null>(null);
  const [hoverPos, setHoverPos] = useState<number>(0);
  const [isSpeedMenuOpen, setIsSpeedMenuOpen] = useState(false);
  const [isQualityMenuOpen, setIsQualityMenuOpen] = useState(false);

  const { isPlaying, currentTime, duration, playbackRate, isLooping, isMuted, volume, quality } =
    playbackState;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  // Handle scrubber pointer interactions
  const handleSeekFromPointer = (clientX: number) => {
    if (!progressBarRef.current || duration <= 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    onSeek(ratio * duration);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    setIsScrubbing(true);
    e.currentTarget.setPointerCapture(e.pointerId);
    handleSeekFromPointer(e.clientX);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!progressBarRef.current || duration <= 0) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    setHoverTime(ratio * duration);
    setHoverPos(e.clientX - rect.left);

    if (isScrubbing) {
      handleSeekFromPointer(e.clientX);
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isScrubbing) {
      setIsScrubbing(false);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch {
        // Ignored
      }
    }
  };

  const handlePointerLeave = () => {
    if (!isScrubbing) {
      setHoverTime(null);
    }
  };

  // Keyboard shortcut listener for spacebar and arrow keys
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        onTogglePlay();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        onStepFrame('prev');
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        onStepFrame('next');
      } else if (e.code === 'KeyL') {
        e.preventDefault();
        onToggleLoop();
      } else if (e.code === 'KeyM') {
        e.preventDefault();
        onToggleMute();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onTogglePlay, onStepFrame, onToggleLoop, onToggleMute]);

  return (
    <div
      id="video-transport-bar"
      className="flex flex-col bg-[#0f1014] border-t border-[#3b3756] px-3 py-2 select-none z-20"
    >
      {/* 1. Timeline Scrubber Track */}
      <div
        ref={progressBarRef}
        className="group relative h-4 flex items-center cursor-pointer mb-2"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
      >
        {/* Track background */}
        <div className="w-full h-1.5 bg-[#222131] rounded-full overflow-hidden relative group-hover:h-2 transition-all">
          {/* Progress fill */}
          <div
            className="h-full bg-gradient-to-r from-[#8e82ba] to-[#dcd2fa] relative rounded-full shadow-[0_0_8px_rgba(220,210,250,0.5)]"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Playhead Scrub Handle */}
        <div
          className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-[#dcd2fa] rounded-full border-2 border-white shadow-lg pointer-events-none group-hover:scale-125 transition-transform"
          style={{ left: `${progressPercent}%` }}
        />

        {/* Hover Time Tooltip */}
        {hoverTime !== null && (
          <div
            className="absolute -top-7 -translate-x-1/2 bg-[#222131] border border-[#3b3756] text-[#dcd2fa] font-mono text-[10px] px-1.5 py-0.5 rounded shadow pointer-events-none whitespace-nowrap"
            style={{ left: `${hoverPos}px` }}
          >
            {formatShortTime(hoverTime)}
          </div>
        )}
      </div>

      {/* 2. Control Buttons & Timecodes Row */}
      <div className="flex items-center justify-between text-xs">
        {/* Left: Playback Controls */}
        <div className="flex items-center gap-1.5">
          {/* Step Frame Back */}
          <button
            id="btn-video-step-back"
            type="button"
            onClick={() => onStepFrame('prev')}
            title="Recuar 1 Quadro (Seta para Esquerda)"
            className="p-1.5 rounded-lg bg-[#222131] hover:bg-[#3b3756] text-[#9a96b4] hover:text-[#f5f3fe] transition-colors cursor-pointer border border-[#3b3756]"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>

          {/* Play / Pause */}
          <button
            id="btn-video-play-pause"
            type="button"
            onClick={onTogglePlay}
            title={isPlaying ? 'Pausar (Espaço)' : 'Reproduzir (Espaço)'}
            className={`flex items-center justify-center w-8 h-8 rounded-lg font-semibold transition-all cursor-pointer shadow-md ${
              isPlaying
                ? 'bg-[#3b3756] hover:bg-[#4b466d] text-[#f5f3fe]'
                : 'bg-[#dcd2fa] hover:bg-[#c9bcf5] text-[#0f1014]'
            }`}
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 fill-current" />
            ) : (
              <Play className="w-4 h-4 fill-current ml-0.5" />
            )}
          </button>

          {/* Step Frame Forward */}
          <button
            id="btn-video-step-forward"
            type="button"
            onClick={() => onStepFrame('next')}
            title="Avançar 1 Quadro (Seta para Direita)"
            className="p-1.5 rounded-lg bg-[#222131] hover:bg-[#3b3756] text-[#9a96b4] hover:text-[#f5f3fe] transition-colors cursor-pointer border border-[#3b3756]"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>

          {/* Loop Toggle */}
          <button
            id="btn-video-loop"
            type="button"
            onClick={onToggleLoop}
            title={`Repetição Contínua (L) — ${isLooping ? 'Ativado' : 'Desativado'}`}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer border ${
              isLooping
                ? 'bg-[#dcd2fa]/20 text-[#dcd2fa] border-[#dcd2fa]/40'
                : 'bg-[#222131] text-[#9a96b4] hover:text-[#f5f3fe] border-[#3b3756]'
            }`}
          >
            <Repeat className="w-3.5 h-3.5" />
          </button>

          {/* Volume / Mute */}
          <div className="flex items-center gap-1 ml-1 group relative">
            <button
              id="btn-video-mute"
              type="button"
              onClick={onToggleMute}
              title={isMuted ? 'Ativar Áudio (M)' : 'Silenciar Áudio (M)'}
              className="p-1.5 rounded-lg bg-[#222131] hover:bg-[#3b3756] text-[#9a96b4] hover:text-[#f5f3fe] transition-colors cursor-pointer border border-[#3b3756]"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-3.5 h-3.5 text-rose-400" />
              ) : (
                <Volume2 className="w-3.5 h-3.5 text-[#dcd2fa]" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={isMuted ? 0 : volume}
              onChange={(e) => {
                onVolumeChange(parseFloat(e.target.value));
              }}
              title="Volume"
              className="w-16 h-1 bg-[#222131] rounded-lg appearance-none cursor-pointer accent-[#dcd2fa] hidden sm:block"
            />
          </div>
        </div>

        {/* Center: SMPTE Timecode Display */}
        <div className="flex items-center gap-2 bg-[#0f1014] px-3 py-1 rounded-lg border border-[#3b3756] font-mono">
          <span className="text-[#dcd2fa] text-xs font-semibold tracking-wider">
            {formatSMPTETimecode(currentTime)}
          </span>
          <span className="text-[#5a5575]">/</span>
          <span className="text-[#9a96b4] text-xs">
            {formatSMPTETimecode(duration)}
          </span>
        </div>

        {/* Right: Resolution Quality, Playback Speed & Still Capture */}
        <div className="flex items-center gap-1.5">
          {/* Quality Mode Dropdown */}
          <div className="relative">
            <button
              id="btn-video-quality"
              type="button"
              onClick={() => {
                setIsQualityMenuOpen((v) => !v);
                setIsSpeedMenuOpen(false);
              }}
              title="Resolução de Processamento do Grading"
              className="flex items-center gap-1 px-2 py-1 rounded bg-[#222131] hover:bg-[#3b3756] text-[11px] font-mono text-[#9a96b4] hover:text-[#f5f3fe] border border-[#3b3756] cursor-pointer"
            >
              <span className="text-[#dcd2fa] font-bold">{quality.toUpperCase()}</span>
            </button>

            {isQualityMenuOpen && (
              <div className="absolute bottom-full right-0 mb-1 bg-[#222131] border border-[#3b3756] rounded-lg shadow-xl p-1 z-50 flex flex-col gap-0.5 min-w-[120px]">
                <div className="px-2 py-1 text-[10px] text-[#9a96b4] font-mono uppercase border-b border-[#3b3756]">
                  Resolução Grading
                </div>
                {(['540p', '720p', 'native'] as const).map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => {
                      onQualityChange(q);
                      setIsQualityMenuOpen(false);
                    }}
                    className={`px-2 py-1 rounded text-left text-xs font-mono cursor-pointer flex items-center justify-between ${
                      quality === q
                        ? 'bg-[#dcd2fa]/20 text-[#dcd2fa] font-bold'
                        : 'text-[#9a96b4] hover:text-[#f5f3fe] hover:bg-[#3b3756]'
                    }`}
                  >
                    <span>{q === 'native' ? 'Nativa Total' : q.toUpperCase()}</span>
                    {q === '540p' && <span className="text-[9px] text-[#dcd2fa]">RÁPIDO</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Playback Speed Selector */}
          <div className="relative">
            <button
              id="btn-video-speed"
              type="button"
              onClick={() => {
                setIsSpeedMenuOpen((v) => !v);
                setIsQualityMenuOpen(false);
              }}
              title="Velocidade de Reprodução"
              className="flex items-center gap-1 px-2 py-1 rounded bg-[#222131] hover:bg-[#3b3756] text-[11px] font-mono text-[#9a96b4] hover:text-[#f5f3fe] border border-[#3b3756] cursor-pointer"
            >
              <Gauge className="w-3 h-3 text-[#dcd2fa]" />
              <span>{playbackRate}x</span>
            </button>

            {isSpeedMenuOpen && (
              <div className="absolute bottom-full right-0 mb-1 bg-[#222131] border border-[#3b3756] rounded-lg shadow-xl p-1 z-50 flex flex-col gap-0.5 min-w-[90px]">
                <div className="px-2 py-1 text-[10px] text-[#9a96b4] font-mono uppercase border-b border-[#3b3756]">
                  Velocidade
                </div>
                {[0.25, 0.5, 1, 1.5, 2].map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      onSpeedChange(s);
                      setIsSpeedMenuOpen(false);
                    }}
                    className={`px-2 py-1 rounded text-left text-xs font-mono cursor-pointer ${
                      playbackRate === s
                        ? 'bg-[#dcd2fa]/20 text-[#dcd2fa] font-bold'
                        : 'text-[#9a96b4] hover:text-[#f5f3fe] hover:bg-[#3b3756]'
                    }`}
                  >
                    {s}x
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Grab / Capture Graded Frame Still */}
          <button
            id="btn-capture-still-frame"
            type="button"
            onClick={onCaptureStill}
            title="Capturar quadro de vídeo atual com grading como imagem estática"
            className="flex items-center gap-1 px-2.5 py-1 rounded bg-[#222131] hover:bg-[#3b3756] text-[#dcd2fa] text-xs font-medium border border-[#3b3756] cursor-pointer transition-colors shadow-sm"
          >
            <Camera className="w-3.5 h-3.5 text-[#dcd2fa]" />
            <span className="hidden sm:inline">Capturar Still</span>
          </button>
        </div>
      </div>
    </div>
  );
};
