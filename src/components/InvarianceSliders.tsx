import { useState } from 'react';
import { InvarianceParams, PerceptronWeights, ArchitectureMode } from '../types';
import { INVARIANCE_DESCRIPTIONS } from '../core/invariants';
import { Sliders, Lock, Zap, HelpCircle, Eye } from 'lucide-react';

interface InvarianceSlidersProps {
  params: InvarianceParams;
  onChangeParam: <K extends keyof InvarianceParams>(key: K, value: InvarianceParams[K]) => void;
  pWeights: PerceptronWeights;
  mode: ArchitectureMode;
}

export function InvarianceSliders({
  params,
  onChangeParam,
  pWeights,
  mode,
}: InvarianceSlidersProps) {
  const [activeSlider, setActiveSlider] = useState<keyof InvarianceParams | null>('gain');
  const [showAllExplanations, setShowAllExplanations] = useState(false);

  // Compute live geometric invariants for Perceptron
  const hasValidWeights = Math.abs(pWeights.w1) > 0.0001 || Math.abs(pWeights.w2) > 0.0001;
  const normalAngleDeg = hasValidWeights
    ? ((Math.atan2(pWeights.w2, pWeights.w1) * 180) / Math.PI + 360) % 360
    : 0;
  const weightRatio = Math.abs(pWeights.w2) > 0.001 ? (pWeights.w1 / pWeights.w2).toFixed(3) : '∞';
  const weightNorm = Math.sqrt(
    pWeights.w1 * pWeights.w1 + pWeights.w2 * pWeights.w2
  ).toFixed(3);

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col gap-4 shadow-xl">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <span>The Invariance Engine</span>
              <span className="text-[10px] font-normal text-slate-400 font-mono">
                (Arbitrary Choice Sliders)
              </span>
            </h2>
            <p className="text-xs text-slate-400 italic">
              "Not so you can tune it — so you can move it and see what doesn't move."
            </p>
          </div>
        </div>

        {/* Input Coordinate Representation Toggle */}
        <div className="flex items-center gap-2 text-xs">
          <span className="text-slate-400 text-[11px]">Coordinate Frame:</span>
          <div className="flex items-center bg-slate-900 p-0.5 rounded-lg border border-slate-800">
            <button
              id="encoding-unipolar-btn"
              onClick={() => onChangeParam('inputEncoding', 'UNIPOLAR')}
              className={`px-2 py-1 rounded font-mono text-[11px] transition-colors ${
                params.inputEncoding === 'UNIPOLAR'
                  ? 'bg-slate-800 text-cyan-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Standard {0, 1} unipolar representation"
            >
              &#123;0, 1&#125;
            </button>
            <button
              id="encoding-bipolar-btn"
              onClick={() => onChangeParam('inputEncoding', 'BIPOLAR')}
              className={`px-2 py-1 rounded font-mono text-[11px] transition-colors ${
                params.inputEncoding === 'BIPOLAR'
                  ? 'bg-slate-800 text-cyan-300 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
              title="Symmetric {-1, 1} bipolar representation"
            >
              &#123;-1, 1&#125;
            </button>
          </div>
        </div>
      </div>

      {/* Real-time Invariant Telemetry Bar */}
      {mode === 'PERCEPTRON' && (
        <div className="bg-slate-900/70 border border-slate-800/80 rounded-lg p-2.5 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
          <div>
            <span className="text-[10px] text-slate-500 block">HYPERPLANE ANGLE</span>
            <span className="text-cyan-300 font-semibold text-sm">
              {normalAngleDeg.toFixed(1)}°
            </span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block">SYNAPTIC RATIO w₁/w₂</span>
            <span className="text-emerald-400 font-semibold text-sm">{weightRatio}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block">WEIGHT NORM ||W||</span>
            <span className="text-amber-300 font-semibold text-sm">{weightNorm}</span>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 block">TOPOLOGICAL PARTITION</span>
            <span className="text-slate-200 font-semibold text-sm">Conserved</span>
          </div>
        </div>
      )}

      {/* Sliders Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {INVARIANCE_DESCRIPTIONS.map((meta) => {
          const value = params[meta.id] as number;
          const isSelected = activeSlider === meta.id;

          return (
            <div
              key={meta.id}
              onMouseEnter={() => setActiveSlider(meta.id)}
              className={`p-3 rounded-lg border transition-all ${
                isSelected
                  ? 'bg-slate-900/90 border-cyan-500/40 shadow-md ring-1 ring-cyan-500/20'
                  : 'bg-slate-900/40 border-slate-800/80 hover:border-slate-700'
              }`}
            >
              {/* Top Row: Label & Value */}
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded bg-slate-800 border border-slate-700 flex items-center justify-center font-mono text-xs text-cyan-300">
                    {meta.symbol}
                  </span>
                  <label htmlFor={`slider-${meta.id}`} className="text-xs font-medium text-slate-200">
                    {meta.label}
                  </label>
                </div>
                <span className="font-mono text-xs font-semibold text-cyan-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  {meta.id === 'clockSpeed' ? `${value} Hz` : value.toFixed(2)}
                </span>
              </div>

              {/* Slider Track */}
              <input
                id={`slider-${meta.id}`}
                type="range"
                min={meta.min}
                max={meta.max}
                step={meta.step}
                value={value}
                onChange={(e) =>
                  onChangeParam(
                    meta.id,
                    parseFloat(e.target.value) as unknown as InvarianceParams[typeof meta.id]
                  )
                }
                className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none my-2"
              />

              {/* Invariance Contrast Cards */}
              <div className="space-y-1 mt-2 text-[11px]">
                <div className="flex items-start gap-1.5 text-amber-300/90 bg-amber-950/20 border border-amber-500/20 p-1.5 rounded">
                  <Zap className="w-3.5 h-3.5 shrink-0 mt-0.5 text-amber-400" />
                  <div>
                    <span className="font-semibold text-amber-300">Moves: </span>
                    <span className="text-slate-300">{meta.whatMoves}</span>
                  </div>
                </div>

                <div className="flex items-start gap-1.5 text-emerald-300/90 bg-emerald-950/20 border border-emerald-500/20 p-1.5 rounded">
                  <Lock className="w-3.5 h-3.5 shrink-0 mt-0.5 text-emerald-400" />
                  <div>
                    <span className="font-semibold text-emerald-300">Invariant: </span>
                    <span className="text-slate-300">{meta.whatDoesNotMove}</span>
                  </div>
                </div>
              </div>

              {/* Expandable Explanation */}
              {(isSelected || showAllExplanations) && (
                <p className="mt-2 text-[11px] text-slate-400 leading-relaxed border-t border-slate-800/80 pt-1.5 font-sans">
                  {meta.explanation}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Toggle */}
      <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-800/60">
        <span className="text-[11px]">
          Hover or touch any slider to inspect its mathematical invariance.
        </span>
        <button
          onClick={() => setShowAllExplanations(!showAllExplanations)}
          className="text-cyan-400 hover:text-cyan-300 text-[11px] flex items-center gap-1 font-medium"
        >
          <HelpCircle className="w-3 h-3" />
          <span>{showAllExplanations ? 'Hide Details' : 'Show All Details'}</span>
        </button>
      </div>
    </div>
  );
}
