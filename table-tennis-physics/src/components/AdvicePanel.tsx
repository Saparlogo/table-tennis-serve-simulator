import React from 'react';
import { Lightbulb, TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import type { SimulationResult, AdviceData, SimulationParams } from '../types/physics';

interface AdvicePanelProps {
  result: SimulationResult;
  params: SimulationParams;
}

// ─── Spin Icon ────────────────────────────────────────────
const SpinIcon: React.FC<{ spinType: AdviceData['spinType'] }> = ({ spinType }) => {
  switch (spinType) {
    case 'heavy-topspin':
    case 'topspin':
      return <TrendingDown className="text-red-400" size={20} />;
    case 'heavy-backspin':
    case 'backspin':
      return <TrendingUp className="text-purple-400" size={20} />;
    default:
      return <Minus className="text-emerald-400" size={20} />;
  }
};

// ─── Outcome Icon ─────────────────────────────────────────
const OutcomeIcon: React.FC<{ outcome: SimulationResult['outcome'] }> = ({ outcome }) => {
  switch (outcome) {
    case 'hit':
      return <CheckCircle2 className="text-emerald-400" size={22} />;
    case 'net':
      return <XCircle className="text-red-400" size={22} />;
    case 'out_long':
    case 'out_side':
      return <AlertTriangle className="text-orange-400" size={22} />;
    default:
      return null;
  }
};

// ─── Difficulty Badge ─────────────────────────────────────
const DifficultyBadge: React.FC<{ difficulty: AdviceData['difficulty'] }> = ({ difficulty }) => {
  const config = {
    easy: { label: 'Простой', bg: 'bg-emerald-500/20', text: 'text-emerald-300', border: 'border-emerald-500/30' },
    medium: { label: 'Средний', bg: 'bg-amber-500/20', text: 'text-amber-300', border: 'border-amber-500/30' },
    hard: { label: 'Сложный', bg: 'bg-red-500/20', text: 'text-red-300', border: 'border-red-500/30' },
  }[difficulty];

  return (
    <span className={`text-xs px-2.5 py-1 rounded-full border font-semibold ${config.bg} ${config.text} ${config.border}`}>
      {config.label}
    </span>
  );
};

// ─── Spin Meter Bar ───────────────────────────────────────
const SpinMeterBar: React.FC<{ value: number; max: number; color: string; label: string }> = ({
  value, max, color, label
}) => {
  const pct = Math.min(Math.abs(value) / max * 100, 100);
  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs text-slate-400 mb-1">
        <span>{label}</span>
        <span style={{ color }}>{value > 0 ? '+' : ''}{value.toLocaleString()} RPM</span>
      </div>
      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, background: color }}
        />
      </div>
    </div>
  );
};

// ─── Physics Stats ────────────────────────────────────────
const PhysicsStats: React.FC<{ result: SimulationResult }> = ({ result }) => {
  const { trajectory, bounces } = result;
  if (trajectory.length === 0) return null;

  const lastPt = trajectory[trajectory.length - 1];
  const firstPt = trajectory[0];
  const maxHeight = trajectory.reduce((max, pt) => Math.max(max, pt.position.z), 0);
  const flightTime = lastPt.time;
  const maxMagnus = trajectory.reduce((max, pt) => Math.max(max, pt.magnusForce), 0);

  const stats = [
    { label: 'Нач. скорость', value: `${firstPt.speed.toFixed(1)} м/с` },
    { label: 'Кон. скорость', value: `${lastPt.speed.toFixed(1)} м/с` },
    { label: 'Макс. высота', value: `${(maxHeight * 100).toFixed(0)} см` },
    { label: 'Время полёта', value: `${flightTime.toFixed(3)} с` },
    { label: 'Отскоков', value: `${bounces.length}` },
    { label: 'Макс. Magnus', value: `${maxMagnus.toFixed(3)} м/с²` },
  ];

  return (
    <div className="grid grid-cols-3 gap-2">
      {stats.map(s => (
        <div key={s.label} className="bg-slate-800/50 rounded-lg p-2.5 text-center border border-slate-700/20">
          <p className="text-xs text-slate-500 mb-0.5">{s.label}</p>
          <p className="text-sm font-bold text-white">{s.value}</p>
        </div>
      ))}
    </div>
  );
};

// ─── Main Component ───────────────────────────────────────
const AdvicePanel: React.FC<AdvicePanelProps> = ({ result, params }) => {
  const { advice, outcome } = result;

  const outcomeBgMap: Record<SimulationResult['outcome'], string> = {
    hit: 'from-emerald-900/40 to-emerald-800/20 border-emerald-500/30',
    net: 'from-red-900/40 to-red-800/20 border-red-500/30',
    out_long: 'from-orange-900/40 to-orange-800/20 border-orange-500/30',
    out_side: 'from-orange-900/40 to-orange-800/20 border-orange-500/30',
    miss: 'from-slate-800/40 to-slate-700/20 border-slate-600/30',
  };

  return (
    <div className="h-full flex flex-col bg-slate-900/80 backdrop-blur-xl border-l border-slate-700/40 overflow-y-auto">
      {/* Header */}
      <div className="px-5 pt-5 pb-4 border-b border-slate-700/40">
        <div className="flex items-center gap-2">
          <Lightbulb className="text-amber-400" size={20} />
          <div>
            <h2 className="text-base font-bold text-white">Интеллектуальный Помощник</h2>
            <p className="text-xs text-slate-400">Анализ и советы по приёму мяча</p>
          </div>
        </div>
      </div>

      <div className="px-5 py-4 flex-1 space-y-4">
        {/* ─── Outcome Card ─────────────────────────────── */}
        <div className={`rounded-xl p-4 bg-gradient-to-br border ${outcomeBgMap[outcome]}`}>
          <div className="flex items-start gap-3">
            <OutcomeIcon outcome={outcome} />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <p className="font-bold text-white text-sm">{advice.message}</p>
                <DifficultyBadge difficulty={advice.difficulty} />
              </div>
            </div>
          </div>
        </div>

        {/* ─── Spin Analysis ────────────────────────────── */}
        <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/20">
          <div className="flex items-center gap-2 mb-3">
            <SpinIcon spinType={advice.spinType} />
            <h3 className="text-sm font-semibold text-white">Анализ Вращения</h3>
          </div>

          <SpinMeterBar
            value={params.topSpin}
            max={8000}
            color={params.topSpin >= 0 ? '#ef4444' : '#8b5cf6'}
            label={params.topSpin >= 0 ? 'Топ-спин' : 'Подрезка'}
          />

          {/* Spin type visualization */}
          <div className="mt-3 grid grid-cols-2 gap-2">
            <div className="bg-slate-900/40 rounded-lg p-2 text-center">
              <p className="text-xs text-slate-500 mb-0.5">Тип спина</p>
              <p className="text-sm font-semibold" style={{ color: advice.color }}>
                {advice.spinType === 'heavy-topspin' ? '🔴 Топ-спин++' :
                 advice.spinType === 'topspin' ? '🟠 Топ-спин' :
                 advice.spinType === 'heavy-backspin' ? '🟣 Подрезка++' :
                 advice.spinType === 'backspin' ? '🔵 Подрезка' :
                 '🟢 Нейтр.'}
              </p>
            </div>
            <div className="bg-slate-900/40 rounded-lg p-2 text-center">
              <p className="text-xs text-slate-500 mb-0.5">Боковой спин</p>
              <p className="text-sm font-semibold text-teal-300">
                {advice.sideSpinType === 'right' ? '→ Правый' :
                 advice.sideSpinType === 'left' ? '← Левый' :
                 '— Нет'}
              </p>
            </div>
          </div>
        </div>

        {/* ─── Receive Advice ───────────────────────────── */}
        <div className="bg-gradient-to-br from-amber-900/20 to-amber-800/10 rounded-xl p-4 border border-amber-500/20">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">🎯</span>
            <h3 className="text-sm font-semibold text-amber-300">Совет по приёму</h3>
          </div>
          <p className="text-sm text-slate-200 leading-relaxed">{advice.receiveMethod}</p>
        </div>

        {/* ─── Spin Effect Visualization ────────────────── */}
        <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/20">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
            Эффект на мяч
          </h3>
          <div className="flex items-center justify-around">
            {/* Ball rotation diagram */}
            <div className="text-center">
              <div className="w-16 h-16 rounded-full border-2 border-slate-600 relative overflow-hidden mx-auto mb-2"
                   style={{
                     background: `radial-gradient(circle at 40% 35%, ${advice.color}33, #0f172a)`,
                     borderColor: advice.color + '66',
                   }}>
                <div className="absolute inset-0 flex items-center justify-center text-2xl">🏓</div>
              </div>
              <p className="text-xs text-slate-400">Мяч</p>
            </div>

            {/* Arrow showing trajectory effect */}
            <div className="text-center px-2">
              <div className="text-3xl mb-1">
                {advice.spinType.includes('topspin') ? '⬇️' :
                 advice.spinType.includes('backspin') ? '⬆️' : '➡️'}
              </div>
              <p className="text-xs text-slate-400">Отлёт</p>
            </div>

            {/* Racket position advice */}
            <div className="text-center">
              <div className="w-16 h-16 relative mx-auto mb-2 flex items-center justify-center">
                <div
                  className="w-2 h-12 bg-gradient-to-b from-slate-300 to-slate-600 rounded-full transition-transform"
                  style={{
                    transform: advice.spinType.includes('topspin')
                      ? 'rotate(-30deg)'
                      : advice.spinType.includes('backspin')
                      ? 'rotate(30deg)'
                      : 'rotate(0deg)',
                  }}
                />
              </div>
              <p className="text-xs text-slate-400">Ракетка</p>
            </div>
          </div>
        </div>

        {/* ─── Physics Stats ────────────────────────────── */}
        <div className="bg-slate-800/40 rounded-xl p-4 border border-slate-700/20">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">
            Физические характеристики
          </h3>
          <PhysicsStats result={result} />
        </div>

        {/* ─── Quick Reference ──────────────────────────── */}
        <div className="bg-slate-800/20 rounded-xl p-4 border border-slate-700/10">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">
            Шпаргалка
          </h3>
          <div className="space-y-2">
            {[
              { icon: '🔴', text: 'Топ-спин → Закрой ракетку, амортизируй' },
              { icon: '🟣', text: 'Подрезка → Открой ракетку, толкни вверх' },
              { icon: '🔵', text: 'Боковой → Компенсируй направление' },
              { icon: '⚡', text: 'Скорость > 15 м/с → Короткое движение' },
            ].map(item => (
              <div key={item.text} className="flex items-start gap-2">
                <span className="text-base leading-none mt-0.5">{item.icon}</span>
                <p className="text-xs text-slate-400 leading-relaxed">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="px-5 py-3 border-t border-slate-700/40">
        <p className="text-xs text-slate-500 text-center">
          Константы: m=0.0027кг · D=0.04м · Cd=0.47 · Cm=0.00041
        </p>
      </div>
    </div>
  );
};

export default AdvicePanel;
