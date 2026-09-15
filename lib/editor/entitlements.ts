// Pro PDF Editor entitlements.
//
// Per the platform FRD, the editor must NEVER hard-code a file-count limit.
// The number of PDFs that can be edited simultaneously is driven by the
// subscription/entitlement tier, and enterprise deployments can override it
// through environment configuration. The editor UI/logic only ever reads
// `PDF_EDITOR_MAX_INPUT_FILES` (and friends) from here.

export type PlanCode = "FREE" | "PREMIUM" | "BUSINESS" | "ENTERPRISE";

export interface EditorEntitlements {
  plan: PlanCode;
  /** FEATURE_PDF_EDITOR */
  editorEnabled: boolean;
  /** FEATURE_PDF_EDITOR_MULTI_FILE */
  multiFileEnabled: boolean;
  /** MAX_EDITOR_INPUT_FILES */
  maxInputFiles: number;
  /** MAX_EDITOR_PAGES (0 = unlimited) */
  maxPages: number;
  /** MAX_EDITOR_FILE_SIZE in bytes (0 = unlimited) */
  maxFileSizeBytes: number;
}

const PLAN_DEFAULTS: Record<PlanCode, EditorEntitlements> = {
  FREE: {
    plan: "FREE",
    editorEnabled: true,
    multiFileEnabled: false,
    maxInputFiles: 1,
    maxPages: 200,
    maxFileSizeBytes: 50 * 1024 * 1024,
  },
  PREMIUM: {
    plan: "PREMIUM",
    editorEnabled: true,
    multiFileEnabled: true,
    maxInputFiles: 10,
    maxPages: 500,
    maxFileSizeBytes: 100 * 1024 * 1024,
  },
  BUSINESS: {
    plan: "BUSINESS",
    editorEnabled: true,
    multiFileEnabled: true,
    maxInputFiles: 50,
    maxPages: 2000,
    maxFileSizeBytes: 250 * 1024 * 1024,
  },
  ENTERPRISE: {
    plan: "ENTERPRISE",
    editorEnabled: true,
    multiFileEnabled: true,
    maxInputFiles: 0, // 0 = unlimited / configurable
    maxPages: 0,
    maxFileSizeBytes: 0,
  },
};

function readInt(value: string | undefined, fallback: number): number {
  if (value == null || value.trim() === "") return fallback;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) ? n : fallback;
}

/**
 * Resolve the effective editor entitlements. Reads the plan and any explicit
 * overrides from NEXT_PUBLIC_* env vars so an operator can reconfigure limits
 * without code changes. Falls back to the "Pro" (PREMIUM) tier by default.
 */
export function getEditorEntitlements(): EditorEntitlements {
  const plan = (process.env.NEXT_PUBLIC_PDF_EDITOR_PLAN as PlanCode) || "PREMIUM";
  const base = PLAN_DEFAULTS[plan] ?? PLAN_DEFAULTS.PREMIUM;

  return {
    ...base,
    maxInputFiles: readInt(
      process.env.NEXT_PUBLIC_PDF_EDITOR_MAX_INPUT_FILES,
      base.maxInputFiles
    ),
    maxPages: readInt(process.env.NEXT_PUBLIC_PDF_EDITOR_MAX_PAGES, base.maxPages),
    maxFileSizeBytes: readInt(
      process.env.NEXT_PUBLIC_PDF_EDITOR_MAX_FILE_SIZE,
      base.maxFileSizeBytes
    ),
  };
}

/** True when the given file count is allowed for the current entitlement. */
export function isFileCountAllowed(
  ent: EditorEntitlements,
  requested: number
): boolean {
  if (ent.maxInputFiles === 0) return true; // unlimited
  return requested <= ent.maxInputFiles;
}
