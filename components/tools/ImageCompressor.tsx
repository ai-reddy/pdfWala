"use client";

import { useState } from "react";
import {
  decodeImageFile,
  drawToCanvas,
  canvasToBlob,
  compressToTargetSize,
  extensionForFormat,
  fileMayHaveTransparency,
  type OutputFormat,
} from "@/lib/image/canvas";

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1024 / 1024).toFixed(2)} MB`;
}

export function ImageCompressor() {
  const [file, setFile] = useState<File | null>(null);
  const [format, setFormat] = useState<OutputFormat>("jpeg");
  const [quality, setQuality] = useState(0.8);
  const [targetKb, setTargetKb] = useState("");
  const [result, setResult] = useState<{ url: string; size: number; quality: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const warnTransparency = file ? fileMayHaveTransparency(file) && format === "jpeg" : false;

  const compress = async () => {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const decoded = await decodeImageFile(file);
      const canvas = drawToCanvas(decoded.bitmap, decoded.width, decoded.height);
      const targetBytes = targetKb.trim() ? Number(targetKb) * 1024 : null;

      if (targetBytes && targetBytes > 0) {
        const { blob, quality: usedQuality } = await compressToTargetSize(canvas, format, targetBytes);
        setResult({ url: URL.createObjectURL(blob), size: blob.size, quality: usedQuality });
      } else {
        const blob = await canvasToBlob(canvas, format, quality);
        setResult({ url: URL.createObjectURL(blob), size: blob.size, quality });
      }
    } catch {
      setError("Could not compress this image.");
    } finally {
      setBusy(false);
    }
  };

  const reduction = result && file ? ((file.size - result.size) / file.size) * 100 : null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight text-center">Image Compressor</h1>
      <p className="mt-2 text-center text-slate-600">Reduce file size by quality or target size — processed in your browser.</p>

      <div className="mt-8 rounded-xl border bg-white p-5 space-y-5">
        <label className="rounded-lg bg-brand-600 px-4 py-2 font-semibold text-white hover:bg-brand-700 cursor-pointer inline-block">
          Choose image
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              setResult(null);
            }}
          />
        </label>

        {file && (
          <>
            <p className="text-sm text-slate-500">Original size: {formatBytes(file.size)}</p>

            <div className="grid grid-cols-2 gap-4">
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">Output format</span>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as OutputFormat)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                >
                  <option value="jpeg">JPG</option>
                  <option value="webp">WebP</option>
                  <option value="png">PNG</option>
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">Target size (KB, optional)</span>
                <input
                  type="number"
                  value={targetKb}
                  onChange={(e) => setTargetKb(e.target.value)}
                  placeholder="e.g. 200"
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>
            </div>

            {!targetKb.trim() && (
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">Quality ({Math.round(quality * 100)}%)</span>
                <input
                  type="range"
                  min={0.3}
                  max={1}
                  step={0.05}
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  disabled={format === "png"}
                  className="w-full"
                />
              </label>
            )}

            {warnTransparency && (
              <p className="text-xs text-amber-600">
                This image has transparency; converting to JPG will fill it with a solid background.
              </p>
            )}

            <button
              onClick={compress}
              disabled={busy}
              className="w-full rounded-lg bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {busy ? "Compressing…" : "Compress"}
            </button>
          </>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {result && (
          <div className="text-center space-y-3">
            <p className="text-sm text-slate-600">
              New size: <span className="font-semibold">{formatBytes(result.size)}</span>
              {reduction !== null && reduction > 0 && (
                <span className="ml-1 text-green-600">({reduction.toFixed(0)}% smaller)</span>
              )}
            </p>
            <a
              href={result.url}
              download={`compressed.${extensionForFormat(format)}`}
              className="inline-block rounded-lg bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700"
            >
              Download
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
