"use client";

import { useMemo, useState } from "react";
import { calculateEmi } from "@/lib/calc/emi";

function money(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(n);
}

export function EmiCalculator() {
  const [principal, setPrincipal] = useState("2500000");
  const [rate, setRate] = useState("8.5");
  const [months, setMonths] = useState("240");
  const [showSchedule, setShowSchedule] = useState(false);

  const { result, error } = useMemo(() => {
    const p = Number(principal);
    const r = Number(rate);
    const n = Number(months);
    if ([principal, rate, months].some((v) => v.trim() === "") || [p, r, n].some(Number.isNaN)) {
      return { result: null, error: "Enter valid numbers for all fields." };
    }
    try {
      return { result: calculateEmi(p, r, n), error: null };
    } catch (err) {
      return { result: null, error: err instanceof Error ? err.message : "Invalid input." };
    }
  }, [principal, rate, months]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight text-center">EMI Calculator</h1>
      <p className="mt-2 text-center text-slate-600">Monthly loan payment, total interest and amortization schedule.</p>

      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border bg-white p-5 space-y-4">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Loan amount</span>
            <input
              type="number"
              value={principal}
              onChange={(e) => setPrincipal(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Annual interest rate (%)</span>
            <input
              type="number"
              value={rate}
              onChange={(e) => setRate(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Tenure (months)</span>
            <input
              type="number"
              value={months}
              onChange={(e) => setMonths(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
          )}
        </div>

        <div className="rounded-xl border bg-white p-5">
          {result && (
            <div className="space-y-3">
              <div className="rounded-lg bg-slate-50 p-4 text-center">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Monthly EMI</p>
                <p className="mt-1 text-3xl font-bold text-brand-700">{money(result.emi)}</p>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Principal</span>
                <span className="font-medium">{money(result.principal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-600">Total interest</span>
                <span className="font-medium">{money(result.totalInterest)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 text-sm font-semibold">
                <span>Total payment</span>
                <span>{money(result.totalPayment)}</span>
              </div>
              <button
                onClick={() => setShowSchedule((s) => !s)}
                className="mt-2 text-sm font-medium text-brand-600 hover:underline"
              >
                {showSchedule ? "Hide" : "Show"} amortization schedule
              </button>
            </div>
          )}
        </div>
      </div>

      {showSchedule && result && (
        <div className="mt-6 rounded-xl border bg-white p-5 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-slate-500">
                <th className="py-1 pr-4">Month</th>
                <th className="py-1 pr-4">EMI</th>
                <th className="py-1 pr-4">Principal</th>
                <th className="py-1 pr-4">Interest</th>
                <th className="py-1">Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {result.schedule.map((row) => (
                <tr key={row.month}>
                  <td className="py-1 pr-4">{row.month}</td>
                  <td className="py-1 pr-4">{money(row.emi)}</td>
                  <td className="py-1 pr-4">{money(row.principal)}</td>
                  <td className="py-1 pr-4">{money(row.interest)}</td>
                  <td className="py-1">{money(row.balance)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
