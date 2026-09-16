"use client";

import { useEffect, useMemo, useState } from "react";
import {
  decodeImageFile,
  drawToCanvas,
  canvasToBlob,
  extensionForFormat,
  type OutputFormat,
} from "@/lib/image/canvas";

const PRESETS: { label: string; width: number; height: number }[] = [
  { label: "Instagram post (1080×1080)", width: 1080, height: 1080 },
  { label: "Profile picture (512×512)", width: 512, height: 512 },
  { label: "Web banner (1600×900)", width: 1600, height: 900 },
  { label: "Passport photo (413×531)", width: 413, height: 531 },
  { label: "A4 @150dpi (1240×1754)", width: 1240, height: 1754 },
];

export function ImageResizer() {
  const [file, setFile] = useState<File | null>(null);
  const [original, setOriginal] = useState<{ width: number; height: number } | null>(null);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);
  const [lockAspect, setLockAspect] = useState(true);
  const [format, setFormat] = useState<OutputFormat>("jpeg");
  const [quality, setQuality] = useState(0.9);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const aspect = useMemo(() => (original ? original.width / original.height : 1), [original]);

  useEffect(() => {
    if (!file) return;
    let revoke: string | null = null;
    decodeImageFile(file)
      .then((decoded) => {
        setOriginal({ width: decoded.width, height: decoded.height });
        setWidth(decoded.width);
        setHeight(decoded.height);
        setError(null);
      })
      .catch(() => setError("Could not read this image."));
    return () => {
      if (revoke) URL.revokeObjectURL(revoke);
    };
  }, [file]);

  const onWidthChange = (w: number) => {
    setWidth(w);
    if (lockAspect) setHeight(Math.round(w / aspect));
  };
  const onHeightChange = (h: number) => {
    setHeight(h);
    if (lockAspect) setWidth(Math.round(h * aspect));
  };

  const applyPercentage = (pct: number) => {
    if (!original) return;
    setWidth(Math.round(original.width * (pct / 100)));
    setHeight(Math.round(original.height * (pct / 100)));
  };

  const resize = async () => {
    if (!file || !width || !height) return;
    setError(null);
    try {
      const decoded = await decodeImageFile(file);
      const canvas = drawToCanvas(decoded.bitmap, width, height);
      const blob = await canvasToBlob(canvas, format, quality);
      setPreviewUrl(URL.createObjectURL(blob));
    } catch {
      setError("Could not resize this image.");
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight text-center">Image Resize</h1>
      <p className="mt-2 text-center text-slate-600">Resize by dimensions, percentage or preset — processed in your browser.</p>

      <div className="mt-8 rounded-xl border bg-white p-5 space-y-5">
        <label className="rounded-lg bg-brand-600 px-4 py-2 font-semibold text-white hover:bg-brand-700 cursor-pointer inline-block">
          Choose image
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              setFile(e.target.files?.[0] ?? null);
              setPreviewUrl(null);
            }}
          />
        </label>

        {original && (
          <>
            <p className="text-sm text-slate-500">
              Original: {original.width} × {original.height}px
            </p>

            <div className="flex flex-wrap gap-2">
              {[25, 50, 75, 100].map((p) => (
                <button
                  key={p}
                  onClick={() => applyPercentage(p)}
                  className="rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-slate-50"
                >
                  {p}%
                </button>
              ))}
            </div>

            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Preset</span>
              <select
                onChange={(e) => {
                  const preset = PRESETS[Number(e.target.value)];
                  if (preset) {
                    setWidth(preset.width);
                    setHeight(preset.height);
                  }
                }}
                defaultValue=""
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="" disabled>
                  Custom
                </option>
                {PRESETS.map((p, i) => (
                  <option key={p.label} value={i}>
                    {p.label}
                  </option>
                ))}
              </select>
            </label>

            <div className="grid grid-cols-2 gap-4">
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">Width (px)</span>
                <input
                  type="number"
                  value={width}
                  onChange={(e) => onWidthChange(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">Height (px)</span>
                <input
                  type="number"
                  value={height}
                  onChange={(e) => onHeightChange(Number(e.target.value))}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>
            </div>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input type="checkbox" checked={lockAspect} onChange={(e) => setLockAspect(e.target.checked)} />
              Lock aspect ratio
            </label>

            <div className="grid grid-cols-2 gap-4">
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">Output format</span>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value as OutputFormat)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                >
                  <option value="jpeg">JPG</option>
                  <option value="png">PNG</option>
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

            <button
              onClick={resize}
              className="w-full rounded-lg bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700"
            >
              Resize
            </button>
          </>
        )}

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {previewUrl && (
          <div className="text-center space-y-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewUrl} alt="Resized preview" className="mx-auto max-h-80 rounded-lg border" />
            <a
              href={previewUrl}
              download={`resized.${extensionForFormat(format)}`}
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
