import React, { useRef, useCallback } from 'react';
import { RotateCcw } from 'lucide-react';
import { ColorWheelSetting } from '../types';

interface ColorWheelProps {
  id: string;
  title: string;
  subtitle?: string;
  value: ColorWheelSetting;
  onChange: (setting: ColorWheelSetting) => void;
  size?: number;
}

export const ColorWheel: React.FC<ColorWheelProps> = ({
  id,
  title,
  subtitle,
  value,
  onChange,
  size = 180,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const radius = size / 2;
  const isModified = value.amount > 0.005;

  // Convert polar (hue in deg, amount 0..1) to cartesian (x, y relative to center)
  // Hue 0 is at (1, 0) - standard Cartesian angle
  const angleRad = (value.hue * Math.PI) / 180;
  const distPx = value.amount * (radius - 12);
  const pointerX = radius + Math.cos(angleRad) * distPx;
  const pointerY = radius + Math.sin(angleRad) * distPx;

  const handlePointer = useCallback(
    (clientX: number, clientY: number) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = clientX - cx;
      const dy = clientY - cy;

      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxDist = radius - 12;
      const rawAmount = Math.min(1, dist / maxDist);

      // Angle in degrees [0, 360)
      let angle = (Math.atan2(dy, dx) * 180) / Math.PI;
      if (angle < 0) angle += 360;

      onChange({
        hue: Math.round(angle),
        amount: Math.round(rawAmount * 100) / 100,
      });
    },
    [radius, onChange]
  );

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = true;
    e.currentTarget.setPointerCapture(e.pointerId);
    handlePointer(e.clientX, e.clientY);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return;
    handlePointer(e.clientX, e.clientY);
  };

  const onPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = false;
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignored if pointer capture is already released
    }
  };

  const handleReset = () => {
    onChange({ hue: 0, amount: 0 });
  };

  const tintColor = isModified
    ? `hsl(${value.hue}, ${Math.round(value.amount * 100)}%, 50%)`
    : 'transparent';

  const isCompact = size <= 125;

  return (
    <div
      id={`color-wheel-card-${id}`}
      className={`flex flex-col items-center bg-[#0f1014] border border-[#3b3756] rounded-xl shadow-md min-w-0 overflow-hidden ${
        isCompact ? 'p-2' : 'p-2.5 sm:p-3'
      }`}
    >
      {/* Header */}
      <div className="w-full flex items-center justify-between mb-1.5 lg:mb-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <div
            className="w-2.5 h-2.5 lg:w-3 lg:h-3 shrink-0 rounded-full border border-[#3b3756] transition-colors"
            style={{ backgroundColor: tintColor }}
            title={`Tint preview: ${tintColor}`}
          />
          <div className="min-w-0">
            <h4 className="text-[11px] lg:text-xs font-semibold uppercase tracking-wider text-[#f5f3fe] truncate">
              {title}
            </h4>
            {subtitle && (
              <span className="text-[9px] lg:text-[10px] text-[#9a96b4] block -mt-0.5 truncate max-w-[80px] sm:max-w-[100px] lg:max-w-none">
                {subtitle}
              </span>
            )}
          </div>
        </div>

        <button
          id={`reset-wheel-${id}`}
          type="button"
          onClick={handleReset}
          disabled={!isModified}
          title="Redefinir roda para o centro"
          className={`p-0.5 lg:p-1 rounded transition-colors shrink-0 ${
            isModified
              ? 'text-[#9a96b4] hover:text-[#f5f3fe] hover:bg-[#222131] cursor-pointer'
              : 'text-[#5a5575] opacity-30 cursor-default'
          }`}
        >
          <RotateCcw className="w-3 h-3 lg:w-3.5 lg:h-3.5" />
        </button>
      </div>

      {/* Interactive Wheel Circle */}
      <div
        id={`wheel-container-${id}`}
        ref={containerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{ width: size, height: size }}
        className="relative rounded-full cursor-crosshair touch-none select-none shadow-inner group overflow-hidden border border-[#3b3756]"
      >
        {/* Conic Hue Spectrum */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              'conic-gradient(from 0deg, hsl(0, 100%, 50%), hsl(60, 100%, 50%), hsl(120, 100%, 50%), hsl(180, 100%, 50%), hsl(240, 100%, 50%), hsl(300, 100%, 50%), hsl(360, 100%, 50%))',
            opacity: 0.85,
          }}
        />

        {/* Radial neutral desaturation gradient to dark studio center */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background:
              'radial-gradient(circle at center, #0f1014 0%, rgba(15, 16, 20, 0.85) 30%, rgba(15, 16, 20, 0.2) 75%, transparent 100%)',
          }}
        />

        {/* Center crosshairs and guide circles */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none opacity-40"
          viewBox={`0 0 ${size} ${size}`}
        >
          <circle
            cx={radius}
            cy={radius}
            r={(radius - 12) * 0.5}
            fill="none"
            stroke="#dcd2fa"
            strokeDasharray="2 2"
            strokeWidth="0.8"
          />
          <circle
            cx={radius}
            cy={radius}
            r={radius - 12}
            fill="none"
            stroke="#dcd2fa"
            strokeWidth="0.8"
          />
          <line
            x1={radius}
            y1={12}
            x2={radius}
            y2={size - 12}
            stroke="#dcd2fa"
            strokeWidth="0.8"
          />
          <line
            x1={12}
            y1={radius}
            x2={size - 12}
            y2={radius}
            stroke="#dcd2fa"
            strokeWidth="0.8"
          />
        </svg>

        {/* Pointer Thumb Indicator */}
        <div
          id={`wheel-pointer-${id}`}
          className={`absolute rounded-full border-2 border-[#f5f3fe] shadow-lg pointer-events-none transition-transform duration-75 flex items-center justify-center ${
            isCompact ? 'w-4 h-4 -ml-2 -mt-2' : 'w-5 h-5 -ml-2.5 -mt-2.5'
          }`}
          style={{
            left: `${pointerX}px`,
            top: `${pointerY}px`,
            backgroundColor: isModified
              ? `hsl(${value.hue}, ${Math.round(value.amount * 100)}%, 50%)`
              : '#0f1014',
            boxShadow: isModified
              ? `0 0 10px hsl(${value.hue}, 100%, 50%)`
              : '0 0 5px rgba(0,0,0,0.5)',
          }}
        >
          <div className={isCompact ? 'w-1 h-1 rounded-full bg-[#f5f3fe]' : 'w-1.5 h-1.5 rounded-full bg-[#f5f3fe]'} />
        </div>
      </div>

      {/* Numerical readouts */}
      <div className="w-full flex items-center justify-between mt-2 lg:mt-3 text-[10px] lg:text-[11px] font-mono px-0.5 sm:px-1">
        <div className="flex items-center gap-1">
          <span className="text-[#9a96b4]">HUE:</span>
          <span className={isModified ? 'text-[#dcd2fa] font-medium' : 'text-[#9a96b4]'}>
            {value.hue}°
          </span>
        </div>
        <div className="flex items-center gap-1">
          <span className="text-[#9a96b4]">INT:</span>
          <span className={isModified ? 'text-[#dcd2fa] font-medium' : 'text-[#9a96b4]'}>
            {Math.round(value.amount * 100)}%
          </span>
        </div>
      </div>
    </div>
  );
};
