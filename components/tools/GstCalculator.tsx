"use client";

import { useMemo, useState } from "react";
import { GST_RATE_REGISTRY, addGst, removeGst } from "@/lib/calc/gst";

function inr(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(n);
}

export function GstCalculator() {
  const [amount, setAmount] = useState("10000");
  const [rate, setRate] = useState(GST_RATE_REGISTRY.rates[4]?.rate ?? 18);
  const [mode, setMode] = useState<"add" | "remove">("add");
  const [split, setSplit] = useState<"intra" | "inter">("intra");

  const { result, error } = useMemo(() => {
    const a = Number(amount);
    if (amount.trim() === "" || Number.isNaN(a) || a < 0) {
      return { result: null, error: "Enter a valid, non-negative amount." };
    }
    return { result: mode === "add" ? addGst(a, rate, split) : removeGst(a, rate, split), error: null };
  }, [amount, rate, mode, split]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight text-center">GST Calculator</h1>
      <p className="mt-2 text-center text-slate-600">
        Add or remove GST. Rates follow a configurable registry (v{GST_RATE_REGISTRY.version}, effective{" "}
        {GST_RATE_REGISTRY.effectiveFrom}) — verify against current tax policy for filing purposes.
      </p>

      <div className="mt-8 rounded-xl border bg-white p-5 space-y-5">
        <div className="flex gap-2">
          <button
            onClick={() => setMode("add")}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${mode === "add" ? "bg-brand-600 text-white" : "border text-slate-700 hover:bg-slate-50"}`}
          >
            Add GST
          </button>
          <button
            onClick={() => setMode("remove")}
            className={`rounded-lg px-3 py-1.5 text-sm font-medium ${mode === "remove" ? "bg-brand-600 text-white" : "border text-slate-700 hover:bg-slate-50"}`}
          >
            Remove GST (inclusive amount)
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">
              {mode === "add" ? "Base amount (₹)" : "Inclusive amount (₹)"}
            </span>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal"
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">GST rate</span>
            <select
              value={rate}
              onChange={(e) => setRate(Number(e.target.value))}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              {GST_RATE_REGISTRY.rates.map((r) => (
                <option key={r.rate} value={r.rate}>
                  {r.label}
                </option>
              ))}
            </select>
          </label>
        </div>

        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Supply type</span>
          <select
            value={split}
            onChange={(e) => setSplit(e.target.value as "intra" | "inter")}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 sm:w-64"
          >
            <option value="intra">Intra-state (CGST + SGST)</option>
            <option value="inter">Inter-state (IGST)</option>
          </select>
        </label>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        ) : result ? (
          <div className="rounded-lg bg-slate-50 p-4 space-y-2">
            <Row label="Base" value={inr(result.base)} />
            {split === "intra" ? (
              <>
                <Row label="CGST" value={inr(result.cgst)} />
                <Row label="SGST" value={inr(result.sgst)} />
              </>
            ) : (
              <Row label="IGST" value={inr(result.igst)} />
            )}
            <Row label="Total GST" value={inr(result.gstAmount)} />
            <div className="border-t pt-2">
              <Row label="Total amount" value={inr(result.total)} bold />
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex items-center justify-between ${bold ? "text-lg font-bold text-brand-700" : "text-sm"}`}>
      <span className="text-slate-600">{label}</span>
      <span className={bold ? "" : "font-medium text-slate-900"}>{value}</span>
    </div>
  );
}
