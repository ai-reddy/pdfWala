"use client";

import JSZip from "jszip";
import { PDFDocument } from "pdf-lib";
import type { OperationOptions } from "@/lib/types";

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

const clientOperations: Record<
  string,
  (files: File[], options: OperationOptions) => Promise<ClientResult>
> = {
  "pdf-to-jpg": pdfToJpg,
  "jpg-to-pdf": imagesToPdf,
  ocr: ocrPdf,
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
