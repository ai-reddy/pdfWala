// Centralized barcode symbology registry (spec section 27). Owns allowed
// characters, length and check-digit rules, and whether a symbology can be
// generated in-browser (JsBarcode covers common 1D formats; 2D formats such as
// DATA_MATRIX/PDF417 are scan-only here since we do not bundle a 2D encoder).
export interface SymbologyDef {
  type: string;
  label: string;
  minLength: number;
  maxLength: number;
  charset: RegExp;
  checkDigit: boolean;
  generatable: boolean;
  jsBarcodeFormat?: string;
}

export const BARCODE_REGISTRY: SymbologyDef[] = [
  {
    type: "CODE_128",
    label: "Code 128",
    minLength: 1,
    maxLength: 80,
    charset: /^[\x00-\x7F]+$/,
    checkDigit: false,
    generatable: true,
    jsBarcodeFormat: "CODE128",
  },
  {
    type: "CODE_39",
    label: "Code 39",
    minLength: 1,
    maxLength: 43,
    charset: /^[A-Z0-9\-. $/+%]+$/,
    checkDigit: false,
    generatable: true,
    jsBarcodeFormat: "CODE39",
  },
  {
    type: "EAN_13",
    label: "EAN-13",
    minLength: 12,
    maxLength: 13,
    charset: /^\d+$/,
    checkDigit: true,
    generatable: true,
    jsBarcodeFormat: "EAN13",
  },
  {
    type: "EAN_8",
    label: "EAN-8",
    minLength: 7,
    maxLength: 8,
    charset: /^\d+$/,
    checkDigit: true,
    generatable: true,
    jsBarcodeFormat: "EAN8",
  },
  {
    type: "UPC_A",
    label: "UPC-A",
    minLength: 11,
    maxLength: 12,
    charset: /^\d+$/,
    checkDigit: true,
    generatable: true,
    jsBarcodeFormat: "UPC",
  },
  {
    type: "UPC_E",
    label: "UPC-E",
    minLength: 6,
    maxLength: 8,
    charset: /^\d+$/,
    checkDigit: false,
    generatable: true,
    jsBarcodeFormat: "UPCE",
  },
  {
    type: "ITF",
    label: "ITF (Interleaved 2 of 5)",
    minLength: 2,
    maxLength: 40,
    charset: /^\d+$/,
    checkDigit: false,
    generatable: true,
    jsBarcodeFormat: "ITF",
  },
  {
    type: "ITF_14",
    label: "ITF-14",
    minLength: 14,
    maxLength: 14,
    charset: /^\d+$/,
    checkDigit: true,
    generatable: true,
    jsBarcodeFormat: "ITF14",
  },
  {
    type: "CODABAR",
    label: "Codabar",
    minLength: 1,
    maxLength: 40,
    charset: /^[A-D0-9\-$:/.+]+$/,
    checkDigit: false,
    generatable: true,
    jsBarcodeFormat: "codabar",
  },
  {
    type: "CODE_93",
    label: "Code 93",
    minLength: 1,
    maxLength: 80,
    charset: /^[\x00-\x7F]+$/,
    checkDigit: true,
    generatable: false,
  },
  {
    type: "DATA_MATRIX",
    label: "Data Matrix",
    minLength: 1,
    maxLength: 2335,
    charset: /^[\s\S]+$/,
    checkDigit: false,
    generatable: false,
  },
  {
    type: "PDF417",
    label: "PDF417",
    minLength: 1,
    maxLength: 1850,
    charset: /^[\s\S]+$/,
    checkDigit: false,
    generatable: false,
  },
];

export function getSymbology(type: string): SymbologyDef | undefined {
  return BARCODE_REGISTRY.find((s) => s.type === type);
}

export function generatableSymbologies(): SymbologyDef[] {
  return BARCODE_REGISTRY.filter((s) => s.generatable);
}

function eanCheckDigit(digits: string): number {
  let sum = 0;
  for (let i = 0; i < digits.length; i++) {
    const weight = (digits.length - i) % 2 === 0 ? 1 : 3;
    sum += Number(digits[i]) * weight;
  }
  return (10 - (sum % 10)) % 10;
}

export interface ValidationResult {
  valid: boolean;
  message?: string;
  normalizedValue?: string;
}

// Validates + (for EAN/UPC/ITF-14) auto-appends the check digit if it was omitted.
export function validateBarcodeValue(type: string, rawValue: string): ValidationResult {
  const def = getSymbology(type);
  if (!def) return { valid: false, message: `Unknown symbology "${type}".` };
  const value = rawValue.trim();
  if (!value) return { valid: false, message: "Value is required." };

  let normalized = value;
  if (def.checkDigit && /^\d+$/.test(value)) {
    const bodyLen = def.maxLength - 1;
    if (value.length === bodyLen) {
      normalized = value + String(eanCheckDigit(value));
    }
  }

  if (normalized.length < def.minLength || normalized.length > def.maxLength) {
    return {
      valid: false,
      message: `${def.label} requires ${def.minLength}-${def.maxLength} characters.`,
    };
  }
  if (!def.charset.test(normalized)) {
    return { valid: false, message: `${def.label} contains unsupported characters.` };
  }
  if (def.checkDigit && /^\d+$/.test(normalized) && normalized.length === def.maxLength) {
    const body = normalized.slice(0, -1);
    const expected = eanCheckDigit(body);
    const actual = Number(normalized.slice(-1));
    if (expected !== actual) {
      return {
        valid: false,
        message: `Invalid check digit for ${def.label} (expected ${expected}).`,
      };
    }
  }
  return { valid: true, normalizedValue: normalized };
}

// QR payload validation (spec section 28). Version is auto-selected by the
// encoder; we only bound size and forbid dangerous URL schemes on decode.
export const DANGEROUS_QR_SCHEMES = ["javascript:", "data:", "file:", "intent:", "vbscript:"];

export function isDangerousPayload(payload: string): boolean {
  const lower = payload.trim().toLowerCase();
  return DANGEROUS_QR_SCHEMES.some((scheme) => lower.startsWith(scheme));
}

export function validateQrPayload(payload: string): ValidationResult {
  if (!payload.trim()) return { valid: false, message: "Payload is required." };
  if (payload.length > 2953) {
    return { valid: false, message: "Payload is too long for a QR code." };
  }
  return { valid: true, normalizedValue: payload };
}
