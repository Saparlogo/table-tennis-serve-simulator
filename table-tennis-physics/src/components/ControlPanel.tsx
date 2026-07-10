import React from 'react';
import { RotateCcw, Settings2 } from 'lucide-react';
import type { SimulationParams } from '../types/physics';

interface ControlPanelProps {
  params: SimulationParams;
  onUpdate: <K extends keyof SimulationParams>(key: K, value: SimulationParams[K]) => void;
  onReset: () => void;
}

interface SliderProps {
  id: string;
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  unit?: string;
  onChange: (v: number) => void;
  formatValue?: (v: number) => string;
  colorScheme?: 'blue' | 'green' | 'purple' | 'orange' | 'teal';
  leftLabel?: string;
  rightLabel?: string;
}

const colorMap = {
  blue: {
    track: 'from-blue-900/60 to-blue-800/60',
    thumb: 'accent-blue-400',
    value: 'text-blue-300',
    gradient: 'from-blue-500 to-blue-400',
  },
  green: {
    track: 'from-emerald-900/60 to-emerald-800/60',
    thumb: 'accent-emerald-400',
    value: 'text-emerald-300',
    gradient: 'from-emerald-500 to-emerald-400',
  },
  purple: {
    track: 'from-purple-900/60 to-purple-800/60',
    thumb: 'accent-purple-400',
    value: 'text-purple-300',
    gradient: 'from-purple-500 to-violet-400',
  },
  orange: {
    track: 'from-orange-900/60 to-orange-800/60',
    thumb: 'accent-orange-400',
    value: 'text-orange-300',
    gradient: 'from-orange-500 to-amber-400',
  },
  teal: {
    track: 'from-teal-900/60 to-teal-800/60',
    thumb: 'accent-teal-400',
    value: 'text-teal-300',
    gradient: 'from-teal-500 to-cyan-400',
  },
};

const Slider: React.FC<SliderProps> = ({
  id,
  label,
  value,
  min,
  max,
  step = 1,
  unit = '',
  onChange,
  formatValue,
  colorScheme = 'blue',
  leftLabel,
  rightLabel,
}) => {
  const colors = colorMap[colorScheme];
  const pct = ((value - min) / (max - min)) * 100;
  const displayValue = formatValue ? formatValue(value) : `${value}`;

  return (
    <div className="mb-4 group">
      <div className="flex items-center justify-between mb-1.5">
        <label htmlFor={id} className="text-sm font-medium text-slate-300 group-hover:text-white transition-colors">
          {label}
        </label>
        <span className={`text-sm font-bold ${colors.value} bg-slate-800/80 px-2.5 py-0.5 rounded-full border border-slate-700/50`}>
          {displayValue}{unit && <span className="text-xs text-slate-400 ml-1">{unit}</span>}
        </span>
      </div>
      <div className="relative">
        {/* Track background */}
        <div className={`absolute inset-0 top-1/2 -translate-y-1/2 h-2 rounded-full bg-gradient-to-r ${colors.track} border border-slate-600/30`} />
        {/* Filled portion */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 h-2 rounded-full bg-gradient-to-r ${colors.gradient} opacity-80`}
          style={{ width: `${pct}%`, left: 0 }}
        />
        {/* Range input */}
        <input
          id={id}
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={e => onChange(Number(e.target.value))}
          className={`relative w-full h-2 rounded-full appearance-none bg-transparent cursor-pointer ${colors.thumb}`}
          style={{
            WebkitAppearance: 'none',
          }}
        />
      </div>
      {(leftLabel || rightLabel) && (
        <div className="flex justify-between mt-1">
          <span className="text-xs text-slate-500">{leftLabel}</span>
          <span className="text-xs text-slate-500">{rightLabel}</span>
        </div>
      )}
    </div>
  );
};

// ─── Spin Visualizer ──────────────────────────────────────
const SpinVisualizer: React.FC<{ topSpin: number; sideSpin: number }> = ({ topSpin, sideSpin }) => {
  const maxRpm = 8000;
  const ts = topSpin / maxRpm;
  const ss = sideSpin / 5000;

  const spinLabel =
    topSpin > 3000 ? 'Сильный Топ-спин' :
    topSpin > 800 ? 'Топ-спин' :
    topSpin < -3000 ? 'Сильная Подрезка' :
    topSpin < -800 ? 'Подрезка' : 'Без спина';

  const spinColor =
    topSpin > 800 ? '#ef4444' :
    topSpin < -800 ? '#8b5cf6' :
    '#10b981';

  return (
    <div className="flex items-center gap-4 bg-slate-800/40 rounded-xl p-3 border border-slate-700/30 mb-4">
      {/* Ball with spin arrows */}
      <div className="relative flex-shrink-0">
        <div
          className="w-14 h-14 rounded-full border-2 flex items-center justify-center relative overflow-hidden"
          style={{ borderColor: spinColor, background: `radial-gradient(circle at 35% 35%, ${spinColor}44, #0f172a)` }}
        >
          {/* Spin stripe */}
          <div
            className="absolute inset-0 rounded-full"
            style={{
              background: `conic-gradient(from ${ts * 180}deg, ${spinColor}33, transparent, ${spinColor}22)`,
              animation: Math.abs(topSpin) > 100 ? 'spin 2s linear infinite' : 'none',
              animationDirection: topSpin < 0 ? 'reverse' : 'normal',
            }}
          />
          <span className="text-lg z-10" role="img" aria-label="ball">🏓</span>
        </div>

        {/* Top/back spin arrows */}
        {Math.abs(topSpin) > 200 && (
          <div
            className="absolute -right-5 top-1/2 -translate-y-1/2 text-lg"
            style={{ color: spinColor }}
          >
            {topSpin > 0 ? '↻' : '↺'}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm" style={{ color: spinColor }}>{spinLabel}</p>
        <p className="text-xs text-slate-400 mt-0.5">
          {Math.abs(topSpin).toLocaleString()} RPM
          {Math.abs(sideSpin) > 200 && (
            <span className="text-teal-400 ml-2">
              · Боковой: {ss > 0 ? '→' : '←'} {Math.abs(sideSpin).toLocaleString()} RPM
            </span>
          )}
        </p>
        {/* Mini spin meter */}
        <div className="mt-1.5 h-1.5 bg-slate-700 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300"
            style={{
              width: `${Math.abs(ts) * 100}%`,
              background: spinColor,
              marginLeft: ts < 0 ? `${(1 + ts) * 100}%` : 0,
            }}
          />
        </div>
      </div>
    </div>
  );
};

// ─── Section Header ───────────────────────────────────────
const SectionHeader: React.FC<{ icon?: React.ReactNode; title: string }> = ({ icon, title }) => (
  <div className="flex items-center gap-2 mb-3 mt-1">
    {icon && <span className="text-slate-400">{icon}</span>}
    <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest">{title}</h3>
  </div>
);

// ─── Main Control Panel ───────────────────────────────────
const ControlPanel: React.FC<ControlPanelProps> = ({ params, onUpdate, onReset }) => {
  return (
    <div className="h-full flex flex-col bg-slate-900/80 backdrop-blur-xl border-r border-slate-700/40 overflow-y-auto">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-slate-700/40">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold text-white flex items-center gap-2">
              🏓 <span>Физика Настольного Тенниса</span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">Симулятор траектории и вращения мяча</p>
          </div>
          <button
            onClick={onReset}
            title="Сбросить настройки"
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-600/50 text-slate-400 hover:text-white transition-all duration-200 hover:scale-105 active:scale-95"
          >
            <RotateCcw size={16} />
          </button>
        </div>
      </div>

      <div className="px-5 py-4 flex-1">
        {/* ─── Launch Parameters ─────────────────────────── */}
        <div className="bg-slate-800/30 rounded-xl p-4 mb-4 border border-slate-700/20">
          <SectionHeader icon={<Settings2 size={14} />} title="Параметры удара" />

          <Slider
            id="speed"
            label="Начальная скорость"
            value={params.speed}
            min={5}
            max={25}
            step={0.5}
            unit="м/с"
            colorScheme="blue"
            onChange={v => onUpdate('speed', v)}
          />

          <Slider
            id="verticalAngle"
            label="Вертикальный угол"
            value={params.verticalAngle}
            min={-10}
            max={30}
            unit="°"
            colorScheme="green"
            leftLabel="-10° (вниз)"
            rightLabel="30° (вверх)"
            onChange={v => onUpdate('verticalAngle', v)}
          />

          <Slider
            id="horizontalAngle"
            label="Горизонтальный угол"
            value={params.horizontalAngle}
            min={-20}
            max={20}
            unit="°"
            colorScheme="teal"
            leftLabel="-20° (влево)"
            rightLabel="20° (вправо)"
            onChange={v => onUpdate('horizontalAngle', v)}
          />
        </div>

        {/* ─── Spin Parameters ───────────────────────────── */}
        <div className="bg-slate-800/30 rounded-xl p-4 mb-4 border border-slate-700/20">
          <SectionHeader title="Параметры вращения" />

          <SpinVisualizer topSpin={params.topSpin} sideSpin={params.sideSpin} />

          <Slider
            id="topSpin"
            label="Верхнее/Нижнее вращение"
            value={params.topSpin}
            min={-8000}
            max={8000}
            step={100}
            unit="RPM"
            colorScheme="orange"
            leftLabel="↙ Подрезка"
            rightLabel="Топ-спин ↗"
            onChange={v => onUpdate('topSpin', v)}
            formatValue={v => (v > 0 ? `+${v}` : `${v}`)}
          />

          <Slider
            id="sideSpin"
            label="Боковое вращение"
            value={params.sideSpin}
            min={-5000}
            max={5000}
            step={100}
            unit="RPM"
            colorScheme="purple"
            leftLabel="← Левый"
            rightLabel="Правый →"
            onChange={v => onUpdate('sideSpin', v)}
            formatValue={v => (v > 0 ? `+${v}` : `${v}`)}
          />
        </div>

        {/* ─── Receive Settings ──────────────────────────── */}
        <div className="bg-slate-800/30 rounded-xl p-4 border border-slate-700/20">
          <SectionHeader title="Настройки приёма" />

          <Slider
            id="racketAngle"
            label="Угол ракетки соперника"
            value={params.racketAngle}
            min={0}
            max={90}
            unit="°"
            colorScheme="teal"
            leftLabel="0° (горизонт.)"
            rightLabel="90° (вертик.)"
            onChange={v => onUpdate('racketAngle', v)}
          />

          {/* Racket angle visualization */}
          <div className="flex items-center gap-3 mt-2 p-3 bg-slate-900/40 rounded-lg">
            <div
              className="w-1.5 h-10 bg-gradient-to-b from-slate-300 to-slate-500 rounded-full transition-transform duration-300 origin-bottom"
              style={{ transform: `rotate(${90 - params.racketAngle}deg)` }}
            />
            <div>
              <p className="text-xs text-slate-400">
                {params.racketAngle < 30 ? '🔓 Открытая ракетка (для подрезки)' :
                 params.racketAngle < 60 ? '⚖️ Нейтральная позиция' :
                 '🔒 Закрытая ракетка (для топ-спина)'}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">{params.racketAngle}° от горизонтали</p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-slate-700/40">
        <p className="text-xs text-slate-500 text-center">
          Физический движок: метод Эйлера · dt=0.001с · Magnus + Drag
        </p>
      </div>

      {/* Slider thumb styles */}
      <style>{`
        input[type=range]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: white;
          border: 2px solid rgba(148, 163, 184, 0.6);
          cursor: pointer;
          box-shadow: 0 2px 8px rgba(0,0,0,0.4);
          transition: transform 0.15s, box-shadow 0.15s;
        }
        input[type=range]::-webkit-slider-thumb:hover {
          transform: scale(1.2);
          box-shadow: 0 2px 16px rgba(99,179,237,0.5);
        }
        input[type=range]::-moz-range-thumb {
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: white;
          border: 2px solid rgba(148, 163, 184, 0.6);
          cursor: pointer;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default ControlPanel;
