/**
 * Tiny GPT inference, written by hand: no ML library. Runs a decoder-only transformer one
 * character at a time with a key/value cache, on weights exported by the tiny-gpt repo
 * (weights_format.py). The math must match its model.py: pre-norm blocks, LayerNorm eps 1e-5,
 * tanh GELU, output layer tied to the token embedding.
 *
 * No DOM or Node APIs here, so the same file runs in the Web Worker and in scripts/check-tinygpt.ts.
 */

export interface TinyGptConfig {
  vocab_size: number;
  block_size: number;
  n_layer: number;
  n_head: number;
  n_embd: number;
}

interface TensorInfo {
  shape: number[];
  dtype: "int8" | "float32";
  offset: number;
  scales?: number;
}

export interface Manifest {
  format: string;
  config: TinyGptConfig;
  vocab: string;
  eos: number;
  bytes: number;
  params: number;
  tensors: Record<string, TensorInfo>;
}

const LN_EPS = 1e-5;
const GELU_C = Math.sqrt(2 / Math.PI);

/** Turns the int8 + per-row scale matrices back into float32. */
const readTensor = (buffer: ArrayBuffer, name: string, t: TensorInfo) => {
  const size = t.shape.reduce((a, b) => a * b, 1);
  if (t.offset + size * (t.dtype === "int8" ? 1 : 4) > buffer.byteLength)
    throw new Error(`${name} runs past the end of model.bin`);
  if (t.dtype === "float32")
    return new Float32Array(buffer.slice(t.offset, t.offset + size * 4));
  const [rows, cols] = t.shape;
  const q = new Int8Array(buffer, t.offset, size);
  const scales = new Float32Array(buffer, t.scales, rows);
  const out = new Float32Array(size);
  for (let r = 0; r < rows; r++) {
    const s = scales[r];
    for (let c = r * cols, end = c + cols; c < end; c++) out[c] = q[c] * s;
  }
  return out;
};

/** out = W·x + b, with W stored [out][in] row-major like torch.nn.Linear. */
const linear = (
  out: Float32Array,
  W: Float32Array,
  b: Float32Array | null,
  x: Float32Array,
  outDim: number,
  inDim: number,
) => {
  for (let o = 0; o < outDim; o++) {
    let sum = b ? b[o] : 0;
    const row = o * inDim;
    for (let i = 0; i < inDim; i++) sum += W[row + i] * x[i];
    out[o] = sum;
  }
};

const layerNorm = (
  out: Float32Array,
  x: Float32Array,
  w: Float32Array,
  b: Float32Array,
) => {
  const n = x.length;
  let mean = 0;
  for (let i = 0; i < n; i++) mean += x[i];
  mean /= n;
  let variance = 0;
  for (let i = 0; i < n; i++) variance += (x[i] - mean) ** 2;
  const inv = 1 / Math.sqrt(variance / n + LN_EPS);
  for (let i = 0; i < n; i++) out[i] = (x[i] - mean) * inv * w[i] + b[i];
};

interface Layer {
  ln1w: Float32Array;
  ln1b: Float32Array;
  attnW: Float32Array;
  attnB: Float32Array;
  projW: Float32Array;
  projB: Float32Array;
  ln2w: Float32Array;
  ln2b: Float32Array;
  fcW: Float32Array;
  fcB: Float32Array;
  fcProjW: Float32Array;
  fcProjB: Float32Array;
  keys: Float32Array; // cache: [block_size][n_embd]
  values: Float32Array;
}

export class TinyGpt {
  readonly config: TinyGptConfig;
  readonly vocab: string;
  readonly eos: number;
  private readonly charToId = new Map<string, number>();
  private readonly wte: Float32Array;
  private readonly wpe: Float32Array;
  private readonly lnfW: Float32Array;
  private readonly lnfB: Float32Array;
  private readonly layers: Layer[];
  /** Tokens currently in the cache, in order; its length is the next position. */
  private context: number[] = [];

  // Scratch buffers, allocated once.
  private readonly x: Float32Array;
  private readonly h: Float32Array;
  private readonly qkv: Float32Array;
  private readonly y: Float32Array;
  private readonly tmp: Float32Array;
  private readonly ff: Float32Array;
  private readonly att: Float32Array;
  private readonly logits: Float32Array;

  constructor(manifest: Manifest, buffer: ArrayBuffer) {
    if (manifest.format !== "tinygpt-v1")
      throw new Error(`Unknown model format ${manifest.format}`);
    const cfg = manifest.config;
    this.config = cfg;
    this.vocab = manifest.vocab;
    this.eos = manifest.eos;
    [...manifest.vocab].forEach((ch, i) => this.charToId.set(ch, i));

    const get = (name: string) => {
      const t = manifest.tensors[name];
      if (!t) throw new Error(`model.json has no tensor ${name}`);
      return readTensor(buffer, name, t);
    };
    const C = cfg.n_embd;
    this.wte = get("wte.weight");
    this.wpe = get("wpe.weight");
    this.lnfW = get("ln_f.weight");
    this.lnfB = get("ln_f.bias");
    this.layers = Array.from({ length: cfg.n_layer }, (_, l) => {
      const p = `h.${l}.`;
      return {
        ln1w: get(p + "ln_1.weight"),
        ln1b: get(p + "ln_1.bias"),
        attnW: get(p + "attn.c_attn.weight"),
        attnB: get(p + "attn.c_attn.bias"),
        projW: get(p + "attn.c_proj.weight"),
        projB: get(p + "attn.c_proj.bias"),
        ln2w: get(p + "ln_2.weight"),
        ln2b: get(p + "ln_2.bias"),
        fcW: get(p + "mlp.c_fc.weight"),
        fcB: get(p + "mlp.c_fc.bias"),
        fcProjW: get(p + "mlp.c_proj.weight"),
        fcProjB: get(p + "mlp.c_proj.bias"),
        keys: new Float32Array(cfg.block_size * C),
        values: new Float32Array(cfg.block_size * C),
      };
    });
    this.x = new Float32Array(C);
    this.h = new Float32Array(C);
    this.qkv = new Float32Array(3 * C);
    this.y = new Float32Array(C);
    this.tmp = new Float32Array(C);
    this.ff = new Float32Array(4 * C);
    this.att = new Float32Array(cfg.block_size);
    this.logits = new Float32Array(cfg.vocab_size);
  }

  /** Characters the model never saw are dropped. */
  encode(text: string) {
    const ids: number[] = [];
    for (const ch of text) {
      const id = this.charToId.get(ch);
      if (id !== undefined && id !== this.eos) ids.push(id);
    }
    return ids;
  }

  decode(id: number) {
    return this.vocab[id] ?? "";
  }

  reset() {
    this.context = [];
  }

  /**
   * Feeds one token and returns the logits for the next one. The returned array is reused by
   * the next call. When the context window is full, the cache is rebuilt from the newest quarter:
   * positions are absolute, so old keys can't simply shift down. A quarter keeps that rebuild
   * pause short (about half a second at 256 characters) while leaving the model some context.
   */
  step(token: number): Float32Array {
    const { block_size } = this.config;
    if (this.context.length === block_size) {
      const keep = this.context.slice(block_size - Math.floor(block_size / 4));
      this.context = [];
      for (const t of keep) this.forward(t);
    }
    return this.forward(token);
  }

  private forward(token: number): Float32Array {
    const { n_embd: C, n_head: H, vocab_size: V } = this.config;
    const D = C / H;
    const pos = this.context.length;
    const { x, h, qkv, y, tmp, ff, att } = this;
    const scale = 1 / Math.sqrt(D);

    for (let i = 0; i < C; i++)
      x[i] = this.wte[token * C + i] + this.wpe[pos * C + i];

    for (const L of this.layers) {
      // Attention: this position's query against every cached key up to and including itself.
      layerNorm(h, x, L.ln1w, L.ln1b);
      linear(qkv, L.attnW, L.attnB, h, 3 * C, C);
      L.keys.set(qkv.subarray(C, 2 * C), pos * C);
      L.values.set(qkv.subarray(2 * C, 3 * C), pos * C);
      for (let hd = 0; hd < H; hd++) {
        const off = hd * D;
        let max = -Infinity;
        for (let t = 0; t <= pos; t++) {
          let s = 0;
          const k = t * C + off;
          for (let d = 0; d < D; d++) s += qkv[off + d] * L.keys[k + d];
          s *= scale;
          att[t] = s;
          if (s > max) max = s;
        }
        let sum = 0;
        for (let t = 0; t <= pos; t++) {
          att[t] = Math.exp(att[t] - max);
          sum += att[t];
        }
        for (let d = 0; d < D; d++) y[off + d] = 0;
        for (let t = 0; t <= pos; t++) {
          const a = att[t] / sum;
          const v = t * C + off;
          for (let d = 0; d < D; d++) y[off + d] += a * L.values[v + d];
        }
      }
      linear(tmp, L.projW, L.projB, y, C, C);
      for (let i = 0; i < C; i++) x[i] += tmp[i];

      // Feed-forward: expand to 4x, GELU, project back.
      layerNorm(h, x, L.ln2w, L.ln2b);
      linear(ff, L.fcW, L.fcB, h, 4 * C, C);
      for (let i = 0; i < ff.length; i++) {
        const v = ff[i];
        ff[i] = 0.5 * v * (1 + Math.tanh(GELU_C * (v + 0.044715 * v * v * v)));
      }
      linear(tmp, L.fcProjW, L.fcProjB, ff, C, 4 * C);
      for (let i = 0; i < C; i++) x[i] += tmp[i];
    }

    layerNorm(h, x, this.lnfW, this.lnfB);
    linear(this.logits, this.wte, null, h, V, C);
    this.context.push(token);
    return this.logits;
  }
}

/**
 * Picks the next token. Temperature below 1 makes the safest characters more likely; above 1
 * makes the text wilder. Only the `topK` most likely characters are considered.
 */
export const sample = (
  logits: Float32Array,
  temperature: number,
  topK: number,
  random: () => number = Math.random,
) => {
  const order = Array.from(logits.keys())
    .sort((a, b) => logits[b] - logits[a])
    .slice(0, Math.max(1, topK));
  if (temperature <= 0) return order[0];
  const max = logits[order[0]];
  const weights = order.map((i) => Math.exp((logits[i] - max) / temperature));
  let r = random() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < order.length; i++) {
    r -= weights[i];
    if (r <= 0) return order[i];
  }
  return order[order.length - 1];
};
