"use client";

import { useMemo, useState } from "react";
import { calendarDifference } from "@/lib/calc/age";

function todayInputValue(): string {
  return new Date().toISOString().slice(0, 10);
}

export function DateDifferenceCalculator() {
  const [start, setStart] = useState("");
  const [end, setEnd] = useState(todayInputValue());

  const { result, error, swapped } = useMemo(() => {
    if (!start || !end) return { result: null, error: null, swapped: false };
    const startDate = new Date(start + "T00:00:00");
    const endDate = new Date(end + "T00:00:00");
    if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
      return { result: null, error: "Enter valid dates.", swapped: false };
    }
    const swapped = endDate < startDate;
    const [a, b] = swapped ? [endDate, startDate] : [startDate, endDate];
    return { result: calendarDifference(a, b), error: null, swapped };
  }, [start, end]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight text-center">Date Difference</h1>
      <p className="mt-2 text-center text-slate-600">Calendar difference and total days/weeks between two dates.</p>

      <div className="mt-8 rounded-xl border bg-white p-5 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Start date</span>
            <input
              type="date"
              value={start}
              onChange={(e) => setStart(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">End date</span>
            <input
              type="date"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {result && (
          <div className="space-y-3">
            {swapped && (
              <p className="text-xs text-amber-600">Dates were reversed; showing the difference regardless of order.</p>
            )}
            <div className="rounded-lg bg-slate-50 p-4 text-center">
              <p className="text-3xl font-bold text-brand-700">
                {result.years}y {result.months}m {result.days}d
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center text-sm">
              <Stat label="Total days" value={result.totalDays} />
              <Stat label="Total weeks" value={result.totalWeeks} />
              <Stat label="Total months" value={result.totalMonths} />
            </div>
          </div>
        )}
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
