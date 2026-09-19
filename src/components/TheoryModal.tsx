import { X, Sparkles, Cpu, Layers, BookOpen, ShieldCheck } from 'lucide-react';

interface TheoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TheoryModal({ isOpen, onClose }: TheoryModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-slate-950 border border-slate-800 rounded-2xl shadow-2xl overflow-y-auto p-6 text-slate-200 space-y-6">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 border-b border-slate-800 pb-4">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-white tracking-tight">
              The Irreducible Circuit & The Invariance Principle
            </h2>
            <p className="text-xs text-slate-400">
              Why this system is the mathematical atom of machine learning
            </p>
          </div>
        </div>

        {/* Section 1: The Irreducible Atom */}
        <div className="space-y-2 text-xs leading-relaxed">
          <h3 className="text-sm font-semibold text-cyan-300 flex items-center gap-2">
            <Cpu className="w-4 h-4" />
            <span>1. What is the Irreducible Machine Learning Circuit?</span>
          </h3>
          <p className="text-slate-300">
            Machine learning is fundamentally the automatic discovery of parameters that separate
            information. In boolean logic with 2 inputs, the <strong>Perceptron</strong> (1 neuron,
            3 parameters: $w_1, w_2, b$) is the most irreducible continuous circuit that can freely
            learn. It forms a single 1D hyper-plane separating 2D continuous space (R²):
          </p>
          <div className="p-3 rounded-lg bg-slate-900 font-mono text-[11px] text-cyan-300 border border-slate-800 text-center">
            z = w₁x₁ + w₂x₂ + b = 0 &nbsp;⟹&nbsp; x₂ = -(w₁/w₂)x₁ - (b/w₂)
          </div>
          <p className="text-slate-300">
            It natively learns linearly separable logic: <strong>AND, OR, NAND, NOR</strong>.
          </p>
        </div>

        {/* Section 2: The Minsky-Papert Singularity */}
        <div className="space-y-2 text-xs leading-relaxed">
          <h3 className="text-sm font-semibold text-amber-300 flex items-center gap-2">
            <Layers className="w-4 h-4" />
            <span>2. The XOR Singularity & The Minimal 2-2-1 Circuit</span>
          </h3>
          <p className="text-slate-300">
            In 1969, Marvin Minsky and Seymour Papert proved that a single linear neuron cannot
            compute <strong>XOR</strong>, because the true states $(0,1)$ and $(1,0)$ sit diagonally
            opposite $(0,0)$ and $(1,1)$. No single straight line can partition them.
          </p>
          <p className="text-slate-300">
            The <strong>Minimal 2-Layer MLP (2→2→1)</strong> is the irreducible multi-neuron circuit
            that resolves this. Hidden neuron $h_1$ learns NAND, hidden neuron $h_2$ learns OR, and
            the output neuron computes AND. In geometric terms, the hidden layer non-linearly{' '}
            <strong>folds the 2D plane</strong> into a space where XOR becomes linearly separable!
          </p>
        </div>

        {/* Section 3: The Philosophy of Invariance */}
        <div className="space-y-2 text-xs leading-relaxed">
          <h3 className="text-sm font-semibold text-emerald-300 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" />
            <span>3. "Not so you can tune it — so you can see what doesn't move"</span>
          </h3>
          <p className="text-slate-300">
            In physics, Emmy Noether discovered that every conservation law corresponds to a
            symmetry (an invariance under transformation). The same profound principle applies to
            neural learning:
          </p>
          <ul className="list-disc pl-4 space-y-1 text-slate-400">
            <li>
              <strong className="text-slate-200">Gain (β):</strong> Scales sigmoid temperature. Moving
              it from soft blur to sharp step leaves the zero-crossing line completely motionless.
            </li>
            <li>
              <strong className="text-slate-200">Learning Rate (η):</strong> Scales velocity through
              weight space, but leaves the stationary attractor basin invariant.
            </li>
            <li>
              <strong className="text-slate-200">Decision Threshold (θ):</strong> Translates the
              boundary parallel to itself without altering the normal angle $\arctan(-w_1/w_2)$.
            </li>
            <li>
              <strong className="text-slate-200">Coordinate Frame:</strong> Switching between unipolar
              &#123;0, 1&#125; and bipolar &#123;-1, 1&#125; shifts the origin, but the boolean
              logic topology is conserved.
            </li>
          </ul>
        </div>

        {/* Close Button */}
        <div className="pt-2 border-t border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-medium text-xs transition-colors"
          >
            Return to Circuit
          </button>
        </div>
      </div>
    </div>
  );
}
