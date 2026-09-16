"use client";

import { useEffect, useMemo, useState } from "react";
import { COMMON_CURRENCIES, convertCurrency, type ExchangeRates } from "@/lib/calc/currency";

const CACHE_KEY = "pdfwala:currency-rates:";
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour, matches the API route's revalidate window

function loadCached(base: string): ExchangeRates | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY + base);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { rates: ExchangeRates; cachedAt: number };
    if (Date.now() - parsed.cachedAt > CACHE_TTL_MS) return null;
    return parsed.rates;
  } catch {
    return null;
  }
}

function saveCached(base: string, rates: ExchangeRates) {
  try {
    localStorage.setItem(CACHE_KEY + base, JSON.stringify({ rates, cachedAt: Date.now() }));
  } catch {
    // localStorage may be unavailable (private mode); caching is best-effort.
  }
}

export function CurrencyConverter() {
  const [amount, setAmount] = useState("100");
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("INR");
  const [rates, setRates] = useState<ExchangeRates | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stale, setStale] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      const cached = loadCached(from);
      if (cached) {
        setRates(cached);
        setStale(false);
      }
      try {
        const res = await fetch(`/api/currency-rates?base=${encodeURIComponent(from)}`);
        if (!res.ok) throw new Error("Rate provider unavailable.");
        const data = (await res.json()) as ExchangeRates;
        if (cancelled) return;
        setRates(data);
        setStale(false);
        saveCached(from, data);
      } catch (err) {
        if (cancelled) return;
        if (cached) {
          setStale(true);
        } else {
          setError(err instanceof Error ? err.message : "Could not load exchange rates.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [from]);

  const result = useMemo(() => {
    const a = Number(amount);
    if (!rates || amount.trim() === "" || Number.isNaN(a)) return null;
    try {
      return convertCurrency(a, rates, to);
    } catch {
      return null;
    }
  }, [amount, rates, to]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight text-center">Currency Converter</h1>
      <p className="mt-2 text-center text-slate-600">
        Reference exchange rates. Actual bank/card conversion may differ due to spreads and fees.
      </p>

      <div className="mt-8 rounded-xl border bg-white p-5 space-y-5">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Amount</span>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          />
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-4 items-end">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">From</span>
            <select
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              {COMMON_CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <button
            onClick={() => {
              setFrom(to);
              setTo(from);
            }}
            className="rounded-lg border p-2 text-slate-600 hover:bg-slate-50"
            aria-label="Swap currencies"
          >
            ⇄
          </button>
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">To</span>
            <select
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              {COMMON_CURRENCIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
        </div>

        {loading && !rates && <p className="text-sm text-slate-500">Loading rates…</p>}
        {error && (
          <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
        )}

        {result !== null && rates && (
          <div className="rounded-lg bg-slate-50 p-4 text-center">
            <p className="text-3xl font-bold text-brand-700">
              {new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(result)} {to}
            </p>
            <p className="mt-2 text-xs text-slate-500">
              1 {from} = {rates.rates[to]?.toFixed(6)} {to} · via {rates.provider} ·{" "}
              {new Date(rates.timestamp).toLocaleString()}
              {stale && <span className="ml-1 font-medium text-amber-600">(showing cached/stale rate)</span>}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
