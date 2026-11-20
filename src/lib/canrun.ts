// Can-it-run estimator: model, hardware, context and quant in; fit, offload and decode speed out.
// Pure, no DOM. Rendered at build time on /can-it-run/ and re-run in the browser on every change.
// Decode is memory-bound, so speed is bytes read per token over usable bandwidth. These are
// rough estimates for llama.cpp-style runtimes, not benchmarks.

export type Model = { id: string; label: string; params: number; active: number; layers: number; kvHeads: number; headDim: number; maxCtx: number };
export type Hardware = { id: string; label: string; memGB: number; bandwidth: number; unified?: boolean };
export type Quant = { id: string; label: string; bpw: number };

// Parameter counts in billions; `active` differs from `params` only for mixture-of-experts models.
export const MODELS: Model[] = [
  { id: "llama-3.1-8b", label: "Llama 3.1 8B", params: 8.03, active: 8.03, layers: 32, kvHeads: 8, headDim: 128, maxCtx: 131072 },
  { id: "qwen-2.5-7b", label: "Qwen2.5 7B", params: 7.62, active: 7.62, layers: 28, kvHeads: 4, headDim: 128, maxCtx: 131072 },
  { id: "gemma-2-9b", label: "Gemma 2 9B", params: 9.24, active: 9.24, layers: 42, kvHeads: 8, headDim: 256, maxCtx: 8192 },
  { id: "phi-4", label: "Phi-4 14B", params: 14.7, active: 14.7, layers: 40, kvHeads: 10, headDim: 128, maxCtx: 16384 },
  { id: "mistral-small-3-24b", label: "Mistral Small 3 24B", params: 23.6, active: 23.6, layers: 40, kvHeads: 8, headDim: 128, maxCtx: 32768 },
  { id: "qwen-3-30b-a3b", label: "Qwen3 30B-A3B (MoE)", params: 30.5, active: 3.3, layers: 48, kvHeads: 4, headDim: 128, maxCtx: 131072 },
  { id: "qwen-2.5-32b", label: "Qwen2.5 32B", params: 32.8, active: 32.8, layers: 64, kvHeads: 8, headDim: 128, maxCtx: 131072 },
  { id: "mixtral-8x7b", label: "Mixtral 8x7B (MoE)", params: 46.7, active: 12.9, layers: 32, kvHeads: 8, headDim: 128, maxCtx: 32768 },
  { id: "llama-3.3-70b", label: "Llama 3.3 70B", params: 70.6, active: 70.6, layers: 80, kvHeads: 8, headDim: 128, maxCtx: 131072 },
  { id: "llama-3.1-405b", label: "Llama 3.1 405B", params: 405, active: 405, layers: 126, kvHeads: 8, headDim: 128, maxCtx: 131072 },
];

// Memory in GB and peak memory bandwidth in GB/s. Unified memory is shared with the CPU.
export const HARDWARE: Hardware[] = [
  { id: "rtx-3060-12", label: "RTX 3060 12 GB", memGB: 12, bandwidth: 360 },
  { id: "rtx-4060ti-16", label: "RTX 4060 Ti 16 GB", memGB: 16, bandwidth: 288 },
  { id: "rtx-3090", label: "RTX 3090 24 GB", memGB: 24, bandwidth: 936 },
  { id: "rtx-4090", label: "RTX 4090 24 GB", memGB: 24, bandwidth: 1008 },
  { id: "rtx-5090", label: "RTX 5090 32 GB", memGB: 32, bandwidth: 1792 },
  { id: "rtx-a6000", label: "RTX A6000 48 GB", memGB: 48, bandwidth: 768 },
  { id: "a100-80", label: "A100 80 GB", memGB: 80, bandwidth: 1935 },
  { id: "h100-80", label: "H100 SXM 80 GB", memGB: 80, bandwidth: 3350 },
  { id: "m4-pro-48", label: "Mac, M4 Pro 48 GB", memGB: 48, bandwidth: 273, unified: true },
  { id: "m2-max-64", label: "Mac, M2 Max 64 GB", memGB: 64, bandwidth: 400, unified: true },
  { id: "m3-max-128", label: "Mac, M3 Max 128 GB", memGB: 128, bandwidth: 400, unified: true },
  { id: "m2-ultra-192", label: "Mac, M2 Ultra 192 GB", memGB: 192, bandwidth: 800, unified: true },
];

// Average bits per weight of llama.cpp GGUF quants, including scales.
export const QUANTS: Quant[] = [
  { id: "f16", label: "FP16", bpw: 16 },
  { id: "q8_0", label: "Q8_0", bpw: 8.5 },
  { id: "q6_k", label: "Q6_K", bpw: 6.56 },
  { id: "q5_k_m", label: "Q5_K_M", bpw: 5.69 },
  { id: "q4_k_m", label: "Q4_K_M", bpw: 4.89 },
  { id: "q3_k_m", label: "Q3_K_M", bpw: 3.91 },
  { id: "q2_k", label: "Q2_K", bpw: 2.96 },
];

export const CONTEXTS = [4096, 8192, 16384, 32768, 65536, 131072];
export const RAM_GB = [16, 32, 64, 128];

export const DEFAULTS = { model: "llama-3.1-8b", hardware: "rtx-3060-12", ram: 32, ctx: 8192, quant: "q4_k_m" };

// Share of a discrete card's memory the runtime can actually claim (driver, display).
const GPU_USABLE = 0.92;
// macOS lets the GPU wire about three quarters of unified memory by default.
const UNIFIED_USABLE = 0.75;
// Compute buffers and runtime overhead, in GB.
const OVERHEAD_GB = 0.75;
// System RAM left for the OS and everything else, in GB.
const OS_RESERVE_GB = 4;
// Dual-channel DDR5, peak GB/s.
const RAM_BANDWIDTH = 60;
// Share of peak bandwidth decode reaches in practice.
const EFFICIENCY = 0.65;

export type Input = { model: string; hardware: string; ram: number; ctx: number; quant: string };
export type Verdict = "fits" | "offload" | "no";
export type Estimate = {
  verdict: Verdict;
  weightsGB: number;
  kvGB: number;
  totalGB: number;
  gpuGB: number;
  gpuShare: number;
  tokPerSec: number | null;
  ctxOverMax: boolean;
};

const byId = <T extends { id: string }>(list: T[], id: string) => list.find(x => x.id === id) ?? list[0];

export function resolve(input: Input) {
  return { model: byId(MODELS, input.model), hw: byId(HARDWARE, input.hardware), quant: byId(QUANTS, input.quant) };
}

export function estimate(input: Input): Estimate {
  const { model, hw, quant } = resolve(input);
  const weightsGB = (model.params * quant.bpw) / 8;
  // K and V, per layer, per KV head, at FP16.
  const kvGB = (2 * model.layers * model.kvHeads * model.headDim * input.ctx * 2) / 1e9;
  const totalGB = weightsGB + kvGB + OVERHEAD_GB;
  const gpuGB = hw.memGB * (hw.unified ? UNIFIED_USABLE : GPU_USABLE);
  const ctxOverMax = input.ctx > model.maxCtx;

  let verdict: Verdict;
  let gpuShare: number;
  let kvOnGpu = true;
  if (totalGB <= gpuGB) {
    verdict = "fits";
    gpuShare = 1;
  } else if (hw.unified) {
    return { verdict: "no", weightsGB, kvGB, totalGB, gpuGB, gpuShare: 0, tokPerSec: null, ctxOverMax };
  } else {
    // Keep the KV cache and buffers on the card, then fill what is left with layers.
    const room = gpuGB - kvGB - OVERHEAD_GB;
    kvOnGpu = room > 0;
    gpuShare = kvOnGpu ? Math.min(1, room / weightsGB) : 0;
    const ramNeed = weightsGB * (1 - gpuShare) + (kvOnGpu ? 0 : kvGB + OVERHEAD_GB);
    if (ramNeed > input.ram - OS_RESERVE_GB) {
      return { verdict: "no", weightsGB, kvGB, totalGB, gpuGB, gpuShare, tokPerSec: null, ctxOverMax };
    }
    verdict = "offload";
  }

  // Each token reads the active weights once and, with the window full, the whole KV cache.
  const activeGB = (model.active * quant.bpw) / 8;
  const gpuRead = activeGB * gpuShare + (kvOnGpu ? kvGB : 0);
  const ramRead = activeGB * (1 - gpuShare) + (kvOnGpu ? 0 : kvGB);
  const seconds = gpuRead / (hw.bandwidth * EFFICIENCY) + ramRead / (RAM_BANDWIDTH * EFFICIENCY);
  return { verdict, weightsGB, kvGB, totalGB, gpuGB, gpuShare, tokPerSec: 1 / seconds, ctxOverMax };
}

/** The highest-precision quant that runs entirely on the GPU, if any. */
export function bestFullFit(input: Input): Quant | null {
  return QUANTS.find(q => estimate({ ...input, quant: q.id }).verdict === "fits") ?? null;
}

const gb = (n: number) => `${n < 10 ? n.toFixed(1) : Math.round(n)} GB`;
export const contextLabel = (n: number) => `${Math.round(n / 1024)}K`;

/** Display strings, shared by the prerendered page and the browser so both say the same thing. */
export function describe(input: Input) {
  const e = estimate(input);
  const { model, hw, quant } = resolve(input);
  const best = e.verdict === "fits" ? null : bestFullFit(input);
  const headline = {
    fits: "Yes. It fits on the GPU.",
    offload: "Yes, with offload to system RAM.",
    no: "No. It will not fit.",
  }[e.verdict];
  const speed = e.tokPerSec === null ? "None" : `~${e.tokPerSec < 10 ? e.tokPerSec.toFixed(1) : Math.round(e.tokPerSec)} tok/s`;
  const notes: string[] = [];
  if (e.verdict === "offload") notes.push(`${Math.round(e.gpuShare * 100)}% of the weights sit on the GPU. The rest run from system RAM, which is what slows decode down.`);
  if (e.verdict === "no") notes.push(hw.unified ? `It needs ${gb(e.totalGB)} and macOS lets the GPU use about ${gb(e.gpuGB)} of unified memory.` : `It needs ${gb(e.totalGB)} across GPU and system RAM, more than this machine has free.`);
  if (best) notes.push(`${best.label} runs fully on the GPU at this context.`);
  else if (e.verdict !== "fits") notes.push("No quant fits fully on the GPU at this context. Try a shorter context or a smaller model.");
  if (e.ctxOverMax) notes.push(`${model.label} supports up to ${contextLabel(model.maxCtx)} context.`);
  return {
    verdict: e.verdict,
    headline,
    memory: `${gb(e.totalGB)} needed, ${gb(e.gpuGB)} usable on ${hw.unified ? "unified memory" : "the GPU"}`,
    weights: `${gb(e.weightsGB)} at ${quant.label}`,
    kv: `${gb(e.kvGB)} at ${contextLabel(input.ctx)}`,
    onGpu: `${Math.round(e.gpuShare * 100)}%`,
    speed,
    notes,
  };
}
