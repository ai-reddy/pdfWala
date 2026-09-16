"use client";

import { useMemo, useState } from "react";
import { calculateAge } from "@/lib/calc/age";

function todayInputValue(): string {
  return new Date().toISOString().slice(0, 10);
}

export function AgeCalculator() {
  const [dob, setDob] = useState("");
  const [asOf, setAsOf] = useState(todayInputValue());

  const { result, error } = useMemo(() => {
    if (!dob) return { result: null, error: null };
    const dobDate = new Date(dob + "T00:00:00");
    const asOfDate = new Date((asOf || todayInputValue()) + "T00:00:00");
    if (Number.isNaN(dobDate.getTime())) return { result: null, error: "Enter a valid date of birth." };
    if (asOfDate < dobDate) return { result: null, error: "The 'as of' date must be after the date of birth." };
    try {
      return { result: calculateAge(dobDate, asOfDate), error: null };
    } catch (err) {
      return { result: null, error: err instanceof Error ? err.message : "Invalid input." };
    }
  }, [dob, asOf]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight text-center">Age Calculator</h1>
      <p className="mt-2 text-center text-slate-600">Calendar-aware age in years, months and days.</p>

      <div className="mt-8 rounded-xl border bg-white p-5 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Date of birth</span>
            <input
              type="date"
              value={dob}
              onChange={(e) => setDob(e.target.value)}
              max={todayInputValue()}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Calculate as of</span>
            <input
              type="date"
              value={asOf}
              onChange={(e) => setAsOf(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
        </div>

        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {result && (
          <div className="space-y-3">
            <div className="rounded-lg bg-slate-50 p-4 text-center">
              <p className="text-3xl font-bold text-brand-700">
                {result.years}y {result.months}m {result.days}d
              </p>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center text-sm">
              <Stat label="Total months" value={result.totalMonths} />
              <Stat label="Total weeks" value={result.totalWeeks} />
              <Stat label="Total days" value={result.totalDays} />
            </div>
            <div className="rounded-lg border p-3 text-center text-sm">
              <span className="text-slate-600">Next birthday: </span>
              <span className="font-medium">
                {result.nextBirthday.toLocaleDateString()} ({result.daysUntilBirthday} days away)
              </span>
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
