// Per-page text extraction using pdfjs-dist. Runs in Node (no worker, no canvas)
// which keeps it compatible with Netlify serverless functions.

// pdfjs-dist >= 4.4 uses Promise.withResolvers, absent before Node 22.
if (typeof (Promise as unknown as { withResolvers?: unknown }).withResolvers !== "function") {
  (Promise as unknown as { withResolvers: () => unknown }).withResolvers = function () {
    let resolve!: (value?: unknown) => void;
    let reject!: (reason?: unknown) => void;
    const promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}

export interface PageText {
  page: number;
  text: string;
  lines: string[];
}

interface TextItem {
  str?: string;
  transform?: number[];
}

function groupIntoLines(items: TextItem[]): string[] {
  const rows = new Map<number, { x: number; s: string }[]>();
  for (const item of items) {
    if (typeof item.str !== "string" || !item.transform) continue;
    const y = Math.round(item.transform[5]);
    const x = item.transform[4];
    if (!rows.has(y)) rows.set(y, []);
    rows.get(y)!.push({ x, s: item.str });
  }

  const lines: string[] = [];
  for (const y of Array.from(rows.keys()).sort((a, b) => b - a)) {
    const line = rows
      .get(y)!
      .sort((a, b) => a.x - b.x)
      .map((p) => p.s)
      .join("")
      .replace(/\s+/g, " ")
      .trim();
    if (line) lines.push(line);
  }
  return lines;
}

export async function extractTextByPage(bytes: Uint8Array): Promise<PageText[]> {
  // Dynamic import so pure pdf-lib tools don't pull in pdfjs.
  const pdfjs = (await import("pdfjs-dist/legacy/build/pdf.mjs")) as {
    GlobalWorkerOptions: { workerSrc: string };
    getDocument: (opts: Record<string, unknown>) => { promise: Promise<PdfDocProxy> };
  };

  // pdfjs needs a resolvable worker even for the in-process fake worker (Node).
  // Use Node's real require (via eval so the bundler leaves it untouched) to
  // resolve the worker file, then point pdfjs at it as a file URL.
  // eslint-disable-next-line no-eval
  const nodeRequire = eval("require") as {
    (id: string): { pathToFileURL: (p: string) => { href: string } };
    resolve: (id: string) => string;
  };
  const workerPath = nodeRequire.resolve(
    "pdfjs-dist/legacy/build/pdf.worker.mjs"
  );
  const { pathToFileURL } = nodeRequire("node:url");
  pdfjs.GlobalWorkerOptions.workerSrc = pathToFileURL(workerPath).href;

  const task = pdfjs.getDocument({
    data: bytes,
    isEvalSupported: false,
    useSystemFonts: true,
  });
  const doc = await task.promise;

  const result: PageText[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const lines = groupIntoLines(content.items as TextItem[]);
    result.push({ page: i, text: lines.join("\n"), lines });
  }
  await doc.cleanup?.();
  return result;
}

interface PdfPageProxy {
  getTextContent: () => Promise<{ items: unknown[] }>;
}
interface PdfDocProxy {
  numPages: number;
  getPage: (n: number) => Promise<PdfPageProxy>;
  cleanup?: () => Promise<void>;
}
