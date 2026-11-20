import assert from "node:assert/strict";
import { test } from "node:test";

import { bestFullFit, describe, estimate, HARDWARE, MODELS, QUANTS } from "../src/lib/canrun.ts";

const input = over => ({ model: "llama-3.1-8b", hardware: "rtx-3060-12", ram: 32, ctx: 8192, quant: "q4_k_m", ...over });

test("a small model at Q4 fits on a 12 GB card with a plausible decode speed", () => {
  const e = estimate(input());
  assert.equal(e.verdict, "fits");
  assert.equal(e.gpuShare, 1);
  assert.ok(e.weightsGB > 4.5 && e.weightsGB < 5.5, `weights ${e.weightsGB}`);
  assert.ok(e.kvGB > 1 && e.kvGB < 1.2, `kv ${e.kvGB}`);
  assert.ok(e.tokPerSec > 20 && e.tokPerSec < 80, `tok/s ${e.tokPerSec}`);
});

test("a 70B model on a 24 GB card offloads to system RAM and slows down", () => {
  const e = estimate(input({ model: "llama-3.3-70b", hardware: "rtx-4090", ram: 64 }));
  assert.equal(e.verdict, "offload");
  assert.ok(e.gpuShare > 0 && e.gpuShare < 1);
  assert.ok(e.tokPerSec > 0.5 && e.tokPerSec < 5, `tok/s ${e.tokPerSec}`);
});

test("it will not run when GPU and free system RAM together are too small", () => {
  const e = estimate(input({ model: "llama-3.3-70b", hardware: "rtx-4090", ram: 16 }));
  assert.equal(e.verdict, "no");
  assert.equal(e.tokPerSec, null);
});

test("unified memory never offloads", () => {
  const e = estimate(input({ model: "llama-3.3-70b", hardware: "m4-pro-48", quant: "q8_0" }));
  assert.equal(e.verdict, "no");
  assert.equal(estimate(input({ model: "llama-3.3-70b", hardware: "m3-max-128", quant: "q8_0" })).verdict, "fits");
});

test("a longer context grows the KV cache linearly", () => {
  const short = estimate(input({ ctx: 4096 }));
  const long = estimate(input({ ctx: 32768 }));
  assert.ok(Math.abs(long.kvGB / short.kvGB - 8) < 1e-9);
});

test("mixture-of-experts decode reads only the active weights", () => {
  const moe = estimate(input({ model: "qwen-3-30b-a3b", hardware: "rtx-5090" }));
  const dense = estimate(input({ model: "qwen-2.5-32b", hardware: "rtx-5090" }));
  assert.equal(moe.verdict, "fits");
  assert.ok(moe.tokPerSec > dense.tokPerSec * 3);
});

test("the full-fit suggestion is the highest precision that fits", () => {
  const best = bestFullFit(input({ model: "mistral-small-3-24b", hardware: "rtx-4090", quant: "f16" }));
  assert.ok(best);
  assert.equal(estimate(input({ model: "mistral-small-3-24b", hardware: "rtx-4090", quant: best.id })).verdict, "fits");
  const higher = QUANTS.slice(0, QUANTS.indexOf(best));
  for (const q of higher) assert.notEqual(estimate(input({ model: "mistral-small-3-24b", hardware: "rtx-4090", quant: q.id })).verdict, "fits");
  assert.equal(bestFullFit(input({ model: "llama-3.1-405b" })), null);
});

test("unknown ids fall back to the first preset instead of throwing", () => {
  assert.doesNotThrow(() => estimate(input({ model: "nope", hardware: "nope", quant: "nope" })));
});

test("display copy follows the site's copy rules for every combination", () => {
  for (const m of MODELS) for (const h of HARDWARE) for (const q of QUANTS) {
    const d = describe(input({ model: m.id, hardware: h.id, quant: q.id, ctx: 131072 }));
    const text = [d.headline, d.memory, d.weights, d.kv, d.onGpu, d.speed, ...d.notes].join(" ");
    assert.ok(!/[—!]/.test(text), text);
    assert.ok(!/NaN|Infinity|undefined/.test(text), text);
  }
});
