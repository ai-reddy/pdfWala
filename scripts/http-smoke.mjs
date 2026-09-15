// End-to-end HTTP smoke test against a running server (next start / next dev).
// Exercises every implemented operation through /api/process.
import { PDFDocument, StandardFonts } from "pdf-lib";

const BASE = process.env.BASE_URL || "http://localhost:3000";

const PNG_1x1_BASE64 =
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

async function multiPagePdf(texts) {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (const t of texts) {
    const page = doc.addPage([300, 300]);
    if (t) page.drawText(t, { x: 20, y: 250, size: 14, font });
  }
  return doc.save();
}

async function call(operation, files, options = {}) {
  const form = new FormData();
  form.append("operation", operation);
  form.append("options", JSON.stringify(options));
  for (const f of files) {
    form.append("files", new Blob([f.bytes], { type: f.type }), f.name);
  }
  const res = await fetch(`${BASE}/api/process`, { method: "POST", body: form });
  const buf = Buffer.from(await res.arrayBuffer());
  return {
    ok: res.ok,
    status: res.status,
    type: res.headers.get("content-type"),
    size: buf.length,
    body: res.ok ? null : buf.toString("utf8").slice(0, 200),
  };
}

async function main() {
  const pdfA = { name: "a.pdf", type: "application/pdf", bytes: await multiPagePdf(["INVOICE 001", "", "INVOICE 002", "Page four"]) };
  const pdfB = { name: "b.pdf", type: "application/pdf", bytes: await multiPagePdf(["INVOICE 001", "", "INVOICE 002 CHANGED", "Page four"]) };
  const png = { name: "img.png", type: "image/png", bytes: Buffer.from(PNG_1x1_BASE64, "base64") };

  const cases = [
    ["merge", [pdfA, pdfB], {}],
    ["split", [pdfA], { mode: "ranges", ranges: "1-2, 3-4" }],
    ["split", [pdfA], { mode: "individual" }],
    ["remove-pages", [pdfA], { pages: "2" }],
    ["extract-pages", [pdfA], { pages: "1,3" }],
    ["organize", [pdfA], { order: "4,3,2,1" }],
    ["rotate", [pdfA], { angle: "90", pages: "" }],
    ["compress", [pdfA], { level: "recommended" }],
    ["repair", [pdfA], {}],
    ["jpg-to-pdf", [png], { orientation: "portrait", margin: 0 }],
    ["pdf-to-markdown", [pdfA], {}],
    ["smart-split", [pdfA], {}],
    ["watermark", [pdfA], { text: "DRAFT", opacity: 30, fontSize: 40, angle: 45 }],
    ["page-numbers", [pdfA], { position: "bottom-center", startAt: 1, fontSize: 12 }],
    ["crop", [pdfA], { margin: 20 }],
    ["unlock", [pdfA], {}],
    ["compare", [pdfA, pdfB], {}],
  ];

  let pass = 0;
  let fail = 0;
  for (const [op, files, opts] of cases) {
    try {
      const r = await call(op, files, opts);
      const label = `${op}${opts.mode ? `:${opts.mode}` : ""}`;
      if (r.ok && r.size > 0) {
        pass++;
        console.log(`PASS  ${label.padEnd(22)} ${r.status} ${r.type} ${r.size}b`);
      } else {
        fail++;
        console.log(`FAIL  ${label.padEnd(22)} ${r.status} ${r.body ?? ""}`);
      }
    } catch (err) {
      fail++;
      console.log(`ERROR ${op}: ${err.message}`);
    }
  }

  console.log(`\n${pass} passed, ${fail} failed`);
  process.exit(fail ? 1 : 0);
}

main();
