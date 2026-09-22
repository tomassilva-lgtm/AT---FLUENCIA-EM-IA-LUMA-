import React from 'react';
import { ColorGradeSettings } from '../types';
import { SliderControl } from './SliderControl';
import { Sun, Thermometer, Sliders, Sparkles, RotateCcw, Film } from 'lucide-react';

interface ControlPanelProps {
  settings: ColorGradeSettings;
  onChange: (settings: ColorGradeSettings) => void;
  onResetSection?: (section: 'exposure' | 'wb' | 'tones' | 'color') => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  settings,
  onChange,
}) => {
  const update = (key: keyof ColorGradeSettings, val: unknown) => {
    onChange({
      ...settings,
      [key]: val,
    });
  };

  const resetGroup = (keys: (keyof ColorGradeSettings)[]) => {
    const next = { ...settings };
    for (const k of keys) {
      if (k === 'shadowsColor' || k === 'midtonesColor' || k === 'highlightsColor') {
        next[k] = { hue: 0, amount: 0 };
      } else if (k === 'vignetteFeather') {
        next[k] = 50;
      } else {
        (next[k] as number) = 0;
      }
    }
    onChange(next);
  };

  return (
    <div id="control-panel" className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
      {/* 1. Exposure & Contrast */}
      <div className="bg-[#222131] border border-[#3b3756] rounded-xl p-3 shadow-sm">
        <div className="flex items-center justify-between pb-2 mb-1 border-b border-[#3b3756]">
          <div className="flex items-center gap-2 text-[#f5f3fe] font-semibold text-xs uppercase tracking-wider">
            <Sun className="w-3.5 h-3.5 text-[#dcd2fa]" />
            <span>Exposição &amp; Contraste</span>
          </div>
          <button
            type="button"
            onClick={() => resetGroup(['exposure', 'brightness', 'contrast'])}
            title="Redefinir exposição e contraste"
            className="text-[10px] text-[#9a96b4] hover:text-[#f5f3fe] flex items-center gap-1 cursor-pointer transition-colors"
          >
            <RotateCcw className="w-2.5 h-2.5" />
            <span>Redefinir</span>
          </button>
        </div>

        <SliderControl
          id="ctrl-exposure"
          label="Exposição"
          value={settings.exposure}
          min={-3}
          max={3}
          step={0.05}
          unit=" EV"
          formatValue={(v) => `${v > 0 ? '+' : ''}${v.toFixed(2)} EV`}
          onChange={(v) => update('exposure', v)}
          accentColor="#dcd2fa"
        />

        <SliderControl
          id="ctrl-brightness"
          label="Brilho"
          value={settings.brightness}
          min={-100}
          max={100}
          step={1}
          onChange={(v) => update('brightness', v)}
          accentColor="#dcd2fa"
        />

        <SliderControl
          id="ctrl-contrast"
          label="Contraste"
          value={settings.contrast}
          min={-100}
          max={100}
          step={1}
          onChange={(v) => update('contrast', v)}
          accentColor="#dcd2fa"
        />
      </div>

      {/* 2. White Balance */}
      <div className="bg-[#222131] border border-[#3b3756] rounded-xl p-3 shadow-sm">
        <div className="flex items-center justify-between pb-2 mb-1 border-b border-[#3b3756]">
          <div className="flex items-center gap-2 text-[#f5f3fe] font-semibold text-xs uppercase tracking-wider">
            <Thermometer className="w-3.5 h-3.5 text-[#dcd2fa]" />
            <span>Balanço de Branco</span>
          </div>
          <button
            type="button"
            onClick={() => resetGroup(['temperature', 'tint'])}
            title="Redefinir balanço de branco"
            className="text-[10px] text-[#9a96b4] hover:text-[#f5f3fe] flex items-center gap-1 cursor-pointer transition-colors"
          >
            <RotateCcw className="w-2.5 h-2.5" />
            <span>Redefinir</span>
          </button>
        </div>

        <SliderControl
          id="ctrl-temperature"
          label="Temperatura"
          value={settings.temperature}
          min={-100}
          max={100}
          step={1}
          formatValue={(v) => `${v > 0 ? '+' : ''}${v} (Quente/Frio)`}
          onChange={(v) => update('temperature', v)}
          accentColor="#dcd2fa"
        />

        <SliderControl
          id="ctrl-tint"
          label="Matiz / Tint"
          value={settings.tint}
          min={-100}
          max={100}
          step={1}
          formatValue={(v) => `${v > 0 ? '+' : ''}${v} (Mag/Verde)`}
          onChange={(v) => update('tint', v)}
          accentColor="#dcd2fa"
        />
      </div>

      {/* 3. Dynamic Range & Tones */}
      <div className="bg-[#222131] border border-[#3b3756] rounded-xl p-3 shadow-sm">
        <div className="flex items-center justify-between pb-2 mb-1 border-b border-[#3b3756]">
          <div className="flex items-center gap-2 text-[#f5f3fe] font-semibold text-xs uppercase tracking-wider">
            <Sliders className="w-3.5 h-3.5 text-[#dcd2fa]" />
            <span>Faixa Dinâmica &amp; Tons</span>
          </div>
          <button
            type="button"
            onClick={() =>
              resetGroup(['highlights', 'shadows', 'whites', 'blacks', 'clarity'])
            }
            title="Redefinir faixa dinâmica"
            className="text-[10px] text-[#9a96b4] hover:text-[#f5f3fe] flex items-center gap-1 cursor-pointer transition-colors"
          >
            <RotateCcw className="w-2.5 h-2.5" />
            <span>Redefinir</span>
          </button>
        </div>

        <SliderControl
          id="ctrl-highlights"
          label="Altas Luzes (Highlights)"
          value={settings.highlights}
          min={-100}
          max={100}
          step={1}
          onChange={(v) => update('highlights', v)}
          accentColor="#dcd2fa"
        />

        <SliderControl
          id="ctrl-shadows"
          label="Sombras (Shadows)"
          value={settings.shadows}
          min={-100}
          max={100}
          step={1}
          onChange={(v) => update('shadows', v)}
          accentColor="#dcd2fa"
        />

        <SliderControl
          id="ctrl-whites"
          label="Brancos (Whites)"
          value={settings.whites}
          min={-100}
          max={100}
          step={1}
          onChange={(v) => update('whites', v)}
          accentColor="#dcd2fa"
        />

        <SliderControl
          id="ctrl-blacks"
          label="Pretos (Blacks)"
          value={settings.blacks}
          min={-100}
          max={100}
          step={1}
          onChange={(v) => update('blacks', v)}
          accentColor="#dcd2fa"
        />

        <SliderControl
          id="ctrl-clarity"
          label="Claridade / Contraste Médio"
          value={settings.clarity}
          min={-100}
          max={100}
          step={1}
          onChange={(v) => update('clarity', v)}
          accentColor="#dcd2fa"
        />
      </div>

      {/* 4. Saturation & Vibrance */}
      <div className="bg-[#222131] border border-[#3b3756] rounded-xl p-3 shadow-sm">
        <div className="flex items-center justify-between pb-2 mb-1 border-b border-[#3b3756]">
          <div className="flex items-center gap-2 text-[#f5f3fe] font-semibold text-xs uppercase tracking-wider">
            <Sparkles className="w-3.5 h-3.5 text-[#dcd2fa]" />
            <span>Saturação &amp; Vibração</span>
          </div>
          <button
            type="button"
            onClick={() => resetGroup(['saturation', 'vibrance'])}
            title="Redefinir saturação e vibração"
            className="text-[10px] text-[#9a96b4] hover:text-[#f5f3fe] flex items-center gap-1 cursor-pointer transition-colors"
          >
            <RotateCcw className="w-2.5 h-2.5" />
            <span>Redefinir</span>
          </button>
        </div>

        <SliderControl
          id="ctrl-saturation"
          label="Saturação"
          value={settings.saturation}
          min={-100}
          max={100}
          step={1}
          onChange={(v) => update('saturation', v)}
          accentColor="#dcd2fa"
        />

        <SliderControl
          id="ctrl-vibrance"
          label="Vibração"
          value={settings.vibrance}
          min={-100}
          max={100}
          step={1}
          onChange={(v) => update('vibrance', v)}
          accentColor="#dcd2fa"
        />
      </div>

      {/* 5. Film Grain & Lens Vignette (Optics & Texture) */}
      <div id="section-grain-vignette" className="bg-[#222131] border border-[#3b3756] rounded-xl p-3 shadow-sm md:col-span-2">
        <div className="flex items-center justify-between pb-2 mb-1 border-b border-[#3b3756]">
          <div className="flex items-center gap-2 text-[#f5f3fe] font-semibold text-xs uppercase tracking-wider">
            <Film className="w-3.5 h-3.5 text-[#dcd2fa]" />
            <span>Grão de Filme &amp; Vinheta Óptica</span>
          </div>
          <button
            id="btn-reset-grain-vignette"
            type="button"
            onClick={() => resetGroup(['grain', 'vignette', 'vignetteFeather'])}
            title="Redefinir grão e vinheta"
            className="text-[10px] text-[#9a96b4] hover:text-[#f5f3fe] flex items-center gap-1 cursor-pointer transition-colors"
          >
            <RotateCcw className="w-2.5 h-2.5" />
            <span>Redefinir</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4">
          <SliderControl
            id="ctrl-grain"
            label="Grão Analógico"
            value={settings.grain || 0}
            min={0}
            max={100}
            step={1}
            unit="%"
            formatValue={(v) => `${v}% (Haleto de Prata)`}
            onChange={(v) => update('grain', v)}
            accentColor="#dcd2fa"
          />

          <SliderControl
            id="ctrl-vignette"
            label="Vinheta de Lente"
            value={settings.vignette || 0}
            min={0}
            max={100}
            step={1}
            unit="%"
            formatValue={(v) => `${v}% (Queda Periférica)`}
            onChange={(v) => update('vignette', v)}
            accentColor="#dcd2fa"
          />

          <div className="sm:col-span-2 mt-1 pt-2 border-t border-[#3b3756]">
            <SliderControl
              id="ctrl-vignette-feather"
              label="Difusão / Suavidade da Vinheta"
              value={settings.vignetteFeather ?? 50}
              min={10}
              max={100}
              step={1}
              unit="%"
              formatValue={(v) => `${v}% ${v > 70 ? '(Muito Suave)' : v < 30 ? '(Borda Nítida)' : '(Gradual)'}`}
              onChange={(v) => update('vignetteFeather', v)}
              accentColor="#dcd2fa"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
