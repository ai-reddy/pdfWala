// Core domain types shared by the UI, the job API, and the processing engine.
// Follows the spec abstraction: Tool -> Job -> Operation -> Processing Engine -> Result.

export type ToolCategory =
  | "organize"
  | "optimize"
  | "convert"
  | "edit"
  | "security"
  | "sign"
  | "ai"
  | "image"
  | "barcode"
  | "label"
  | "career";

export type OperationId =
  | "merge"
  | "split"
  | "smart-split"
  | "remove-pages"
  | "extract-pages"
  | "organize"
  | "rotate"
  | "compress"
  | "repair"
  | "ocr"
  | "jpg-to-pdf"
  | "pdf-to-jpg"
  | "word-to-pdf"
  | "excel-to-pdf"
  | "powerpoint-to-pdf"
  | "pdf-to-word"
  | "pdf-to-excel"
  | "pdf-to-powerpoint"
  | "html-to-pdf"
  | "pdf-to-pdfa"
  | "pdf-to-markdown"
  | "edit"
  | "watermark"
  | "page-numbers"
  | "crop"
  | "forms"
  | "protect"
  | "unlock"
  | "redact"
  | "compare"
  | "sign"
  | "summarize"
  | "translate"
  | "extract-data"
  | "image-editor"
  | "remove-background"
  | "barcode-generate"
  | "qr-generate"
  | "scan-codes"
  | "batch-barcode-generate"
  | "batch-qr-generate"
  | "barcode-to-pdf"
  | "qr-to-pdf"
  | "add-barcode-to-pdf"
  | "add-qr-to-pdf"
  | "product-label"
  | "shipping-label"
  | "resume-builder";

// Declarative option schema so the tool shell can render forms generically.
export type OptionField =
  | {
      kind: "select";
      name: string;
      label: string;
      options: { value: string; label: string }[];
      default: string;
    }
  | {
      kind: "text";
      name: string;
      label: string;
      placeholder?: string;
      default?: string;
    }
  | {
      kind: "number";
      name: string;
      label: string;
      min?: number;
      max?: number;
      default?: number;
    }
  | {
      kind: "checkbox";
      name: string;
      label: string;
      default?: boolean;
    };

export interface ToolDef {
  slug: string;
  operation: OperationId;
  name: string;
  category: ToolCategory;
  description: string;
  // Accepted input MIME types / extensions for the uploader.
  accept: string;
  multiple: boolean;
  options: OptionField[];
  // Whether a working engine implementation exists yet.
  implemented: boolean;
  // Where processing happens. Rendering-heavy tools run in the browser.
  runtime?: "server" | "client";
  isNew?: boolean;
  // Optional custom destination. When set, the card links here instead of the
  // generic /tools/[slug] shell (used by the standalone Pro PDF Editor).
  href?: string;
}

export interface EngineInput {
  name: string;
  bytes: Uint8Array;
  mimeType: string;
}

export interface EngineResult {
  filename: string;
  mimeType: string;
  bytes: Uint8Array;
}

export type OperationOptions = Record<string, string | number | boolean>;

export type OperationHandler = (
  inputs: EngineInput[],
  options: OperationOptions
) => Promise<EngineResult>;
