"use client";

import { useMemo, useState } from "react";
import { formatJson, minifyJson, validateJson, jsonSizeInfo } from "@/lib/text/json";

const SAMPLE = '{\n  "name": "pdfWala",\n  "tools": ["merge", "split", "compress"]\n}';

function download(text: string, filename: string) {
  const blob = new Blob([text], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function JsonTool({ emphasis = "format" }: { emphasis?: "format" | "validate" }) {
  const [input, setInput] = useState(SAMPLE);
  const [indent, setIndent] = useState<"2" | "4" | "tab">("2");
  const [sortKeys, setSortKeys] = useState(false);
  const [output, setOutput] = useState("");
  const [copied, setCopied] = useState(false);

  const validation = useMemo(() => validateJson(input), [input]);
  const size = useMemo(() => jsonSizeInfo(input), [input]);

  const runFormat = () => {
    if (!validation.valid) return;
    setOutput(formatJson(input, { indent: indent === "tab" ? "tab" : Number(indent) as 2 | 4, sortKeys }));
  };
  const runMinify = () => {
    if (!validation.valid) return;
    setOutput(minifyJson(input));
  };
  const copy = () => {
    navigator.clipboard?.writeText(output || input).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight text-center">
        {emphasis === "validate" ? "JSON Validator" : "JSON Formatter"}
      </h1>
      <p className="mt-2 text-center text-slate-600">
        Format, minify and validate JSON entirely in your browser — nothing is uploaded.
      </p>

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border bg-white p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Input</h2>
            <label className="text-xs text-brand-600 cursor-pointer hover:underline">
              Upload .json
              <input
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) setInput(await file.text());
                }}
              />
            </label>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={16}
            spellCheck={false}
            className="w-full rounded-lg border border-slate-300 p-3 font-mono text-sm"
          />
          <p className="text-xs text-slate-500">
            {size.characters.toLocaleString()} characters · {size.bytes.toLocaleString()} bytes
          </p>

          {validation.valid ? (
            <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-2 text-sm text-green-700">
              Valid JSON
            </div>
          ) : (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {validation.error?.message}
              {validation.error && ` (line ${validation.error.line}, column ${validation.error.column})`}
            </div>
          )}
        </div>

        <div className="rounded-xl border bg-white p-5 space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={indent}
              onChange={(e) => setIndent(e.target.value as "2" | "4" | "tab")}
              className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm"
            >
              <option value="2">Indent: 2</option>
              <option value="4">Indent: 4</option>
              <option value="tab">Indent: Tabs</option>
            </select>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={sortKeys} onChange={(e) => setSortKeys(e.target.checked)} />
              Sort keys
            </label>
            <button
              onClick={runFormat}
              disabled={!validation.valid}
              className="rounded-lg bg-brand-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              Format
            </button>
            <button
              onClick={runMinify}
              disabled={!validation.valid}
              className="rounded-lg border px-3 py-1.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
            >
              Minify
            </button>
          </div>

          <textarea
            readOnly
            value={output}
            rows={16}
            spellCheck={false}
            className="w-full rounded-lg border border-slate-300 bg-slate-50 p-3 font-mono text-sm"
          />
          <div className="flex gap-2">
            <button
              onClick={copy}
              disabled={!output}
              className="rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
            <button
              onClick={() => download(output, "formatted.json")}
              disabled={!output}
              className="rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-slate-50 disabled:opacity-50"
            >
              Download
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
