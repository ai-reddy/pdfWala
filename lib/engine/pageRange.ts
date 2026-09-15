// Parse human page specs like "1, 3-5, 8" into zero-based page indices.
// `pageCount` bounds the result and drops out-of-range values.
export function parsePageList(spec: string, pageCount: number): number[] {
  const result = new Set<number>();
  const trimmed = (spec || "").trim();
  if (!trimmed) return [];

  for (const rawPart of trimmed.split(",")) {
    const part = rawPart.trim();
    if (!part) continue;

    const rangeMatch = part.match(/^(\d+)\s*-\s*(\d+)$/);
    if (rangeMatch) {
      let start = parseInt(rangeMatch[1], 10);
      let end = parseInt(rangeMatch[2], 10);
      if (start > end) [start, end] = [end, start];
      for (let p = start; p <= end; p++) {
        if (p >= 1 && p <= pageCount) result.add(p - 1);
      }
      continue;
    }

    const single = parseInt(part, 10);
    if (!Number.isNaN(single) && single >= 1 && single <= pageCount) {
      result.add(single - 1);
    }
  }

  return Array.from(result).sort((a, b) => a - b);
}

// Parse ranges into ordered groups, e.g. "1-3, 4-6" -> [[0,1,2],[3,4,5]].
export function parseRangeGroups(spec: string, pageCount: number): number[][] {
  const groups: number[][] = [];
  const trimmed = (spec || "").trim();
  if (!trimmed) return groups;

  for (const rawPart of trimmed.split(",")) {
    const part = rawPart.trim();
    if (!part) continue;

    const rangeMatch = part.match(/^(\d+)\s*-\s*(\d+)$/);
    if (rangeMatch) {
      let start = parseInt(rangeMatch[1], 10);
      let end = parseInt(rangeMatch[2], 10);
      if (start > end) [start, end] = [end, start];
      const group: number[] = [];
      for (let p = start; p <= end; p++) {
        if (p >= 1 && p <= pageCount) group.push(p - 1);
      }
      if (group.length) groups.push(group);
      continue;
    }

    const single = parseInt(part, 10);
    if (!Number.isNaN(single) && single >= 1 && single <= pageCount) {
      groups.push([single - 1]);
    }
  }

  return groups;
}
