import { PDFDocument, degrees, rgb, StandardFonts } from "pdf-lib";
import JSZip from "jszip";
import type { EngineInput, EngineResult, OperationHandler } from "../types";
import { parsePageList, parseRangeGroups } from "./pageRange";

const PDF_MIME = "application/pdf";
const ZIP_MIME = "application/zip";

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

export const operations: Partial<Record<string, OperationHandler>> = {
  merge,
  split,
  "remove-pages": removePages,
  "extract-pages": extractPages,
  organize,
  rotate,
  compress,
  "jpg-to-pdf": jpgToPdf,
  watermark,
  "page-numbers": pageNumbers,
};
