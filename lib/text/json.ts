// Shared parser for the JSON Formatter and JSON Validator tools (spec
// sections 13/14). Uses the native JSON parser only — never regex-based
// parsing — and derives line/column from the thrown error's character offset.
export interface JsonError {
  message: string;
  line: number;
  column: number;
}

export interface JsonValidationResult {
  valid: boolean;
  error?: JsonError;
}

function positionToLineColumn(text: string, position: number): { line: number; column: number } {
  let line = 1;
  let lastNewline = -1;
  for (let i = 0; i < position && i < text.length; i++) {
    if (text[i] === "\n") {
      line++;
      lastNewline = i;
    }
  }
  return { line, column: position - lastNewline };
}

function parseErrorPosition(message: string): number | null {
  const match = message.match(/position (\d+)/i);
  return match ? Number(match[1]) : null;
}

export function validateJson(text: string): JsonValidationResult {
  try {
    JSON.parse(text);
    return { valid: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid JSON.";
    const position = parseErrorPosition(message);
    const { line, column } = position !== null ? positionToLineColumn(text, position) : { line: 1, column: 1 };
    return { valid: false, error: { message, line, column } };
  }
}

export interface FormatOptions {
  indent?: 2 | 4 | "tab";
  sortKeys?: boolean;
}

function sortObjectKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortObjectKeys);
  if (value !== null && typeof value === "object") {
    const sorted: Record<string, unknown> = {};
    for (const key of Object.keys(value as Record<string, unknown>).sort()) {
      sorted[key] = sortObjectKeys((value as Record<string, unknown>)[key]);
    }
    return sorted;
  }
  return value;
}

export function formatJson(text: string, options: FormatOptions = {}): string {
  const parsed = JSON.parse(text);
  const data = options.sortKeys ? sortObjectKeys(parsed) : parsed;
  const indent = options.indent === "tab" ? "\t" : options.indent ?? 2;
  return JSON.stringify(data, null, indent);
}

export function minifyJson(text: string): string {
  return JSON.stringify(JSON.parse(text));
}

export function jsonSizeInfo(text: string): { characters: number; bytes: number } {
  return { characters: text.length, bytes: new TextEncoder().encode(text).length };
}
