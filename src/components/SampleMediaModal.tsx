import React, { useState } from 'react';
import { sampleFrames, sampleVideos } from '../data/samples';
import { SampleMedia, MediaType } from '../types';
import { X, Film, Check, Image as ImageIcon, Play } from 'lucide-react';

interface SampleMediaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectSample: (media: SampleMedia) => void;
  onSelectCalibration: () => void;
  currentUrl?: string;
}

export const SampleMediaModal: React.FC<SampleMediaModalProps> = ({
  isOpen,
  onClose,
  onSelectSample,
  onSelectCalibration,
  currentUrl,
}) => {
  const [activeTab, setActiveTab] = useState<'video' | 'image'>('video');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-2xl bg-[#0f1014] border border-[#3b3756] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-[#3b3756] bg-[#222131]">
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 text-[#dcd2fa]" />
            <h3 className="text-sm font-semibold text-[#f5f3fe]">
              Selecionar Mídia Cinematográfica de Exemplo
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="p-1 rounded-md text-[#9a96b4] hover:text-[#f5f3fe] hover:bg-[#3b3756] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex items-center px-5 pt-3 gap-2 bg-[#222131] border-b border-[#3b3756]">
          <button
            type="button"
            onClick={() => setActiveTab('video')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer border-b-2 ${
              activeTab === 'video'
                ? 'text-[#dcd2fa] border-[#dcd2fa] bg-[#0f1014]'
                : 'text-[#9a96b4] hover:text-[#f5f3fe] border-transparent'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Vídeos MP4 ({sampleVideos.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('image')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-t-lg transition-colors cursor-pointer border-b-2 ${
              activeTab === 'image'
                ? 'text-[#dcd2fa] border-[#dcd2fa] bg-[#0f1014]'
                : 'text-[#9a96b4] hover:text-[#f5f3fe] border-transparent'
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Quadros em Alta Resolução ({sampleFrames.length})</span>
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
          <p className="text-xs text-[#9a96b4] leading-relaxed">
            {activeTab === 'video'
              ? 'Escolha um clipe de vídeo MP4 em tempo real para testar reprodução contínua, avanço quadro a quadro e osciloscópios dinâmicos:'
              : 'Escolha uma imagem cinematográfica de alta resolução para testar faixa dinâmica, separação de tons de pele e gradação de cores:'}
          </p>

          {activeTab === 'video' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {sampleVideos.map((sample) => {
                const isSelected = currentUrl === sample.url;
                return (
                  <button
                    key={sample.id}
                    type="button"
                    onClick={() => {
                      onSelectSample(sample);
                      onClose();
                    }}
                    className={`flex flex-col text-left rounded-xl overflow-hidden border transition-all cursor-pointer group relative ${
                      isSelected
                        ? 'border-[#dcd2fa] ring-2 ring-[#dcd2fa]/30 shadow-lg bg-[#222131]'
                        : 'border-[#3b3756] hover:border-[#dcd2fa]/50 bg-[#222131]'
                    }`}
                  >
                    <div className="relative w-full aspect-video bg-[#07090e] overflow-hidden flex items-center justify-center">
                      <video
                        src={sample.url}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 pointer-events-none opacity-80 group-hover:opacity-100"
                        preload="metadata"
                        muted
                        playsInline
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />

                      {/* Play badge overlay */}
                      <div className="absolute w-10 h-10 rounded-full bg-black/60 border border-[#dcd2fa]/40 backdrop-blur-sm flex items-center justify-center group-hover:scale-110 group-hover:bg-[#dcd2fa] group-hover:text-[#0f1014] text-[#dcd2fa] transition-all shadow-xl">
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      </div>

                      <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-[#0f1014]/80 border border-[#3b3756] backdrop-blur-sm text-[10px] font-mono text-[#dcd2fa]">
                        {sample.category}
                      </div>

                      {sample.duration && (
                        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 rounded bg-black/80 font-mono text-[10px] text-[#f5f3fe]">
                          {sample.duration}
                        </div>
                      )}

                      {isSelected && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#dcd2fa] text-[#0f1014] flex items-center justify-center shadow">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>

                    <div className="p-2.5 flex flex-col">
                      <span className="text-xs font-semibold text-[#f5f3fe] group-hover:text-[#dcd2fa] transition-colors truncate">
                        {sample.name}
                      </span>
                      <span className="text-[10px] text-[#9a96b4]">
                        {sample.resolution || 'MP4 Video'} • 30/60fps Live Sync
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {sampleFrames.map((sample) => {
                const isSelected = currentUrl === sample.url;
                return (
                  <button
                    key={sample.id}
                    type="button"
                    onClick={() => {
                      onSelectSample(sample);
                      onClose();
                    }}
                    className={`flex flex-col text-left rounded-xl overflow-hidden border transition-all cursor-pointer group relative ${
                      isSelected
                        ? 'border-[#dcd2fa] ring-2 ring-[#dcd2fa]/30 shadow-lg bg-[#222131]'
                        : 'border-[#3b3756] hover:border-[#dcd2fa]/50 bg-[#222131]'
                    }`}
                  >
                    <div className="relative w-full aspect-video bg-[#0b0d13] overflow-hidden">
                      <img
                        src={sample.url}
                        alt={sample.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                      <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-sm text-[10px] font-mono text-[#dcd2fa]">
                        {sample.category}
                      </div>
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#dcd2fa] text-[#0f1014] flex items-center justify-center shadow">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>

                    <div className="p-2.5 flex flex-col gap-0.5">
                      <span className="text-xs font-semibold text-[#f5f3fe] group-hover:text-[#dcd2fa] transition-colors truncate">
                        {sample.name}
                      </span>
                      <div className="flex items-center gap-1.5 text-[10px]">
                        <span className="text-[#dcd2fa] font-mono font-medium">
                          {sample.resolution || '1920 × 1080'}
                        </span>
                        <span className="text-[#5a5575]">•</span>
                        <span className="text-[#9a96b4]">Rec.709</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Procedural calibration chart card */}
          <div className="pt-2 border-t border-[#3b3756]">
            <button
              type="button"
              onClick={() => {
                onSelectCalibration();
                onClose();
              }}
              className="w-full flex items-center justify-between p-3 rounded-xl bg-[#222131] border border-[#3b3756] hover:border-[#dcd2fa]/60 hover:bg-[#2a283b] transition-all cursor-pointer text-left"
            >
              <div>
                <span className="text-xs font-semibold text-[#f5f3fe] block">
                  Padrão de Teste e Calibração Procedural (Macbeth) com Iluminação Dupla
                </span>
                <span className="text-[10px] text-[#9a96b4]">
                  Cartela sintética com 24 amostras de cores Macbeth e iluminação de estúdio (Key/Rim lights)
                </span>
              </div>
              <span className="text-xs text-[#dcd2fa] font-medium whitespace-nowrap pl-3">
                Carregar Padrão →
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
