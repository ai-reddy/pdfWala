import { NextRequest, NextResponse } from "next/server";
import { runOperation } from "@/lib/engine";
import type { EngineInput, OperationOptions } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const MAX_FILE_BYTES = 50 * 1024 * 1024; // 50 MB per file (MVP entitlement).
const MAX_FILES = 100;

// Synchronous job endpoint for the MVP. The abstraction (operation + inputs +
// options -> result) matches the spec's async job model and can be swapped for a
// queue/worker later without changing callers.
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const operation = String(form.get("operation") ?? "");
    if (!operation) {
      return errorResponse("MISSING_OPERATION", "No operation specified.", 400);
    }

    let options: OperationOptions = {};
    const rawOptions = form.get("options");
    if (typeof rawOptions === "string" && rawOptions.trim()) {
      try {
        options = JSON.parse(rawOptions);
      } catch {
        return errorResponse("INVALID_OPTIONS", "Options must be valid JSON.", 400);
      }
    }

    const files = form.getAll("files").filter((f): f is File => f instanceof File);
    if (!files.length) {
      return errorResponse("NO_FILES", "Upload at least one file.", 400);
    }
    if (files.length > MAX_FILES) {
      return errorResponse("TOO_MANY_FILES", `Max ${MAX_FILES} files.`, 400);
    }

    const inputs: EngineInput[] = [];
    for (const file of files) {
      if (file.size > MAX_FILE_BYTES) {
        return errorResponse(
          "FILE_TOO_LARGE",
          `"${file.name}" exceeds the 50 MB limit.`,
          413
        );
      }
      const bytes = new Uint8Array(await file.arrayBuffer());
      inputs.push({
        name: file.name,
        bytes,
        mimeType: file.type || "application/octet-stream",
      });
    }

    const result = await runOperation(operation, inputs, options);

    // Copy into a standalone ArrayBuffer so the response body is a valid BodyInit.
    const body = new Uint8Array(result.bytes.length);
    body.set(result.bytes);

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": result.mimeType,
        "Content-Disposition": `attachment; filename="${result.filename}"`,
        "Content-Length": String(body.length),
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unexpected processing error.";
    return errorResponse("PROCESSING_FAILED", message, 422);
  }
}

function errorResponse(code: string, message: string, status: number) {
  return NextResponse.json(
    { error: { code, message, retryable: status >= 500 } },
    { status }
  );
}
