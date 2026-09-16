"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { PDFDocument } from "pdf-lib";

interface TextOverlay {
  id: string;
  text: string;
  xPct: number;
  yPct: number;
  size: number;
  color: string;
}

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

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read this image."));
    img.src = url;
  });
}

export function ImageEditor() {
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [rotation, setRotation] = useState<0 | 90 | 180 | 270>(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [grayscale, setGrayscale] = useState(0);
  const [blur, setBlur] = useState(0);
  const [cropTop, setCropTop] = useState(0);
  const [cropRight, setCropRight] = useState(0);
  const [cropBottom, setCropBottom] = useState(0);
  const [cropLeft, setCropLeft] = useState(0);
  const [overlays, setOverlays] = useState<TextOverlay[]>([]);
  const [jpgQuality, setJpgQuality] = useState(90);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const render = useCallback(() => {
    if (!image) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const swap = rotation === 90 || rotation === 270;
    const rotW = swap ? image.height : image.width;
    const rotH = swap ? image.width : image.height;

    const rotated = document.createElement("canvas");
    rotated.width = rotW;
    rotated.height = rotH;
    const rctx = rotated.getContext("2d")!;
    rctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%) grayscale(${grayscale}%) blur(${blur}px)`;
    rctx.save();
    rctx.translate(rotW / 2, rotH / 2);
    rctx.rotate((rotation * Math.PI) / 180);
    rctx.scale(flipH ? -1 : 1, flipV ? -1 : 1);
    rctx.drawImage(image, -image.width / 2, -image.height / 2);
    rctx.restore();

    const left = Math.floor((cropLeft / 100) * rotW);
    const right = Math.floor((cropRight / 100) * rotW);
    const top = Math.floor((cropTop / 100) * rotH);
    const bottom = Math.floor((cropBottom / 100) * rotH);
    const cropW = Math.max(1, rotW - left - right);
    const cropH = Math.max(1, rotH - top - bottom);

    canvas.width = cropW;
    canvas.height = cropH;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, cropW, cropH);
    ctx.drawImage(rotated, left, top, cropW, cropH, 0, 0, cropW, cropH);

    for (const o of overlays) {
      ctx.fillStyle = o.color;
      ctx.font = `${o.size}px Helvetica, Arial, sans-serif`;
      ctx.textBaseline = "top";
      ctx.fillText(o.text, (o.xPct / 100) * cropW, (o.yPct / 100) * cropH);
    }
  }, [
    image,
    rotation,
    flipH,
    flipV,
    brightness,
    contrast,
    saturation,
    grayscale,
    blur,
    cropTop,
    cropRight,
    cropBottom,
    cropLeft,
    overlays,
  ]);

  useEffect(() => {
    render();
  }, [render]);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setError(null);
    try {
      const img = await loadImageFromFile(file);
      setImage(img);
      setRotation(0);
      setFlipH(false);
      setFlipV(false);
      setBrightness(100);
      setContrast(100);
      setSaturation(100);
      setGrayscale(0);
      setBlur(0);
      setCropTop(0);
      setCropRight(0);
      setCropBottom(0);
      setCropLeft(0);
      setOverlays([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load this image.");
    }
  };

  const addText = () =>
    setOverlays((prev) => [
      ...prev,
      { id: crypto.randomUUID(), text: "Text", xPct: 10, yPct: 10, size: 32, color: "#111111" },
    ]);

  const updateOverlay = (id: string, patch: Partial<TextOverlay>) =>
    setOverlays((prev) => prev.map((o) => (o.id === id ? { ...o, ...patch } : o)));

  const removeOverlay = (id: string) => setOverlays((prev) => prev.filter((o) => o.id !== id));

  const exportImage = async (format: "png" | "jpg" | "pdf") => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (format === "pdf") {
      const doc = await PDFDocument.create();
      const png = await doc.embedPng(
        new Uint8Array(
          await (await new Promise<Blob>((res) => canvas.toBlob((b) => res(b!), "image/png"))).arrayBuffer()
        )
      );
      const page = doc.addPage([canvas.width, canvas.height]);
      page.drawImage(png, { x: 0, y: 0, width: canvas.width, height: canvas.height });
      const bytes = await doc.save();
      download(new Blob([bytes], { type: "application/pdf" }), "image.pdf");
      return;
    }
    canvas.toBlob(
      (b) => b && download(b, format === "png" ? "image.png" : "image.jpg"),
      format === "png" ? "image/png" : "image/jpeg",
      format === "jpg" ? jpgQuality / 100 : undefined
    );
  };

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight text-center">Image Editor</h1>
      <p className="mt-2 text-center text-slate-600">
        Crop, resize, rotate, flip, adjust and annotate images — right in your browser.
      </p>

      {!image ? (
        <div className="mt-8 rounded-xl border-2 border-dashed bg-white p-10 text-center">
          <p className="text-slate-600 mb-4">Select an image to start editing</p>
          <label className="rounded-lg bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700 cursor-pointer">
            Select image
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0])}
            />
          </label>
          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-6">
          <div className="space-y-5">
            <div className="rounded-xl border bg-white p-4 space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                Transform
              </h3>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setRotation((r) => ((r + 270) % 360) as 0 | 90 | 180 | 270)}
                  className="rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50"
                >
                  ⟲ Rotate left
                </button>
                <button
                  onClick={() => setRotation((r) => ((r + 90) % 360) as 0 | 90 | 180 | 270)}
                  className="rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50"
                >
                  ⟳ Rotate right
                </button>
                <button
                  onClick={() => setFlipH((v) => !v)}
                  className={`rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50 ${flipH ? "bg-brand-50 border-brand-400" : ""}`}
                >
                  ↔ Flip H
                </button>
                <button
                  onClick={() => setFlipV((v) => !v)}
                  className={`rounded-lg border px-3 py-1.5 text-sm hover:bg-slate-50 ${flipV ? "bg-brand-50 border-brand-400" : ""}`}
                >
                  ↕ Flip V
                </button>
              </div>
            </div>

            <div className="rounded-xl border bg-white p-4 space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                Crop (% from each edge)
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ["Top", cropTop, setCropTop],
                  ["Right", cropRight, setCropRight],
                  ["Bottom", cropBottom, setCropBottom],
                  ["Left", cropLeft, setCropLeft],
                ].map(([label, val, setter]) => (
                  <label key={label as string} className="block text-sm">
                    <span className="mb-1 block text-slate-700">{label as string}</span>
                    <input
                      type="number"
                      min={0}
                      max={49}
                      value={val as number}
                      onChange={(e) => (setter as (n: number) => void)(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-300 px-2 py-1.5"
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="rounded-xl border bg-white p-4 space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                Adjustments
              </h3>
              {[
                ["Brightness", brightness, setBrightness, 0, 200],
                ["Contrast", contrast, setContrast, 0, 200],
                ["Saturation", saturation, setSaturation, 0, 200],
                ["Grayscale", grayscale, setGrayscale, 0, 100],
                ["Blur (px)", blur, setBlur, 0, 10],
              ].map(([label, val, setter, min, max]) => (
                <label key={label as string} className="block text-sm">
                  <span className="mb-1 flex justify-between text-slate-700">
                    <span>{label as string}</span>
                    <span className="text-slate-400">{val as number}</span>
                  </span>
                  <input
                    type="range"
                    min={min as number}
                    max={max as number}
                    value={val as number}
                    onChange={(e) => (setter as (n: number) => void)(Number(e.target.value))}
                    className="w-full"
                  />
                </label>
              ))}
            </div>

            <div className="rounded-xl border bg-white p-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Text</h3>
                <button onClick={addText} className="text-sm font-medium text-brand-600 hover:underline">
                  + Add text
                </button>
              </div>
              {overlays.map((o) => (
                <div key={o.id} className="rounded-lg border p-2 space-y-2">
                  <input
                    value={o.text}
                    onChange={(e) => updateOverlay(o.id, { text: e.target.value })}
                    className="w-full rounded border border-slate-300 px-2 py-1 text-sm"
                  />
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <label>
                      X%
                      <input
                        type="number"
                        value={o.xPct}
                        onChange={(e) => updateOverlay(o.id, { xPct: Number(e.target.value) })}
                        className="w-full rounded border border-slate-300 px-1 py-0.5"
                      />
                    </label>
                    <label>
                      Y%
                      <input
                        type="number"
                        value={o.yPct}
                        onChange={(e) => updateOverlay(o.id, { yPct: Number(e.target.value) })}
                        className="w-full rounded border border-slate-300 px-1 py-0.5"
                      />
                    </label>
                    <label>
                      Size
                      <input
                        type="number"
                        value={o.size}
                        onChange={(e) => updateOverlay(o.id, { size: Number(e.target.value) })}
                        className="w-full rounded border border-slate-300 px-1 py-0.5"
                      />
                    </label>
                    <label>
                      Color
                      <input
                        type="color"
                        value={o.color}
                        onChange={(e) => updateOverlay(o.id, { color: e.target.value })}
                        className="h-7 w-full rounded border border-slate-300"
                      />
                    </label>
                  </div>
                  <button
                    onClick={() => removeOverlay(o.id)}
                    className="text-xs font-medium text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="rounded-xl border bg-white p-4 space-y-3">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Export</h3>
              <label className="block text-sm">
                <span className="mb-1 flex justify-between text-slate-700">
                  <span>JPG quality</span>
                  <span className="text-slate-400">{jpgQuality}%</span>
                </span>
                <input
                  type="range"
                  min={10}
                  max={100}
                  value={jpgQuality}
                  onChange={(e) => setJpgQuality(Number(e.target.value))}
                  className="w-full"
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => exportImage("png")}
                  className="rounded-lg bg-brand-600 px-3 py-2 text-sm font-semibold text-white hover:bg-brand-700"
                >
                  PNG
                </button>
                <button
                  onClick={() => exportImage("jpg")}
                  className="rounded-lg border px-3 py-2 text-sm font-semibold hover:bg-slate-50"
                >
                  JPG
                </button>
                <button
                  onClick={() => exportImage("pdf")}
                  className="rounded-lg border px-3 py-2 text-sm font-semibold hover:bg-slate-50"
                >
                  PDF
                </button>
              </div>
              <label className="block pt-2 text-sm font-medium text-brand-600 hover:underline cursor-pointer">
                Replace image
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => onFile(e.target.files?.[0])}
                />
              </label>
            </div>
          </div>

          <div className="rounded-xl border bg-white p-4 flex items-center justify-center overflow-auto">
            <canvas ref={canvasRef} style={{ maxWidth: "100%", height: "auto" }} />
          </div>
        </div>
      )}
    </div>
  );
}
