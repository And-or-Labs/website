/* Testimonial portraits in the house dithered duotone, the same treatment as the
   blog heroes (scripts/lib/dither.ts). Run once per new face:
     node scripts/portraits.mts
   Originals stay in public/testimonials/; outputs are *-duo.png beside them.
   Baked at build time instead of a CSS filter so every browser shows the same
   cells and the page ships a two-colour PNG of a few KB. */
import fs from "node:fs";
import path from "node:path";
import { ditherToDuotoneWithStats, ditherPreset } from "./lib/dither.ts";

const DIR = "public/testimonials";
const FACES = ["trevor-thomas.jpg", "marty-kratky-katz.jpg", "goswijn-thijssen.jpg"];
const PORTRAIT = {
  ...ditherPreset.THUMB,
  width: 320, height: 320, pixel: 2,
  // Headshots fill the frame; trimming would eat hair and shoulders.
  trim: false,
  // Faces sit centre-top in most crops; centre measured fine on all three.
  crop: "centre" as const,
};

for (const f of FACES) {
  const src = path.join(DIR, f);
  const { png, stats } = await ditherToDuotoneWithStats(fs.readFileSync(src), PORTRAIT);
  const out = path.join(DIR, f.replace(/\.\w+$/, "-duo.png"));
  fs.writeFileSync(out, png);
  console.log(`${out}  ${png.length}B  shadow ${(stats.shadowPct * 100).toFixed(0)}%  flat ${(stats.flatCellPct * 100).toFixed(0)}%`);
}
