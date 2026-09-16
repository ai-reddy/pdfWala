"use client";

import { useMemo, useState } from "react";
import { computeTextStats } from "@/lib/text/counter";

export function TextCounter() {
  const [text, setText] = useState("");
  const stats = useMemo(() => computeTextStats(text), [text]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight text-center">Word &amp; Character Counter</h1>
      <p className="mt-2 text-center text-slate-600">Unicode-aware counting — nothing leaves your browser.</p>

      <div className="mt-8 rounded-xl border bg-white p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500">Text</h2>
          <label className="text-xs text-brand-600 cursor-pointer hover:underline">
            Upload .txt
            <input
              type="file"
              accept=".txt,text/plain"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) setText(await file.text());
              }}
            />
          </label>
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows={12}
          placeholder="Paste or type text here…"
          className="w-full rounded-lg border border-slate-300 p-3 text-sm"
        />

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
          <Stat label="Words" value={stats.words} />
          <Stat label="Characters" value={stats.characters} />
          <Stat label="Chars (no spaces)" value={stats.charactersExcludingSpaces} />
          <Stat label="Chars (no whitespace)" value={stats.charactersExcludingWhitespace} />
          <Stat label="Unicode code points" value={stats.unicodeCodePoints} />
          <Stat label="Sentences" value={stats.sentences} />
          <Stat label="Paragraphs" value={stats.paragraphs} />
          <Stat label="Lines" value={stats.lines} />
        </div>
        <p className="text-center text-sm text-slate-500">
          Estimated reading time: {stats.readingTimeMinutes} min
        </p>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border p-3">
      <p className="text-lg font-bold text-slate-900">{value.toLocaleString()}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </div>
  );
}
