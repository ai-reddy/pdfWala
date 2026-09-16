"use client";

import { useState } from "react";
import JSZip from "jszip";
import {
  decodeImageFile,
  drawToCanvas,
  canvasToBlob,
  extensionForFormat,
  fileMayHaveTransparency,
  type OutputFormat,
} from "@/lib/image/canvas";

function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function ImageConverter() {
  const [files, setFiles] = useState<File[]>([]);
  const [format, setFormat] = useState<OutputFormat>("png");
  const [quality, setQuality] = useState(0.9);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const anyTransparent = files.some((f) => fileMayHaveTransparency(f)) && format === "jpeg";

  const convert = async () => {
    if (!files.length) return;
    setBusy(true);
    setError(null);
    try {
      const converted: { name: string; blob: Blob }[] = [];
      for (const file of files) {
        const decoded = await decodeImageFile(file);
        const canvas = drawToCanvas(decoded.bitmap, decoded.width, decoded.height);
        const blob = await canvasToBlob(canvas, format, quality);
        const base = file.name.replace(/\.[^.]+$/, "");
        converted.push({ name: `${base}.${extensionForFormat(format)}`, blob });
      }

      if (converted.length === 1) {
        download(converted[0].blob, converted[0].name);
      } else {
        const zip = new JSZip();
        for (const item of converted) zip.file(item.name, item.blob);
        const bytes = await zip.generateAsync({ type: "blob" });
        download(bytes, "converted-images.zip");
      }
    } catch {
      setError("Could not convert one or more images.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight text-center">JPG / PNG / WebP Converter</h1>
      <p className="mt-2 text-center text-slate-600">Batch convert images between formats — processed in your browser.</p>

      <div className="mt-8 rounded-xl border bg-white p-5 space-y-5">
        <label className="rounded-lg bg-brand-600 px-4 py-2 font-semibold text-white hover:bg-brand-700 cursor-pointer inline-block">
          Choose images
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
          />
        </label>

        {files.length > 0 && (
          <>
            <ul className="text-sm text-slate-600 list-disc pl-5">
              {files.map((f, i) => (
                <li key={i}>{f.name}</li>
              ))}
            </ul>

            <div className="grid grid-cols-2 gap-4">
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">Convert to</span>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as OutputFormat)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                >
                  <option value="png">PNG</option>
                  <option value="jpeg">JPG</option>
                  <option value="webp">WebP</option>
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">Quality</span>
                <input
                  type="range"
                  min={0.4}
                  max={1}
                  step={0.05}
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  disabled={format === "png"}
                  className="w-full"
                />
              </label>
            </div>

            {anyTransparent && (
              <p className="text-xs text-amber-600">
                Some images have transparency; converting to JPG will fill it with a solid background.
              </p>
            )}

            <button
              onClick={convert}
              disabled={busy}
              className="w-full rounded-lg bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {busy ? "Converting…" : "Convert & Download"}
            </button>
          </>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}
      </div>
    </div>
  );
}
