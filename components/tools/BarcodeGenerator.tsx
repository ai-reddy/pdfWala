"use client";

import { useEffect, useRef, useState } from "react";
import {
  BARCODE_REGISTRY,
  generatableSymbologies,
  validateBarcodeValue,
} from "@/lib/barcode/registry";
import { renderBarcodeToCanvas, canvasToPngBlob, buildCodeSheetPdf } from "@/lib/barcode/render";

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

export function BarcodeGenerator() {
  const symbologies = generatableSymbologies();
  const [format, setFormat] = useState(symbologies[0]?.type ?? "CODE_128");
  const [value, setValue] = useState("012345678905");
  const [showText, setShowText] = useState(true);
  const [height, setHeight] = useState(80);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const validation = validateBarcodeValue(format, value);
    if (!validation.valid) {
      setError(validation.message ?? "Invalid value.");
      const ctx = canvasRef.current?.getContext("2d");
      if (ctx && canvasRef.current) {
        ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
      return;
    }
    setError(null);
    try {
      const canvas = renderBarcodeToCanvas({
        format,
        value: validation.normalizedValue ?? value,
        showText,
        height,
      });
      const target = canvasRef.current;
      if (!target) return;
      target.width = canvas.width;
      target.height = canvas.height;
      target.getContext("2d")?.drawImage(canvas, 0, 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not render barcode.");
    }
  }, [format, value, showText, height]);

  const def = BARCODE_REGISTRY.find((s) => s.type === format);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight text-center">
        Barcode Generator
      </h1>
      <p className="mt-2 text-center text-slate-600">
        Generate CODE128, EAN, UPC, ITF and Codabar barcodes.
      </p>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border bg-white p-5 space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Symbology</span>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              {symbologies.map((s) => (
                <option key={s.type} value={s.type}>
                  {s.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Value</span>
            <input
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder={def ? `${def.minLength}-${def.maxLength} characters` : ""}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Bar height (px)</span>
            <input
              type="number"
              value={height}
              min={40}
              max={200}
              onChange={(e) => setHeight(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input
              type="checkbox"
              checked={showText}
              onChange={(e) => setShowText(e.target.checked)}
              className="h-4 w-4 rounded border-slate-300"
            />
            Show human-readable text
          </label>
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        <div className="rounded-xl border bg-white p-5 flex flex-col items-center justify-center gap-4">
          <div className="flex min-h-[140px] items-center justify-center w-full overflow-x-auto">
            <canvas ref={canvasRef} />
          </div>
          <div className="flex gap-3">
            <button
              disabled={!!error}
              onClick={async () => {
                const blob = await canvasToPngBlob(canvasRef.current!);
                download(blob, `barcode-${value}.png`);
              }}
              className="rounded-lg bg-brand-600 px-4 py-2 font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              Download PNG
            </button>
            <button
              disabled={!!error}
              onClick={async () => {
                const validation = validateBarcodeValue(format, value);
                const pdfBytes = await buildCodeSheetPdf(
                  [{ kind: "barcode", value: validation.normalizedValue ?? value, format }],
                  { columns: 1, rows: 1 }
                );
                download(new Blob([pdfBytes], { type: "application/pdf" }), `barcode-${value}.pdf`);
              }}
              className="rounded-lg border px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Download PDF
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
