const NS = "http://www.w3.org/2000/svg";
const snap = (v: number) => Math.round(v) + 0.5;

interface LRect {
  x: number;
  y: number;
  r: number;
  b: number;
}

export function mountSpecMarks(h1: HTMLElement): void {
  if (h1.dataset.specmarks === "1") return;
  const wrap = h1.parentElement;
  if (!wrap) return;
  h1.dataset.specmarks = "1";

  const svg = document.createElementNS(NS, "svg");
  svg.setAttribute("class", "specmarks");
  svg.setAttribute("aria-hidden", "true");
  wrap.appendChild(svg);

  const em = h1.querySelector("em");
  const emText = em?.firstChild;
  if (!em || !emText || emText.nodeType !== Node.TEXT_NODE) return;
  const emNode = emText as Text;

  let ampNode: Text | null = null;
  let ampIdx = -1;
  const walker = document.createTreeWalker(h1, NodeFilter.SHOW_TEXT);
  let node: Node | null;
  while ((node = walker.nextNode())) {
    const i = node.nodeValue?.indexOf("&") ?? -1;
    if (i >= 0) {
      ampNode = node as Text;
      ampIdx = i;
      break;
    }
  }

  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const probe = document.createElement("canvas").getContext("2d");
  let first = true;

  const rectOf = (n: Text, s: number, e: number, wr: DOMRect): LRect | null => {
    const range = document.createRange();
    range.setStart(n, s);
    range.setEnd(n, e);
    const r = range.getClientRects()[0];
    range.detach();
    return r ? { x: r.left - wr.left, y: r.top - wr.top, r: r.right - wr.left, b: r.bottom - wr.top } : null;
  };
  const boundaryX = (n: Text, i: number, wr: DOMRect): number | null => {
    const range = document.createRange();
    range.setStart(n, i);
    range.setEnd(n, i);
    const r = range.getClientRects()[0];
    range.detach();
    return r ? r.left - wr.left : null;
  };

  function draw() {
    if (!h1.isConnected) {
      ro.disconnect();
      return;
    }
    const wr = wrap!.getBoundingClientRect();
    if (wr.width < 40) return;
    svg.setAttribute("viewBox", `0 0 ${wr.width} ${wr.height}`);
    svg.replaceChildren();

    const cs = getComputedStyle(h1);
    const fs = parseFloat(cs.fontSize);
    if (probe) probe.font = `${cs.fontWeight} ${fs}px ${cs.fontFamily}`;
    const descent = probe?.measureText("Ag").fontBoundingBoxDescent ?? fs * 0.22;
    const clampX = (v: number) => Math.max(2, Math.min(wr.width - 2, v));
    const animate = first && !reduced;

    const marks: { el: SVGLineElement; delay: number }[] = [];
    const labels: { el: SVGTextElement; delay: number }[] = [];
    let order = 0;

    const line = (x1: number, y1: number, x2: number, y2: number, dashed = false) => {
      const el = document.createElementNS(NS, "line");
      el.setAttribute("x1", String(snap(x1)));
      el.setAttribute("y1", String(snap(y1)));
      el.setAttribute("x2", String(snap(x2)));
      el.setAttribute("y2", String(snap(y2)));
      if (dashed) el.setAttribute("data-dash", "3 3");
      svg.appendChild(el);
      marks.push({ el, delay: order++ });
    };
    const label = (x: number, y: number, txt: string, anchor: "start" | "middle" | "end" = "middle") => {
      const el = document.createElementNS(NS, "text");
      el.setAttribute("x", String(Math.round(x)));
      el.setAttribute("y", String(Math.round(y)));
      el.setAttribute("text-anchor", anchor);
      el.textContent = txt;
      svg.appendChild(el);
      labels.push({ el, delay: order++ });
    };

    // (a) width dimension above "engineer" (em text, offsets 0-8)
    const en = rectOf(emNode, 0, 8, wr);
    if (en) {
      const y = en.y - 8;
      const x1 = clampX(en.x);
      const x2 = clampX(en.r);
      line(x1, y, x2, y);
      line(x1, y - 3, x1, y + 3);
      line(x2, y - 3, x2, y + 3);
      label((x1 + x2) / 2, y - 5, `W ${Math.round(en.r - en.x)}`);
    }

    // (b) kerning ticks in "growth" (em text, offsets 9-15; pairs g|r, o|w, t|h)
    const gr = rectOf(emNode, 9, 15, wr);
    if (gr && innerWidth > 860) {
      const ls = parseFloat(cs.letterSpacing);
      const perEm = Number.isFinite(ls) ? Math.round((ls / fs) * 1000) : 0;
      const txt = perEm > 0 ? `+${perEm}` : String(perEm);
      const baseline = gr.b - descent;
      const tickTop = baseline - fs * 0.5;
      for (const off of [10, 12, 14]) {
        const x = boundaryX(emNode, off, wr);
        if (x == null) continue;
        line(x, tickTop, x, baseline);
        label(x, baseline + 11, txt);
      }
    }

    // (c) baseline guide for the line containing "&"
    if (ampNode) {
      const a = rectOf(ampNode, ampIdx, ampIdx + 1, wr);
      if (a) {
        const all = document.createRange();
        all.selectNodeContents(h1);
        const lineRect = [...all.getClientRects()].find((r) => Math.abs(r.top - wr.top - a.y) < 2);
        all.detach();
        const y = a.b - descent;
        const x1 = lineRect ? lineRect.left - wr.left : a.x;
        const x2 = clampX((lineRect ? lineRect.right - wr.left : a.r) + 12);
        line(x1, y, x2, y, true);
        label(x2, y + 11, "baseline", "end");
      }
    }

    for (const { el, delay } of marks) {
      const len = Math.hypot(
        parseFloat(el.getAttribute("x2")!) - parseFloat(el.getAttribute("x1")!),
        parseFloat(el.getAttribute("y2")!) - parseFloat(el.getAttribute("y1")!),
      );
      el.setAttribute("stroke-dasharray", String(len));
      const pat = el.getAttribute("data-dash");
      if (animate) {
        el.setAttribute("stroke-dashoffset", String(len));
        el.style.transitionDelay = `${delay * 80}ms`;
        requestAnimationFrame(() => {
          el.classList.add("drawn");
          el.setAttribute("stroke-dashoffset", "0");
        });
        if (pat) setTimeout(() => el.setAttribute("stroke-dasharray", pat), 600 + delay * 80 + 60);
      } else if (pat) {
        el.setAttribute("stroke-dasharray", pat);
      }
    }
    for (const { el, delay } of labels) {
      if (animate) {
        el.setAttribute("opacity", "0");
        el.style.transitionDelay = `${480 + delay * 60}ms`;
        requestAnimationFrame(() => {
          el.classList.add("shown");
          el.setAttribute("opacity", "1");
        });
      }
    }
    first = false;
  }

  const ro = new ResizeObserver(draw);
  ro.observe(wrap);
  document.fonts.ready.then(() => {
    if (h1.isConnected) draw();
  });
  draw();
}
