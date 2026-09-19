import {
  ArchitectureMode,
  InvarianceParams,
  LogicFunctionType,
  MLPWeights,
  PerceptronWeights,
  TruthTableSample,
} from '../types';

export const LOGIC_TARGETS: Record<
  Exclude<LogicFunctionType, 'CUSTOM'>,
  [number, number, number, number] // values for (0,0), (0,1), (1,0), (1,1)
> = {
  AND: [0, 0, 0, 1],
  OR: [0, 1, 1, 1],
  NAND: [1, 1, 1, 0],
  NOR: [1, 0, 0, 0],
  XOR: [0, 1, 1, 0],
  XNOR: [1, 0, 0, 1],
};

export function getBaseTruthTable(
  logic: LogicFunctionType,
  customTargets: [number, number, number, number],
  encoding: 'UNIPOLAR' | 'BIPOLAR'
): { x1: number; x2: number; target: number }[] {
  const targets = logic === 'CUSTOM' ? customTargets : LOGIC_TARGETS[logic];
  const coords: [number, number][] =
    encoding === 'BIPOLAR'
      ? [
          [-1, -1],
          [-1, 1],
          [1, -1],
          [1, 1],
        ]
      : [
          [0, 0],
          [0, 1],
          [1, 0],
          [1, 1],
        ];

  return coords.map(([x1, x2], i) => ({
    x1,
    x2,
    target: targets[i],
  }));
}

export function sigmoid(z: number, beta: number = 1.0): number {
  const scaled = Math.max(-20, Math.min(20, beta * z));
  return 1 / (1 + Math.exp(-scaled));
}

export function sigmoidDerivative(y: number, beta: number = 1.0): number {
  return beta * y * (1 - y);
}

export function createInitialPerceptronWeights(): PerceptronWeights {
  return {
    w1: (Math.random() - 0.5) * 1.5,
    w2: (Math.random() - 0.5) * 1.5,
    bias: (Math.random() - 0.5) * 0.8,
  };
}

export function createInitialMLPWeights(): MLPWeights {
  return {
    wHidden: [
      [(Math.random() - 0.5) * 2.0, (Math.random() - 0.5) * 2.0],
      [(Math.random() - 0.5) * 2.0, (Math.random() - 0.5) * 2.0],
    ],
    bHidden: [(Math.random() - 0.5) * 1.0, (Math.random() - 0.5) * 1.0],
    wOutput: [(Math.random() - 0.5) * 2.0, (Math.random() - 0.5) * 2.0],
    bOutput: (Math.random() - 0.5) * 1.0,
  };
}

export interface ForwardResult {
  out: number;
  membranePotentials: {
    h1?: number;
    h2?: number;
    out: number;
  };
  nodeActivations: {
    x1: number;
    x2: number;
    bias: number;
    h1?: number;
    h2?: number;
    out: number;
  };
}

export function forwardPass(
  x1: number,
  x2: number,
  mode: ArchitectureMode,
  pWeights: PerceptronWeights,
  mlpWeights: MLPWeights,
  params: InvarianceParams
): ForwardResult {
  const beta = params.gain;

  if (mode === 'PERCEPTRON') {
    const z = pWeights.w1 * x1 + pWeights.w2 * x2 + pWeights.bias;
    const y = sigmoid(z, beta);
    return {
      out: y,
      membranePotentials: { out: z },
      nodeActivations: {
        x1,
        x2,
        bias: 1.0,
        out: y,
      },
    };
  } else {
    // Minimal MLP (2-2-1)
    const z_h1 =
      mlpWeights.wHidden[0][0] * x1 +
      mlpWeights.wHidden[0][1] * x2 +
      mlpWeights.bHidden[0];
    const h1 = sigmoid(z_h1, beta);

    const z_h2 =
      mlpWeights.wHidden[1][0] * x1 +
      mlpWeights.wHidden[1][1] * x2 +
      mlpWeights.bHidden[1];
    const h2 = sigmoid(z_h2, beta);

    const z_out =
      mlpWeights.wOutput[0] * h1 +
      mlpWeights.wOutput[1] * h2 +
      mlpWeights.bOutput;
    const out = sigmoid(z_out, beta);

    return {
      out,
      membranePotentials: {
        h1: z_h1,
        h2: z_h2,
        out: z_out,
      },
      nodeActivations: {
        x1,
        x2,
        bias: 1.0,
        h1,
        h2,
        out,
      },
    };
  }
}

export interface TrainStepResult {
  pWeights: PerceptronWeights;
  mlpWeights: MLPWeights;
  pVelocities: PerceptronWeights;
  mlpVelocities: {
    wHidden: number[][];
    bHidden: number[];
    wOutput: number[];
    bOutput: number;
  };
  loss: number;
  accuracy: number;
  sampleResults: TruthTableSample[];
}

export function trainOneStep(
  mode: ArchitectureMode,
  pWeights: PerceptronWeights,
  mlpWeights: MLPWeights,
  pVel: PerceptronWeights,
  mlpVel: {
    wHidden: number[][];
    bHidden: number[];
    wOutput: number[];
    bOutput: number;
  },
  truthTable: { x1: number; x2: number; target: number }[],
  params: InvarianceParams
): TrainStepResult {
  const { learningRate, gain, decisionThreshold, weightDecay, momentum, synapticNoise } = params;

  let totalLoss = 0;
  let correctCount = 0;
  const sampleResults: TruthTableSample[] = [];

  const noise = () => (Math.random() - 0.5) * 2 * synapticNoise;

  if (mode === 'PERCEPTRON') {
    let dw1 = 0;
    let dw2 = 0;
    let db = 0;

    for (const sample of truthTable) {
      const { x1, x2, target } = sample;
      const res = forwardPass(x1, x2, mode, pWeights, mlpWeights, params);
      const y = res.out;
      const error = y - target;
      totalLoss += 0.5 * error * error;

      const isCorrect = (y >= decisionThreshold ? 1 : 0) === target;
      if (isCorrect) correctCount++;

      sampleResults.push({
        x1,
        x2,
        target,
        actual: y,
        correct: isCorrect,
      });

      // Gradient of 0.5 * (y - target)^2 w.r.t z: error * beta * y * (1 - y)
      const delta = error * sigmoidDerivative(y, gain);
      dw1 += delta * x1;
      dw2 += delta * x2;
      db += delta;
    }

    const n = truthTable.length;
    dw1 = dw1 / n + weightDecay * pWeights.w1;
    dw2 = dw2 / n + weightDecay * pWeights.w2;
    db = db / n; // bias is usually not decayed

    // Momentum update
    const v_w1 = momentum * pVel.w1 - learningRate * dw1 + noise() * 0.01;
    const v_w2 = momentum * pVel.w2 - learningRate * dw2 + noise() * 0.01;
    const v_b = momentum * pVel.bias - learningRate * db + noise() * 0.01;

    const newPWeights: PerceptronWeights = {
      w1: pWeights.w1 + v_w1,
      w2: pWeights.w2 + v_w2,
      bias: pWeights.bias + v_b,
    };

    return {
      pWeights: newPWeights,
      mlpWeights,
      pVelocities: { w1: v_w1, w2: v_w2, bias: v_b },
      mlpVelocities: mlpVel,
      loss: totalLoss / n,
      accuracy: (correctCount / n) * 100,
      sampleResults,
    };
  } else {
    // Minimal MLP (2-2-1)
    const dWH = [
      [0, 0],
      [0, 0],
    ];
    const dBH = [0, 0];
    const dWO = [0, 0];
    let dBO = 0;

    for (const sample of truthTable) {
      const { x1, x2, target } = sample;
      const res = forwardPass(x1, x2, mode, pWeights, mlpWeights, params);
      const y = res.out;
      const h1 = res.nodeActivations.h1!;
      const h2 = res.nodeActivations.h2!;

      const error = y - target;
      totalLoss += 0.5 * error * error;

      const isCorrect = (y >= decisionThreshold ? 1 : 0) === target;
      if (isCorrect) correctCount++;

      sampleResults.push({
        x1,
        x2,
        target,
        actual: y,
        correct: isCorrect,
      });

      // Output gradient
      const deltaOut = error * sigmoidDerivative(y, gain);
      dWO[0] += deltaOut * h1;
      dWO[1] += deltaOut * h2;
      dBO += deltaOut;

      // Hidden layer gradients
      const deltaH1 = deltaOut * mlpWeights.wOutput[0] * sigmoidDerivative(h1, gain);
      dWH[0][0] += deltaH1 * x1;
      dWH[0][1] += deltaH1 * x2;
      dBH[0] += deltaH1;

      const deltaH2 = deltaOut * mlpWeights.wOutput[1] * sigmoidDerivative(h2, gain);
      dWH[1][0] += deltaH2 * x1;
      dWH[1][1] += deltaH2 * x2;
      dBH[1] += deltaH2;
    }

    const n = truthTable.length;
    // Apply weight decay & momentum to output layer
    const newWOVel = [0, 0];
    const newWO = [0, 0];
    for (let i = 0; i < 2; i++) {
      const grad = dWO[i] / n + weightDecay * mlpWeights.wOutput[i];
      newWOVel[i] = momentum * mlpVel.wOutput[i] - learningRate * grad + noise() * 0.01;
      newWO[i] = mlpWeights.wOutput[i] + newWOVel[i];
    }
    const gradBO = dBO / n;
    const newBOVel = momentum * mlpVel.bOutput - learningRate * gradBO + noise() * 0.01;
    const newBO = mlpWeights.bOutput + newBOVel;

    // Apply to hidden layer
    const newWHVel = [
      [0, 0],
      [0, 0],
    ];
    const newWH = [
      [0, 0],
      [0, 0],
    ];
    const newBHVel = [0, 0];
    const newBH = [0, 0];

    for (let h = 0; h < 2; h++) {
      for (let j = 0; j < 2; j++) {
        const grad = dWH[h][j] / n + weightDecay * mlpWeights.wHidden[h][j];
        newWHVel[h][j] = momentum * mlpVel.wHidden[h][j] - learningRate * grad + noise() * 0.01;
        newWH[h][j] = mlpWeights.wHidden[h][j] + newWHVel[h][j];
      }
      const gradBH = dBH[h] / n;
      newBHVel[h] = momentum * mlpVel.bHidden[h] - learningRate * gradBH + noise() * 0.01;
      newBH[h] = mlpWeights.bHidden[h] + newBHVel[h];
    }

    return {
      pWeights,
      mlpWeights: {
        wHidden: newWH,
        bHidden: newBH,
        wOutput: newWO,
        bOutput: newBO,
      },
      pVelocities: pVel,
      mlpVelocities: {
        wHidden: newWHVel,
        bHidden: newBHVel,
        wOutput: newWOVel,
        bOutput: newBOVel,
      },
      loss: totalLoss / n,
      accuracy: (correctCount / n) * 100,
      sampleResults,
    };
  }
}
