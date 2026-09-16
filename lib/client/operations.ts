"use client";

import JSZip from "jszip";
import { PDFDocument } from "pdf-lib";
import type { OperationOptions } from "@/lib/types";
import { parseCsvWithHeaders } from "@/lib/barcode/csv";
import {
  renderBarcodeToCanvas,
  renderQrToCanvas,
  canvasToPngBlob,
  buildCodeSheetPdf,
  type CodeSheetItem,
} from "@/lib/barcode/render";
import { validateBarcodeValue, validateQrPayload } from "@/lib/barcode/registry";

export interface ClientResult {
  filename: string;
  mimeType: string;
  blob: Blob;
}

type PdfjsModule = typeof import("pdfjs-dist");
let pdfjsModule: PdfjsModule | null = null;

async function loadPdfjs(): Promise<PdfjsModule> {
  if (pdfjsModule) return pdfjsModule;
  const pdfjs = await import("pdfjs-dist");
  // Worker is copied to /public by scripts/copy-pdf-worker.mjs.
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  pdfjsModule = pdfjs;
  return pdfjs;
}

const SCALE_MAP: Record<string, number> = { low: 1, medium: 1.5, high: 2.5 };

async function renderPageToCanvas(
  pdfjs: PdfjsModule,
  data: Uint8Array,
  pageNumber: number,
  scale: number
): Promise<HTMLCanvasElement> {
  const pdf = await pdfjs.getDocument({ data }).promise;
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(viewport.width);
  canvas.height = Math.ceil(viewport.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not supported in this browser.");
  await page.render({ canvasContext: ctx, viewport }).promise;
  return canvas;
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Failed to export image."))),
      type,
      quality
    );
  });
}

// -------------------- PDF -> JPG --------------------

async function pdfToJpg(
  files: File[],
  options: OperationOptions
): Promise<ClientResult> {
  if (!files.length) throw new Error("Upload a PDF file.");
  const pdfjs = await loadPdfjs();
  const data = new Uint8Array(await files[0].arrayBuffer());
  const doc = await pdfjs.getDocument({ data: data.slice() }).promise;
  const scale = SCALE_MAP[String(options.quality ?? "medium")] ?? 1.5;

  const images: { name: string; blob: Blob }[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas is not supported in this browser.");
    await page.render({ canvasContext: ctx, viewport }).promise;
    images.push({
      name: `page_${String(i).padStart(2, "0")}.jpg`,
      blob: await canvasToBlob(canvas, "image/jpeg", 0.92),
    });
  }

  if (images.length === 1) {
    return { filename: "page_01.jpg", mimeType: "image/jpeg", blob: images[0].blob };
  }
  const zip = new JSZip();
  for (const img of images) zip.file(img.name, img.blob);
  const blob = await zip.generateAsync({ type: "blob" });
  return { filename: "images.zip", mimeType: "application/zip", blob };
}

// -------------------- Scan / Images -> PDF (client) --------------------

async function imagesToPdf(files: File[]): Promise<ClientResult> {
  if (!files.length) throw new Error("Add at least one image.");
  const out = await PDFDocument.create();
  for (const file of files) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const isPng =
      file.type.includes("png") || file.name.toLowerCase().endsWith(".png");
    const image = isPng ? await out.embedPng(bytes) : await out.embedJpg(bytes);
    const page = out.addPage([image.width, image.height]);
    page.drawImage(image, { x: 0, y: 0, width: image.width, height: image.height });
  }
  const bytes = await out.save();
  return {
    filename: "scanned.pdf",
    mimeType: "application/pdf",
    blob: new Blob([bytes], { type: "application/pdf" }),
  };
}

// -------------------- OCR PDF (client, tesseract.js) --------------------

async function ocrPdf(
  files: File[],
  options: OperationOptions
): Promise<ClientResult> {
  if (!files.length) throw new Error("Upload a PDF file.");
  const pdfjs = await loadPdfjs();
  const { createWorker } = await import("tesseract.js");
  const lang = String(options.language ?? "eng");

  const data = new Uint8Array(await files[0].arrayBuffer());
  const doc = await pdfjs.getDocument({ data: data.slice() }).promise;
  const worker = await createWorker(lang);

  const parts: string[] = [];
  try {
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i);
      const viewport = page.getViewport({ scale: 2 });
      const canvas = document.createElement("canvas");
      canvas.width = Math.ceil(viewport.width);
      canvas.height = Math.ceil(viewport.height);
      const ctx = canvas.getContext("2d");
      if (!ctx) throw new Error("Canvas is not supported in this browser.");
      await page.render({ canvasContext: ctx, viewport }).promise;
      const dataUrl = canvas.toDataURL("image/png");
      const { data: result } = await worker.recognize(dataUrl);
      parts.push(`## Page ${i}\n\n${result.text.trim()}`);
    }
  } finally {
    await worker.terminate();
  }

  const text = parts.join("\n\n");
  return {
    filename: "ocr.txt",
    mimeType: "text/plain",
    blob: new Blob([text], { type: "text/plain" }),
  };
}

// -------------------- Remove Image Background --------------------

async function removeBackground(files: File[]): Promise<ClientResult> {
  if (!files.length) throw new Error("Upload an image.");
  // Runs fully in-browser via WASM; the segmentation model is fetched from a
  // CDN on first use (same pattern as tesseract.js elsewhere in this app).
  const { removeBackground: runRemoveBackground } = await import(
    "@imgly/background-removal"
  );
  const blob = await runRemoveBackground(files[0]);
  const base = files[0].name.replace(/\.[^.]+$/, "");
  return { filename: `${base}-transparent.png`, mimeType: "image/png", blob };
}

// -------------------- Add Barcode / QR to PDF --------------------

function sanitizeFilename(value: string): string {
  return value.replace(/[^a-z0-9_\-]+/gi, "_").slice(0, 60) || "code";
}

async function addCodeToPdf(
  files: File[],
  options: OperationOptions,
  kind: "barcode" | "qr"
): Promise<ClientResult> {
  if (!files.length) throw new Error("Upload a PDF file.");
  const value = String(options.value ?? "").trim();
  if (!value) throw new Error(kind === "qr" ? "Enter a QR payload." : "Enter a barcode value.");

  const format = String(options.format ?? "CODE_128");
  const validation =
    kind === "qr" ? validateQrPayload(value) : validateBarcodeValue(format, value);
  if (!validation.valid) throw new Error(validation.message ?? "Invalid value.");

  const bytes = new Uint8Array(await files[0].arrayBuffer());
  const doc = await PDFDocument.load(bytes);
  const pageCount = doc.getPageCount();
  const pageNum = Math.min(pageCount, Math.max(1, Number(options.page ?? 1)));
  const page = doc.getPage(pageNum - 1);

  const width = Number(options.width ?? (kind === "qr" ? 120 : 220));
  const height = Number(options.height ?? (kind === "qr" ? 120 : 70));
  const x = Number(options.x ?? 36);
  const y = Number(options.y ?? 36); // top-left origin, per spec section 12 convention

  const canvas =
    kind === "qr"
      ? await renderQrToCanvas({ payload: validation.normalizedValue ?? value })
      : renderBarcodeToCanvas({
          format,
          value: validation.normalizedValue ?? value,
          showText: Boolean(options.showText ?? true),
        });
  const pngBlob = await canvasToPngBlob(canvas);
  const png = await doc.embedPng(new Uint8Array(await pngBlob.arrayBuffer()));

  const pageHeight = page.getHeight();
  page.drawImage(png, { x, y: pageHeight - y - height, width, height });

  const outBytes = await doc.save();
  return {
    filename: `${files[0].name.replace(/\.pdf$/i, "")}-${kind}.pdf`,
    mimeType: "application/pdf",
    blob: new Blob([outBytes], { type: "application/pdf" }),
  };
}

// -------------------- Batch Barcode / QR Generator --------------------

function pickColumn(rec: Record<string, string>, keys: string[]): string {
  for (const key of keys) {
    const found = Object.keys(rec).find((k) => k.toLowerCase() === key);
    if (found && rec[found]) return rec[found];
  }
  return Object.values(rec).find((v) => v)?.trim() ?? "";
}

async function batchGenerate(
  files: File[],
  options: OperationOptions,
  kind: "barcode" | "qr"
): Promise<ClientResult> {
  if (!files.length) throw new Error("Upload a CSV file.");
  const text = await files[0].text();
  const table = parseCsvWithHeaders(text);
  if (!table.rows.length) {
    throw new Error("The CSV file has no data rows.");
  }

  const defaultFormat = String(options.format ?? "CODE_128");
  const items: CodeSheetItem[] = [];
  const errors: { row: number; message: string }[] = [];

  table.rows.forEach((rec, idx) => {
    const rawValue = pickColumn(rec, ["value", "barcode", "payload", "data", "code"]);
    const caption = pickColumn(rec, ["caption", "name", "label", "sku"]) || rawValue;
    const format = kind === "barcode" ? pickColumn(rec, ["format"]) || defaultFormat : undefined;
    const validation =
      kind === "qr" ? validateQrPayload(rawValue) : validateBarcodeValue(format!, rawValue);
    if (!validation.valid) {
      errors.push({ row: idx + 2, message: validation.message ?? "Invalid value." });
      return;
    }
    items.push({ kind, value: validation.normalizedValue ?? rawValue, format, caption });
  });

  if (!items.length) {
    throw new Error("No valid rows found. Check column names (value/barcode/payload) and formats.");
  }

  const errorsCsv = errors.length
    ? "row,message\n" + errors.map((e) => `${e.row},"${e.message.replace(/"/g, '""')}"`).join("\n")
    : null;

  const output = String(options.output ?? "pdf");
  if (output === "zip") {
    const zip = new JSZip();
    for (const item of items) {
      const canvas =
        item.kind === "qr"
          ? await renderQrToCanvas({ payload: item.value })
          : renderBarcodeToCanvas({ format: item.format ?? defaultFormat, value: item.value });
      zip.file(`${sanitizeFilename(item.caption ?? item.value)}.png`, await canvasToPngBlob(canvas));
    }
    if (errorsCsv) zip.file("errors.csv", errorsCsv);
    const bytes = await zip.generateAsync({ type: "uint8array" });
    return {
      filename: `${kind}-batch.zip`,
      mimeType: "application/zip",
      blob: new Blob([bytes], { type: "application/zip" }),
    };
  }

  const pdfBytes = await buildCodeSheetPdf(items, {
    pageSize: String(options.pageSize ?? "A4") as "A4" | "Letter",
    columns: Number(options.columns ?? 3),
    rows: Number(options.rows ?? 6),
    title: kind === "qr" ? "QR Codes" : "Barcodes",
  });

  if (errorsCsv) {
    const zip = new JSZip();
    zip.file(`${kind}-sheet.pdf`, pdfBytes);
    zip.file("errors.csv", errorsCsv);
    const bytes = await zip.generateAsync({ type: "uint8array" });
    return {
      filename: `${kind}-batch.zip`,
      mimeType: "application/zip",
      blob: new Blob([bytes], { type: "application/zip" }),
    };
  }

  return {
    filename: `${kind}-sheet.pdf`,
    mimeType: "application/pdf",
    blob: new Blob([pdfBytes], { type: "application/pdf" }),
  };
}

const clientOperations: Record<
  string,
  (files: File[], options: OperationOptions) => Promise<ClientResult>
> = {
  "pdf-to-jpg": pdfToJpg,
  "jpg-to-pdf": imagesToPdf,
  ocr: ocrPdf,
  "remove-background": (files) => removeBackground(files),
  "add-barcode-to-pdf": (files, options) => addCodeToPdf(files, options, "barcode"),
  "add-qr-to-pdf": (files, options) => addCodeToPdf(files, options, "qr"),
  "batch-barcode-generate": (files, options) => batchGenerate(files, options, "barcode"),
  "batch-qr-generate": (files, options) => batchGenerate(files, options, "qr"),
  "barcode-to-pdf": (files, options) =>
    batchGenerate(files, { ...options, output: "pdf" }, "barcode"),
  "qr-to-pdf": (files, options) => batchGenerate(files, { ...options, output: "pdf" }, "qr"),
};

export function hasClientOperation(operation: string): boolean {
  return operation in clientOperations;
}

export async function runClient(
  operation: string,
  files: File[],
  options: OperationOptions
): Promise<ClientResult> {
  const handler = clientOperations[operation];
  if (!handler) throw new Error(`No client operation for "${operation}".`);
  return handler(files, options);
}
