import { trackToolEvent } from "./analytics";
import { describe, HARDWARE, type Input } from "../lib/canrun";

// One `tool_result_shown` per settled build, not one per select change.
const SETTLE_MS = 1200;
let timer = 0;

const ramSelect = (form: HTMLFormElement) => {
  const el = form.elements.namedItem("ram");
  return el instanceof HTMLSelectElement ? el : null;
};

function read(form: HTMLFormElement): Input {
  const f = new FormData(form);
  return {
    model: String(f.get("model")),
    hardware: String(f.get("hardware")),
    // A disabled select is left out of FormData, so read its current value directly.
    ram: Number(ramSelect(form)?.value),
    ctx: Number(f.get("ctx")),
    quant: String(f.get("quant")),
  };
}

function render(result: HTMLElement, input: Input) {
  const d = describe(input);
  result.dataset.verdict = d.verdict;
  for (const k of ["headline", "memory", "weights", "kv", "onGpu", "speed"] as const) {
    const el = result.querySelector(`[data-k="${k}"]`);
    if (el) el.textContent = d[k];
  }
  const notes = result.querySelector('[data-k="notes"]');
  notes?.replaceChildren(...d.notes.map(n => Object.assign(document.createElement("li"), { textContent: n })));
  return d.verdict;
}

document.addEventListener("astro:page-load", () => {
  const form = document.querySelector<HTMLFormElement>("form[data-canrun]");
  const result = document.querySelector<HTMLElement>("[data-result]");
  if (!form || !result) return;
  const ram = ramSelect(form);
  const update = () => {
    const input = read(form);
    // Unified memory has no separate system RAM to offload into.
    if (ram) ram.disabled = !!HARDWARE.find(h => h.id === input.hardware)?.unified;
    return { input, verdict: render(result, input) };
  };
  form.addEventListener("submit", e => e.preventDefault());
  form.addEventListener("change", () => {
    const { input, verdict } = update();
    window.clearTimeout(timer);
    timer = window.setTimeout(() => {
      trackToolEvent("tool_result_shown", "can-it-run", {
        verdict,
        model: input.model,
        hardware: input.hardware,
        quant: input.quant,
        context: String(input.ctx),
        ram: String(input.ram),
      });
    }, SETTLE_MS);
  });
  // Restored form state (back/forward cache, autofill) can differ from the prerendered default.
  update();
});

document.addEventListener("astro:before-swap", () => window.clearTimeout(timer));
