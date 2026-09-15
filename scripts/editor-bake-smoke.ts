// Node smoke test for the Pro PDF Editor export pipeline (lib/editor/export.ts).
// Bakes one of every object type into scripts/sample.pdf and asserts the output
// is a valid PDF with the expected form fields and link annotation. Run with:
//   npx tsx scripts/editor-bake-smoke.ts
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { PDFDocument, PDFName } from "pdf-lib";
import { bakeEditsToPdf } from "../lib/editor/export";
import type { EditorObject } from "../lib/editor/types";

const here = dirname(fileURLToPath(import.meta.url));
const PNG_1x1 =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

const objects: EditorObject[] = [
  { id: "t1", type: "text", page: 1, x: 40, y: 40, width: 200, height: 24, text: "APPROVED — café ✓", fontFamily: "Helvetica", fontSize: 16, bold: true, italic: false, color: "#0a7d1b", align: "left", opacity: 1 },
  { id: "i1", type: "image", page: 1, x: 60, y: 100, width: 80, height: 80, src: PNG_1x1, format: "png", opacity: 0.9 },
  { id: "s1", type: "signature", page: 1, x: 200, y: 120, width: 120, height: 40, src: PNG_1x1 },
  { id: "w1", type: "whiteout", page: 1, x: 40, y: 200, width: 120, height: 24 },
  { id: "r1", type: "shape-rect", page: 1, x: 60, y: 240, width: 100, height: 60, strokeColor: "#2563eb", fillColor: "#dbeafe", strokeWidth: 1.5, opacity: 1 },
  { id: "e1", type: "shape-ellipse", page: 1, x: 200, y: 240, width: 80, height: 50, strokeColor: "#dc2626", fillColor: null, strokeWidth: 2, opacity: 1 },
  { id: "h1", type: "highlight", page: 2, x: 40, y: 60, width: 160, height: 16, color: "#fde047" },
  { id: "st1", type: "strikethrough", page: 2, x: 40, y: 100, width: 160, height: 14, color: "#dc2626" },
  { id: "u1", type: "underline", page: 2, x: 40, y: 140, width: 160, height: 14, color: "#111827" },
  { id: "lu", type: "link", page: 1, x: 260, y: 40, width: 120, height: 18, url: "https://example.com", label: "Docs" },
  { id: "lp", type: "link", page: 2, x: 40, y: 180, width: 120, height: 18, targetPage: 3, label: "Go to page 3" },
  { id: "ft", type: "field-text", page: 2, x: 40, y: 220, width: 160, height: 24, name: "full_name", value: "Jane Doe", fontSize: 12 },
  { id: "cb", type: "field-checkbox", page: 2, x: 40, y: 260, width: 18, height: 18, name: "agree", checked: true },
];

async function main() {
  const src = new Uint8Array(readFileSync(join(here, "sample.pdf")));
  const { filename, bytes } = await bakeEditsToPdf(src, "sample.pdf", objects);
  writeFileSync(join(here, "_editor_bake.pdf"), bytes);

  // Re-open to validate structure.
  const out = await PDFDocument.load(bytes);
  const pages = out.getPages();
  const form = out.getForm();
  const fieldNames = form.getFields().map((f) => f.getName());
  const page1Annots = pages[0].node.Annots();
  const page1LinkCount = page1Annots
    ? page1Annots.asArray().filter((ref) => {
        const dict = out.context.lookup(ref);
        // @ts-expect-error runtime dict access
        return dict?.get(PDFName.of("Subtype"))?.toString() === "/Link";
      }).length
    : 0;

  const checks = {
    filename,
    outputStartsWithPDF: String.fromCharCode(...bytes.slice(0, 5)) === "%PDF-",
    pageCount: pages.length,
    fieldNames,
    hasTextField: fieldNames.includes("full_name"),
    hasCheckbox: fieldNames.includes("agree"),
    page1LinkAnnotations: page1LinkCount,
    sourceUnchanged: src.length === new Uint8Array(readFileSync(join(here, "sample.pdf"))).length,
  };
  console.log(JSON.stringify(checks, null, 2));

  const ok =
    checks.outputStartsWithPDF &&
    checks.pageCount === 3 &&
    checks.hasTextField &&
    checks.hasCheckbox &&
    checks.page1LinkAnnotations >= 1;
  console.log(ok ? "SMOKE_PASS" : "SMOKE_FAIL");
  if (!ok) process.exit(1);
}

main().catch((err) => {
  console.error("SMOKE_ERROR", err);
  process.exit(1);
});
