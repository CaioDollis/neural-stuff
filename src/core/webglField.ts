import { ArchitectureMode, InvarianceParams, MLPWeights, PerceptronWeights } from '../types';

const VERTEX_SHADER_SOURCE = `
attribute vec2 a_position;
varying vec2 v_uv;

void main() {
  v_uv = (a_position + 1.0) * 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER_SOURCE = `
precision highp float;

varying vec2 v_uv;

uniform vec2 u_resolution;
uniform int u_mode; // 0: Perceptron, 1: Minimal MLP
uniform vec3 u_pWeights; // w1, w2, bias
uniform vec3 u_hWeights0; // w00, w01, b0
uniform vec3 u_hWeights1; // w10, w11, b1
uniform vec3 u_oWeights;  // wo0, wo1, bo
uniform float u_gain;
uniform float u_threshold;
uniform float u_time;
uniform vec2 u_probe;
uniform int u_encoding; // 0: unipolar [0,1], 1: bipolar [-1,1]

float sigmoid(float z, float beta) {
  float clamped = clamp(z * beta, -20.0, 20.0);
  return 1.0 / (1.0 + exp(-clamped));
}

void main() {
  // Map UV to logic space with comfortable margins
  vec2 coord;
  if (u_encoding == 0) {
    coord = mix(vec2(-0.25, -0.25), vec2(1.25, 1.25), v_uv);
  } else {
    coord = mix(vec2(-1.5, -1.5), vec2(1.5, 1.5), v_uv);
  }

  float x1 = coord.x;
  float x2 = coord.y;
  float act = 0.0;
  float preActivation = 0.0;

  if (u_mode == 0) {
    preActivation = u_pWeights.x * x1 + u_pWeights.y * x2 + u_pWeights.z;
    act = sigmoid(preActivation, u_gain);
  } else {
    float zh1 = u_hWeights0.x * x1 + u_hWeights0.y * x2 + u_hWeights0.z;
    float h1 = sigmoid(zh1, u_gain);

    float zh2 = u_hWeights1.x * x1 + u_hWeights1.y * x2 + u_hWeights1.z;
    float h2 = sigmoid(zh2, u_gain);

    preActivation = u_oWeights.x * h1 + u_oWeights.y * h2 + u_oWeights.z;
    act = sigmoid(preActivation, u_gain);
  }

  // Color Palette: Deep technical obsidian / slate background
  // Class 0: Indigo-Cyan deep space
  // Class 1: Vivid Emerald-Teal energy
  vec3 col0 = vec3(0.06, 0.09, 0.16); // dark slate/indigo
  vec3 col1 = vec3(0.04, 0.28, 0.24); // rich emerald teal
  vec3 baseColor = mix(col0, col1, act);

  // Topographical probability contour ripples
  float contours = fract(act * 8.0);
  float contourLine = smoothstep(0.0, 0.04, contours) * (1.0 - smoothstep(0.06, 0.1, contours));
  baseColor += vec3(0.04, 0.12, 0.14) * contourLine;

  // The Critical Invariant Decision Boundary: act == u_threshold
  float distToThreshold = abs(act - u_threshold);
  float boundaryThickness = 0.015 + 0.02 * (1.0 / max(1.0, u_gain * 0.5));
  float boundary = 1.0 - smoothstep(0.0, boundaryThickness, distToThreshold);
  // Boundary laser glow (Cyan / White)
  vec3 laserGlow = vec3(0.18, 0.88, 0.95);
  baseColor += laserGlow * boundary * 1.8;

  // Sub-boundary zero-crossing (z = 0) indicator
  float zZero = 1.0 - smoothstep(0.0, 0.05, abs(preActivation));
  baseColor += vec3(0.1, 0.4, 0.5) * zZero * 0.25;

  // Render Coordinate Axes and Unit Square Boundaries
  float gridThick = 0.012;
  float axisX = 1.0 - smoothstep(0.0, gridThick, abs(coord.y));
  float axisY = 1.0 - smoothstep(0.0, gridThick, abs(coord.x));
  float unitX = 1.0 - smoothstep(0.0, gridThick, abs(coord.y - 1.0));
  float unitY = 1.0 - smoothstep(0.0, gridThick, abs(coord.x - 1.0));
  float grid = max(max(axisX, axisY), max(unitX, unitY));
  baseColor += vec3(0.15, 0.22, 0.32) * grid * 0.4;

  // Probe indicator ring
  float probeDist = length(coord - u_probe);
  float probeRing = 1.0 - smoothstep(0.03, 0.045, abs(probeDist - 0.06));
  float probeCore = 1.0 - smoothstep(0.0, 0.02, probeDist);
  vec3 probeColor = vec3(1.0, 0.84, 0.22); // Solar Gold
  baseColor = mix(baseColor, probeColor, probeRing * 0.9 + probeCore * 0.95);

  // Subtle vignette
  vec2 d = abs(v_uv - 0.5) * 2.0;
  float vignette = 1.0 - dot(d, d) * 0.2;
  baseColor *= clamp(vignette, 0.6, 1.0);

  gl_FragColor = vec4(baseColor, 1.0);
}
`;

export class WebGLFieldRenderer {
  private gl: WebGLRenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private positionBuffer: WebGLBuffer | null = null;

  // Uniform locations cache
  private uResolutionLoc: WebGLUniformLocation | null = null;
  private uModeLoc: WebGLUniformLocation | null = null;
  private uPWeightsLoc: WebGLUniformLocation | null = null;
  private uHWeights0Loc: WebGLUniformLocation | null = null;
  private uHWeights1Loc: WebGLUniformLocation | null = null;
  private uOWeightsLoc: WebGLUniformLocation | null = null;
  private uGainLoc: WebGLUniformLocation | null = null;
  private uThresholdLoc: WebGLUniformLocation | null = null;
  private uTimeLoc: WebGLUniformLocation | null = null;
  private uProbeLoc: WebGLUniformLocation | null = null;
  private uEncodingLoc: WebGLUniformLocation | null = null;

  constructor(private canvas: HTMLCanvasElement) {
    this.initWebGL();
  }

  private initWebGL() {
    const gl =
      this.canvas.getContext('webgl', { antialias: true, alpha: false }) ||
      (this.canvas.getContext('experimental-webgl') as WebGLRenderingContext | null);

    if (!gl) {
      console.warn('WebGL not supported on this device');
      return;
    }
    this.gl = gl;

    const vs = this.compileShader(gl.VERTEX_SHADER, VERTEX_SHADER_SOURCE);
    const fs = this.compileShader(gl.FRAGMENT_SHADER, FRAGMENT_SHADER_SOURCE);
    if (!vs || !fs) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(program));
      return;
    }
    this.program = program;

    // Create full screen quad [-1, -1] to [1, 1]
    const positions = new Float32Array([
      -1, -1,
       1, -1,
      -1,  1,
      -1,  1,
       1, -1,
       1,  1,
    ]);
    this.positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    // Cache uniforms
    this.uResolutionLoc = gl.getUniformLocation(program, 'u_resolution');
    this.uModeLoc = gl.getUniformLocation(program, 'u_mode');
    this.uPWeightsLoc = gl.getUniformLocation(program, 'u_pWeights');
    this.uHWeights0Loc = gl.getUniformLocation(program, 'u_hWeights0');
    this.uHWeights1Loc = gl.getUniformLocation(program, 'u_hWeights1');
    this.uOWeightsLoc = gl.getUniformLocation(program, 'u_oWeights');
    this.uGainLoc = gl.getUniformLocation(program, 'u_gain');
    this.uThresholdLoc = gl.getUniformLocation(program, 'u_threshold');
    this.uTimeLoc = gl.getUniformLocation(program, 'u_time');
    this.uProbeLoc = gl.getUniformLocation(program, 'u_probe');
    this.uEncodingLoc = gl.getUniformLocation(program, 'u_encoding');
  }

  private compileShader(type: number, src: string): WebGLShader | null {
    const gl = this.gl!;
    const shader = gl.createShader(type);
    if (!shader) return null;
    gl.shaderSource(shader, src);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', gl.getShaderInfoLog(shader));
      gl.deleteShader(shader);
      return null;
    }
    return shader;
  }

  public render(
    mode: ArchitectureMode,
    pWeights: PerceptronWeights,
    mlpWeights: MLPWeights,
    params: InvarianceParams,
    probe: [number, number],
    time: number
  ) {
    const gl = this.gl;
    if (!gl || !this.program) return;

    const width = this.canvas.clientWidth;
    const height = this.canvas.clientHeight;
    if (this.canvas.width !== width || this.canvas.height !== height) {
      this.canvas.width = width;
      this.canvas.height = height;
      gl.viewport(0, 0, width, height);
    }

    gl.useProgram(this.program);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
    const posAttr = gl.getAttribLocation(this.program, 'a_position');
    gl.enableVertexAttribArray(posAttr);
    gl.vertexAttribPointer(posAttr, 2, gl.FLOAT, false, 0, 0);

    gl.uniform2f(this.uResolutionLoc, width, height);
    gl.uniform1i(this.uModeLoc, mode === 'PERCEPTRON' ? 0 : 1);
    gl.uniform3f(this.uPWeightsLoc, pWeights.w1, pWeights.w2, pWeights.bias);

    gl.uniform3f(
      this.uHWeights0Loc,
      mlpWeights.wHidden[0][0],
      mlpWeights.wHidden[0][1],
      mlpWeights.bHidden[0]
    );
    gl.uniform3f(
      this.uHWeights1Loc,
      mlpWeights.wHidden[1][0],
      mlpWeights.wHidden[1][1],
      mlpWeights.bHidden[1]
    );
    gl.uniform3f(
      this.uOWeightsLoc,
      mlpWeights.wOutput[0],
      mlpWeights.wOutput[1],
      mlpWeights.bOutput
    );

    gl.uniform1f(this.uGainLoc, params.gain);
    gl.uniform1f(this.uThresholdLoc, params.decisionThreshold);
    gl.uniform1f(this.uTimeLoc, time);
    gl.uniform2f(this.uProbeLoc, probe[0], probe[1]);
    gl.uniform1i(this.uEncodingLoc, params.inputEncoding === 'BIPOLAR' ? 1 : 0);

    gl.drawArrays(gl.TRIANGLES, 0, 6);
  }

  public dispose() {
    if (this.gl && this.program) {
      this.gl.deleteProgram(this.program);
    }
  }
}
