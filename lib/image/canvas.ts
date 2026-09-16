"use client";

// Shared canvas helpers for the single-purpose image utility tools (resize,
// compress, convert). The full Image Editor has its own inline canvas logic;
// these are intentionally lightweight/focused.
export interface DecodedImage {
  bitmap: ImageBitmap;
  width: number;
  height: number;
}

export async function decodeImageFile(file: File): Promise<DecodedImage> {
  const bitmap = await createImageBitmap(file);
  return { bitmap, width: bitmap.width, height: bitmap.height };
}

export function drawToCanvas(bitmap: ImageBitmap, width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not supported in this browser.");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas;
}

export type OutputFormat = "png" | "jpeg" | "webp";

const MIME_BY_FORMAT: Record<OutputFormat, string> = {
  png: "image/png",
  jpeg: "image/jpeg",
  webp: "image/webp",
};

export function canvasToBlob(canvas: HTMLCanvasElement, format: OutputFormat, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error("Failed to export image."))),
      MIME_BY_FORMAT[format],
      format === "png" ? undefined : quality
    );
  });
}

export function extensionForFormat(format: OutputFormat): string {
  return format === "jpeg" ? "jpg" : format;
}

// Detects a fully-transparent-capable source (PNG/WebP with alpha) so callers
// can warn before flattening onto JPG (spec section 19).
export function fileMayHaveTransparency(file: File): boolean {
  return file.type === "image/png" || file.type === "image/webp" || file.type === "image/gif";
}

// Iteratively reduce JPEG/WebP quality (and optionally downscale) until the
// output is at or below the target size, or the quality floor is reached.
export async function compressToTargetSize(
  canvas: HTMLCanvasElement,
  format: OutputFormat,
  targetBytes: number,
  minQuality = 0.35
): Promise<{ blob: Blob; quality: number }> {
  let quality = 0.92;
  let blob = await canvasToBlob(canvas, format, quality);
  while (blob.size > targetBytes && quality > minQuality) {
    quality -= 0.07;
    blob = await canvasToBlob(canvas, format, quality);
  }
  return { blob, quality };
}
