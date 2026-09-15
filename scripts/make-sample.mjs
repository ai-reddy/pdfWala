// Writes a small multi-page sample PDF to disk for manual/browser testing.
import { PDFDocument, StandardFonts } from "pdf-lib";
import { writeFileSync } from "node:fs";

const doc = await PDFDocument.create();
const font = await doc.embedFont(StandardFonts.Helvetica);
for (const t of ["Sample Page One", "Sample Page Two", "Sample Page Three"]) {
  const page = doc.addPage([420, 300]);
  page.drawText(t, { x: 40, y: 220, size: 20, font });
  page.drawText("pdfWala browser test fixture", { x: 40, y: 190, size: 11, font });
}
const bytes = await doc.save();
writeFileSync("scripts/sample.pdf", bytes);
console.log("Wrote scripts/sample.pdf", bytes.length, "bytes");
