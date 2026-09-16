"use client";

import { useEffect, useRef, useState } from "react";
import {
  buildShippingLabelLayout,
  renderLabelSheetPdf,
  renderLayoutToCanvas,
  type ShippingAddress,
  type ShippingLabelData,
} from "@/lib/labels/render";

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

const EMPTY_ADDRESS: ShippingAddress = {
  name: "",
  company: "",
  address1: "",
  address2: "",
  city: "",
  state: "",
  postalCode: "",
  country: "",
  phone: "",
};

const DEFAULT_DATA: ShippingLabelData = {
  sender: EMPTY_ADDRESS,
  recipient: EMPTY_ADDRESS,
  weight: "",
  weightUnit: "kg",
  dimensions: "",
  orderNumber: "",
  trackingNumber: "TRACK1234567890",
  deliveryInstructions: "",
};

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-slate-700">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-slate-300 px-3 py-2"
      />
    </label>
  );
}

function AddressForm({
  title,
  value,
  onChange,
}: {
  title: string;
  value: ShippingAddress;
  onChange: (a: ShippingAddress) => void;
}) {
  const set = (patch: Partial<ShippingAddress>) => onChange({ ...value, ...patch });
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">{title}</h3>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Name" value={value.name} onChange={(v) => set({ name: v })} />
        <Field label="Company" value={value.company} onChange={(v) => set({ company: v })} />
        <Field label="Address line 1" value={value.address1} onChange={(v) => set({ address1: v })} />
        <Field label="Address line 2" value={value.address2} onChange={(v) => set({ address2: v })} />
        <Field label="City" value={value.city} onChange={(v) => set({ city: v })} />
        <Field label="State" value={value.state} onChange={(v) => set({ state: v })} />
        <Field label="Postal code" value={value.postalCode} onChange={(v) => set({ postalCode: v })} />
        <Field label="Country" value={value.country} onChange={(v) => set({ country: v })} />
        <Field label="Phone" value={value.phone} onChange={(v) => set({ phone: v })} />
      </div>
    </div>
  );
}

export function ShippingLabelGenerator() {
  const [data, setData] = useState<ShippingLabelData>(DEFAULT_DATA);
  const [width, setWidth] = useState(100);
  const [height, setHeight] = useState(150);
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setError(null);
        const layout = await buildShippingLabelLayout(data, width, height, "mm");
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
  }, [data, width, height]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight text-center">
        Shipping Label Generator
      </h1>
      <p className="mt-2 text-center text-slate-600">
        Printable shipping label with sender, recipient and tracking barcode. Not a
        carrier-valid label unless integrated with a real carrier.
      </p>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border bg-white p-5 space-y-6">
          <AddressForm
            title="From"
            value={data.sender}
            onChange={(a) => setData((prev) => ({ ...prev, sender: a }))}
          />
          <AddressForm
            title="To"
            value={data.recipient}
            onChange={(a) => setData((prev) => ({ ...prev, recipient: a }))}
          />
          <div className="grid grid-cols-2 gap-3 border-t pt-4">
            <Field label="Weight" value={data.weight} onChange={(v) => setData((p) => ({ ...p, weight: v }))} />
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Weight unit</span>
              <select
                value={data.weightUnit}
                onChange={(e) => setData((p) => ({ ...p, weightUnit: e.target.value }))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="kg">kg</option>
                <option value="lb">lb</option>
              </select>
            </label>
            <Field
              label="Dimensions (L x W x H)"
              value={data.dimensions}
              onChange={(v) => setData((p) => ({ ...p, dimensions: v }))}
            />
            <Field
              label="Order number"
              value={data.orderNumber}
              onChange={(v) => setData((p) => ({ ...p, orderNumber: v }))}
            />
            <Field
              label="Tracking number"
              value={data.trackingNumber}
              onChange={(v) => setData((p) => ({ ...p, trackingNumber: v }))}
            />
            <Field
              label="Delivery instructions"
              value={data.deliveryInstructions}
              onChange={(v) => setData((p) => ({ ...p, deliveryInstructions: v }))}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Width (mm)</span>
              <input
                type="number"
                value={width}
                onChange={(e) => setWidth(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Height (mm)</span>
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        <div className="rounded-xl border bg-white p-5 flex flex-col items-center justify-center gap-4">
          <div className="flex max-h-[500px] items-center justify-center overflow-auto rounded border p-4">
            <canvas ref={canvasRef} style={{ maxWidth: "100%", height: "auto" }} />
          </div>
          <div className="flex gap-3">
            <button
              disabled={!!error}
              onClick={async () => {
                const layout = await buildShippingLabelLayout(data, width, height, "mm");
                const canvas = await renderLayoutToCanvas(layout);
                canvas.toBlob((b) => b && download(b, "shipping-label.png"), "image/png");
              }}
              className="rounded-lg bg-brand-600 px-4 py-2 font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              Download PNG
            </button>
            <button
              disabled={!!error}
              onClick={async () => {
                const layout = await buildShippingLabelLayout(data, width, height, "mm");
                const bytes = await renderLabelSheetPdf(layout, 1, "A4");
                download(new Blob([bytes], { type: "application/pdf" }), "shipping-label.pdf");
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
