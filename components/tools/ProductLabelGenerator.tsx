"use client";

import { useEffect, useRef, useState } from "react";
import { generatableSymbologies } from "@/lib/barcode/registry";
import {
  buildProductLabelLayout,
  renderLabelSheetPdf,
  renderLayoutToCanvas,
  type ProductLabelData,
} from "@/lib/labels/render";
import type { LengthUnit } from "@/lib/labels/units";

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

const DEFAULT_DATA: ProductLabelData = {
  productName: "Sample Product",
  sku: "SKU-1001",
  price: "999",
  currency: "$",
  brand: "",
  variant: "",
  size: "",
  color: "",
  batchNumber: "",
  lotNumber: "",
  mfgDate: "",
  expiryDate: "",
  countryOfOrigin: "",
  website: "",
  contact: "",
  customText: "",
  codeType: "barcode",
  codeFormat: "CODE_128",
  codeValue: "8901234567890",
};

function Field({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-slate-700">{label}</span>
      <input
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2"
      />
    </label>
  );
}

export function ProductLabelGenerator() {
  const [data, setData] = useState<ProductLabelData>(DEFAULT_DATA);
  const [unit, setUnit] = useState<LengthUnit>("mm");
  const [width, setWidth] = useState(80);
  const [height, setHeight] = useState(50);
  const [copies, setCopies] = useState(12);
  const [pageSize, setPageSize] = useState<"A4" | "Letter">("A4");
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const set = (patch: Partial<ProductLabelData>) => setData((prev) => ({ ...prev, ...patch }));

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setError(null);
        const layout = await buildProductLabelLayout(data, width, height, unit);
        const canvas = await renderLayoutToCanvas(layout);
        if (cancelled) return;
        const target = canvasRef.current;
        if (!target) return;
        target.width = canvas.width;
        target.height = canvas.height;
        target.getContext("2d")?.drawImage(canvas, 0, 0);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Could not render label.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [data, width, height, unit]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight text-center">
        Product Label Generator
      </h1>
      <p className="mt-2 text-center text-slate-600">
        Design a printable product label with barcode/QR, price and branding.
      </p>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border bg-white p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Product name" value={data.productName} onChange={(v) => set({ productName: v })} />
            <Field label="Brand" value={data.brand} onChange={(v) => set({ brand: v })} />
            <Field label="SKU" value={data.sku} onChange={(v) => set({ sku: v })} />
            <div className="grid grid-cols-2 gap-2">
              <Field label="Currency" value={data.currency} onChange={(v) => set({ currency: v })} />
              <Field label="Price" value={data.price} onChange={(v) => set({ price: v })} />
            </div>
            <Field label="Variant" value={data.variant} onChange={(v) => set({ variant: v })} />
            <Field label="Size" value={data.size} onChange={(v) => set({ size: v })} />
            <Field label="Color" value={data.color} onChange={(v) => set({ color: v })} />
            <Field label="Country of origin" value={data.countryOfOrigin} onChange={(v) => set({ countryOfOrigin: v })} />
            <Field label="Batch number" value={data.batchNumber} onChange={(v) => set({ batchNumber: v })} />
            <Field label="Lot number" value={data.lotNumber} onChange={(v) => set({ lotNumber: v })} />
            <Field label="Manufacturing date" value={data.mfgDate} onChange={(v) => set({ mfgDate: v })} />
            <Field label="Expiry date" value={data.expiryDate} onChange={(v) => set({ expiryDate: v })} />
            <Field label="Website" value={data.website} onChange={(v) => set({ website: v })} />
            <Field label="Contact" value={data.contact} onChange={(v) => set({ contact: v })} />
          </div>
          <Field label="Custom text" value={data.customText} onChange={(v) => set({ customText: v })} />

          <div className="grid grid-cols-3 gap-4 pt-2">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Code type</span>
              <select
                value={data.codeType}
                onChange={(e) => set({ codeType: e.target.value as ProductLabelData["codeType"] })}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="barcode">Barcode</option>
                <option value="qr">QR Code</option>
                <option value="none">None</option>
              </select>
            </label>
            {data.codeType === "barcode" && (
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">Symbology</span>
                <select
                  value={data.codeFormat}
                  onChange={(e) => set({ codeFormat: e.target.value })}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                >
                  {generatableSymbologies().map((s) => (
                    <option key={s.type} value={s.type}>
                      {s.label}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {data.codeType !== "none" && (
              <Field label="Code value" value={data.codeValue} onChange={(v) => set({ codeValue: v })} />
            )}
          </div>

          <div className="grid grid-cols-4 gap-4 pt-2 border-t">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Unit</span>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as LengthUnit)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="mm">mm</option>
                <option value="cm">cm</option>
                <option value="in">inch</option>
                <option value="pt">pt</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Width</span>
              <input
                type="number"
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Height</span>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Copies/page</span>
              <input
                type="number"
                min={1}
                value={copies}
                onChange={(e) => setCopies(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
          </div>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Sheet page size</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(e.target.value as "A4" | "Letter")}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="A4">A4</option>
              <option value="Letter">Letter</option>
            </select>
          </label>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        <div className="rounded-xl border bg-white p-5 flex flex-col items-center justify-center gap-4">
          <div className="flex max-h-[420px] items-center justify-center overflow-auto rounded border p-4">
            <canvas ref={canvasRef} style={{ maxWidth: "100%", height: "auto" }} />
          </div>
          <div className="flex gap-3">
            <button
              disabled={!!error}
              onClick={async () => {
                const layout = await buildProductLabelLayout(data, width, height, unit);
                const canvas = await renderLayoutToCanvas(layout);
                canvas.toBlob((b) => b && download(b, `${data.sku || "label"}.png`), "image/png");
              }}
              className="rounded-lg bg-brand-600 px-4 py-2 font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              Download PNG
            </button>
            <button
              disabled={!!error}
              onClick={async () => {
                const layout = await buildProductLabelLayout(data, width, height, unit);
                const bytes = await renderLabelSheetPdf(layout, copies, pageSize);
                download(new Blob([bytes], { type: "application/pdf" }), `${data.sku || "labels"}.pdf`);
              }}
              className="rounded-lg border px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Download PDF sheet
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
