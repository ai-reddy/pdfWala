"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import type { OptionField, ToolDef } from "@/lib/types";

type Status = "idle" | "processing" | "done" | "error";

interface ResultFile {
  url: string;
  filename: string;
}

function defaultOptions(fields: OptionField[]): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {};
  for (const f of fields) {
    if (f.kind === "select") out[f.name] = f.default;
    else if (f.kind === "checkbox") out[f.name] = f.default ?? false;
    else if (f.kind === "number") out[f.name] = f.default ?? 0;
    else out[f.name] = f.default ?? "";
  }
  return out;
}

export function ToolRunner({ tool }: { tool: ToolDef }) {
  const [files, setFiles] = useState<File[]>([]);
  const [options, setOptions] = useState(() => defaultOptions(tool.options));
  const [status, setStatus] = useState<Status>("idle");
  const [error, setError] = useState<string>("");
  const [result, setResult] = useState<ResultFile | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const canProcess = useMemo(
    () => files.length >= (tool.multiple ? 1 : 1) && status !== "processing",
    [files, status, tool.multiple]
  );

  const addFiles = useCallback(
    (incoming: FileList | null) => {
      if (!incoming) return;
      const list = Array.from(incoming);
      setFiles((prev) => (tool.multiple ? [...prev, ...list] : list.slice(0, 1)));
      setResult(null);
      setStatus("idle");
      setError("");
    },
    [tool.multiple]
  );

  const removeFile = (index: number) =>
    setFiles((prev) => prev.filter((_, i) => i !== index));

  const move = (index: number, dir: -1 | 1) =>
    setFiles((prev) => {
      const next = [...prev];
      const target = index + dir;
      if (target < 0 || target >= next.length) return prev;
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  const setOption = (name: string, value: string | number | boolean) =>
    setOptions((prev) => ({ ...prev, [name]: value }));

  const process = useCallback(async () => {
    setStatus("processing");
    setError("");
    setResult(null);
    try {
      // Rendering/OCR tools run entirely in the browser.
      if (tool.runtime === "client") {
        const { runClient } = await import("@/lib/client/operations");
        const out = await runClient(tool.operation, files, options);
        setResult({ url: URL.createObjectURL(out.blob), filename: out.filename });
        setStatus("done");
        return;
      }

      const form = new FormData();
      form.append("operation", tool.operation);
      form.append("options", JSON.stringify(options));
      files.forEach((f) => form.append("files", f));

      const res = await fetch("/api/process", { method: "POST", body: form });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error?.message ?? "Processing failed.");
      }

      const blob = await res.blob();
      const disposition = res.headers.get("Content-Disposition") ?? "";
      const match = disposition.match(/filename="?([^"]+)"?/);
      const filename = match?.[1] ?? "result";
      setResult({ url: URL.createObjectURL(blob), filename });
      setStatus("done");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setStatus("error");
    }
  }, [files, options, tool.operation, tool.runtime]);

  const reset = () => {
    setFiles([]);
    setResult(null);
    setStatus("idle");
    setError("");
    setOptions(defaultOptions(tool.options));
  };

  if (status === "done" && result) {
    return (
      <div className="rounded-xl border bg-white p-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-100 text-green-600 text-2xl">
          ✓
        </div>
        <h2 className="text-xl font-semibold">Your file is ready</h2>
        <p className="mt-1 text-slate-500">{result.filename}</p>
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
          <a
            href={result.url}
            download={result.filename}
            className="rounded-lg bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700"
          >
            Download
          </a>
          <button
            onClick={reset}
            className="rounded-lg border px-6 py-3 font-semibold text-slate-700 hover:bg-slate-50"
          >
            Process another
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Uploader */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          addFiles(e.dataTransfer.files);
        }}
        className={`rounded-xl border-2 border-dashed bg-white p-10 text-center transition ${
          dragging ? "border-brand-500 bg-brand-50" : "border-slate-300"
        }`}
      >
        <p className="text-slate-600">Drag files here</p>
        <p className="my-2 text-sm text-slate-400">or</p>
        <button
          onClick={() => inputRef.current?.click()}
          className="rounded-lg bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700"
        >
          Select files
        </button>
        <input
          ref={inputRef}
          type="file"
          accept={tool.accept}
          multiple={tool.multiple}
          className="hidden"
          onChange={(e) => addFiles(e.target.files)}
        />
      </div>

      {/* File queue */}
      {files.length > 0 && (
        <div className="rounded-xl border bg-white divide-y">
          {files.map((file, i) => (
            <div
              key={`${file.name}-${i}`}
              className="flex items-center justify-between px-4 py-3"
            >
              <div className="min-w-0">
                <p className="truncate font-medium text-slate-800">
                  {file.name}
                </p>
                <p className="text-xs text-slate-400">
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <div className="flex items-center gap-1 text-slate-500">
                {tool.multiple && (
                  <>
                    <button
                      onClick={() => move(i, -1)}
                      className="rounded p-1 hover:bg-slate-100"
                      aria-label="Move up"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => move(i, 1)}
                      className="rounded p-1 hover:bg-slate-100"
                      aria-label="Move down"
                    >
                      ↓
                    </button>
                  </>
                )}
                <button
                  onClick={() => removeFile(i)}
                  className="rounded p-1 text-brand-600 hover:bg-brand-50"
                  aria-label="Remove"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Options */}
      {tool.options.length > 0 && (
        <div className="rounded-xl border bg-white p-5 space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-500">
            Options
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {tool.options.map((field) => (
              <OptionInput
                key={field.name}
                field={field}
                value={options[field.name]}
                onChange={(v) => setOption(field.name, v)}
              />
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <button
        disabled={!canProcess}
        onClick={process}
        className="w-full rounded-lg bg-brand-600 px-6 py-4 text-lg font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {status === "processing" ? "Processing…" : tool.name}
      </button>
    </div>
  );
}

function OptionInput({
  field,
  value,
  onChange,
}: {
  field: OptionField;
  value: string | number | boolean;
  onChange: (value: string | number | boolean) => void;
}) {
  if (field.kind === "select") {
    return (
      <label className="block text-sm">
        <span className="mb-1 block font-medium text-slate-700">
          {field.label}
        </span>
        <select
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-3 py-2"
        >
          {field.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </label>
    );
  }

  if (field.kind === "checkbox") {
    return (
      <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
        <input
          type="checkbox"
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300"
        />
        {field.label}
      </label>
    );
  }

  return (
    <label className="block text-sm">
      <span className="mb-1 block font-medium text-slate-700">
        {field.label}
      </span>
      <input
        type={field.kind === "number" ? "number" : "text"}
        value={String(value ?? "")}
        placeholder={field.kind === "text" ? field.placeholder : undefined}
        min={field.kind === "number" ? field.min : undefined}
        max={field.kind === "number" ? field.max : undefined}
        onChange={(e) =>
          onChange(
            field.kind === "number" ? Number(e.target.value) : e.target.value
          )
        }
        className="w-full rounded-lg border border-slate-300 px-3 py-2"
      />
    </label>
  );
}
