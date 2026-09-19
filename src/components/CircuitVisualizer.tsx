import { useEffect, useRef, useState, useCallback } from 'react';
import {
  ArchitectureMode,
  InvarianceParams,
  MLPWeights,
  PerceptronWeights,
  TruthTableSample,
} from '../types';
import { WebGLFieldRenderer } from '../core/webglField';
import { CircuitVisualizer as CircuitEngine, NodePosition } from '../core/circuitRenderer';
import { Activity, Compass, Eye, Sparkles } from 'lucide-react';

interface CircuitVisualizerProps {
  mode: ArchitectureMode;
  pWeights: PerceptronWeights;
  mlpWeights: MLPWeights;
  params: InvarianceParams;
  probeInput: [number, number];
  onUpdateProbe: (x1: number, x2: number) => void;
  nodeActivations: {
    x1: number;
    x2: number;
    bias: number;
    h1?: number;
    h2?: number;
    out: number;
  };
  membranePotentials: {
    h1?: number;
    h2?: number;
    out: number;
  };
  sampleResults: TruthTableSample[];
  onToggleInputSample: (sampleIdx: number) => void;
}

export function CircuitVisualizer({
  mode,
  pWeights,
  mlpWeights,
  params,
  probeInput,
  onUpdateProbe,
  nodeActivations,
  membranePotentials,
  sampleResults,
  onToggleInputSample,
}: CircuitVisualizerProps) {
  const [viewMode, setViewMode] = useState<'SPLIT' | 'CIRCUIT' | 'FIELD'>('SPLIT');

  // WebGL Field Canvas Ref & Renderer
  const fieldCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const fieldRendererRef = useRef<WebGLFieldRenderer | null>(null);

  // Circuit Canvas Ref & Engine
  const circuitCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const circuitEngineRef = useRef<CircuitEngine | null>(null);
  const currentNodesRef = useRef<NodePosition[]>([]);

  // Dragging probe state in field
  const [isDraggingProbe, setIsDraggingProbe] = useState(false);

  // Initialize WebGL Field Renderer
  useEffect(() => {
    if (fieldCanvasRef.current && !fieldRendererRef.current) {
      fieldRendererRef.current = new WebGLFieldRenderer(fieldCanvasRef.current);
    }
    return () => {
      fieldRendererRef.current?.dispose();
      fieldRendererRef.current = null;
    };
  }, []);

  // Initialize Circuit Engine
  useEffect(() => {
    if (circuitCanvasRef.current && !circuitEngineRef.current) {
      circuitEngineRef.current = new CircuitEngine(circuitCanvasRef.current);
    }
  }, []);

  // Animation Frame Loop
  useEffect(() => {
    let animationId: number;

    const renderLoop = (time: number) => {
      // 1. Render WebGL Field
      if (fieldRendererRef.current && fieldCanvasRef.current) {
        fieldRendererRef.current.render(
          mode,
          pWeights,
          mlpWeights,
          params,
          probeInput,
          time * 0.001
        );
      }

      // 2. Render Circuit
      if (circuitEngineRef.current && circuitCanvasRef.current) {
        currentNodesRef.current = circuitEngineRef.current.render(
          mode,
          pWeights,
          mlpWeights,
          nodeActivations,
          membranePotentials,
          params.decisionThreshold,
          time
        );
      }

      animationId = requestAnimationFrame(renderLoop);
    };

    animationId = requestAnimationFrame(renderLoop);
    return () => cancelAnimationFrame(animationId);
  }, [mode, pWeights, mlpWeights, params, probeInput, nodeActivations, membranePotentials]);

  // Handle Drag on Field Canvas
  const handleFieldInteraction = useCallback(
    (clientX: number, clientY: number) => {
      const canvas = fieldCanvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const u = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      const v = Math.max(0, Math.min(1, 1 - (clientY - rect.top) / rect.height)); // invert Y

      let x1 = 0;
      let x2 = 0;
      if (params.inputEncoding === 'UNIPOLAR') {
        x1 = -0.25 + u * 1.5;
        x2 = -0.25 + v * 1.5;
      } else {
        x1 = -1.5 + u * 3.0;
        x2 = -1.5 + v * 3.0;
      }

      onUpdateProbe(parseFloat(x1.toFixed(3)), parseFloat(x2.toFixed(3)));
    },
    [params.inputEncoding, onUpdateProbe]
  );

  const handleCircuitClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!circuitEngineRef.current) return;
    const clickedNode = circuitEngineRef.current.getClickedNode(
      e.clientX,
      e.clientY,
      currentNodesRef.current
    );
    if (clickedNode && clickedNode.isInput) {
      if (clickedNode.id === 'x1') {
        onUpdateProbe(probeInput[0] > 0.5 ? 0 : 1, probeInput[1]);
      } else if (clickedNode.id === 'x2') {
        onUpdateProbe(probeInput[0], probeInput[1] > 0.5 ? 0 : 1);
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* View Switcher Bar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800/80 bg-slate-900/60 text-xs">
        <div className="flex items-center gap-2">
          <span className="text-slate-400 font-medium">Visualization:</span>
          <div className="flex items-center bg-slate-950 p-0.5 rounded-lg border border-slate-800">
            <button
              id="view-split-btn"
              onClick={() => setViewMode('SPLIT')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                viewMode === 'SPLIT'
                  ? 'bg-slate-800 text-cyan-300 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Dual View
            </button>
            <button
              id="view-circuit-btn"
              onClick={() => setViewMode('CIRCUIT')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                viewMode === 'CIRCUIT'
                  ? 'bg-slate-800 text-cyan-300 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Neuro-Circuit
            </button>
            <button
              id="view-field-btn"
              onClick={() => setViewMode('FIELD')}
              className={`px-2.5 py-1 rounded font-medium transition-colors ${
                viewMode === 'FIELD'
                  ? 'bg-slate-800 text-cyan-300 font-semibold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              WebGL Manifold
            </button>
          </div>
        </div>

        {/* Live Interaction Hint */}
        <div className="hidden sm:flex items-center gap-1.5 text-slate-400 font-mono text-[11px]">
          <Compass className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
          <span>Click inputs or drag on manifold to probe</span>
        </div>
      </div>

      {/* Main Canvas Stage */}
      <div className="relative flex-1 grid grid-cols-1 lg:grid-cols-2 gap-px bg-slate-800 min-h-[360px] md:min-h-[460px]">
        {/* VIEWPORT 1: NEURO-SYNAPTIC CIRCUIT */}
        {(viewMode === 'SPLIT' || viewMode === 'CIRCUIT') && (
          <div
            className={`relative bg-slate-950 flex flex-col ${
              viewMode === 'CIRCUIT' ? 'col-span-1 lg:col-span-2' : ''
            }`}
          >
            {/* Header Badge */}
            <div className="absolute top-3 left-3 z-10 pointer-events-none flex items-center gap-2">
              <span className="px-2 py-1 rounded-md bg-slate-900/90 border border-slate-700/80 text-[11px] font-mono text-cyan-300 flex items-center gap-1.5 shadow-md">
                <Activity className="w-3.5 h-3.5 text-cyan-400" />
                Physical Synaptic Circuit
              </span>
            </div>

            {/* Canvas */}
            <canvas
              ref={circuitCanvasRef}
              onClick={handleCircuitClick}
              className="w-full h-full cursor-pointer touch-none block"
            />

            {/* Bottom Sub-bar */}
            <div className="p-2 border-t border-slate-800/80 bg-slate-950/70 text-[11px] font-mono text-slate-400 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-cyan-400" />
                  <span>Excitatory (w &gt; 0)</span>
                </span>
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span>Inhibitory (w &lt; 0)</span>
                </span>
              </div>
              <span>Click x₁, x₂ soma to toggle logic input</span>
            </div>
          </div>
        )}

        {/* VIEWPORT 2: WEBGL DECISION MANIFOLD */}
        {(viewMode === 'SPLIT' || viewMode === 'FIELD') && (
          <div
            className={`relative bg-slate-950 flex flex-col ${
              viewMode === 'FIELD' ? 'col-span-1 lg:col-span-2' : ''
            }`}
          >
            {/* Header Badge */}
            <div className="absolute top-3 left-3 z-10 pointer-events-none flex items-center gap-2">
              <span className="px-2 py-1 rounded-md bg-slate-900/90 border border-slate-700/80 text-[11px] font-mono text-emerald-300 flex items-center gap-1.5 shadow-md">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                WebGL Manifold & Invariant Boundary
              </span>
            </div>

            {/* Probe coordinates pill */}
            <div className="absolute top-3 right-3 z-10 pointer-events-none">
              <div className="px-2.5 py-1 rounded-md bg-slate-900/90 border border-amber-500/40 text-[11px] font-mono text-amber-300 shadow-md flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
                <span>Probe: ({probeInput[0].toFixed(2)}, {probeInput[1].toFixed(2)})</span>
              </div>
            </div>

            {/* WebGL Canvas */}
            <canvas
              ref={fieldCanvasRef}
              onMouseDown={(e) => {
                setIsDraggingProbe(true);
                handleFieldInteraction(e.clientX, e.clientY);
              }}
              onMouseMove={(e) => {
                if (isDraggingProbe) handleFieldInteraction(e.clientX, e.clientY);
              }}
              onMouseUp={() => setIsDraggingProbe(false)}
              onMouseLeave={() => setIsDraggingProbe(false)}
              onTouchStart={(e) => {
                if (e.touches.length > 0) {
                  setIsDraggingProbe(true);
                  handleFieldInteraction(e.touches[0].clientX, e.touches[0].clientY);
                }
              }}
              onTouchMove={(e) => {
                if (isDraggingProbe && e.touches.length > 0) {
                  handleFieldInteraction(e.touches[0].clientX, e.touches[0].clientY);
                }
              }}
              onTouchEnd={() => setIsDraggingProbe(false)}
              className="w-full h-full cursor-crosshair touch-none block"
            />

            {/* Overlay Truth Table Coordinates clickable dots */}
            <div className="p-2 border-t border-slate-800/80 bg-slate-950/70 text-[11px] font-mono text-slate-400 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-500">Truth Anchors:</span>
                {sampleResults.map((sample, idx) => (
                  <button
                    key={idx}
                    onClick={() => onToggleInputSample(idx)}
                    className={`px-2 py-0.5 rounded text-[10px] font-mono transition-all ${
                      sample.correct
                        ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 hover:bg-emerald-900'
                        : 'bg-rose-950/80 border border-rose-500/40 text-rose-300 hover:bg-rose-900'
                    }`}
                    title={`Click to set probe to (${sample.x1}, ${sample.x2}). Target: ${sample.target}, Actual: ${sample.actual.toFixed(2)}`}
                  >
                    ({sample.x1},{sample.x2})→{sample.target}
                  </button>
                ))}
              </div>
              <span className="text-cyan-400 font-semibold">Laser = Hyperplane Boundary</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
