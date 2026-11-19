// The mark, drawn like a terminal logo (after the Codex CLI glyph): "A/O" is
// rasterised to a one-pixel-per-cell mask once per resize, then re-rendered
// every frame from a character ramp so the letters breathe and shimmer.
// A is blue, / ink, O pink; a blurred copy of the mask glows faintly outside.

const RAMP = " .·:-=+*#%@";
const BLUE = "#1b4dff", INK = "#0b1533", PINK = "#dc6bad";

const hash = (x: number, y: number, s: number) => {
  let h = (x * 374761393 + y * 668265263 + s * 2246822519) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
};

export function mountAO(root: HTMLElement) {
  if (root.dataset.live) return;
  root.dataset.live = "1";
  const canvas = root.querySelector("canvas")!, ctx = canvas.getContext("2d")!;
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  let W = 0, H = 0, d = 1, cw = 0, ch = 0;
  let cols = 0, rows = 0, span1 = 0, span2 = 0;
  let cover: Float32Array | null = null, halo: Float32Array | null = null;

  const buildMask = () => {
    cols = Math.ceil(W / cw); rows = Math.ceil(H / ch);
    if (!cols || !rows) return;
    const m = document.createElement("canvas");
    m.width = cols; m.height = rows;
    const mc = m.getContext("2d", { willReadFrequently: true })!;
    // One mask pixel per cell; squash y so the glyph keeps its screen aspect.
    const spaceH = rows * ch / cw;
    mc.scale(1, cw / ch);
    // Span ~72% of the pane width, capped so the cap-height stays under ~70%
    // of the pane height (also fits the 220px mobile pane).
    let px = 0.7 * spaceH;
    mc.font = `700 ${px}px "Paper Mono", ui-monospace, monospace`;
    const w = mc.measureText("A/O").width;
    if (w > 0.72 * cols) px *= (0.72 * cols) / w;
    mc.font = `700 ${px}px "Paper Mono", ui-monospace, monospace`;
    mc.textAlign = "center"; mc.textBaseline = "middle";
    mc.fillStyle = "#fff";
    mc.fillText("A/O", cols / 2, spaceH / 2);
    mc.lineWidth = 0.9; mc.lineJoin = "round"; mc.strokeStyle = "#fff";
    mc.strokeText("A/O", cols / 2, spaceH / 2);
    const start = cols / 2 - mc.measureText("A/O").width / 2;
    span1 = start + mc.measureText("A").width;
    span2 = start + mc.measureText("A/").width;
    const a = mc.getImageData(0, 0, cols, rows).data;
    cover = new Float32Array(cols * rows);
    for (let i = 0; i < cover.length; i++) cover[i] = Math.min(1, a[i * 4 + 3] / 255 * 1.8);
    const hc = document.createElement("canvas");
    hc.width = cols; hc.height = rows;
    const hx = hc.getContext("2d", { willReadFrequently: true })!;
    hx.filter = "blur(1.5px)";
    hx.drawImage(m, 0, 0);
    const b = hx.getImageData(0, 0, cols, rows).data;
    halo = new Float32Array(cols * rows);
    for (let i = 0; i < halo.length; i++) halo[i] = b[i * 4 + 3] / 255;
  };

  const size = () => {
    d = Math.min(2, devicePixelRatio || 1);
    const r = root.getBoundingClientRect();
    if (!r.width || !r.height) return;
    W = canvas.width = Math.round(r.width * d); H = canvas.height = Math.round(r.height * d);
    ctx.font = `${9 * d}px "Paper Mono", ui-monospace, monospace`;
    cw = ctx.measureText("0").width; ch = 9 * d * 1.3;
    buildMask();
    draw(performance.now());
  };

  function draw(now: number) {
    if (!W || !cover || !halo) return;
    const t = reduce ? 0 : now / 1000;
    const cx = cols / 2, cy = rows / 2, q = Math.floor(t * 8);
    ctx.clearRect(0, 0, W, H);
    ctx.font = `${9 * d}px "Paper Mono", ui-monospace, monospace`;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    for (let r = 0; r < rows; r++) {
      const py = (r + 0.5) * ch;
      for (let c = 0; c < cols; c++) {
        const i = r * cols + c, cov = cover[i], gl = halo[i];
        if (cov < 0.02 && gl < 0.05) continue;
        // Breathing ripple radiating out from the glyph centre (screen-space
        // distance so it stays round), plus a per-cell flicker re-rolled ~8x/sec.
        const dist = Math.hypot((c - cx) * cw, (r - cy) * ch) / (8 * cw);
        const s = Math.sin((t / 2.6) * Math.PI * 2 - dist * 0.9);
        const fl = (hash(c, r, q) - 0.5) * 0.24;
        // In-glyph cells stay in the dense end of the ramp so the ripple reads
        // as density change, not dropout; the halo keeps the wider pulse.
        const v = Math.min(1, Math.max(0, cov * (0.72 + 0.28 * s + fl) + (1 - cov) * gl * 0.25 * (0.55 + 0.45 * s + fl)));
        const glyph = RAMP[Math.min(RAMP.length - 1, Math.floor(v * RAMP.length))];
        if (glyph === " ") continue;
        const x = c + 0.5;
        ctx.fillStyle = x < span1 ? BLUE : x < span2 ? INK : PINK;
        ctx.globalAlpha = 0.35 + 0.65 * v;
        ctx.fillText(glyph, (c + 0.5) * cw, py);
      }
    }
    ctx.globalAlpha = 1;
  }

  new ResizeObserver(size).observe(root);
  document.fonts.ready.then(() => document.fonts.load('700 24px "Paper Mono"')).then(size);
  if (reduce) return;
  let last = 0;
  const tick = (now: number) => {
    requestAnimationFrame(tick);
    if (now - last < 33 || document.hidden || !document.documentElement.hasAttribute("data-home")) return;
    last = now;
    draw(now);
  };
  requestAnimationFrame(tick);
}
