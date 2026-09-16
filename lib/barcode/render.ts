"use client";

import JsBarcode from "jsbarcode";
import QRCode from "qrcode";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { getSymbology } from "./registry";

export interface BarcodeRenderOptions {
  format: string;
  value: string;
  showText?: boolean;
  width?: number;
  height?: number;
}

export function renderBarcodeToCanvas(opts: BarcodeRenderOptions): HTMLCanvasElement {
  const def = getSymbology(opts.format);
  const canvas = document.createElement("canvas");
  JsBarcode(canvas, opts.value, {
    format: def?.jsBarcodeFormat ?? "CODE128",
    displayValue: opts.showText ?? true,
    width: 2,
    height: opts.height ?? 80,
    margin: 8,
  });
  return canvas;
}

export interface QrRenderOptions {
  payload: string;
  size?: number;
  margin?: number;
  errorCorrection?: "L" | "M" | "Q" | "H";
}

export async function renderQrToCanvas(opts: QrRenderOptions): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  await QRCode.toCanvas(canvas, opts.payload, {
    width: opts.size ?? 300,
    margin: opts.margin ?? 2,
    errorCorrectionLevel: opts.errorCorrection ?? "M",
  });
  return canvas;
}

export function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Failed to export image."))),
      "image/png"
    );
  });
}

export interface CodeSheetItem {
  kind: "barcode" | "qr";
  value: string;
  format?: string;
  caption?: string;
}

export interface CodeSheetLayout {
  pageSize?: "A4" | "Letter";
  columns?: number;
  rows?: number;
  title?: string;
}

const PAGE_SIZES: Record<string, [number, number]> = {
  A4: [595.28, 841.89],
  Letter: [612, 792],
};

// Renders a grid of barcodes/QR codes onto one or more PDF pages (spec
// sections 10/11 "Barcode/QR -> PDF" and the batch generator's PDF output).
export async function buildCodeSheetPdf(
  items: CodeSheetItem[],
  layout: CodeSheetLayout = {}
): Promise<Uint8Array> {
  const [pw, ph] = PAGE_SIZES[layout.pageSize ?? "A4"];
  const columns = Math.max(1, layout.columns ?? 3);
  const rows = Math.max(1, layout.rows ?? 6);
  const margin = 36;
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const titleFont = await doc.embedFont(StandardFonts.HelveticaBold);

  const titleHeight = layout.title ? 28 : 0;
  const usableW = pw - margin * 2;
  const usableH = ph - margin * 2 - titleHeight;
  const cellW = usableW / columns;
  const cellH = usableH / rows;
  const perPage = columns * rows;

  for (let p = 0; p < items.length; p += perPage) {
    const page = doc.addPage([pw, ph]);
    if (layout.title) {
      page.drawText(layout.title, {
        x: margin,
        y: ph - margin - 16,
        size: 16,
        font: titleFont,
        color: rgb(0.1, 0.1, 0.1),
      });
    }
    const chunk = items.slice(p, p + perPage);
    for (let i = 0; i < chunk.length; i++) {
      const item = chunk[i];
      const col = i % columns;
      const row = Math.floor(i / columns);
      const cellX = margin + col * cellW;
      const cellY = ph - margin - titleHeight - (row + 1) * cellH;

      const canvas =
        item.kind === "qr"
          ? await renderQrToCanvas({ payload: item.value, size: 300 })
          : renderBarcodeToCanvas({ format: item.format ?? "CODE_128", value: item.value, showText: false });
      const pngBlob = await canvasToPngBlob(canvas);
      const pngBytes = new Uint8Array(await pngBlob.arrayBuffer());
      const png = await doc.embedPng(pngBytes);

      const padding = 10;
      const captionH = 14;
      const imgMaxW = cellW - padding * 2;
      const imgMaxH = cellH - padding * 2 - captionH;
      const scale = Math.min(imgMaxW / png.width, imgMaxH / png.height, 1);
      const drawW = png.width * scale;
      const drawH = png.height * scale;

      page.drawImage(png, {
        x: cellX + (cellW - drawW) / 2,
        y: cellY + captionH + (imgMaxH - drawH) / 2 + padding / 2,
        width: drawW,
        height: drawH,
      });

      const caption = item.caption ?? item.value;
      const capSize = 8;
      const capWidth = font.widthOfTextAtSize(caption, capSize);
      page.drawText(caption.length > 40 ? caption.slice(0, 37) + "..." : caption, {
        x: cellX + Math.max(0, (cellW - capWidth) / 2),
        y: cellY + 4,
        size: capSize,
        font,
        color: rgb(0.3, 0.3, 0.3),
      });
    }
  }

  return doc.save();
}
