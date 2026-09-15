// Standalone smoke test: verifies pdfjs-dist text extraction works in Node
// (the risky dependency behind pdf-to-markdown, smart-split, compare).
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

if (typeof Promise.withResolvers !== "function") {
  Promise.withResolvers = function () {
    let resolve, reject;
    const promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}

async function makeSamplePdf() {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const p1 = doc.addPage([300, 300]);
  p1.drawText("INVOICE 001", { x: 20, y: 260, size: 18, font, color: rgb(0, 0, 0) });
  p1.drawText("Amount due 1200", { x: 20, y: 230, size: 12, font });
  doc.addPage([300, 300]); // intentionally blank -> smart-split separator
  const p3 = doc.addPage([300, 300]);
  p3.drawText("INVOICE 002", { x: 20, y: 260, size: 18, font });
  p3.drawText("Amount due 3400", { x: 20, y: 230, size: 12, font });
  return doc.save();
}

async function main() {
  const bytes = await makeSamplePdf();
  const { createRequire } = await import("module");
  const { pathToFileURL } = await import("url");
  const require = createRequire(import.meta.url);
  const workerPath = require.resolve("pdfjs-dist/legacy/build/pdf.worker.mjs");
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = pathToFileURL(workerPath).href;
  const task = pdfjs.getDocument({ data: bytes, isEvalSupported: false, useSystemFonts: true });
  const pdf = await task.promise;
  console.log("numPages =", pdf.numPages);
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map((it) => it.str).join(" ").replace(/\s+/g, " ").trim();
    console.log(`page ${i}: "${text}" (chars=${text.replace(/\s/g, "").length})`);
  }
  console.log("PDFJS_SMOKE_OK");
}

main().catch((err) => {
  console.error("PDFJS_SMOKE_FAIL", err);
  process.exit(1);
});
