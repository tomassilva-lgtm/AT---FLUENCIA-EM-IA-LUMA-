import React, { useState, useEffect, useRef } from 'react';
import { RotateCcw } from 'lucide-react';

interface SliderControlProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  defaultValue?: number;
  unit?: string;
  formatValue?: (val: number) => string;
  onChange: (val: number) => void;
  accentColor?: string;
}

export const SliderControl: React.FC<SliderControlProps> = ({
  id,
  label,
  value,
  min,
  max,
  step = 1,
  defaultValue = 0,
  unit = '',
  formatValue,
  onChange,
  accentColor = '#dcd2fa',
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(value.toString());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isEditing) {
      setInputValue(Number.isInteger(value) ? value.toString() : value.toFixed(2));
    }
  }, [value, isEditing]);

  const isModified = Math.abs(value - defaultValue) > 0.001;

  const displayVal = formatValue
    ? formatValue(value)
    : `${value > 0 ? '+' : ''}${typeof value === 'number' ? (Number.isInteger(value) ? value : value.toFixed(2)) : value}${unit}`;

  // Calculate track progress percentage from center (if min < 0 < max) or from min
  let fillLeft = '0%';
  let fillWidth = '0%';

  if (min < 0 && max > 0) {
    const zeroPercent = (Math.abs(min) / (max - min)) * 100;
    const currentPercent = ((value - min) / (max - min)) * 100;
    if (value >= 0) {
      fillLeft = `${zeroPercent}%`;
      fillWidth = `${currentPercent - zeroPercent}%`;
    } else {
      fillLeft = `${currentPercent}%`;
      fillWidth = `${zeroPercent - currentPercent}%`;
    }
  } else {
    const currentPercent = ((value - min) / (max - min)) * 100;
    fillLeft = '0%';
    fillWidth = `${currentPercent}%`;
  }

  // Handle fine adjustment (+/- 0.01) with Arrow keys
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const delta = e.shiftKey ? 0.1 : 0.01;
      const nextVal = Math.min(max, Math.round((value + delta) * 100) / 100);
      onChange(nextVal);
      setInputValue(nextVal.toString());
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      const delta = e.shiftKey ? 0.1 : 0.01;
      const nextVal = Math.max(min, Math.round((value - delta) * 100) / 100);
      onChange(nextVal);
      setInputValue(nextVal.toString());
    } else if (e.key === 'Enter') {
      commitInputValue();
      setIsEditing(false);
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setInputValue(value.toString());
    }
  };

  const commitInputValue = () => {
    const parsed = parseFloat(inputValue);
    if (!isNaN(parsed)) {
      const clamped = Math.min(max, Math.max(min, Math.round(parsed * 100) / 100));
      onChange(clamped);
      setInputValue(clamped.toString());
    } else {
      setInputValue(value.toString());
    }
  };

  return (
    <div
      id={`slider-group-${id}`}
      className="flex flex-col gap-1.5 py-1.5 px-2 rounded-lg hover:bg-[#222131]/60 transition-colors group"
    >
      <div className="flex items-center justify-between text-xs">
        <label
          htmlFor={`range-${id}`}
          className="font-medium text-[#9a96b4] group-hover:text-[#f5f3fe] transition-colors cursor-pointer select-none"
        >
          {label}
        </label>
        <div className="flex items-center gap-1.5">
          {isEditing ? (
            <input
              ref={inputRef}
              id={`num-input-${id}`}
              type="text"
              autoFocus
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onBlur={() => {
                commitInputValue();
                setIsEditing(false);
              }}
              onKeyDown={handleKeyDown}
              className="w-16 px-1.5 py-0.5 text-center font-mono text-[11px] bg-[#0f1014] text-[#dcd2fa] border border-[#dcd2fa] rounded outline-none shadow-sm"
              title="Pressione Cima/Baixo para ajuste fino (+/- 0.01)"
            />
          ) : (
            <button
              type="button"
              id={`badge-${id}`}
              onClick={() => {
                setIsEditing(true);
                setTimeout(() => inputRef.current?.select(), 10);
              }}
              title="Clique para editar valor. Suporta setas Cima/Baixo (+/- 0.01)"
              className={`font-mono text-[11px] px-1.5 py-0.5 rounded cursor-text transition-all ${
                isModified
                  ? 'text-[#dcd2fa] bg-[#3b3756]/40 font-semibold border border-[#3b3756]'
                  : 'text-[#9a96b4] bg-[#222131]/60 border border-transparent hover:border-[#3b3756]'
              }`}
            >
              {displayVal}
            </button>
          )}

          <button
            id={`reset-${id}`}
            type="button"
            disabled={!isModified}
            onClick={() => {
              onChange(defaultValue);
              setInputValue(defaultValue.toString());
            }}
            title="Restaurar valor padrão"
            className={`p-1 rounded-md transition-all ${
              isModified
                ? 'text-[#9a96b4] hover:text-[#f5f3fe] hover:bg-[#3b3756]/50 cursor-pointer'
                : 'text-[#3b3756] opacity-30 cursor-default'
            }`}
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="relative flex items-center h-4">
        {/* Custom Fill Indicator Bar */}
        <div className="absolute left-0 right-0 h-1 bg-[#3b3756] rounded-full pointer-events-none overflow-hidden">
          <div
            className="absolute top-0 bottom-0 rounded-full transition-all duration-75"
            style={{
              left: fillLeft,
              width: fillWidth,
              backgroundColor: isModified ? accentColor : '#6a6587',
            }}
          />
        </div>

        {/* Center notch for bi-directional sliders */}
        {min < 0 && max > 0 && (
          <div
            className="absolute top-1/2 -translate-y-1/2 w-0.5 h-2 bg-[#dcd2fa]/60 pointer-events-none"
            style={{ left: `${(Math.abs(min) / (max - min)) * 100}%` }}
          />
        )}

        <input
          id={`range-${id}`}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          onKeyDown={handleKeyDown}
          title={`${label}: use as setas Cima/Baixo para ajuste fino (+/- 0.01)`}
          className="w-full relative z-10 cursor-pointer opacity-90 hover:opacity-100"
        />
      </div>
    </div>
  );
};

