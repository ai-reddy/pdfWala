"use client";

import { useMemo, useState } from "react";
import {
  calculatePercentageOf,
  calculatePercentage,
  calculatePercentageIncrease,
  calculatePercentageDecrease,
} from "@/lib/calc/percentage";

type Mode = "of" | "what" | "increase" | "decrease";

const MODES: { id: Mode; label: string }[] = [
  { id: "of", label: "X% of Y" },
  { id: "what", label: "What % is X of Y?" },
  { id: "increase", label: "% Increase" },
  { id: "decrease", label: "% Decrease" },
];

function fmt(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 4 }).format(n);
}

export function PercentageCalculator() {
  const [mode, setMode] = useState<Mode>("of");
  const [x, setX] = useState("15");
  const [y, setY] = useState("500");

  const { result, error } = useMemo(() => {
    const a = Number(x);
    const b = Number(y);
    if (x.trim() === "" || y.trim() === "" || Number.isNaN(a) || Number.isNaN(b)) {
      return { result: null, error: "Enter valid numbers in both fields." };
    }
    try {
      switch (mode) {
        case "of":
          return { result: calculatePercentageOf(b, a), error: null };
        case "what":
          return { result: calculatePercentage(a, b), error: null };
        case "increase":
          return { result: calculatePercentageIncrease(a, b), error: null };
        case "decrease":
          return { result: calculatePercentageDecrease(a, b), error: null };
      }
    } catch (err) {
      return { result: null, error: err instanceof Error ? err.message : "Invalid input." };
    }
  }, [mode, x, y]);

  const labels: Record<Mode, [string, string, string]> = {
    of: ["Percentage (%)", "Of value", "Result"],
    what: ["Value (X)", "Total (Y)", "X is this % of Y"],
    increase: ["Original value", "New value", "% increase"],
    decrease: ["Original value", "New value", "% decrease"],
  };
  const [labelX, labelY, resultLabel] = labels[mode];

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight text-center">Percentage Calculator</h1>
      <p className="mt-2 text-center text-slate-600">Percent of a value, percentage change, and more.</p>

      <div className="mt-8 rounded-xl border bg-white p-5 space-y-5">
        <div className="flex flex-wrap gap-2">
          {MODES.map((m) => (
            <button
              key={m.id}
              onClick={() => setMode(m.id)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                mode === m.id ? "bg-brand-600 text-white" : "border text-slate-700 hover:bg-slate-50"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">{labelX}</span>
            <input
              type="number"
              value={x}
              onChange={(e) => setX(e.target.value)}
              inputMode="decimal"
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">{labelY}</span>
            <input
              type="number"
              value={y}
              onChange={(e) => setY(e.target.value)}
              inputMode="decimal"
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
        </div>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        ) : (
          <div className="rounded-lg bg-slate-50 p-4 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{resultLabel}</p>
            <p className="mt-1 text-3xl font-bold text-brand-700">
              {fmt(result ?? 0)}
              {mode !== "of" ? "%" : ""}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
