"use client";

// Pro PDF Editor — client-side PDF loader.
//
// Renders each page to a raster preview (data URL) used as the editor canvas
// background and captures intrinsic page geometry. Also exposes a text search
// used by Find & Replace, and a selectable text layer (mirrors the pdfjs
// viewer / Sejda behaviour) so users can select and copy text from the page.
// Reuses the same pdfjs worker recipe as the rest of the app (worker copied
// to /public by scripts/copy-pdf-worker.mjs).

import type { EditorDocument, EditorPage, FontFamily } from "./types";

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

// Cache the opened pdfjs document per immutable `bytes` buffer so the text
// layer and find/replace can reuse it instead of re-parsing the PDF.
const pdfDocCache = new WeakMap<Uint8Array, Promise<import("pdfjs-dist").PDFDocumentProxy>>();
// Cache the rasterized preview canvas per page so find/replace can sample
// the real ink color of matched text without a second render pass.
const pageCanvasCache = new WeakMap<Uint8Array, HTMLCanvasElement[]>();

function getCachedPdfDocument(bytes: Uint8Array) {
  let cached = pdfDocCache.get(bytes);
  if (!cached) {
    cached = loadPdfjs().then((pdfjs) => pdfjs.getDocument({ data: bytes.slice() }).promise);
    pdfDocCache.set(bytes, cached);
  }
  return cached;
}

export async function loadEditorDocument(file: File): Promise<EditorDocument> {
  const pdfjs = await loadPdfjs();
  const bytes = new Uint8Array(await file.arrayBuffer());
  // pdfjs mutates the buffer it receives, so hand it a copy and keep `bytes`
  // pristine for export baking.
  const pdfPromise = pdfjs.getDocument({ data: bytes.slice() }).promise;
  pdfDocCache.set(bytes, pdfPromise);
  const pdf = await pdfPromise;

  const pages: EditorPage[] = [];
  const canvases: HTMLCanvasElement[] = [];
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
    canvases.push(canvas);
    pages.push({
      index: i,
      widthPts: base.width,
      heightPts: base.height,
      preview: canvas.toDataURL("image/jpeg", 0.85),
      rotation: (page.rotate ?? 0) % 360,
    });
  }
  pageCanvasCache.set(bytes, canvases);

  return {
    id: `doc_${++docCounter}`,
    fileName: file.name,
    bytes,
    pages,
  };
}

/**
 * Renders a native, invisible-but-selectable pdfjs text layer into
 * `container` for the given page, at viewport scale 1 (1 CSS px == 1 PDF
 * point, matching the object-overlay coordinate convention used elsewhere in
 * the editor). The caller is responsible for scaling the container to the
 * current zoom level via CSS transform. Returns a handle whose `cancel()`
 * should be called on unmount/page change.
 */
export async function renderPageTextLayer(
  bytes: Uint8Array,
  pageNumber: number,
  container: HTMLElement
): Promise<{ cancel: () => void }> {
  const pdfjs = await loadPdfjs();
  const pdf = await getCachedPdfDocument(bytes);
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale: 1 });
  container.replaceChildren();
  const textContentSource = page.streamTextContent();
  const layer = new pdfjs.TextLayer({ textContentSource, container, viewport });
  await layer.render();
  return { cancel: () => layer.cancel() };
}

function mapFontFamily(cssFamily: string | undefined): FontFamily {
  const f = (cssFamily || "").toLowerCase();
  if (/courier|mono|consolas/.test(f)) return "Courier";
  if (/times|serif|georgia|garamond|cambria|minion|palatino|book/.test(f)) return "Times";
  return "Helvetica";
}

/** Picks the darkest (most likely ink) pixel color inside a page-canvas rect. */
function sampleInkColor(canvas: HTMLCanvasElement | undefined, xPx: number, yPx: number, wPx: number, hPx: number): string {
  const fallback = "#111827";
  if (!canvas) return fallback;
  const ctx = canvas.getContext("2d");
  if (!ctx) return fallback;
  const rx = Math.max(0, Math.min(canvas.width - 1, Math.round(xPx)));
  const ry = Math.max(0, Math.min(canvas.height - 1, Math.round(yPx)));
  const rw = Math.max(1, Math.min(canvas.width - rx, Math.round(wPx)));
  const rh = Math.max(1, Math.min(canvas.height - ry, Math.round(hPx)));
  let data: Uint8ClampedArray;
  try {
    data = ctx.getImageData(rx, ry, rw, rh).data;
  } catch {
    return fallback;
  }
  let best = { r: 255, g: 255, b: 255, lum: 255 };
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const lum = 0.299 * r + 0.587 * g + 0.114 * b;
    if (lum < best.lum) best = { r, g, b, lum };
  }
  if (best.lum > 230) return fallback; // no real ink found, keep a sane default
  const hex = (n: number) => n.toString(16).padStart(2, "0");
  return `#${hex(best.r)}${hex(best.g)}${hex(best.b)}`;
}

export interface TextMatch {
  page: number;
  /** bounding box in PDF points, top-left origin. */
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  /** best-effort match of the source glyphs' look, for style-preserving replace. */
  fontFamily: FontFamily;
  fontSize: number;
  bold: boolean;
  italic: boolean;
  color: string;
}

interface RawTextItem {
  str?: string;
  transform?: number[];
  width?: number;
  height?: number;
  fontName?: string;
}

interface StyledRun {
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  fontFamily: FontFamily;
  bold: boolean;
  italic: boolean;
  color: string;
}

/** Converts one pdfjs text-content item into a styled, top-left-origin bbox. */
function styleItem(
  anyItem: RawTextItem,
  viewport: { height: number },
  styles: Record<string, { fontFamily?: string }>,
  canvas: HTMLCanvasElement | undefined,
  canvasScale: number
): StyledRun {
  const str = anyItem.str ?? "";
  const tr = anyItem.transform ?? [1, 0, 0, 1, 0, 0];
  const fontHeight = Math.abs(anyItem.height ?? tr[3] ?? 10) || 10;
  const width = anyItem.width ?? str.length * fontHeight * 0.5;
  // pdfjs transform origin is bottom-left; convert to top-left.
  const x = tr[4];
  const y = viewport.height - tr[5] - fontHeight;
  const styleInfo = anyItem.fontName ? styles[anyItem.fontName] : undefined;
  const rawFamily = (styleInfo?.fontFamily || "").toLowerCase();
  const color = sampleInkColor(
    canvas,
    x * canvasScale,
    (y + fontHeight * 0.15) * canvasScale,
    Math.max(width, 1) * canvasScale,
    fontHeight * 0.7 * canvasScale
  );
  return {
    x,
    y,
    width,
    height: fontHeight * 1.2,
    fontSize: fontHeight,
    fontFamily: mapFontFamily(rawFamily),
    bold: /bold|black|heavy/.test(rawFamily) || /bold|black|heavy/i.test(anyItem.fontName ?? ""),
    italic: /italic|oblique/.test(rawFamily) || /italic|oblique/i.test(anyItem.fontName ?? ""),
    color,
  };
}

/**
 * Find occurrences of `query` across the document, returning bounding boxes in
 * PDF points (top-left origin) plus the source run's font family, size and
 * ink color, so the editor can whiteout + replace them with matching style
 * instead of a hard-coded default look.
 */
export async function findTextMatches(
  bytes: Uint8Array,
  query: string
): Promise<TextMatch[]> {
  if (!query.trim()) return [];
  const pdf = await getCachedPdfDocument(bytes);
  const canvases = pageCanvasCache.get(bytes);
  const needle = query.toLowerCase();
  const matches: TextMatch[] = [];

  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const viewport = page.getViewport({ scale: 1 });
    const content = await page.getTextContent();
    const canvas = canvases?.[i - 1];
    const canvasScale = canvas ? canvas.width / viewport.width : PREVIEW_SCALE;
    for (const item of content.items) {
      const anyItem = item as RawTextItem;
      const str = anyItem.str ?? "";
      if (!str || !str.toLowerCase().includes(needle)) continue;
      const styled = styleItem(anyItem, viewport, content.styles, canvas, canvasScale);
      matches.push({ page: i, text: str, ...styled });
    }
  }
  return matches;
}

export interface TextRun {
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
  text: string;
  fontFamily: FontFamily;
  fontSize: number;
  bold: boolean;
  italic: boolean;
  color: string;
}

/**
 * Hit-tests the word under a click point (PDF points, top-left origin) so an
 * "edit text" click can turn the existing PDF word into an editable object
 * that keeps the source's font family, size and color. Falls back to the
 * whole text run if word-level splitting isn't possible.
 */
export async function findTextRunAtPoint(
  bytes: Uint8Array,
  pageNumber: number,
  xPts: number,
  yPts: number
): Promise<TextRun | null> {
  const pdf = await getCachedPdfDocument(bytes);
  const canvases = pageCanvasCache.get(bytes);
  const page = await pdf.getPage(pageNumber);
  const viewport = page.getViewport({ scale: 1 });
  const content = await page.getTextContent();
  const canvas = canvases?.[pageNumber - 1];
  const canvasScale = canvas ? canvas.width / viewport.width : PREVIEW_SCALE;

  for (const item of content.items) {
    const anyItem = item as RawTextItem;
    const str = anyItem.str ?? "";
    if (!str.trim()) continue;
    const styled = styleItem(anyItem, viewport, content.styles, canvas, canvasScale);
    const pad = styled.height * 0.15;
    if (
      xPts < styled.x - pad ||
      xPts > styled.x + styled.width + pad ||
      yPts < styled.y - pad ||
      yPts > styled.y + styled.height + pad
    ) {
      continue;
    }

    // Split the run into words, distributing width by character count
    // (proportional-width approximation — pdfjs doesn't expose per-glyph
    // metrics), and return whichever word contains the click x-position.
    const totalChars = str.length;
    let charOffset = 0;
    const words = str.split(/(\s+)/).filter(Boolean);
    for (const word of words) {
      const wStart = (charOffset / totalChars) * styled.width;
      const wWidth = (word.length / totalChars) * styled.width;
      charOffset += word.length;
      if (!word.trim()) continue;
      const wordX = styled.x + wStart;
      if (xPts >= wordX - pad && xPts <= wordX + wWidth + pad) {
        return {
          page: pageNumber,
          x: wordX,
          y: styled.y,
          width: wWidth,
          height: styled.height,
          text: word,
          fontFamily: styled.fontFamily,
          fontSize: styled.fontSize,
          bold: styled.bold,
          italic: styled.italic,
          color: styled.color,
        };
      }
    }
    // Point was inside the run's bbox but not a specific word (e.g. between
    // words) — return the whole run so the click still does something useful.
    return { page: pageNumber, text: str, ...styled };
  }
  return null;
}
