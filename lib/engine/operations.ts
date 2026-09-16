import { PDFDocument, degrees, rgb, StandardFonts, type PDFFont } from "pdf-lib";
import JSZip from "jszip";
import mammoth from "mammoth";
import { Document as DocxDocument, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import type { EngineInput, EngineResult, OperationHandler } from "../types";
import { parsePageList, parseRangeGroups } from "./pageRange";
import { extractTextByPage } from "./text";

const PDF_MIME = "application/pdf";
const ZIP_MIME = "application/zip";
const MD_MIME = "text/markdown";
const DOCX_MIME =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function requirePdf(inputs: EngineInput[], min = 1): void {
  if (inputs.length < min) {
    throw new Error(`This operation requires at least ${min} file(s).`);
  }
}

async function load(input: EngineInput): Promise<PDFDocument> {
  try {
    return await PDFDocument.load(input.bytes, { ignoreEncryption: false });
  } catch (err) {
    throw new Error(
      `Could not read "${input.name}". It may be corrupted or password-protected.`
    );
  }
}

// -------------------- Organize --------------------

const merge: OperationHandler = async (inputs) => {
  requirePdf(inputs, 2);
  const out = await PDFDocument.create();
  for (const input of inputs) {
    const doc = await load(input);
    const pages = await out.copyPages(doc, doc.getPageIndices());
    pages.forEach((p) => out.addPage(p));
  }
  const bytes = await out.save();
  return { filename: "merged.pdf", mimeType: PDF_MIME, bytes };
};

const split: OperationHandler = async (inputs, options) => {
  requirePdf(inputs);
  const doc = await load(inputs[0]);
  const pageCount = doc.getPageCount();
  const mode = String(options.mode ?? "ranges");

  let groups: number[][] = [];
  if (mode === "individual") {
    groups = doc.getPageIndices().map((i) => [i]);
  } else if (mode === "everyN") {
    const n = Math.max(1, Number(options.everyN ?? 1));
    for (let i = 0; i < pageCount; i += n) {
      groups.push(
        Array.from({ length: Math.min(n, pageCount - i) }, (_, k) => i + k)
      );
    }
  } else {
    groups = parseRangeGroups(String(options.ranges ?? ""), pageCount);
    if (!groups.length) {
      throw new Error("Provide at least one valid range, e.g. 1-3, 4-6.");
    }
  }

  if (groups.length === 1) {
    const out = await PDFDocument.create();
    const pages = await out.copyPages(doc, groups[0]);
    pages.forEach((p) => out.addPage(p));
    const bytes = await out.save();
    return { filename: "split.pdf", mimeType: PDF_MIME, bytes };
  }

  const zip = new JSZip();
  let idx = 1;
  for (const group of groups) {
    const out = await PDFDocument.create();
    const pages = await out.copyPages(doc, group);
    pages.forEach((p) => out.addPage(p));
    const bytes = await out.save();
    zip.file(`split_${String(idx).padStart(2, "0")}.pdf`, bytes);
    idx++;
  }
  const zipBytes = await zip.generateAsync({ type: "uint8array" });
  return { filename: "split.zip", mimeType: ZIP_MIME, bytes: zipBytes };
};

const removePages: OperationHandler = async (inputs, options) => {
  requirePdf(inputs);
  const doc = await load(inputs[0]);
  const pageCount = doc.getPageCount();
  const toRemove = new Set(
    parsePageList(String(options.pages ?? ""), pageCount)
  );
  if (!toRemove.size) throw new Error("Specify which pages to remove.");

  const keep = doc.getPageIndices().filter((i) => !toRemove.has(i));
  if (!keep.length) throw new Error("You cannot remove every page.");

  const out = await PDFDocument.create();
  const pages = await out.copyPages(doc, keep);
  pages.forEach((p) => out.addPage(p));
  const bytes = await out.save();
  return { filename: "removed-pages.pdf", mimeType: PDF_MIME, bytes };
};

const extractPages: OperationHandler = async (inputs, options) => {
  requirePdf(inputs);
  const doc = await load(inputs[0]);
  const pageCount = doc.getPageCount();
  const wanted = parsePageList(String(options.pages ?? ""), pageCount);
  if (!wanted.length) throw new Error("Specify which pages to extract.");

  const out = await PDFDocument.create();
  const pages = await out.copyPages(doc, wanted);
  pages.forEach((p) => out.addPage(p));
  const bytes = await out.save();
  return { filename: "extracted-pages.pdf", mimeType: PDF_MIME, bytes };
};

const organize: OperationHandler = async (inputs, options) => {
  requirePdf(inputs);
  const doc = await load(inputs[0]);
  const pageCount = doc.getPageCount();

  const orderRaw = String(options.order ?? "").trim();
  const order = orderRaw
    ? orderRaw
        .split(",")
        .map((s) => parseInt(s.trim(), 10))
        .filter((n) => n >= 1 && n <= pageCount)
        .map((n) => n - 1)
    : doc.getPageIndices();

  if (!order.length) throw new Error("Provide a valid page order, e.g. 3,1,2.");

  const out = await PDFDocument.create();
  const pages = await out.copyPages(doc, order);
  pages.forEach((p) => out.addPage(p));
  const bytes = await out.save();
  return { filename: "organized.pdf", mimeType: PDF_MIME, bytes };
};

const rotate: OperationHandler = async (inputs, options) => {
  requirePdf(inputs);
  const doc = await load(inputs[0]);
  const pageCount = doc.getPageCount();
  const angle = Number(options.angle ?? 90);
  const target = parsePageList(String(options.pages ?? ""), pageCount);
  const targetSet = target.length ? new Set(target) : null;

  doc.getPages().forEach((page, i) => {
    if (targetSet && !targetSet.has(i)) return;
    const current = page.getRotation().angle;
    page.setRotation(degrees((current + angle) % 360));
  });

  const bytes = await doc.save();
  return { filename: "rotated.pdf", mimeType: PDF_MIME, bytes };
};

// -------------------- Optimize --------------------

const compress: OperationHandler = async (inputs) => {
  requirePdf(inputs);
  const doc = await load(inputs[0]);
  // Structural optimization via object streams. Image recompression requires
  // Ghostscript and lands in a later phase; this is a safe, lossless baseline.
  const bytes = await doc.save({ useObjectStreams: true });
  return { filename: "compressed.pdf", mimeType: PDF_MIME, bytes };
};

// -------------------- Convert --------------------

const jpgToPdf: OperationHandler = async (inputs, options) => {
  requirePdf(inputs);
  const out = await PDFDocument.create();
  const margin = Number(options.margin ?? 0);
  const landscape = String(options.orientation ?? "portrait") === "landscape";

  for (const input of inputs) {
    const isPng =
      input.mimeType.includes("png") ||
      input.name.toLowerCase().endsWith(".png");
    const image = isPng
      ? await out.embedPng(input.bytes)
      : await out.embedJpg(input.bytes);

    let w = image.width + margin * 2;
    let h = image.height + margin * 2;
    if (landscape && w < h) [w, h] = [h, w];

    const page = out.addPage([w, h]);
    const drawW = landscape && image.width < image.height ? h - margin * 2 : image.width;
    const drawH = landscape && image.width < image.height ? w - margin * 2 : image.height;
    page.drawImage(image, {
      x: (page.getWidth() - drawW) / 2,
      y: (page.getHeight() - drawH) / 2,
      width: drawW,
      height: drawH,
    });
  }

  const bytes = await out.save();
  return { filename: "images.pdf", mimeType: PDF_MIME, bytes };
};

// -------------------- Convert (Word <-> PDF) --------------------

// A basic HTML block model: mammoth's output is simple/flat enough that a
// regex-based block splitter (rather than a full HTML/DOM parser) is enough
// for MVP text+heading fidelity. Bold/italic/inline styling and images inside
// the document body are intentionally not preserved yet.
interface DocBlock {
  kind: "h1" | "h2" | "h3" | "p" | "li";
  text: string;
}

function decodeHtmlEntities(input: string): string {
  return input
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

function stripTags(html: string): string {
  return decodeHtmlEntities(html.replace(/<[^>]+>/g, "")).trim();
}

function htmlToBlocks(html: string): DocBlock[] {
  const blocks: DocBlock[] = [];
  const blockRe =
    /<(h1|h2|h3|h4|h5|h6|p|li)[^>]*>([\s\S]*?)<\/\1>/gi;
  let match: RegExpExecArray | null;
  while ((match = blockRe.exec(html))) {
    const tag = match[1].toLowerCase();
    const text = stripTags(match[2]);
    if (!text) continue;
    const kind: DocBlock["kind"] =
      tag === "h1"
        ? "h1"
        : tag === "h2" || tag === "h3"
          ? "h2"
          : tag === "li"
            ? "li"
            : tag.startsWith("h")
              ? "h3"
              : "p";
    blocks.push({ kind, text });
  }
  if (!blocks.length) {
    const text = stripTags(html);
    if (text) blocks.push({ kind: "p", text });
  }
  return blocks;
}

function wrapLine(font: PDFFont, text: string, size: number, maxWidth: number): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    const candidate = current ? `${current} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) > maxWidth && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }
  if (current) lines.push(current);
  return lines;
}

const wordToPdf: OperationHandler = async (inputs) => {
  if (!inputs.length) throw new Error("Upload a DOC/DOCX file.");
  const input = inputs[0];
  const lower = input.name.toLowerCase();
  if (!lower.endsWith(".docx")) {
    throw new Error(
      "Only .docx files are supported. Save legacy .doc files as .docx and try again."
    );
  }

  let html: string;
  try {
    const result = await mammoth.convertToHtml({
      buffer: Buffer.from(input.bytes),
    });
    html = result.value;
  } catch {
    throw new Error(`Could not read "${input.name}". It may be corrupted.`);
  }

  const blocks = htmlToBlocks(html);
  if (!blocks.length) throw new Error("The document does not contain any readable text.");

  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 56;
  const maxWidth = pageWidth - margin * 2;

  let page = doc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  const ensureSpace = (needed: number) => {
    if (y - needed < margin) {
      page = doc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }
  };

  for (const block of blocks) {
    const size = block.kind === "h1" ? 20 : block.kind === "h2" ? 16 : block.kind === "h3" ? 13 : 11;
    const font = block.kind === "p" || block.kind === "li" ? regular : bold;
    const lineHeight = size * 1.4;
    const prefix = block.kind === "li" ? "\u2022 " : "";
    const lines = wrapLine(font, prefix + block.text, size, maxWidth);

    ensureSpace(lineHeight);
    if (block.kind !== "p" && block.kind !== "li") y -= lineHeight * 0.3;

    for (const line of lines) {
      ensureSpace(lineHeight);
      page.drawText(line, { x: margin, y, size, font, color: rgb(0.1, 0.1, 0.1) });
      y -= lineHeight;
    }
    if (block.kind !== "p" && block.kind !== "li") y -= lineHeight * 0.2;
  }

  const bytes = await doc.save();
  return {
    filename: input.name.replace(/\.docx$/i, "") + ".pdf",
    mimeType: PDF_MIME,
    bytes,
  };
};

const pdfToWord: OperationHandler = async (inputs) => {
  requirePdf(inputs);
  const pages = await extractTextByPage(inputs[0].bytes);

  const children: Paragraph[] = [];
  for (const page of pages) {
    if (!page.lines.length) continue;
    for (const line of page.lines) {
      const isHeading =
        line === line.toUpperCase() && /^[A-Z0-9][A-Z0-9 ,.&:'\-/]{2,59}$/.test(line);
      children.push(
        new Paragraph(
          isHeading
            ? { text: line, heading: HeadingLevel.HEADING_2 }
            : { children: [new TextRun(line)] }
        )
      );
    }
    children.push(new Paragraph({ children: [new TextRun("")] }));
  }
  if (!children.length) {
    throw new Error(
      "No extractable text was found. Scanned PDFs need OCR first."
    );
  }

  const docxDoc = new DocxDocument({ sections: [{ children }] });
  const buffer = await Packer.toBuffer(docxDoc);
  const bytes = new Uint8Array(buffer);
  return {
    filename: inputs[0].name.replace(/\.pdf$/i, "") + ".docx",
    mimeType: DOCX_MIME,
    bytes,
  };
};

// -------------------- Edit --------------------

const watermark: OperationHandler = async (inputs, options) => {
  requirePdf(inputs);
  const doc = await load(inputs[0]);
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  const text = String(options.text ?? "CONFIDENTIAL");
  const opacity = Math.min(1, Math.max(0.05, Number(options.opacity ?? 30) / 100));
  const fontSize = Number(options.fontSize ?? 48);
  const angle = Number(options.angle ?? 45);

  doc.getPages().forEach((page) => {
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(text, fontSize);
    page.drawText(text, {
      x: width / 2 - textWidth / 2,
      y: height / 2,
      size: fontSize,
      font,
      color: rgb(0.5, 0.5, 0.5),
      opacity,
      rotate: degrees(angle),
    });
  });

  const bytes = await doc.save();
  return { filename: "watermarked.pdf", mimeType: PDF_MIME, bytes };
};

const pageNumbers: OperationHandler = async (inputs, options) => {
  requirePdf(inputs);
  const doc = await load(inputs[0]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const position = String(options.position ?? "bottom-center");
  const startAt = Number(options.startAt ?? 1);
  const fontSize = Number(options.fontSize ?? 12);
  const pad = 24;

  doc.getPages().forEach((page, i) => {
    const { width, height } = page.getSize();
    const label = String(startAt + i);
    const textWidth = font.widthOfTextAtSize(label, fontSize);

    let x = width / 2 - textWidth / 2;
    let y = pad;
    if (position.includes("right")) x = width - pad - textWidth;
    if (position.includes("left")) x = pad;
    if (position.startsWith("top")) y = height - pad - fontSize;

    page.drawText(label, { x, y, size: fontSize, font, color: rgb(0, 0, 0) });
  });

  const bytes = await doc.save();
  return { filename: "numbered.pdf", mimeType: PDF_MIME, bytes };
};

// Build a single PDF (or a zip of PDFs) from ordered page-index groups.
async function buildFromGroups(
  doc: PDFDocument,
  groups: number[][],
  baseName: string
): Promise<EngineResult> {
  if (groups.length === 1) {
    const out = await PDFDocument.create();
    const pages = await out.copyPages(doc, groups[0]);
    pages.forEach((p) => out.addPage(p));
    const bytes = await out.save();
    return { filename: `${baseName}.pdf`, mimeType: PDF_MIME, bytes };
  }
  const zip = new JSZip();
  let idx = 1;
  for (const group of groups) {
    const out = await PDFDocument.create();
    const pages = await out.copyPages(doc, group);
    pages.forEach((p) => out.addPage(p));
    const bytes = await out.save();
    zip.file(`${baseName}_${String(idx).padStart(2, "0")}.pdf`, bytes);
    idx++;
  }
  const zipBytes = await zip.generateAsync({ type: "uint8array" });
  return { filename: `${baseName}.zip`, mimeType: ZIP_MIME, bytes: zipBytes };
}

// -------------------- Edit (crop) --------------------

const crop: OperationHandler = async (inputs, options) => {
  requirePdf(inputs);
  const doc = await load(inputs[0]);
  const margin = Math.max(0, Number(options.margin ?? 20));

  doc.getPages().forEach((page) => {
    const { x, y, width, height } = page.getMediaBox();
    const m = Math.min(margin, width / 2 - 1, height / 2 - 1);
    page.setCropBox(x + m, y + m, width - 2 * m, height - 2 * m);
  });

  const bytes = await doc.save();
  return { filename: "cropped.pdf", mimeType: PDF_MIME, bytes };
};

// -------------------- Optimize (repair) --------------------

const repair: OperationHandler = async (inputs) => {
  requirePdf(inputs);
  try {
    const doc = await PDFDocument.load(inputs[0].bytes, {
      ignoreEncryption: true,
      throwOnInvalidObject: false,
      updateMetadata: false,
    });
    const bytes = await doc.save();
    return { filename: "repaired.pdf", mimeType: PDF_MIME, bytes };
  } catch {
    throw new Error("This PDF is too damaged to recover automatically.");
  }
};

// -------------------- Security (unlock) --------------------

const unlock: OperationHandler = async (inputs) => {
  requirePdf(inputs);
  let doc: PDFDocument;
  try {
    doc = await PDFDocument.load(inputs[0].bytes, { ignoreEncryption: true });
  } catch {
    throw new Error(
      "This PDF needs its open password to unlock, which is not available here."
    );
  }
  // Re-saving without encryption produces an unrestricted copy.
  const bytes = await doc.save();
  return { filename: "unlocked.pdf", mimeType: PDF_MIME, bytes };
};

// -------------------- Convert (PDF -> Markdown) --------------------

const HEADING_RE = /^[A-Z0-9][A-Z0-9 ,.&:'\-/]{2,59}$/;

const pdfToMarkdown: OperationHandler = async (inputs) => {
  requirePdf(inputs);
  const pages = await extractTextByPage(inputs[0].bytes);
  const md: string[] = [];

  for (const page of pages) {
    md.push(`## Page ${page.page}`, "");
    for (const line of page.lines) {
      if (line === line.toUpperCase() && HEADING_RE.test(line)) {
        md.push(`### ${line}`, "");
      } else {
        md.push(line, "");
      }
    }
  }

  const bytes = new TextEncoder().encode(md.join("\n").trim() + "\n");
  return { filename: "document.md", mimeType: MD_MIME, bytes };
};

// -------------------- Organize (Smart Split) --------------------

const smartSplit: OperationHandler = async (inputs) => {
  requirePdf(inputs);
  const doc = await load(inputs[0]);
  const pages = await extractTextByPage(inputs[0].bytes);

  // A near-empty page is treated as a separator between logical documents.
  const isBlank = (i: number) =>
    (pages[i]?.text.replace(/\s/g, "").length ?? 0) < 3;

  const groups: number[][] = [];
  let current: number[] = [];
  for (let i = 0; i < doc.getPageCount(); i++) {
    if (isBlank(i)) {
      if (current.length) groups.push(current);
      current = [];
    } else {
      current.push(i);
    }
  }
  if (current.length) groups.push(current);

  // No blank separators found -> fall back to one document per page.
  if (groups.length <= 1) {
    const perPage = doc.getPageIndices().map((i) => [i]);
    return buildFromGroups(doc, perPage, "smart-split");
  }

  return buildFromGroups(doc, groups, "smart-split");
};

// -------------------- Security (Compare) --------------------

const compare: OperationHandler = async (inputs) => {
  requirePdf(inputs, 2);
  const left = await extractTextByPage(inputs[0].bytes);
  const right = await extractTextByPage(inputs[1].bytes);
  const maxPages = Math.max(left.length, right.length);

  const report: string[] = [
    "# PDF comparison report",
    "",
    `- Left: ${inputs[0].name} (${left.length} pages)`,
    `- Right: ${inputs[1].name} (${right.length} pages)`,
    "",
  ];

  let changes = 0;
  for (let i = 0; i < maxPages; i++) {
    const a = left[i];
    const b = right[i];
    if (!a) {
      report.push(`## Page ${i + 1}: only in right document`, "");
      changes++;
      continue;
    }
    if (!b) {
      report.push(`## Page ${i + 1}: only in left document`, "");
      changes++;
      continue;
    }
    const la = new Set(a.lines);
    const lb = new Set(b.lines);
    const removed = a.lines.filter((l) => !lb.has(l));
    const added = b.lines.filter((l) => !la.has(l));
    if (!removed.length && !added.length) continue;
    changes++;
    report.push(`## Page ${i + 1}`);
    removed.forEach((l) => report.push(`- ${l}`));
    added.forEach((l) => report.push(`+ ${l}`));
    report.push("");
  }

  if (!changes) report.push("No textual differences found.", "");

  const bytes = new TextEncoder().encode(report.join("\n").trim() + "\n");
  return { filename: "comparison.md", mimeType: MD_MIME, bytes };
};

export const operations: Partial<Record<string, OperationHandler>> = {
  merge,
  split,
  "remove-pages": removePages,
  "extract-pages": extractPages,
  organize,
  rotate,
  compress,
  repair,
  "jpg-to-pdf": jpgToPdf,
  "word-to-pdf": wordToPdf,
  "pdf-to-word": pdfToWord,
  "pdf-to-markdown": pdfToMarkdown,
  "smart-split": smartSplit,
  watermark,
  "page-numbers": pageNumbers,
  crop,
  unlock,
  compare,
};
