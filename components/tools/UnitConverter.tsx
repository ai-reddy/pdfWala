"use client";

import { useEffect, useMemo, useState } from "react";
import { UNIT_CATEGORIES, unitsByCategory, convertUnit } from "@/lib/calc/units";

export function UnitConverter() {
  const [category, setCategory] = useState<string>(UNIT_CATEGORIES[0]);
  const units = useMemo(() => unitsByCategory(category), [category]);
  const [fromUnit, setFromUnit] = useState(units[0]?.id ?? "");
  const [toUnit, setToUnit] = useState(units[1]?.id ?? units[0]?.id ?? "");
  const [value, setValue] = useState("1");

  useEffect(() => {
    const list = unitsByCategory(category);
    setFromUnit(list[0]?.id ?? "");
    setToUnit(list[1]?.id ?? list[0]?.id ?? "");
  }, [category]);

  const result = useMemo(() => {
    const v = Number(value);
    if (value.trim() === "" || Number.isNaN(v) || !fromUnit || !toUnit) return null;
    try {
      return convertUnit(v, fromUnit, toUnit);
    } catch {
      return null;
    }
  }, [value, fromUnit, toUnit]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <h1 className="text-3xl font-extrabold tracking-tight text-center">Unit Converter</h1>
      <p className="mt-2 text-center text-slate-600">Length, weight, temperature, data and more.</p>

      <div className="mt-8 rounded-xl border bg-white p-5 space-y-5">
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-700">Category</span>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2"
          >
            {UNIT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-4 items-end">
          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Value</span>
            <input
              type="number"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2"
            />
            <select
              value={fromUnit}
              onChange={(e) => setFromUnit(e.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.label}
                </option>
              ))}
            </select>
          </label>

          <button
            onClick={() => {
              setFromUnit(toUnit);
              setToUnit(fromUnit);
            }}
            className="rounded-lg border p-2 text-slate-600 hover:bg-slate-50"
            aria-label="Swap units"
            title="Swap"
          >
            ⇄
          </button>

          <label className="block text-sm">
            <span className="mb-1 block font-medium text-slate-700">Result</span>
            <input
              readOnly
              value={result === null ? "" : new Intl.NumberFormat(undefined, { maximumFractionDigits: 6 }).format(result)}
              className="w-full rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 font-semibold"
            />
            <select
              value={toUnit}
              onChange={(e) => setToUnit(e.target.value)}
              className="mt-2 w-full rounded-lg border border-slate-300 px-3 py-2"
            >
              {units.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.label}
                </option>
              ))}
            </select>
          </label>
        </div>
      </div>
    </div>
  );
}
