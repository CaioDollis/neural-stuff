import { InvarianceMetadata } from '../types';

export const INVARIANCE_DESCRIPTIONS: InvarianceMetadata[] = [
  {
    id: 'learningRate',
    label: 'Learning Rate',
    symbol: 'η',
    min: 0.02,
    max: 1.5,
    step: 0.01,
    whatMoves: 'Trajectory step velocity ||ΔW|| and convergence speed',
    whatDoesNotMove: 'The stationary attractor basin and optimal separating hyperplane orientation',
    explanation:
      'Altering η changes how rapidly the network traverses parameter space, but the geometric vector field pointing toward the classification solution remains topologically invariant.',
  },
  {
    id: 'gain',
    label: 'Activation Gain / Temperature',
    symbol: 'β',
    min: 0.5,
    max: 8.0,
    step: 0.1,
    whatMoves: 'Sigmoid margin softness and transition zone blur gradient',
    whatDoesNotMove: 'The exact zero-crossing hyper-plane (z = 0 is completely invariant)',
    explanation:
      'As you slide β from soft continuous probabilities (low gain) to a razor-sharp Heaviside step function (high gain), notice that the decision boundary line does not budge a single millimeter. Only the confidence gradient steepens.',
  },
  {
    id: 'decisionThreshold',
    label: 'Decision Threshold',
    symbol: 'θ',
    min: 0.1,
    max: 0.9,
    step: 0.02,
    whatMoves: 'Parallel translation of the classification boundary',
    whatDoesNotMove: 'Hyperplane normal direction angle: arctan(-w1 / w2)',
    explanation:
      'Changing the firing threshold shifts the boundary along its normal axis without rotating it. The synaptic ratio w1/w2 encoding the logical relationship stays locked.',
  },
  {
    id: 'weightDecay',
    label: 'Weight Decay (L2)',
    symbol: 'λ',
    min: 0.0,
    max: 0.08,
    step: 0.002,
    whatMoves: 'Synaptic weight norm ||W|| and energy dissipation rate',
    whatDoesNotMove: 'Boolean truth table partitioning and basin of attraction',
    explanation:
      'L2 regularization exerts a centripetal contraction pulling weights toward the origin (preventing explosive runaway), while the angular orientation separating 0 from 1 is conserved.',
  },
  {
    id: 'momentum',
    label: 'Inertia / Momentum',
    symbol: 'α',
    min: 0.0,
    max: 0.95,
    step: 0.05,
    whatMoves: 'Kinetic inertia, valley oscillations, and trajectory curvature',
    whatDoesNotMove: 'The stationary fixed point (∇L = 0)',
    explanation:
      'Momentum gives synaptic updates physical mass. It changes how the system swings around local curvature, yet the asymptotic fixed points where learning rests are unchanged.',
  },
  {
    id: 'synapticNoise',
    label: 'Synaptic Thermal Jitter',
    symbol: 'σ',
    min: 0.0,
    max: 0.25,
    step: 0.01,
    whatMoves: 'Microscopic Brownian motion of synaptic weights and boundary flutter',
    whatDoesNotMove: 'The macroscopic logic attractor state (topological robustness)',
    explanation:
      'Thermal noise tests the robustness of the circuit. Even with strong stochastic noise, the circuit remains trapped in the boolean logic attractor basin.',
  },
  {
    id: 'clockSpeed',
    label: 'Propagation Clock',
    symbol: 'Hz',
    min: 2,
    max: 60,
    step: 1,
    whatMoves: 'Action potential pulse rate and visual tick frequency',
    whatDoesNotMove: 'The causal sequence of logic state transitions',
    explanation:
      'Clock frequency scales observer time, but the discrete causal graph and mathematical state transitions remain invariant.',
  },
];
