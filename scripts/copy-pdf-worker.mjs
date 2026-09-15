// Copies the pdfjs worker into public/ so the browser can load it as a static
// asset (avoids bundling the worker through webpack/SWC).
import { copyFileSync, mkdirSync, existsSync } from "node:fs";

const candidates = [
  "node_modules/pdfjs-dist/build/pdf.worker.min.mjs",
  "node_modules/pdfjs-dist/build/pdf.worker.mjs",
];
const dest = "public/pdf.worker.min.mjs";

const src = candidates.find((p) => existsSync(p));
if (!src) {
  console.error("pdfjs worker not found in node_modules; skipping copy.");
  process.exit(0);
}

if (!existsSync("public")) mkdirSync("public", { recursive: true });
copyFileSync(src, dest);
console.log(`Copied ${src} -> ${dest}`);
