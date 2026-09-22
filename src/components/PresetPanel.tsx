import React, { useState } from 'react';
import { ColorGradeSettings, ColorPreset } from '../types';
import { presets } from '../color-engine';
import { Clapperboard, Check } from 'lucide-react';

interface PresetPanelProps {
  currentSettings: ColorGradeSettings;
  onApplyPreset: (preset: ColorPreset) => void;
}

export const PresetPanel: React.FC<PresetPanelProps> = ({
  currentSettings,
  onApplyPreset,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'Todos' },
    { id: 'Standard', label: 'Padrão' },
    { id: 'Film', label: 'Cinema / Filme' },
    { id: 'Creative', label: 'Criativo' },
    { id: 'Stylized', label: 'Estilizado' },
  ];

  const filteredPresets =
    selectedCategory === 'all'
      ? presets
      : presets.filter((p) => p.category === selectedCategory);

  // Helper to check if a preset matches current settings
  const isPresetActive = (preset: ColorPreset) => {
    return (
      Math.abs(preset.settings.exposure - currentSettings.exposure) < 0.01 &&
      Math.abs(preset.settings.contrast - currentSettings.contrast) < 0.5 &&
      Math.abs(preset.settings.temperature - currentSettings.temperature) < 0.5 &&
      Math.abs(preset.settings.shadowsColor.hue - currentSettings.shadowsColor.hue) < 1 &&
      Math.abs(preset.settings.shadowsColor.amount - currentSettings.shadowsColor.amount) < 0.02
    );
  };

  return (
    <div id="preset-panel" className="flex flex-col gap-2">
      {/* Category Pills */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 text-xs">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-2.5 py-1 rounded-md transition-all whitespace-nowrap cursor-pointer ${
              selectedCategory === cat.id
                ? 'bg-[#dcd2fa] text-[#0f1014] font-semibold shadow-sm'
                : 'text-[#9a96b4] hover:text-[#f5f3fe] hover:bg-[#222131] border border-transparent'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Presets Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {filteredPresets.map((preset) => {
          const active = isPresetActive(preset);
          return (
            <button
              key={preset.id}
              id={`preset-btn-${preset.id}`}
              type="button"
              onClick={() => onApplyPreset(preset)}
              className={`flex flex-col text-left p-2.5 rounded-xl border transition-all cursor-pointer relative overflow-hidden group ${
                active
                  ? 'bg-[#222131] border-[#dcd2fa] shadow-md ring-1 ring-[#dcd2fa]/40'
                  : 'bg-[#222131] border-[#3b3756] hover:border-[#dcd2fa]/50 hover:bg-[#2a283b]'
              }`}
            >
              <div className="flex items-center justify-between w-full mb-1">
                <span className="font-semibold text-xs text-[#f5f3fe] group-hover:text-[#dcd2fa] transition-colors truncate">
                  {preset.name}
                </span>
                {active && (
                  <span className="w-3.5 h-3.5 rounded-full bg-[#dcd2fa] text-[#0f1014] flex items-center justify-center">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                  </span>
                )}
              </div>

              <span className="text-[10px] text-[#9a96b4] line-clamp-2 leading-relaxed">
                {preset.description}
              </span>

              {/* Little palette indicator */}
              <div className="flex items-center gap-1 mt-2">
                <span className="text-[9px] font-mono px-1 py-0.5 rounded bg-[#0f1014] border border-[#3b3756] text-[#9a96b4]">
                  {preset.category}
                </span>
                {preset.settings.shadowsColor.amount > 0 && (
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: `hsl(${preset.settings.shadowsColor.hue}, 80%, 50%)`,
                    }}
                    title="Shadows Tint"
                  />
                )}
                {preset.settings.highlightsColor.amount > 0 && (
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: `hsl(${preset.settings.highlightsColor.hue}, 80%, 50%)`,
                    }}
                    title="Highlights Tint"
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
