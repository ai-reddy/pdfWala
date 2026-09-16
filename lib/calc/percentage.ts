// Pure, deterministic calculation functions (spec section 36). No formatting,
// no I/O — callers apply locale-aware display formatting separately.

export function calculatePercentageOf(value: number, percentage: number): number {
  return (percentage / 100) * value;
}

export function calculatePercentage(part: number, total: number): number {
  if (total === 0) throw new Error("Division by zero: total cannot be 0.");
  return (part / total) * 100;
}

export function calculatePercentageIncrease(original: number, current: number): number {
  if (original === 0) throw new Error("Division by zero: original value cannot be 0.");
  return ((current - original) / original) * 100;
}

export function calculatePercentageDecrease(original: number, current: number): number {
  if (original === 0) throw new Error("Division by zero: original value cannot be 0.");
  return ((original - current) / original) * 100;
}
