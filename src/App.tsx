import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArchitectureMode,
  InvarianceParams,
  LogicFunctionType,
  MLPWeights,
  PerceptronWeights,
  TruthTableSample,
} from './types';
import {
  createInitialMLPWeights,
  createInitialPerceptronWeights,
  forwardPass,
  getBaseTruthTable,
  trainOneStep,
} from './core/neuralCircuit';
import { Header } from './components/Header';
import { CircuitVisualizer } from './components/CircuitVisualizer';
import { InvarianceSliders } from './components/InvarianceSliders';
import { TruthTableProbe } from './components/TruthTableProbe';
import { TheoryModal } from './components/TheoryModal';

const DEFAULT_PARAMS: InvarianceParams = {
  learningRate: 0.35,
  gain: 1.5,
  inputEncoding: 'UNIPOLAR',
  decisionThreshold: 0.5,
  weightDecay: 0.002,
  momentum: 0.7,
  synapticNoise: 0.02,
  clockSpeed: 24,
};

export default function App() {
  const [architecture, setArchitecture] = useState<ArchitectureMode>('PERCEPTRON');
  const [logicTarget, setLogicTarget] = useState<LogicFunctionType>('AND');
  const [customTargets, setCustomTargets] = useState<[number, number, number, number]>([0, 0, 0, 1]);
  const [isPlaying, setIsPlaying] = useState<boolean>(true);
  const [params, setParams] = useState<InvarianceParams>(DEFAULT_PARAMS);
  const [iteration, setIteration] = useState<number>(0);
  const [loss, setLoss] = useState<number>(0.25);
  const [accuracy, setAccuracy] = useState<number>(50);
  const [isTheoryOpen, setIsTheoryOpen] = useState<boolean>(false);

  // Synaptic weights
  const [pWeights, setPWeights] = useState<PerceptronWeights>(createInitialPerceptronWeights);
  const [mlpWeights, setMLPWeights] = useState<MLPWeights>(createInitialMLPWeights);

  // Velocity buffers for momentum
  const pVelocitiesRef = useRef<PerceptronWeights>({ w1: 0, w2: 0, bias: 0 });
  const mlpVelocitiesRef = useRef<{
    wHidden: number[][];
    bHidden: number[];
    wOutput: number[];
    bOutput: number;
  }>({
    wHidden: [
      [0, 0],
      [0, 0],
    ],
    bHidden: [0, 0],
    wOutput: [0, 0],
    bOutput: 0,
  });

  // Interactive live continuous probe
  const [probeInput, setProbeInput] = useState<[number, number]>([1, 1]);
  const [sampleResults, setSampleResults] = useState<TruthTableSample[]>([]);

  // Simulation step execution
  const executeStep = useCallback(() => {
    const truthTable = getBaseTruthTable(logicTarget, customTargets, params.inputEncoding);

    const stepResult = trainOneStep(
      architecture,
      pWeights,
      mlpWeights,
      pVelocitiesRef.current,
      mlpVelocitiesRef.current,
      truthTable,
      params
    );

    setPWeights(stepResult.pWeights);
    setMLPWeights(stepResult.mlpWeights);
    pVelocitiesRef.current = stepResult.pVelocities;
    mlpVelocitiesRef.current = stepResult.mlpVelocities;
    setLoss(stepResult.loss);
    setAccuracy(stepResult.accuracy);
    setSampleResults(stepResult.sampleResults);
    setIteration((prev) => prev + 1);
  }, [architecture, logicTarget, customTargets, params, pWeights, mlpWeights]);

  // Initial evaluation on mount or target change
  useEffect(() => {
    const truthTable = getBaseTruthTable(logicTarget, customTargets, params.inputEncoding);
    const initialSamples: TruthTableSample[] = truthTable.map(({ x1, x2, target }) => {
      const res = forwardPass(x1, x2, architecture, pWeights, mlpWeights, params);
      return {
        x1,
        x2,
        target,
        actual: res.out,
        correct: (res.out >= params.decisionThreshold ? 1 : 0) === target,
      };
    });
    setSampleResults(initialSamples);
    const initialCorrect = initialSamples.filter((s) => s.correct).length;
    setAccuracy((initialCorrect / initialSamples.length) * 100);
  }, [logicTarget, architecture, params.inputEncoding]);

  // Clock loop for training
  useEffect(() => {
    if (!isPlaying) return;

    const intervalMs = Math.max(10, 1000 / params.clockSpeed);
    const intervalId = setInterval(() => {
      executeStep();
    }, intervalMs);

    return () => clearInterval(intervalId);
  }, [isPlaying, params.clockSpeed, executeStep]);

  // Reset function
  const handleReset = () => {
    setPWeights(createInitialPerceptronWeights());
    setMLPWeights(createInitialMLPWeights());
    pVelocitiesRef.current = { w1: 0, w2: 0, bias: 0 };
    mlpVelocitiesRef.current = {
      wHidden: [
        [0, 0],
        [0, 0],
      ],
      bHidden: [0, 0],
      wOutput: [0, 0],
      bOutput: 0,
    };
    setIteration(0);
    setLoss(0.25);
  };

  // Switch architecture with smart auto-switch for XOR
  const handleSetArchitecture = (mode: ArchitectureMode) => {
    setArchitecture(mode);
    handleReset();
  };

  const handleSetLogicTarget = (target: LogicFunctionType) => {
    setLogicTarget(target);
    // If user picks XOR or XNOR while on Perceptron, we let them observe the failure first,
    // or if they reset, it trains fresh
    setIteration(0);
  };

  const handleToggleCustomTarget = (idx: number) => {
    setCustomTargets((prev) => {
      const copy: [number, number, number, number] = [...prev];
      copy[idx] = copy[idx] === 1 ? 0 : 1;
      return copy;
    });
    setIteration(0);
  };

  const handleChangeParam = <K extends keyof InvarianceParams>(key: K, value: InvarianceParams[K]) => {
    setParams((prev) => ({ ...prev, [key]: value }));
  };

  // Compute live probe forward pass
  const probeForward = forwardPass(
    probeInput[0],
    probeInput[1],
    architecture,
    pWeights,
    mlpWeights,
    params
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top Navigation & Telemetry Bar */}
      <Header
        architecture={architecture}
        onSetArchitecture={handleSetArchitecture}
        logicTarget={logicTarget}
        onSetLogicTarget={handleSetLogicTarget}
        isPlaying={isPlaying}
        onTogglePlay={() => setIsPlaying(!isPlaying)}
        onStep={executeStep}
        onReset={handleReset}
        iteration={iteration}
        loss={loss}
        accuracy={accuracy}
        onOpenTheory={() => setIsTheoryOpen(true)}
      />

      {/* Main Responsive Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-3 sm:p-4 md:p-6 flex flex-col gap-6">
        {/* Stage 1: Dual Interactive WebGL Manifold & Circuit Visualizer */}
        <section className="w-full">
          <CircuitVisualizer
            mode={architecture}
            pWeights={pWeights}
            mlpWeights={mlpWeights}
            params={params}
            probeInput={probeInput}
            onUpdateProbe={(x1, x2) => setProbeInput([x1, x2])}
            nodeActivations={probeForward.nodeActivations}
            membranePotentials={probeForward.membranePotentials}
            sampleResults={sampleResults}
            onToggleInputSample={(idx) => {
              if (sampleResults[idx]) {
                setProbeInput([sampleResults[idx].x1, sampleResults[idx].x2]);
              }
            }}
          />
        </section>

        {/* Stage 2: Two-column grid with Sliders & Truth Table */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Column (7 cols): Invariance Sliders Engine */}
          <div className="lg:col-span-7">
            <InvarianceSliders
              params={params}
              onChangeParam={handleChangeParam}
              pWeights={pWeights}
              mode={architecture}
            />
          </div>

          {/* Right Column (5 cols): Truth Table & Continuous Probe */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <TruthTableProbe
              logicTarget={logicTarget}
              customTargets={customTargets}
              onToggleCustomTarget={handleToggleCustomTarget}
              sampleResults={sampleResults}
              probeInput={probeInput}
              probeOutput={probeForward.out}
              probeMembraneZ={probeForward.membranePotentials.out}
              threshold={params.decisionThreshold}
              onSelectSampleAsProbe={(x1, x2) => setProbeInput([x1, x2])}
            />

            {/* Quick Pedagogical Callout Card */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-xs space-y-2 text-slate-300 shadow-lg">
              <div className="flex items-center gap-2 text-cyan-400 font-semibold font-mono text-[11px] uppercase tracking-wider">
                <span>Core Invariance Observation</span>
              </div>
              <p className="leading-relaxed text-slate-400">
                Notice how you can slide <strong>Gain (β)</strong> from 0.5 to 8.0: the slope
                steepens from a continuous probabilistic hill into a vertical boolean cliff, yet the{' '}
                <strong className="text-slate-200">decision line position does not move</strong>.
                Likewise, varying <strong>Learning Rate (η)</strong> changes traversal speed without
                altering the invariant attractor basin.
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Epistemological Theory Modal */}
      <TheoryModal isOpen={isTheoryOpen} onClose={() => setIsTheoryOpen(false)} />
    </div>
  );
}
