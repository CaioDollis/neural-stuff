import { ArchitectureMode, MLPWeights, PerceptronWeights } from '../types';

export interface Pulse {
  sourceId: string;
  targetId: string;
  progress: number; // 0 to 1
  speed: number;
  weight: number;
  activation: number;
}

export interface NodePosition {
  id: string;
  label: string;
  sublabel: string;
  x: number;
  y: number;
  radius: number;
  isInput?: boolean;
  value: number;
  membranePotential?: number;
  isFiring?: boolean;
}

export class CircuitVisualizer {
  private pulses: Pulse[] = [];
  private lastTime = 0;
  private firingFlashes: Map<string, number> = new Map(); // node id -> flash intensity [0..1]
  private plasticityRipples: Map<string, number> = new Map(); // synapse key -> ripple [0..1]
  private prevPWeights: PerceptronWeights | null = null;
  private prevMLPWeights: MLPWeights | null = null;

  constructor(private canvas: HTMLCanvasElement) {}

  public getClickedNode(clientX: number, clientY: number, nodes: NodePosition[]): NodePosition | null {
    const rect = this.canvas.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * this.canvas.width;
    const y = ((clientY - rect.top) / rect.height) * this.canvas.height;

    for (const node of nodes) {
      const dx = x - node.x;
      const dy = y - node.y;
      if (dx * dx + dy * dy <= (node.radius + 15) * (node.radius + 15)) {
        return node;
      }
    }
    return null;
  }

  public render(
    mode: ArchitectureMode,
    pWeights: PerceptronWeights,
    mlpWeights: MLPWeights,
    nodeActivations: {
      x1: number;
      x2: number;
      bias: number;
      h1?: number;
      h2?: number;
      out: number;
    },
    membranePotentials: {
      h1?: number;
      h2?: number;
      out: number;
    },
    threshold: number,
    time: number
  ): NodePosition[] {
    const ctx = this.canvas.getContext('2d');
    if (!ctx) return [];

    const dpr = window.devicePixelRatio || 1;
    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;

    if (this.canvas.width !== width * dpr || this.canvas.height !== height * dpr) {
      this.canvas.width = width * dpr;
      this.canvas.height = height * dpr;
    }

    ctx.save();
    ctx.scale(dpr, dpr);

    // Delta time
    const dt = this.lastTime ? Math.min(0.05, (time - this.lastTime) / 1000) : 0.016;
    this.lastTime = time;

    // Check plasticity changes
    if (mode === 'PERCEPTRON' && this.prevPWeights) {
      if (Math.abs(pWeights.w1 - this.prevPWeights.w1) > 0.001) this.plasticityRipples.set('x1-out', 1.0);
      if (Math.abs(pWeights.w2 - this.prevPWeights.w2) > 0.001) this.plasticityRipples.set('x2-out', 1.0);
      if (Math.abs(pWeights.bias - this.prevPWeights.bias) > 0.001) this.plasticityRipples.set('b-out', 1.0);
    }
    this.prevPWeights = { ...pWeights };
    this.prevMLPWeights = JSON.parse(JSON.stringify(mlpWeights));

    // Clear with sophisticated dark canvas
    ctx.fillStyle = '#090d16';
    ctx.fillRect(0, 0, width, height);

    // Subtle technical grid
    ctx.strokeStyle = 'rgba(30, 41, 59, 0.4)';
    ctx.lineWidth = 1;
    const gridSize = 28;
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Compute Node Positions responsively
    const isMobile = width < 500;
    const nodeRadius = isMobile ? 22 : 28;

    const leftX = width * (isMobile ? 0.18 : 0.16);
    const midX = width * 0.5;
    const rightX = width * (isMobile ? 0.82 : 0.84);

    const nodes: NodePosition[] = [];

    // Inputs (Left Layer)
    const inputSpacing = height / 4;
    const nodeX1: NodePosition = {
      id: 'x1',
      label: 'x₁',
      sublabel: 'Input 1',
      x: leftX,
      y: inputSpacing * 1.0,
      radius: nodeRadius,
      isInput: true,
      value: nodeActivations.x1,
      isFiring: nodeActivations.x1 > 0.5,
    };
    const nodeX2: NodePosition = {
      id: 'x2',
      label: 'x₂',
      sublabel: 'Input 2',
      x: leftX,
      y: inputSpacing * 2.0,
      radius: nodeRadius,
      isInput: true,
      value: nodeActivations.x2,
      isFiring: nodeActivations.x2 > 0.5,
    };
    const nodeBias: NodePosition = {
      id: 'b',
      label: '+1',
      sublabel: 'Threshold Bias',
      x: leftX,
      y: inputSpacing * 3.0,
      radius: nodeRadius * 0.85,
      isInput: true,
      value: 1.0,
      isFiring: true,
    };
    nodes.push(nodeX1, nodeX2, nodeBias);

    // Hidden layer (if Minimal MLP)
    let nodeH1: NodePosition | undefined;
    let nodeH2: NodePosition | undefined;

    if (mode === 'MINIMAL_MLP') {
      const hSpacing = height / 3;
      nodeH1 = {
        id: 'h1',
        label: 'h₁',
        sublabel: 'Hidden 1',
        x: midX,
        y: hSpacing * 1.0,
        radius: nodeRadius,
        value: nodeActivations.h1 ?? 0,
        membranePotential: membranePotentials.h1 ?? 0,
        isFiring: (nodeActivations.h1 ?? 0) >= threshold,
      };
      nodeH2 = {
        id: 'h2',
        label: 'h₂',
        sublabel: 'Hidden 2',
        x: midX,
        y: hSpacing * 2.0,
        radius: nodeRadius,
        value: nodeActivations.h2 ?? 0,
        membranePotential: membranePotentials.h2 ?? 0,
        isFiring: (nodeActivations.h2 ?? 0) >= threshold,
      };
      nodes.push(nodeH1, nodeH2);
    }

    // Output Node (Right Layer)
    const nodeOut: NodePosition = {
      id: 'out',
      label: 'y',
      sublabel: mode === 'PERCEPTRON' ? 'Perceptron Soma' : 'Output Soma',
      x: rightX,
      y: height * 0.5,
      radius: nodeRadius * 1.15,
      value: nodeActivations.out,
      membranePotential: membranePotentials.out,
      isFiring: nodeActivations.out >= threshold,
    };
    nodes.push(nodeOut);

    // Build Synaptic Connections list
    interface Synapse {
      key: string;
      src: NodePosition;
      dst: NodePosition;
      weight: number;
    }
    const synapses: Synapse[] = [];

    if (mode === 'PERCEPTRON') {
      synapses.push(
        { key: 'x1-out', src: nodeX1, dst: nodeOut, weight: pWeights.w1 },
        { key: 'x2-out', src: nodeX2, dst: nodeOut, weight: pWeights.w2 },
        { key: 'b-out', src: nodeBias, dst: nodeOut, weight: pWeights.bias }
      );
    } else {
      // Inputs -> Hidden 1
      synapses.push(
        { key: 'x1-h1', src: nodeX1, dst: nodeH1!, weight: mlpWeights.wHidden[0][0] },
        { key: 'x2-h1', src: nodeX2, dst: nodeH1!, weight: mlpWeights.wHidden[0][1] },
        { key: 'b-h1', src: nodeBias, dst: nodeH1!, weight: mlpWeights.bHidden[0] }
      );
      // Inputs -> Hidden 2
      synapses.push(
        { key: 'x1-h2', src: nodeX1, dst: nodeH2!, weight: mlpWeights.wHidden[1][0] },
        { key: 'x2-h2', src: nodeX2, dst: nodeH2!, weight: mlpWeights.wHidden[1][1] },
        { key: 'b-h2', src: nodeBias, dst: nodeH2!, weight: mlpWeights.bHidden[1] }
      );
      // Hidden -> Output
      synapses.push(
        { key: 'h1-out', src: nodeH1!, dst: nodeOut, weight: mlpWeights.wOutput[0] },
        { key: 'h2-out', src: nodeH2!, dst: nodeOut, weight: mlpWeights.wOutput[1] },
        { key: 'b-out', src: nodeBias, dst: nodeOut, weight: mlpWeights.bOutput }
      );
    }

    // Spawn pulses periodically along active synapses
    if (Math.random() < 0.35) {
      const activeSynapses = synapses.filter((s) => s.src.value > 0.05);
      if (activeSynapses.length > 0) {
        const s = activeSynapses[Math.floor(Math.random() * activeSynapses.length)];
        this.pulses.push({
          sourceId: s.src.id,
          targetId: s.dst.id,
          progress: 0,
          speed: 0.9 + Math.random() * 0.5,
          weight: s.weight,
          activation: s.src.value,
        });
      }
    }

    // Update pulses
    for (let i = this.pulses.length - 1; i >= 0; i--) {
      const p = this.pulses[i];
      p.progress += p.speed * dt;
      if (p.progress >= 1.0) {
        // Trigger flash on destination
        this.firingFlashes.set(p.targetId, 1.0);
        this.pulses.splice(i, 1);
      }
    }

    // Decay flashes and plasticity ripples
    for (const [id, val] of this.firingFlashes.entries()) {
      const nextVal = val - dt * 2.5;
      if (nextVal <= 0) this.firingFlashes.delete(id);
      else this.firingFlashes.set(id, nextVal);
    }
    for (const [k, val] of this.plasticityRipples.entries()) {
      const nextVal = val - dt * 2.0;
      if (nextVal <= 0) this.plasticityRipples.delete(k);
      else this.plasticityRipples.set(k, nextVal);
    }

    // 1. Render Synaptic Connections (Axons)
    for (const syn of synapses) {
      const { src, dst, weight, key } = syn;
      const isExcitatory = weight >= 0;
      const absW = Math.abs(weight);
      const wireThick = Math.min(8, Math.max(1.5, absW * 2.2));

      // Color based on excitatory (cyan/emerald) vs inhibitory (amber/crimson)
      const baseAlpha = Math.min(0.9, 0.25 + absW * 0.2);
      const color = isExcitatory
        ? `rgba(34, 211, 238, ${baseAlpha})`
        : `rgba(249, 115, 22, ${baseAlpha})`;

      // Axon line with curvature
      ctx.beginPath();
      ctx.moveTo(src.x, src.y);
      const cpX = (src.x + dst.x) * 0.5;
      const cpY = (src.y + dst.y) * 0.5;
      ctx.lineTo(dst.x, dst.y);

      ctx.strokeStyle = color;
      ctx.lineWidth = wireThick;
      ctx.stroke();

      // Plasticity Ripple (flash if weights changed recently)
      const ripple = this.plasticityRipples.get(key);
      if (ripple && ripple > 0) {
        ctx.save();
        ctx.strokeStyle = `rgba(255, 255, 255, ${ripple * 0.8})`;
        ctx.lineWidth = wireThick + 4 * ripple;
        ctx.stroke();
        ctx.restore();
      }

      // Weight label tag near midpoint
      const labelX = src.x * 0.45 + dst.x * 0.55;
      const labelY = src.y * 0.45 + dst.y * 0.55;

      ctx.fillStyle = '#0f172a';
      ctx.strokeStyle = isExcitatory ? 'rgba(34, 211, 238, 0.5)' : 'rgba(249, 115, 22, 0.5)';
      ctx.lineWidth = 1;
      const tagW = 44;
      const tagH = 16;
      ctx.beginPath();
      ctx.roundRect(labelX - tagW / 2, labelY - tagH / 2, tagW, tagH, 3);
      ctx.fill();
      ctx.stroke();

      ctx.font = '10px monospace';
      ctx.fillStyle = isExcitatory ? '#38bdf8' : '#fb923c';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText((weight >= 0 ? '+' : '') + weight.toFixed(2), labelX, labelY + 0.5);
    }

    // 2. Render Action Potential Pulses
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const pulse of this.pulses) {
      const srcNode = nodes.find((n) => n.id === pulse.sourceId);
      const dstNode = nodes.find((n) => n.id === pulse.targetId);
      if (!srcNode || !dstNode) continue;

      const px = srcNode.x + (dstNode.x - srcNode.x) * pulse.progress;
      const py = srcNode.y + (dstNode.y - srcNode.y) * pulse.progress;

      const pulseColor = pulse.weight >= 0 ? '#38bdf8' : '#fb923c';
      const pulseSize = Math.max(3, Math.min(8, 3 + Math.abs(pulse.weight) * 2));

      // Glow halo
      const grad = ctx.createRadialGradient(px, py, 0, px, py, pulseSize * 2.5);
      grad.addColorStop(0, pulseColor);
      grad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(px, py, pulseSize * 2.5, 0, Math.PI * 2);
      ctx.fill();

      // Core photon
      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.arc(px, py, pulseSize * 0.7, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    // 3. Render Neurons (Soma bodies, capacitors, threshold flares)
    for (const node of nodes) {
      const flash = this.firingFlashes.get(node.id) || 0;
      const isFiring = node.isFiring;

      // Threshold shockwave flare if firing
      if (flash > 0 || isFiring) {
        const flareSize = node.radius * (1.3 + flash * 0.6);
        const flareGrad = ctx.createRadialGradient(node.x, node.y, node.radius * 0.8, node.x, node.y, flareSize);
        flareGrad.addColorStop(0, 'rgba(52, 211, 153, 0.4)');
        flareGrad.addColorStop(0.7, 'rgba(34, 211, 238, 0.2)');
        flareGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
        ctx.fillStyle = flareGrad;
        ctx.beginPath();
        ctx.arc(node.x, node.y, flareSize, 0, Math.PI * 2);
        ctx.fill();
      }

      // Soma Outer Shell
      ctx.beginPath();
      ctx.arc(node.x, node.y, node.radius, 0, Math.PI * 2);
      ctx.fillStyle = '#0f172a';
      ctx.fill();

      // Soma Border: Glowing Green/Cyan if firing, muted slate if quiet
      ctx.lineWidth = isFiring ? 3 : 1.8;
      ctx.strokeStyle = isFiring ? '#10b981' : '#334155';
      ctx.stroke();

      // If neuron has membrane potential (soma), draw capacitor dielectric fill
      if (node.membranePotential !== undefined) {
        // Clamp for display
        const normPot = Math.max(0, Math.min(1, (node.membranePotential + 2) / 4));
        const fillAngle = normPot * Math.PI * 2;

        ctx.save();
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.radius - 4, -Math.PI / 2, -Math.PI / 2 + fillAngle);
        ctx.strokeStyle = isFiring ? 'rgba(16, 185, 129, 0.8)' : 'rgba(56, 189, 248, 0.4)';
        ctx.lineWidth = 3;
        ctx.stroke();
        ctx.restore();
      } else if (node.isInput) {
        // Input fill
        if (node.value > 0.5) {
          ctx.beginPath();
          ctx.arc(node.x, node.y, node.radius - 5, 0, Math.PI * 2);
          ctx.fillStyle = node.id === 'b' ? 'rgba(234, 179, 8, 0.35)' : 'rgba(16, 185, 129, 0.35)';
          ctx.fill();
        }
      }

      // Typography / Labels inside Node
      ctx.fillStyle = isFiring ? '#ffffff' : '#94a3b8';
      ctx.font = `bold ${isMobile ? 12 : 14}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(node.label, node.x, node.y - (isMobile ? 3 : 4));

      // Value readout
      ctx.fillStyle = isFiring ? '#34d399' : '#64748b';
      ctx.font = '9px monospace';
      const valStr = node.isInput ? (node.value > 0.5 ? 'HIGH (1)' : 'LOW (0)') : node.value.toFixed(2);
      ctx.fillText(valStr, node.x, node.y + (isMobile ? 9 : 10));

      // Outer label caption
      ctx.fillStyle = '#64748b';
      ctx.font = '10px sans-serif';
      ctx.fillText(node.sublabel, node.x, node.y + node.radius + 14);

      if (node.membranePotential !== undefined) {
        ctx.fillStyle = '#38bdf8';
        ctx.font = '9px monospace';
        ctx.fillText(`Vₘ: ${node.membranePotential.toFixed(2)}`, node.x, node.y + node.radius + 26);
      }
    }

    ctx.restore();
    return nodes;
  }
}
