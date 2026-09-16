"use client";

import { useEffect, useRef, useState } from "react";
import { validateQrPayload } from "@/lib/barcode/registry";
import { renderQrToCanvas, canvasToPngBlob, buildCodeSheetPdf } from "@/lib/barcode/render";

type PayloadType = "text" | "url" | "email" | "phone" | "sms" | "wifi";

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

function buildPayload(type: PayloadType, fields: Record<string, string>): string {
  switch (type) {
    case "url":
      return fields.value || "https://";
    case "email":
      return `mailto:${fields.value}${fields.subject ? `?subject=${encodeURIComponent(fields.subject)}` : ""}`;
    case "phone":
      return `tel:${fields.value}`;
    case "sms":
      return `smsto:${fields.value}:${fields.message ?? ""}`;
    case "wifi":
      return `WIFI:T:${fields.security || "WPA"};S:${fields.ssid ?? ""};P:${fields.password ?? ""};;`;
    default:
      return fields.value ?? "";
  }
}

export function QrGenerator() {
  const [type, setType] = useState<PayloadType>("url");
  const [fields, setFields] = useState<Record<string, string>>({ value: "https://example.com" });
  const [size, setSize] = useState(300);
  const [errorCorrection, setErrorCorrection] = useState<"L" | "M" | "Q" | "H">("M");
  const [error, setError] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const payload = buildPayload(type, fields);

  useEffect(() => {
    const validation = validateQrPayload(payload);
    if (!validation.valid) {
      setError(validation.message ?? "Invalid payload.");
      return;
    }
    setError(null);
    renderQrToCanvas({ payload, size, errorCorrection })
      .then((canvas) => {
        const target = canvasRef.current;
        if (!target) return;
        target.width = canvas.width;
        target.height = canvas.height;
        target.getContext("2d")?.drawImage(canvas, 0, 0);
      })
      .catch((err) => setError(err instanceof Error ? err.message : "Could not render QR code."));
  }, [payload, size, errorCorrection]);

  const setField = (name: string, v: string) => setFields((prev) => ({ ...prev, [name]: v }));

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight text-center">QR Code Generator</h1>
      <p className="mt-2 text-center text-slate-600">
        Generate QR codes for URLs, text, email, phone, SMS and Wi-Fi.
      </p>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border bg-white p-5 space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Payload type</span>
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value as PayloadType);
                setFields({ value: "" });
              }}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              <option value="text">Plain text</option>
              <option value="url">URL</option>
              <option value="email">Email</option>
              <option value="phone">Phone</option>
              <option value="sms">SMS</option>
              <option value="wifi">Wi-Fi</option>
            </select>
          </label>

          {type === "wifi" ? (
            <>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">Network name (SSID)</span>
                <input
                  value={fields.ssid ?? ""}
                  onChange={(e) => setField("ssid", e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">Password</span>
                <input
                  value={fields.password ?? ""}
                  onChange={(e) => setField("password", e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">Security</span>
                <select
                  value={fields.security ?? "WPA"}
                  onChange={(e) => setField("security", e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                >
                  <option value="WPA">WPA/WPA2</option>
                  <option value="WEP">WEP</option>
                  <option value="nopass">None</option>
                </select>
              </label>
            </>
          ) : type === "sms" ? (
            <>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">Phone number</span>
                <input
                  value={fields.value ?? ""}
                  onChange={(e) => setField("value", e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">Message</span>
                <input
                  value={fields.message ?? ""}
                  onChange={(e) => setField("message", e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>
            </>
          ) : type === "email" ? (
            <>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">Email address</span>
                <input
                  value={fields.value ?? ""}
                  onChange={(e) => setField("value", e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">Subject (optional)</span>
                <input
                  value={fields.subject ?? ""}
                  onChange={(e) => setField("subject", e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>
            </>
          ) : (
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">
                {type === "url" ? "URL" : type === "phone" ? "Phone number" : "Text"}
              </span>
              <textarea
                value={fields.value ?? ""}
                onChange={(e) => setField("value", e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
          )}

          <div className="grid grid-cols-2 gap-4">
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Size (px)</span>
              <input
                type="number"
                value={size}
                min={100}
                max={1000}
                onChange={(e) => setSize(Number(e.target.value))}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block font-medium text-slate-700">Error correction</span>
              <select
                value={errorCorrection}
                onChange={(e) => setErrorCorrection(e.target.value as "L" | "M" | "Q" | "H")}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              >
                <option value="L">Low (7%)</option>
                <option value="M">Medium (15%)</option>
                <option value="Q">Quartile (25%)</option>
                <option value="H">High (30%)</option>
              </select>
            </label>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>

        <div className="rounded-xl border bg-white p-5 flex flex-col items-center justify-center gap-4">
          <canvas ref={canvasRef} className="max-w-full" />
          <div className="flex gap-3">
            <button
              disabled={!!error}
              onClick={async () => {
                const blob = await canvasToPngBlob(canvasRef.current!);
                download(blob, "qr-code.png");
              }}
              className="rounded-lg bg-brand-600 px-4 py-2 font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              Download PNG
            </button>
            <button
              disabled={!!error}
              onClick={async () => {
                const pdfBytes = await buildCodeSheetPdf([{ kind: "qr", value: payload }], {
                  columns: 1,
                  rows: 1,
                });
                download(new Blob([pdfBytes], { type: "application/pdf" }), "qr-code.pdf");
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
