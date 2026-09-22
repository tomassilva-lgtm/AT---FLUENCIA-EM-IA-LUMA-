import React, { useState, useEffect } from 'react';
import { ColorGradeSettings, ColorWheelSetting } from '../types';
import { ColorWheel } from './ColorWheel';
import { Palette, RotateCcw } from 'lucide-react';

interface ColorWheelsPanelProps {
  settings: ColorGradeSettings;
  onChange: (settings: ColorGradeSettings) => void;
}

export const ColorWheelsPanel: React.FC<ColorWheelsPanelProps> = ({
  settings,
  onChange,
}) => {
  // Tablet detection: screen width in tablet range (641px - 1024px) or touch tablets up to 1194px
  const [isTablet, setIsTablet] = useState(() => {
    if (typeof window === 'undefined') return false;
    const w = window.innerWidth;
    const isTouchTablet =
      typeof navigator !== 'undefined' &&
      (navigator.maxTouchPoints > 1 || /iPad|Tablet|PlayBook|Silk/i.test(navigator.userAgent)) &&
      w <= 1194 &&
      w >= 600;
    const isTabletWidth = w >= 641 && w <= 1024;
    return isTabletWidth || isTouchTablet;
  });

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      const isTouchTablet =
        typeof navigator !== 'undefined' &&
        (navigator.maxTouchPoints > 1 || /iPad|Tablet|PlayBook|Silk/i.test(navigator.userAgent)) &&
        w <= 1194 &&
        w >= 600;
      const isTabletWidth = w >= 641 && w <= 1024;
      setIsTablet(isTabletWidth || isTouchTablet);
    };

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  const updateShadows = (val: ColorWheelSetting) => {
    onChange({ ...settings, shadowsColor: val });
  };

  const updateMidtones = (val: ColorWheelSetting) => {
    onChange({ ...settings, midtonesColor: val });
  };

  const updateHighlights = (val: ColorWheelSetting) => {
    onChange({ ...settings, highlightsColor: val });
  };

  const resetAllWheels = () => {
    onChange({
      ...settings,
      shadowsColor: { hue: 0, amount: 0 },
      midtonesColor: { hue: 0, amount: 0 },
      highlightsColor: { hue: 0, amount: 0 },
    });
  };

  const anyWheelModified =
    settings.shadowsColor.amount > 0 ||
    settings.midtonesColor.amount > 0 ||
    settings.highlightsColor.amount > 0;

  // Reduced wheel size ONLY for tablet version so the 3 wheels fit side-by-side without overlapping
  // 112px on tablet leaves ample breathing room in the 3-column layout; 160px for mobile and desktop
  const wheelSize = isTablet ? 112 : 160;

  return (
    <div
      id="color-wheels-panel"
      className="bg-[#222131] border border-[#3b3756] rounded-xl p-2.5 lg:p-3 shadow-md"
    >
      <div className="flex items-center justify-between pb-2 mb-2.5 lg:mb-3 border-b border-[#3b3756]">
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-[#dcd2fa]" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#f5f3fe]">
            Rodas de Cor Primárias (3-Way)
          </h3>
          <span className="text-[10px] text-[#9a96b4] hidden sm:inline">
            (Sombras / Meios-Tons / Altas Luzes)
          </span>
        </div>

        <button
          id="btn-reset-all-wheels"
          type="button"
          onClick={resetAllWheels}
          disabled={!anyWheelModified}
          className={`flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium transition-all ${
            anyWheelModified
              ? 'text-[#9a96b4] hover:text-[#f5f3fe] hover:bg-[#2c2a3e] cursor-pointer'
              : 'text-[#5a5575] opacity-40 cursor-default'
          }`}
        >
          <RotateCcw className="w-3 h-3" />
          <span>Redefinir Rodas</span>
        </button>
      </div>

      {/* The 3 wheels grid - gap-2 on tablet to prevent clipping, gap-3 on desktop */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 lg:gap-3 items-center justify-center">
        <ColorWheel
          id="wheel-shadows"
          title="Sombras"
          subtitle="Piso tonal (Luma < 50%)"
          value={settings.shadowsColor}
          onChange={updateShadows}
          size={wheelSize}
        />

        <ColorWheel
          id="wheel-midtones"
          title="Meios-Tons"
          subtitle="Corpo e Pele (Luma 25-75%)"
          value={settings.midtonesColor}
          onChange={updateMidtones}
          size={wheelSize}
        />

        <ColorWheel
          id="wheel-highlights"
          title="Altas Luzes"
          subtitle="Especular e Céu (Luma > 50%)"
          value={settings.highlightsColor}
          onChange={updateHighlights}
          size={wheelSize}
        />
      </div>
    </div>
  );
};
