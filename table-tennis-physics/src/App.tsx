import React, { useState } from 'react';
import ControlPanel from './components/ControlPanel';
import AdvicePanel from './components/AdvicePanel';
import TableCanvas from './components/TableCanvas';
import { useSimulation } from './hooks/useSimulation';
import { BarChart3, ChevronLeft, ChevronRight } from 'lucide-react';

const App: React.FC = () => {
  const { params, result, updateParam, reset } = useSimulation();
  const [leftPanelOpen, setLeftPanelOpen] = useState(true);
  const [rightPanelOpen, setRightPanelOpen] = useState(true);

  return (
    <div className="h-screen bg-slate-950 text-white flex flex-col overflow-hidden font-sans">
      {/* ─── Top Bar ─────────────────────────────────────── */}
      <header className="flex-shrink-0 h-12 bg-slate-900/90 backdrop-blur border-b border-slate-700/40 flex items-center px-4 gap-4 z-10">
        <div className="flex items-center gap-2 mr-4">
          <span className="text-xl">🏓</span>
          <span className="font-bold text-white hidden sm:block">Table Tennis Physics Lab</span>
          <span className="text-xs px-2 py-0.5 bg-blue-500/20 text-blue-300 rounded-full border border-blue-500/30 font-mono">v2.0</span>
        </div>

        {/* Outcome badge */}
        <div className="flex items-center gap-2">
          {result.outcome === 'hit' && (
            <span className="text-xs px-3 py-1 bg-emerald-500/20 text-emerald-300 rounded-full border border-emerald-500/30 font-semibold animate-pulse">
              ✅ Попадание
            </span>
          )}
          {result.outcome === 'net' && (
            <span className="text-xs px-3 py-1 bg-red-500/20 text-red-300 rounded-full border border-red-500/30 font-semibold">
              ⛔ Сетка
            </span>
          )}
          {result.outcome === 'out_long' && (
            <span className="text-xs px-3 py-1 bg-orange-500/20 text-orange-300 rounded-full border border-orange-500/30 font-semibold">
              📤 Аут за столом
            </span>
          )}
          {result.outcome === 'out_side' && (
            <span className="text-xs px-3 py-1 bg-orange-500/20 text-orange-300 rounded-full border border-orange-500/30 font-semibold">
              ↔️ Аут в сторону
            </span>
          )}
        </div>

        <div className="ml-auto flex items-center gap-2">
          {/* Ball trajectory count */}
          <span className="text-xs text-slate-500 hidden md:block">
            {result.trajectory.length} точек · {result.bounces.length} отскоков
          </span>

          <div className="flex items-center gap-1">
            <BarChart3 size={14} className="text-slate-400" />
            <span className="text-xs text-slate-400 hidden sm:block">Euler dt=0.001с</span>
          </div>

          {/* Panel toggles */}
          <button
            onClick={() => setLeftPanelOpen(o => !o)}
            className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            title="Управление"
          >
            <ChevronLeft size={16} className={`transition-transform ${leftPanelOpen ? '' : 'rotate-180'}`} />
          </button>
          <button
            onClick={() => setRightPanelOpen(o => !o)}
            className="p-1.5 rounded text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
            title="Советы"
          >
            <ChevronRight size={16} className={`transition-transform ${rightPanelOpen ? '' : 'rotate-180'}`} />
          </button>
        </div>
      </header>

      {/* ─── Main Layout ─────────────────────────────────── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Controls */}
        <aside
          className={`flex-shrink-0 transition-all duration-300 overflow-hidden ${
            leftPanelOpen ? 'w-80' : 'w-0'
          }`}
        >
          <div className="w-80 h-full">
            <ControlPanel
              params={params}
              onUpdate={updateParam}
              onReset={reset}
            />
          </div>
        </aside>

        {/* Center - Canvas */}
        <main className="flex-1 relative min-w-0 overflow-hidden">
          <TableCanvas result={result} />

          {/* Floating legend overlay */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-3 bg-slate-900/80 backdrop-blur px-4 py-2 rounded-full border border-slate-700/40 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-1.5 rounded-full bg-emerald-400 inline-block" />
              Стабильный полёт
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-1.5 rounded-full bg-amber-400 inline-block" />
              Средний Magnus
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-1.5 rounded-full bg-red-400 inline-block" />
              Сильный Magnus
            </span>
            <span className="flex items-center gap-1.5">
              <span className="text-amber-400 font-bold">✕</span>
              Отскок
            </span>
          </div>
        </main>

        {/* Right Panel - Advice */}
        <aside
          className={`flex-shrink-0 transition-all duration-300 overflow-hidden ${
            rightPanelOpen ? 'w-80' : 'w-0'
          }`}
        >
          <div className="w-80 h-full">
            <AdvicePanel result={result} params={params} />
          </div>
        </aside>
      </div>
    </div>
  );
};

export default App;
