"use client";

// Pro PDF Editor — client-side PDF loader.
//
// Renders each page to a raster preview (data URL) used as the editor canvas
// background and captures intrinsic page geometry. Also exposes a text search
// used by Find & Replace. Reuses the same pdfjs worker recipe as the rest of
// the app (worker copied to /public by scripts/copy-pdf-worker.mjs).

import type { EditorDocument, EditorPage } from "./types";

type PdfjsModule = typeof import("pdfjs-dist");
let pdfjsModule: PdfjsModule | null = null;

async function loadPdfjs(): Promise<PdfjsModule> {
  if (pdfjsModule) return pdfjsModule;
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  pdfjsModule = pdfjs;
  return pdfjs;
}

const PREVIEW_SCALE = 1.5;

let docCounter = 0;

export async function loadEditorDocument(file: File): Promise<EditorDocument> {
  const pdfjs = await loadPdfjs();
  const bytes = new Uint8Array(await file.arrayBuffer());
  // pdfjs mutates the buffer it receives, so hand it a copy and keep `bytes`
  // pristine for export baking.
  const pdf = await pdfjs.getDocument({ data: bytes.slice() }).promise;

  const pages: EditorPage[] = [];
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const base = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: PREVIEW_SCALE });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas is not supported in this browser.");
    await page.render({ canvasContext: ctx, viewport }).promise;
    pages.push({
      index: i,
      widthPts: base.width,
      heightPts: base.height,
      preview: canvas.toDataURL("image/jpeg", 0.85),
      rotation: (page.rotate ?? 0) % 360,
    });
  }

  return {
    id: `doc_${++docCounter}`,
    fileName: file.name,
    bytes,
    pages,
  };
}

export interface TextMatch {
  page: number;
  /** bounding box in PDF points, top-left origin. */
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
}

/**
 * Find occurrences of `query` across the document, returning bounding boxes in
 * PDF points (top-left origin) so the editor can whiteout + replace them.
 */
export async function findTextMatches(
  bytes: Uint8Array,
  query: string
): Promise<TextMatch[]> {
  if (!query.trim()) return [];
  const pdfjs = await loadPdfjs();
  const pdf = await pdfjs.getDocument({ data: bytes.slice() }).promise;
  const needle = query.toLowerCase();
  const matches: TextMatch[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();
    for (const item of content.items) {
      const anyItem = item as {
        str?: string;
        transform?: number[];
        width?: number;
        height?: number;
      };
      const str = anyItem.str ?? "";
      if (!str || !str.toLowerCase().includes(needle)) continue;
      const tr = anyItem.transform ?? [1, 0, 0, 1, 0, 0];
      const fontHeight = Math.abs(anyItem.height ?? tr[3] ?? 10) || 10;
      const width = anyItem.width ?? str.length * fontHeight * 0.5;
      // pdfjs transform origin is bottom-left; convert to top-left.
      const xPts = tr[4];
      const yTopPts = viewport.height - tr[5] - fontHeight;
      matches.push({
        page: i,
        x: xPts,
        y: yTopPts,
        width,
        height: fontHeight * 1.2,
        text: str,
      });
    }
  }
  return matches;
}
