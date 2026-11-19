// Exhaust heat refraction over the home page pane.
// The engine figure (right pane iframe, transition:persist) posts
// { engine: { nozzle: [x, y], dir: [dx, dy], heat } } in iframe CSS px.
// Inside the iframe the plume runs from the nozzle to the left edge; here it
// continues across the menu text as refracted shimmer. The pane text is painted
// into an offscreen 2D canvas at devicePixelRatio, sampled by a WebGL quad, and
// displaced by a noise-driven plume mask; the DOM text is set transparent so
// selection, focus, screen readers and SEO keep working.

type EngineState = { nozzle: [number, number]; dir: [number, number]; heat: number };

const reduce = matchMedia("(prefers-reduced-motion: reduce)");
const wide = matchMedia("(min-width: 861px)"); // .viz sits beside .pane above 860px

let latest: EngineState = { nozzle: [0, 0], dir: [-1, 0], heat: 0 };
let live: Live | null = null;

const isHome = () => document.documentElement.hasAttribute("data-home");
const allowed = () =>
  isHome() && wide.matches && !reduce.matches && !document.hidden &&
  !new URLSearchParams(location.search).has("noheat") &&
  new URLSearchParams(location.search).get("heat") !== "off";
// ?heat0 keeps the canvas live but forces displacement to zero, so the only
// difference vs the DOM is the text raster itself (premult/AA proof).
const PARAMS = new URLSearchParams(location.search);
const FLAT = PARAMS.has("heat0");
// ?heat=debug tints the mask core so the plume geometry is inspectable.
const DBG = PARAMS.get("heat") === "debug";

const onMessage = (e: MessageEvent) => {
  if (e.origin !== location.origin) return;
  const iframe = document.querySelector<HTMLIFrameElement>(".ao iframe");
  if (!iframe || e.source !== iframe.contentWindow) return;
  const d = e.data?.engine;
  if (!d || !Array.isArray(d.nozzle) || !Array.isArray(d.dir) || typeof d.heat !== "number") return;
  const moved = Math.abs(d.nozzle[1] - latest.nozzle[1]) > 2 || Math.abs(d.dir[0] - latest.dir[0]) > 0.01;
  latest = { nozzle: [d.nozzle[0], d.nozzle[1]], dir: [d.dir[0], d.dir[1]], heat: Math.min(1, Math.max(0, d.heat)) };
  live?.setTarget(latest.heat);
  if (moved) live?.relayout();
};
window.addEventListener("message", onMessage);

const VERT = `attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}`;
const FRAG = `
precision mediump float;
uniform sampler2D uTex;
uniform vec2 uRes;
uniform vec2 uSrc;
uniform vec2 uDir;
uniform vec4 uMenu;
uniform float uTail;
uniform float uRise;
uniform float uDbg;
uniform float uHeat;
uniform float uT;
uniform float uDpr;
uniform float uFlat;

float hash(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float vnoise(vec2 p){
  vec2 i=floor(p),f=fract(p);
  f=f*f*(3.-2.*f);
  return mix(mix(hash(i),hash(i+vec2(1.,0.)),f.x),mix(hash(i+vec2(0.,1.)),hash(i+vec2(1.,1.)),f.x),f.y);
}
float fbm(vec2 p){return .65*vnoise(p)+.35*vnoise(p*2.13+7.3);}

void main(){
  vec2 p=vec2(gl_FragCoord.x,uRes.y-gl_FragCoord.y); // device px, y down
  float mx0=uMenu.x, myc=uMenu.y, mx1=uMenu.z, mh=uMenu.w;
  // centreline: from the source it blends down/left onto the menu's
  // vertical centre, holds it across the menu rows, then a weak tail
  // curls upward past the menu's left edge
  float cy=myc;
  float b=clamp((p.x-mx1)/max(uSrc.x-mx1,1.),0.,1.);
  cy+=(uSrc.y-myc)*b*b*(3.-2.*b);
  float tt=clamp((mx0-p.x)/max(uTail,1.),0.,1.);
  cy-=uRise*tt*tt;
  float r=abs(p.y-cy);
  float tail=1.-smoothstep(mx0-2.,mx0+2.,p.x);
  float w=(mh+max(0.,p.x-mx1)*.08)*(1.-.45*tail);
  float inX=1.-smoothstep(uSrc.x-2.,uSrc.x+4.,p.x);       // nothing right of source
  float outX=smoothstep(mx0-uTail,mx0-uTail+70.,p.x);     // tail fades at its end
  float mask=exp(-r*r/(w*w))*inX*outX;
  mask=pow(mask,1.15);
  // noise in CSS px: a dominant ~110 px octave with a weak ~30 px octave,
  // advected along the jet at ~55 px/s plus a buoyant upward drift
  vec2 qc=(p-uSrc)/uDpr;
  vec2 flow=qc-uDir*(uT*55.)+vec2(0.,uT*14.);
  vec2 n1=vec2(fbm(flow/110.),fbm(flow/110.+vec2(7.7,3.1)))-.5;
  vec2 n2=vec2(fbm(flow/32.+vec2(19.3,5.9)),fbm(flow/32.+vec2(4.1,23.7)))-.5;
  vec2 off=n1+.35*n2;
  // big displacement in the core; the tail bends only (<=40%)
  float amp=mix(2.5,9.,uHeat)*uDpr*(1.-.6*tail)*(1.-uFlat);
  vec2 dp=(off*1.6+vec2(0.,-.25))*amp*mask;
  vec4 tex=texture2D(uTex,(p+dp)/uRes);
  vec3 ink=vec3(.043,.082,.2);
  // premultiplied end to end: darken text toward ink at the same alpha
  float k=clamp((fbm(flow/140.+vec2(4.7,8.1))-.5)*2.,0.,1.)*mask*smoothstep(.02,.15,uHeat)*.9*(1.-uFlat);
  vec3 rgb=mix(tex.rgb,ink*tex.a,k);
  // schlieren: ink-dark streaks only, up to ~6% at TAKEOFF, gated on real
  // displacement, and clipped to the menu rect so nothing smudges the
  // logos, bylines or headline. Never lightens.
  float inMenu=smoothstep(mx0-5.,mx0+5.,p.x)*(1.-smoothstep(mx1-5.,mx1+5.,p.x))
    *smoothstep(myc-mh-5.,myc-mh+5.,p.y)*(1.-smoothstep(myc+mh-5.,myc+mh+5.,p.y));
  float disp=length(dp)/max(amp,.001);
  float sch=smoothstep(.02,.15,uHeat)*.06*mask*inMenu*smoothstep(.25,.6,disp)*(1.-uFlat);
  float a=tex.a+(1.-tex.a)*sch;
  rgb+=ink*(1.-tex.a)*sch;
  if(uDbg>.5){ float db=mask*.15; a=max(a,db); rgb+=vec3(1.,.15,.15)*db*(1.-tex.a); }
  gl_FragColor=vec4(rgb,a);
}`;

interface Live {
  setTarget(h: number): void;
  relayout(): void;
  destroy(): void;
}

function mount(): Live | null {
  const iframe = document.querySelector<HTMLIFrameElement>(".ao iframe");
  const pane = document.querySelector<HTMLElement>(".pane");
  const menu = document.querySelector<HTMLElement>(".menu");
  const display = document.querySelector<HTMLElement>(".display");
  if (!iframe || !pane || !menu || !display) return null;

  const canvas = document.createElement("canvas");
  canvas.setAttribute("aria-hidden", "true");
  canvas.style.cssText = "position:fixed;pointer-events:none;z-index:5";
  const gl = canvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false, depth: false, stencil: false }) as WebGLRenderingContext | null;
  if (!gl) return null; // nothing was mutated yet
  const compile = (type: number, src: string) => {
    const s = gl.createShader(type)!;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || "shader");
    return s;
  };
  let prog: WebGLProgram;
  try {
    prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FRAG));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) || "link");
  } catch { return null; }
  gl.useProgram(prog);
  const quad = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, quad);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aLoc = gl.getAttribLocation(prog, "a");
  gl.enableVertexAttribArray(aLoc);
  gl.vertexAttribPointer(aLoc, 2, gl.FLOAT, false, 0, 0);
  gl.enable(gl.BLEND);
  gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
  const U = (n: string) => gl.getUniformLocation(prog, n);
  const uTex = U("uTex"), uRes = U("uRes"), uSrc = U("uSrc"), uDir = U("uDir"), uMenu = U("uMenu"), uTail = U("uTail"), uRise = U("uRise"), uHeat = U("uHeat"), uT = U("uT"), uDpr = U("uDpr"), uFlat = U("uFlat"), uDbg = U("uDbg");

  const texCanvas = document.createElement("canvas");
  const tctx = texCanvas.getContext("2d")!;
  const texture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
  gl.uniform1i(uTex, 0);

  // plume geometry in page CSS px
  let bx = 0, by = 0, bw = 1, bh = 1, srcX = 0, srcY = 0, dpr = 1;
  let mx0 = 0, mx1 = 0, myc = 0, mh = 40, tailLen = 100, tailRise = 0;
  const targets: HTMLElement[] = [display, ...([...menu.querySelectorAll<HTMLElement>("a")])];

  const layout = () => {
    const ir = iframe.getBoundingClientRect();
    const mr = menu.getBoundingClientRect();
    const dr = display.getBoundingClientRect();
    srcX = ir.left;
    srcY = ir.top + latest.nozzle[1];
    mx0 = mr.left; mx1 = mr.right;
    myc = mr.top + mr.height / 2;
    mh = mr.height / 2 + 10; // core covers all four menu rows
    // past the menu's left edge a weak tail curls up to the headline
    tailLen = Math.max(60, mr.left - dr.left + 40);
    tailRise = Math.max(0, myc - (dr.top + dr.height * 0.55));
    bx = Math.min(mr.left - tailLen - 20, dr.left - 30);
    by = Math.min(dr.top, srcY) - 26;
    bw = srcX + 8 - bx;
    bh = Math.max(mr.bottom, srcY) + 34 - by;
    dpr = Math.min(2, devicePixelRatio || 1);
    canvas.width = Math.max(1, Math.round(bw * dpr));
    canvas.height = Math.max(1, Math.round(bh * dpr));
    canvas.style.left = `${bx}px`;
    canvas.style.top = `${by}px`;
    canvas.style.width = `${bw}px`;
    canvas.style.height = `${bh}px`;
    texCanvas.width = canvas.width;
    texCanvas.height = canvas.height;
    gl.viewport(0, 0, canvas.width, canvas.height);
    drawText();
    upload();
  };

  const drawText = () => {
    tctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    tctx.clearRect(0, 0, bw, bh);
    // .ht-run makes computed colours transparent; un-hide while we sample styles.
    // ht-flat kills colour transitions so getComputedStyle returns targets, not mid-fade values.
    pane.classList.remove("ht-run");
    pane.classList.add("ht-flat");
    try {
    for (const root of targets) {
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let node = walker.nextNode() as Text | null;
      while (node) {
        const text = node.data;
        const el = node.parentElement!;
        const cs = getComputedStyle(el);
        tctx.font = cs.font || `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
        if ("letterSpacing" in tctx && cs.letterSpacing !== "normal") (tctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = cs.letterSpacing;
        else if ("letterSpacing" in tctx) (tctx as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "0px";
        tctx.fillStyle = cs.color;
        let op = 1;
        for (let e: HTMLElement | null = el; e && e !== root.parentElement; e = e.parentElement) {
          const o = parseFloat(getComputedStyle(e).opacity);
          if (o < 1) op *= o;
        }
        tctx.globalAlpha = op;
        tctx.textBaseline = "alphabetic";
        for (const m of text.matchAll(/\S+/g)) {
          const range = document.createRange();
          range.setStart(node, m.index!);
          range.setEnd(node, m.index! + m[0].length);
          const metrics = tctx.measureText(m[0]);
          const asc = metrics.fontBoundingBoxAscent ?? parseFloat(cs.fontSize) * 0.8;
          const desc = metrics.fontBoundingBoxDescent ?? parseFloat(cs.fontSize) * 0.2;
          for (const r of range.getClientRects()) {
            if (r.right < bx || r.left > bx + bw || r.bottom < by || r.top > by + bh || !r.width || !r.height) continue;
            const baseline = r.top - by + (r.height + asc - desc) / 2;
            tctx.fillText(m[0], r.left - bx, baseline);
          }
          range.detach();
        }
        node = walker.nextNode() as Text | null;
      }
    }
    } finally {
      pane.classList.remove("ht-flat");
      pane.classList.add("ht-run");
    }
  };

  const upload = () => gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, texCanvas);

  let raf = 0, last = 0, clock = 0, heat = latest.heat, target = latest.heat, destroyed = false;
  const tick = (now: number) => {
    raf = 0;
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
    last = now; clock += dt;
    heat += (target - heat) * Math.min(1, dt * 3);
    if (Math.abs(target - heat) < 0.001) heat = target;
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform2f(uSrc, (srcX - bx) * dpr, (srcY - by) * dpr);
    gl.uniform2f(uDir, latest.dir[0], latest.dir[1]);
    gl.uniform4f(uMenu, (mx0 - bx) * dpr, (myc - by) * dpr, (mx1 - bx) * dpr, mh * dpr);
    gl.uniform1f(uTail, tailLen * dpr);
    gl.uniform1f(uRise, tailRise * dpr);
    gl.uniform1f(uHeat, heat);
    gl.uniform1f(uT, clock);
    gl.uniform1f(uDpr, dpr);
    gl.uniform1f(uFlat, FLAT ? 1 : 0);
    gl.uniform1f(uDbg, DBG ? 1 : 0);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    if (!destroyed && !document.hidden) raf = requestAnimationFrame(tick);
  };
  const start = () => { if (!raf && !destroyed && !document.hidden) { last = 0; raf = requestAnimationFrame(tick); } };

  let rerenderTimer = 0;
  const scheduleText = () => {
    clearTimeout(rerenderTimer);
    rerenderTimer = window.setTimeout(() => { drawText(); upload(); }, 60);
  };
  const mo = new MutationObserver(scheduleText); // hover toggles .on and recolours rows
  mo.observe(menu, { subtree: true, attributes: true, attributeFilter: ["class"] });
  const ro = new ResizeObserver(() => layout());
  ro.observe(pane);
  ro.observe(iframe);
  pane.addEventListener("scroll", scheduleText, { passive: true });
  document.fonts?.ready.then(() => {
    if (destroyed) return;
    layout();
    pane.classList.add("ht-run");
    document.body.appendChild(canvas);
    start();
  });

  return {
    setTarget(h) { target = h; start(); },
    relayout() { if (!destroyed) layout(); },
    destroy() {
      destroyed = true;
      if (raf) cancelAnimationFrame(raf);
      clearTimeout(rerenderTimer);
      mo.disconnect();
      ro.disconnect();
      pane.classList.remove("ht-run");
      pane.classList.remove("ht-flat");
      canvas.remove();
      const lose = gl.getExtension("WEBGL_lose_context");
      lose?.loseContext();
    },
  };
}

const evaluate = () => {
  if (allowed() && !live) live = mount();
  else if (!allowed() && live) { live.destroy(); live = null; }
};

const onVis = () => evaluate();

const onMedia = () => evaluate();

let wired = false;
export function initHeat() {
  evaluate();
  if (wired) return;
  wired = true;
  wide.addEventListener("change", onMedia);
  reduce.addEventListener("change", onMedia);
  document.addEventListener("visibilitychange", onVis);
}

export function destroyHeat() {
  if (!wired) return;
  wired = false;
  wide.removeEventListener("change", onMedia);
  reduce.removeEventListener("change", onMedia);
  document.removeEventListener("visibilitychange", onVis);
  live?.destroy();
  live = null;
}
