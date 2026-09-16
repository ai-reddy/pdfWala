"use client";

import { useCallback, useRef, useState } from "react";
import { scanImageFile, scanFromVideoDevice, type ScanResult } from "@/lib/barcode/scan";

interface HistoryEntry extends ScanResult {
  timestamp: string;
}

function download(text: string, filename: string, mime: string) {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function CodeScanner() {
  const [result, setResult] = useState<ScanResult | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [cameraOn, setCameraOn] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const stopRef = useRef<(() => void) | null>(null);

  const recordResult = useCallback((r: ScanResult) => {
    setResult(r);
    setHistory((prev) => [{ ...r, timestamp: new Date().toISOString() }, ...prev].slice(0, 100));
  }, []);

  const onFile = useCallback(
    async (file: File | undefined) => {
      if (!file) return;
      setError(null);
      setScanning(true);
      try {
        const r = await scanImageFile(file);
        recordResult(r);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not decode this image.");
      } finally {
        setScanning(false);
      }
    },
    [recordResult]
  );

  const startCamera = useCallback(async () => {
    setError(null);
    try {
      const video = videoRef.current;
      if (!video) return;
      const stop = await scanFromVideoDevice(video, undefined, (r) => recordResult(r));
      stopRef.current = stop;
      setCameraOn(true);
    } catch {
      setError("Could not access the camera. Check browser permissions.");
    }
  }, [recordResult]);

  const stopCamera = useCallback(() => {
    stopRef.current?.();
    stopRef.current = null;
    setCameraOn(false);
  }, []);

  const copyValue = () => {
    if (result) navigator.clipboard?.writeText(result.value).catch(() => {});
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight text-center">
        Barcode &amp; QR Code Scanner
      </h1>
      <p className="mt-2 text-center text-slate-600">
        Decode barcodes and QR codes from an image or your camera.
      </p>

      <div className="mt-8 rounded-xl border bg-white p-5 space-y-4">
        <div className="flex flex-wrap gap-3">
          <label className="rounded-lg bg-brand-600 px-4 py-2 font-semibold text-white hover:bg-brand-700 cursor-pointer">
            Upload image
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => onFile(e.target.files?.[0])}
            />
          </label>
          {!cameraOn ? (
            <button
              onClick={startCamera}
              className="rounded-lg border px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
            >
              Start camera
            </button>
          ) : (
            <button
              onClick={stopCamera}
              className="rounded-lg border px-4 py-2 font-semibold text-slate-700 hover:bg-slate-50"
            >
              Stop camera
            </button>
          )}
        </div>

        <video
          ref={videoRef}
          className={cameraOn ? "w-full rounded-lg bg-black" : "hidden"}
          muted
          playsInline
        />

        {scanning && <p className="text-sm text-slate-500">Scanning…</p>}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {result && (
          <div className="rounded-lg border bg-slate-50 p-4 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
              {result.format}
            </p>
            <p className="break-all font-mono text-sm text-slate-800">{result.value}</p>
            {result.isUnsafe && (
              <p className="text-sm font-medium text-red-600">
                This payload uses a potentially unsafe scheme. It was not opened automatically.
              </p>
            )}
            <div className="flex flex-wrap gap-2 pt-1">
              <button
                onClick={copyValue}
                className="rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-white"
              >
                Copy
              </button>
              {!result.isUnsafe && /^https?:\/\//i.test(result.value) && (
                <a
                  href={result.value}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-white"
                >
                  Open link
                </a>
              )}
            </div>
          </div>
        )}
      </div>

      {history.length > 0 && (
        <div className="mt-6 rounded-xl border bg-white p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              Scan history ({history.length})
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() =>
                  download(
                    "timestamp,format,value\n" +
                      history
                        .map((h) => `${h.timestamp},${h.format},"${h.value.replace(/"/g, '""')}"`)
                        .join("\n"),
                    "scan-history.csv",
                    "text/csv"
                  )
                }
                className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-slate-50"
              >
                Export CSV
              </button>
              <button
                onClick={() =>
                  download(
                    history.map((h) => `[${h.timestamp}] ${h.format}: ${h.value}`).join("\n"),
                    "scan-history.txt",
                    "text/plain"
                  )
                }
                className="rounded-lg border px-3 py-1.5 text-xs font-medium hover:bg-slate-50"
              >
                Export TXT
              </button>
            </div>
          </div>
          <div className="mt-3 divide-y">
            {history.map((h, i) => (
              <div key={i} className="py-2 text-sm">
                <span className="font-mono text-xs text-slate-400">{h.format}</span>{" "}
                <span className="break-all">{h.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
