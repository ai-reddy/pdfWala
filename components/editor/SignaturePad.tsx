"use client";

import { useEffect, useRef, useState } from "react";

interface Props {
  onCancel: () => void;
  onConfirm: (dataUrl: string) => void;
}

type Mode = "type" | "draw" | "upload";

const TYPE_FONTS = [
  { label: "Signature", css: "'Brush Script MT', cursive" },
  { label: "Formal", css: "'Segoe Script', cursive" },
  { label: "Classic", css: "Georgia, serif" },
];

/** Create a signature by typing, drawing, or uploading. Returns a PNG data URL. */
export function SignaturePad({ onCancel, onConfirm }: Props) {
  const [mode, setMode] = useState<Mode>("type");
  const [name, setName] = useState("");
  const [fontIndex, setFontIndex] = useState(0);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);
  const hasStrokes = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || mode !== "draw") return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#111827";
    hasStrokes.current = false;
  }, [mode]);

  function pointerPos(e: React.PointerEvent<HTMLCanvasElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) * (e.currentTarget.width / rect.width),
      y: (e.clientY - rect.top) * (e.currentTarget.height / rect.height),
    };
  }

  function startDraw(e: React.PointerEvent<HTMLCanvasElement>) {
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    drawing.current = true;
    hasStrokes.current = true;
    const { x, y } = pointerPos(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  }
  function moveDraw(e: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    const { x, y } = pointerPos(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  }
  function endDraw() {
    drawing.current = false;
  }

  function renderTypedToDataUrl(): string {
    const canvas = document.createElement("canvas");
    canvas.width = 600;
    canvas.height = 200;
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#111827";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `64px ${TYPE_FONTS[fontIndex].css}`;
    ctx.fillText(name || "Signature", canvas.width / 2, canvas.height / 2);
    return canvas.toDataURL("image/png");
  }

  function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => onConfirm(String(reader.result));
    reader.readAsDataURL(file);
  }

  function confirm() {
    if (mode === "type") {
      if (!name.trim()) return;
      onConfirm(renderTypedToDataUrl());
    } else if (mode === "draw") {
      if (!hasStrokes.current || !canvasRef.current) return;
      onConfirm(canvasRef.current.toDataURL("image/png"));
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-xl">
        <h3 className="text-lg font-semibold">Create your signature</h3>

        <div className="mt-4 flex gap-2 text-sm">
          {(["type", "draw", "upload"] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={`rounded-lg px-3 py-1.5 font-medium capitalize ${
                mode === m
                  ? "bg-brand-600 text-white"
                  : "bg-slate-100 text-slate-700 hover:bg-slate-200"
              }`}
            >
              {m}
            </button>
          ))}
        </div>

        <div className="mt-4">
          {mode === "type" && (
            <div className="space-y-3">
              <input
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Type your name"
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
              <div className="flex gap-2">
                {TYPE_FONTS.map((f, i) => (
                  <button
                    key={f.label}
                    onClick={() => setFontIndex(i)}
                    style={{ fontFamily: f.css }}
                    className={`flex-1 rounded-lg border px-3 py-3 text-xl ${
                      fontIndex === i ? "border-brand-500 bg-brand-50" : "border-slate-200"
                    }`}
                  >
                    {name || "Signature"}
                  </button>
                ))}
              </div>
            </div>
          )}

          {mode === "draw" && (
            <canvas
              ref={canvasRef}
              width={560}
              height={200}
              onPointerDown={startDraw}
              onPointerMove={moveDraw}
              onPointerUp={endDraw}
              onPointerLeave={endDraw}
              className="w-full touch-none rounded-lg border border-slate-300 bg-white"
            />
          )}

          {mode === "upload" && (
            <label className="flex h-40 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 text-slate-500 hover:bg-slate-50">
              <span>Click to upload a signature image</span>
              <input
                type="file"
                accept="image/png,image/jpeg"
                className="hidden"
                onChange={handleUpload}
              />
            </label>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onCancel}
            className="rounded-lg border px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Cancel
          </button>
          {mode !== "upload" && (
            <button
              onClick={confirm}
              className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            >
              Add signature
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
