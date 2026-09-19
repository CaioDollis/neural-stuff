export type LogicFunctionType = 'AND' | 'OR' | 'NAND' | 'NOR' | 'XOR' | 'XNOR' | 'CUSTOM';

export type ArchitectureMode = 'PERCEPTRON' | 'MINIMAL_MLP'; // 2->1 vs 2->2->1

export interface TruthTableSample {
  x1: number;
  x2: number;
  target: number;
  actual: number;
  correct: boolean;
}

export interface InvarianceParams {
  learningRate: number;        // eta: [0.01, 1.5]
  gain: number;                // beta / sharpness: [0.5, 10.0]
  inputEncoding: 'UNIPOLAR' | 'BIPOLAR'; // {0, 1} vs {-1, 1}
  decisionThreshold: number;   // theta: [0.1, 0.9]
  weightDecay: number;         // lambda: [0.0, 0.1]
  momentum: number;            // alpha: [0.0, 0.95]
  synapticNoise: number;       // sigma: [0.0, 0.3]
  clockSpeed: number;          // updates per second: [1, 60]
}

export interface InvarianceMetadata {
  id: keyof InvarianceParams;
  label: string;
  symbol: string;
  min: number;
  max: number;
  step: number;
  whatMoves: string;
  whatDoesNotMove: string;
  explanation: string;
}

export interface PerceptronWeights {
  w1: number;
  w2: number;
  bias: number;
}

export interface MLPWeights {
  // Hidden layer (2 neurons, each takes 2 inputs + bias)
  wHidden: number[][]; // [neuronIdx][inputIdx]: 2x2
  bHidden: number[];   // [neuronIdx]: 2
  // Output layer (1 neuron takes 2 hidden outputs + bias)
  wOutput: number[];   // [hiddenIdx]: 2
  bOutput: number;
}

export interface CircuitState {
  architecture: ArchitectureMode;
  logicTarget: LogicFunctionType;
  customTruthTargets: [number, number, number, number]; // for (0,0), (0,1), (1,0), (1,1)
  iteration: number;
  loss: number;
  accuracy: number;
  perceptronWeights: PerceptronWeights;
  mlpWeights: MLPWeights;
  // History for loss charting
  lossHistory: number[];
  // Last active sample index
  currentSampleIdx: number;
  // Active probe value (live test point)
  probeInput: [number, number];
  probeOutput: number;
  // Firing activities for visualization
  nodeActivations: {
    x1: number;
    x2: number;
    bias: number;
    h1?: number;
    h2?: number;
    out: number;
  };
  // Membrane potentials (pre-activation z)
  membranePotentials: {
    h1?: number;
    h2?: number;
    out: number;
  };
}
