"use client";

import { useMemo, useState } from "react";
import {
  calculateSequentialDiscount,
  originalPriceFromFinal,
  discountRateFromAmounts,
} from "@/lib/calc/discount";

function money(n: number): string {
  if (!Number.isFinite(n)) return "—";
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(n);
}

export function DiscountCalculator() {
  const [price, setPrice] = useState("10000");
  const [rates, setRates] = useState("20, 10");
  const [reverseMode, setReverseMode] = useState<"none" | "fromFinal" | "fromAmounts">("none");
  const [finalPrice, setFinalPrice] = useState("7200");
  const [singleRate, setSingleRate] = useState("20");

  const rateList = useMemo(
    () =>
      rates
        .split(",")
        .map((r) => Number(r.trim()))
        .filter((n) => !Number.isNaN(n) && n >= 0),
    [rates]
  );

  const forward = useMemo(() => {
    const p = Number(price);
    if (price.trim() === "" || Number.isNaN(p) || p < 0 || !rateList.length) return null;
    return calculateSequentialDiscount(p, rateList);
  }, [price, rateList]);

  const reverse = useMemo(() => {
    try {
      if (reverseMode === "fromFinal") {
        const fp = Number(finalPrice);
        const r = Number(singleRate);
        if (Number.isNaN(fp) || Number.isNaN(r)) return null;
        return { label: "Original price", value: originalPriceFromFinal(fp, r) };
      }
      if (reverseMode === "fromAmounts") {
        const p = Number(price);
        const fp = Number(finalPrice);
        if (Number.isNaN(p) || Number.isNaN(fp)) return null;
        return { label: "Discount rate", value: discountRateFromAmounts(p, fp), suffix: "%" };
      }
      return null;
    } catch {
      return null;
    }
  }, [reverseMode, finalPrice, singleRate, price]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight text-center">Discount Calculator</h1>
      <p className="mt-2 text-center text-slate-600">
        Single or stacked sequential discounts, plus reverse calculations.
      </p>

      <div className="mt-8 rounded-xl border bg-white p-5 space-y-5">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Original price</span>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Discount(s) % (comma-separated for stacked)</span>
            <input
              value={rates}
              onChange={(e) => setRates(e.target.value)}
              placeholder="20, 10"
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
          </label>
        </div>

        {forward && (
          <div className="rounded-lg bg-slate-50 p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-slate-600">Total discount</span>
              <span className="font-medium">{money(forward.discountAmount)}</span>
            </div>
            <div className="flex justify-between border-t pt-2 text-lg font-bold text-brand-700">
              <span>Final price</span>
              <span>{money(forward.finalPrice)}</span>
            </div>
            {rateList.length > 1 && (
              <p className="text-xs text-slate-500">
                Applied sequentially ({rateList.join("% then ")}%), not summed.
              </p>
            )}
          </div>
        )}

        <div className="border-t pt-4">
          <span className="mb-2 block text-sm font-semibold uppercase tracking-wider text-slate-500">
            Reverse calculation
          </span>
          <div className="flex flex-wrap gap-2 mb-3">
            <button
              onClick={() => setReverseMode("none")}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${reverseMode === "none" ? "bg-brand-600 text-white" : "border text-slate-700"}`}
            >
              Off
            </button>
            <button
              onClick={() => setReverseMode("fromFinal")}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${reverseMode === "fromFinal" ? "bg-brand-600 text-white" : "border text-slate-700"}`}
            >
              Final price → Original price
            </button>
            <button
              onClick={() => setReverseMode("fromAmounts")}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${reverseMode === "fromAmounts" ? "bg-brand-600 text-white" : "border text-slate-700"}`}
            >
              Amounts → Discount %
            </button>
          </div>

          {reverseMode === "fromFinal" && (
            <div className="grid grid-cols-2 gap-4 mb-3">
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">Final price</span>
                <input
                  type="number"
                  value={finalPrice}
                  onChange={(e) => setFinalPrice(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium text-slate-700">Discount %</span>
                <input
                  type="number"
                  value={singleRate}
                  onChange={(e) => setSingleRate(e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2"
                />
              </label>
            </div>
          )}
          {reverseMode === "fromAmounts" && (
            <label className="block text-sm mb-3">
              <span className="mb-1 block font-medium text-slate-700">Final price</span>
              <input
                type="number"
                value={finalPrice}
                onChange={(e) => setFinalPrice(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2"
              />
            </label>
          )}

          {reverse && (
            <div className="rounded-lg bg-slate-50 p-4 text-center">
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{reverse.label}</p>
              <p className="mt-1 text-2xl font-bold text-brand-700">
                {money(reverse.value)}
                {reverse.suffix ?? ""}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
