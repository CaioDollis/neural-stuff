import { CheckCircle2, XCircle, Target, Sparkles, SlidersHorizontal } from 'lucide-react';
import { LogicFunctionType, TruthTableSample } from '../types';

interface TruthTableProbeProps {
  logicTarget: LogicFunctionType;
  customTargets: [number, number, number, number];
  onToggleCustomTarget: (idx: number) => void;
  sampleResults: TruthTableSample[];
  probeInput: [number, number];
  probeOutput: number;
  probeMembraneZ?: number;
  threshold: number;
  onSelectSampleAsProbe: (x1: number, x2: number) => void;
}

export function TruthTableProbe({
  logicTarget,
  customTargets,
  onToggleCustomTarget,
  sampleResults,
  probeInput,
  probeOutput,
  probeMembraneZ,
  threshold,
  onSelectSampleAsProbe,
}: TruthTableProbeProps) {
  const isCustom = logicTarget === 'CUSTOM';

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-xl p-4 flex flex-col gap-4 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Target className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-100 flex items-center gap-2">
              <span>Truth Table & Verification</span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400">
                4-State Base
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Discrete boolean points embedded in the continuous space
            </p>
          </div>
        </div>

        {isCustom && (
          <span className="text-[11px] font-mono text-amber-400 bg-amber-950/40 border border-amber-500/30 px-2 py-0.5 rounded">
            Click targets to customize
          </span>
        )}
      </div>

      {/* Table of the 4 truth states */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
              <th className="py-2 px-2.5">x₁</th>
              <th className="py-2 px-2.5">x₂</th>
              <th className="py-2 px-2.5">Target</th>
              <th className="py-2 px-2.5">Output y</th>
              <th className="py-2 px-2.5">Binary</th>
              <th className="py-2 px-2.5 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/50">
            {sampleResults.map((sample, idx) => {
              const isActive =
                Math.abs(probeInput[0] - sample.x1) < 0.05 &&
                Math.abs(probeInput[1] - sample.x2) < 0.05;

              return (
                <tr
                  key={idx}
                  onClick={() => onSelectSampleAsProbe(sample.x1, sample.x2)}
                  className={`cursor-pointer transition-colors ${
                    isActive
                      ? 'bg-cyan-950/40 text-cyan-200 font-semibold'
                      : 'hover:bg-slate-900/60 text-slate-300'
                  }`}
                >
                  <td className="py-2 px-2.5">{sample.x1}</td>
                  <td className="py-2 px-2.5">{sample.x2}</td>
                  <td className="py-2 px-2.5">
                    {isCustom ? (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleCustomTarget(idx);
                        }}
                        className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-cyan-300 font-bold border border-slate-700"
                      >
                        {customTargets[idx]}
                      </button>
                    ) : (
                      <span className="font-bold">{sample.target}</span>
                    )}
                  </td>
                  <td className="py-2 px-2.5">
                    <span className="text-slate-300">{sample.actual.toFixed(3)}</span>
                  </td>
                  <td className="py-2 px-2.5">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[10px] ${
                        sample.actual >= threshold
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/30'
                          : 'bg-slate-900 text-slate-400 border border-slate-800'
                      }`}
                    >
                      {sample.actual >= threshold ? '1 (HIGH)' : '0 (LOW)'}
                    </span>
                  </td>
                  <td className="py-2 px-2.5 text-right">
                    {sample.correct ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400 text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>PASS</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-rose-400 text-[11px]">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>FAIL</span>
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Live Probe Continuous Inspector */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3 flex flex-col gap-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-slate-200 flex items-center gap-1.5">
            <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
            <span>Continuous State Probe</span>
          </span>
          <span className="font-mono text-[11px] text-amber-300 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-500/30">
            Probe: ({probeInput[0].toFixed(2)}, {probeInput[1].toFixed(2)})
          </span>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center font-mono text-xs mt-1">
          <div className="bg-slate-950/70 p-2 rounded border border-slate-800">
            <span className="text-[10px] text-slate-500 block">PRE-ACTIVATION z</span>
            <span className="text-slate-200 font-semibold">
              {probeMembraneZ !== undefined ? probeMembraneZ.toFixed(3) : '—'}
            </span>
          </div>
          <div className="bg-slate-950/70 p-2 rounded border border-slate-800">
            <span className="text-[10px] text-slate-500 block">ACTIVATION y</span>
            <span className="text-cyan-400 font-semibold">{probeOutput.toFixed(3)}</span>
          </div>
          <div className="bg-slate-950/70 p-2 rounded border border-slate-800">
            <span className="text-[10px] text-slate-500 block">STATE (y ≥ θ)</span>
            <span
              className={`font-semibold ${
                probeOutput >= threshold ? 'text-emerald-400' : 'text-slate-400'
              }`}
            >
              {probeOutput >= threshold ? 'FIRED (1)' : 'QUIET (0)'}
            </span>
          </div>
        </div>

        {/* Probability bar */}
        <div className="mt-1">
          <div className="flex justify-between text-[10px] text-slate-400 font-mono mb-1">
            <span>Probability Mass [0..1]</span>
            <span>Threshold θ = {threshold.toFixed(2)}</span>
          </div>
          <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden relative border border-slate-800">
            <div
              className={`h-full transition-all duration-75 ${
                probeOutput >= threshold ? 'bg-emerald-400' : 'bg-cyan-500'
              }`}
              style={{ width: `${Math.max(0, Math.min(100, probeOutput * 100))}%` }}
            />
            {/* Threshold tick line */}
            <div
              className="absolute top-0 bottom-0 w-0.5 bg-amber-400 z-10"
              style={{ left: `${threshold * 100}%` }}
              title={`Decision threshold: ${threshold}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
