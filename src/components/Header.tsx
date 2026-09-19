import { Play, Pause, RotateCcw, StepForward, Info, Cpu, Layers } from 'lucide-react';
import { ArchitectureMode, LogicFunctionType } from '../types';

interface HeaderProps {
  architecture: ArchitectureMode;
  onSetArchitecture: (mode: ArchitectureMode) => void;
  logicTarget: LogicFunctionType;
  onSetLogicTarget: (target: LogicFunctionType) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onStep: () => void;
  onReset: () => void;
  iteration: number;
  loss: number;
  accuracy: number;
  onOpenTheory: () => void;
}

const LOGIC_GATES: LogicFunctionType[] = ['AND', 'OR', 'NAND', 'NOR', 'XOR', 'XNOR', 'CUSTOM'];

export function Header({
  architecture,
  onSetArchitecture,
  logicTarget,
  onSetLogicTarget,
  isPlaying,
  onTogglePlay,
  onStep,
  onReset,
  iteration,
  loss,
  accuracy,
  onOpenTheory,
}: HeaderProps) {
  const isXorProblem = logicTarget === 'XOR' || logicTarget === 'XNOR';
  const isPerceptronFailingXor = isXorProblem && architecture === 'PERCEPTRON';

  return (
    <header className="border-b border-slate-800/80 bg-slate-950/80 backdrop-blur-md px-4 py-3 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Title & Brand */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Cpu className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-semibold text-slate-100 tracking-tight">
                  Irreducible Logic Circuit
                </h1>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-500/30 text-cyan-300">
                  Invariance Engine
                </span>
              </div>
              <p className="text-xs text-slate-400">
                The minimal neural structure realizing machine learning
              </p>
            </div>
          </div>

          {/* Theory button on mobile */}
          <button
            id="theory-btn-mobile"
            onClick={onOpenTheory}
            className="md:hidden p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
            title="Epistemological Guide"
          >
            <Info className="w-4 h-4" />
          </button>
        </div>

        {/* Central Controls: Architecture & Logic Target */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Architecture Switcher */}
          <div className="flex items-center bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
            <button
              id="mode-perceptron-btn"
              onClick={() => onSetArchitecture('PERCEPTRON')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
                architecture === 'PERCEPTRON'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="2 Inputs -> 1 Output (3 parameters). Linearly separable logic only."
            >
              <Cpu className="w-3.5 h-3.5" />
              <span>Single Perceptron (2→1)</span>
            </button>
            <button
              id="mode-mlp-btn"
              onClick={() => onSetArchitecture('MINIMAL_MLP')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md font-medium transition-all ${
                architecture === 'MINIMAL_MLP'
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="2 Inputs -> 2 Hidden -> 1 Output (9 parameters). Solves XOR by folding space."
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Minimal Circuit (2→2→1)</span>
            </button>
          </div>

          {/* Logic Gate Target Selector */}
          <div className="flex items-center bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs overflow-x-auto">
            {LOGIC_GATES.map((gate) => {
              const isSelected = logicTarget === gate;
              const isNonlinear = gate === 'XOR' || gate === 'XNOR';
              return (
                <button
                  key={gate}
                  id={`gate-btn-${gate}`}
                  onClick={() => onSetLogicTarget(gate)}
                  className={`px-2.5 py-1 rounded-md font-mono transition-all relative ${
                    isSelected
                      ? 'bg-slate-800 text-white font-semibold border border-slate-700'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <span>{gate}</span>
                  {isNonlinear && (
                    <span
                      className="absolute -top-1 -right-0.5 w-1.5 h-1.5 rounded-full bg-amber-400"
                      title="Non-linearly separable"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Action Controls & Real-time Telemetry */}
        <div className="flex items-center justify-between md:justify-end gap-3">
          {/* Telemetry pill */}
          <div className="flex items-center gap-2 text-xs font-mono bg-slate-900/90 border border-slate-800 px-3 py-1.5 rounded-lg">
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500">EPOCH</span>
              <span className="text-slate-200 font-semibold">{iteration}</span>
            </div>
            <div className="w-px h-6 bg-slate-800" />
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500">LOSS</span>
              <span className="text-amber-400 font-semibold">{loss.toFixed(4)}</span>
            </div>
            <div className="w-px h-6 bg-slate-800" />
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500">ACC</span>
              <span
                className={`font-semibold ${
                  accuracy === 100
                    ? 'text-emerald-400'
                    : isPerceptronFailingXor
                    ? 'text-rose-400'
                    : 'text-cyan-400'
                }`}
              >
                {accuracy.toFixed(0)}%
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1.5">
            <button
              id="train-play-btn"
              onClick={onTogglePlay}
              className={`p-2 rounded-lg font-medium text-xs transition-all flex items-center justify-center ${
                isPlaying
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                  : 'bg-emerald-500 text-slate-950 hover:bg-emerald-400 shadow-sm'
              }`}
              title={isPlaying ? 'Pause Simulation' : 'Start Simulation'}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-current" />}
            </button>

            <button
              id="train-step-btn"
              onClick={onStep}
              disabled={isPlaying}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white disabled:opacity-40 transition-colors"
              title="Single Epoch Step"
            >
              <StepForward className="w-4 h-4" />
            </button>

            <button
              id="train-reset-btn"
              onClick={onReset}
              className="p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white transition-colors"
              title="Reset Synaptic Weights"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            <button
              id="theory-btn-desktop"
              onClick={onOpenTheory}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 hover:text-white text-xs transition-colors"
              title="The Invariance Principle"
            >
              <Info className="w-3.5 h-3.5 text-cyan-400" />
              <span>Invariance</span>
            </button>
          </div>
        </div>
      </div>

      {/* Warning banner if Perceptron is stuck on XOR */}
      {isPerceptronFailingXor && (
        <div className="mt-2 max-w-7xl mx-auto px-3 py-1.5 rounded-md bg-rose-950/60 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
          <span>
            <strong>The Minsky-Papert Singularity:</strong> A single linear neuron (Perceptron)
            cannot separate XOR. Switch to the <strong>Minimal Circuit (2→2→1)</strong> to fold
            space and resolve the parity problem.
          </span>
          <button
            onClick={() => onSetArchitecture('MINIMAL_MLP')}
            className="ml-3 underline hover:text-white shrink-0 font-medium"
          >
            Switch to 2→2→1 Circuit →
          </button>
        </div>
      )}
    </header>
  );
}
