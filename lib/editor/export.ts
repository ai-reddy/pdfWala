// Pro PDF Editor — export/baking pipeline.
//
// Takes the original (immutable) PDF bytes plus the list of editor objects and
// produces a new PDF with every object rendered into the page content. This is
// the deterministic "Apply changes" step from the FRD editor save model.
//
// Objects are authored in PDF points with a top-left origin; pdf-lib uses a
// bottom-left origin, so every Y coordinate is flipped against page height.

import {
  PDFDocument,
  StandardFonts,
  rgb,
  degrees,
  PDFName,
  PDFString,
  type PDFFont,
  type PDFPage,
} from "pdf-lib";
import type {
  EditorObject,
  FontFamily,
  TextObject,
  ImageObject,
  SignatureObject,
  ShapeObject,
  MarkupObject,
  LinkObject,
  WhiteoutObject,
  TextFieldObject,
  CheckboxFieldObject,
} from "./types";

function hexToRgb(hex: string) {
  const clean = hex.replace("#", "");
  const full =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  const int = Number.parseInt(full || "000000", 16);
  return rgb(((int >> 16) & 255) / 255, ((int >> 8) & 255) / 255, (int & 255) / 255);
}

function dataUrlToBytes(dataUrl: string): Uint8Array {
  const base64 = dataUrl.split(",")[1] ?? "";
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function resolveFont(
  doc: PDFDocument,
  family: FontFamily,
  bold: boolean,
  italic: boolean,
  cache: Map<string, PDFFont>
): Promise<PDFFont> {
  const key = `${family}-${bold ? "b" : ""}${italic ? "i" : ""}`;
  const cached = cache.get(key);
  if (cached) return cached;

  let std: StandardFonts;
  if (family === "Times") {
    std =
      bold && italic
        ? StandardFonts.TimesRomanBoldItalic
        : bold
        ? StandardFonts.TimesRomanBold
        : italic
        ? StandardFonts.TimesRomanItalic
        : StandardFonts.TimesRoman;
  } else if (family === "Courier") {
    std =
      bold && italic
        ? StandardFonts.CourierBoldOblique
        : bold
        ? StandardFonts.CourierBold
        : italic
        ? StandardFonts.CourierOblique
        : StandardFonts.Courier;
  } else {
    std =
      bold && italic
        ? StandardFonts.HelveticaBoldOblique
        : bold
        ? StandardFonts.HelveticaBold
        : italic
        ? StandardFonts.HelveticaOblique
        : StandardFonts.Helvetica;
  }
  const font = await doc.embedFont(std);
  cache.set(key, font);
  return font;
}

// Strip characters the 14 standard fonts (WinAnsi) cannot encode so a single
// unsupported glyph never aborts the whole export.
function sanitizeForStandardFont(text: string): string {
  // eslint-disable-next-line no-control-regex
  return text.replace(/[^\x00-\xFF]/g, "?");
}

function wrapLines(
  text: string,
  font: PDFFont,
  fontSize: number,
  maxWidth: number
): string[] {
  const out: string[] = [];
  for (const rawLine of text.split(/\r?\n/)) {
    if (rawLine === "") {
      out.push("");
      continue;
    }
    const words = rawLine.split(/\s+/);
    let line = "";
    for (const word of words) {
      const candidate = line ? `${line} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, fontSize) <= maxWidth || !line) {
        line = candidate;
      } else {
        out.push(line);
        line = word;
      }
    }
    out.push(line);
  }
  return out;
}

export interface ExportResult {
  filename: string;
  bytes: Uint8Array;
}

/**
 * Bake the given objects into the source PDF and return new bytes.
 */
export async function bakeEditsToPdf(
  sourceBytes: Uint8Array,
  fileName: string,
  objects: EditorObject[]
): Promise<ExportResult> {
  const doc = await PDFDocument.load(sourceBytes, { ignoreEncryption: true });
  const pages = doc.getPages();
  const fontCache = new Map<string, PDFFont>();
  const usedFieldNames = new Set<string>();
  // Fields need an embedded font for their default appearance (/DA).
  let formFont: PDFFont | null = null;
  const getFormFont = async () => {
    if (!formFont) formFont = await doc.embedFont(StandardFonts.Helvetica);
    return formFont;
  };

  // Group objects by page for efficient drawing.
  const byPage = new Map<number, EditorObject[]>();
  for (const obj of objects) {
    const list = byPage.get(obj.page) ?? [];
    list.push(obj);
    byPage.set(obj.page, list);
  }

  for (const [pageNumber, pageObjects] of byPage) {
    const page = pages[pageNumber - 1];
    if (!page) continue;
    const { height: H } = page.getSize();

    for (const obj of pageObjects) {
      switch (obj.type) {
        case "whiteout":
          drawWhiteout(page, obj as WhiteoutObject, H);
          break;
        case "shape-rect":
        case "shape-ellipse":
          drawShape(page, obj as ShapeObject, H);
          break;
        case "highlight":
        case "strikethrough":
        case "underline":
          drawMarkup(page, obj as MarkupObject, H);
          break;
        case "text":
          await drawTextObject(doc, page, obj as TextObject, H, fontCache);
          break;
        case "image":
        case "signature":
          await drawImageObject(doc, page, obj as ImageObject | SignatureObject, H);
          break;
        case "link":
          await drawLink(doc, page, pages, obj as LinkObject, H, fontCache);
          break;
        case "field-text":
          await createTextField(
            doc,
            page,
            obj as TextFieldObject,
            H,
            usedFieldNames,
            await getFormFont()
          );
          break;
        case "field-checkbox":
          await createCheckboxField(
            doc,
            page,
            obj as CheckboxFieldObject,
            H,
            usedFieldNames,
            await getFormFont()
          );
          break;
      }
    }
  }

  const bytes = await doc.save();
  const base = fileName.replace(/\.pdf$/i, "");
  return { filename: `${base}-edited.pdf`, bytes };
}

function drawWhiteout(page: PDFPage, obj: WhiteoutObject, H: number) {
  page.drawRectangle({
    x: obj.x,
    y: H - obj.y - obj.height,
    width: obj.width,
    height: obj.height,
    color: rgb(1, 1, 1),
  });
}

function drawShape(page: PDFPage, obj: ShapeObject, H: number) {
  const common = {
    borderColor: hexToRgb(obj.strokeColor),
    borderWidth: obj.strokeWidth,
    color: obj.fillColor ? hexToRgb(obj.fillColor) : undefined,
    opacity: obj.fillColor ? obj.opacity : undefined,
    borderOpacity: obj.opacity,
  };
  if (obj.type === "shape-ellipse") {
    page.drawEllipse({
      x: obj.x + obj.width / 2,
      y: H - obj.y - obj.height / 2,
      xScale: obj.width / 2,
      yScale: obj.height / 2,
      ...common,
    });
  } else {
    page.drawRectangle({
      x: obj.x,
      y: H - obj.y - obj.height,
      width: obj.width,
      height: obj.height,
      ...common,
    });
  }
}

function drawMarkup(page: PDFPage, obj: MarkupObject, H: number) {
  const color = hexToRgb(obj.color);
  if (obj.type === "highlight") {
    page.drawRectangle({
      x: obj.x,
      y: H - obj.y - obj.height,
      width: obj.width,
      height: obj.height,
      color,
      opacity: 0.4,
    });
    return;
  }
  const yLine =
    obj.type === "strikethrough"
      ? H - obj.y - obj.height / 2
      : H - obj.y - obj.height + 1;
  page.drawLine({
    start: { x: obj.x, y: yLine },
    end: { x: obj.x + obj.width, y: yLine },
    thickness: Math.max(1, obj.height * 0.08),
    color,
  });
}

async function drawTextObject(
  doc: PDFDocument,
  page: PDFPage,
  obj: TextObject,
  H: number,
  cache: Map<string, PDFFont>
) {
  const font = await resolveFont(doc, obj.fontFamily, obj.bold, obj.italic, cache);
  const text = sanitizeForStandardFont(obj.text);
  const lineHeight = obj.fontSize * 1.2;
  const lines = wrapLines(text, font, obj.fontSize, obj.width);
  let cursorY = H - obj.y - obj.fontSize;
  for (const line of lines) {
    let x = obj.x;
    if (obj.align !== "left") {
      const w = font.widthOfTextAtSize(line, obj.fontSize);
      x = obj.align === "center" ? obj.x + (obj.width - w) / 2 : obj.x + obj.width - w;
    }
    page.drawText(line, {
      x,
      y: cursorY,
      size: obj.fontSize,
      font,
      color: hexToRgb(obj.color),
      opacity: obj.opacity,
    });
    cursorY -= lineHeight;
  }
}

async function drawImageObject(
  doc: PDFDocument,
  page: PDFPage,
  obj: ImageObject | SignatureObject,
  H: number
) {
  const bytes = dataUrlToBytes(obj.src);
  const isPng =
    obj.type === "signature" ||
    (obj as ImageObject).format === "png" ||
    obj.src.startsWith("data:image/png");
  const image = isPng ? await doc.embedPng(bytes) : await doc.embedJpg(bytes);
  const opacity = obj.type === "image" ? (obj as ImageObject).opacity : 1;
  page.drawImage(image, {
    x: obj.x,
    y: H - obj.y - obj.height,
    width: obj.width,
    height: obj.height,
    opacity,
  });
}

async function drawLink(
  doc: PDFDocument,
  page: PDFPage,
  pages: PDFPage[],
  obj: LinkObject,
  H: number,
  cache: Map<string, PDFFont>
) {
  // Visible affordance: underlined blue label.
  const font = await resolveFont(doc, "Helvetica", false, false, cache);
  page.drawText(sanitizeForStandardFont(obj.label || obj.url || "link"), {
    x: obj.x + 2,
    y: H - obj.y - obj.height + 4,
    size: Math.min(obj.height - 4, 12),
    font,
    color: rgb(0.09, 0.4, 0.85),
  });
  page.drawLine({
    start: { x: obj.x, y: H - obj.y - obj.height + 2 },
    end: { x: obj.x + obj.width, y: H - obj.y - obj.height + 2 },
    thickness: 0.75,
    color: rgb(0.09, 0.4, 0.85),
  });

  const rect = [obj.x, H - obj.y - obj.height, obj.x + obj.width, H - obj.y];
  const ctx = doc.context;
  let annotRef;
  if (obj.url) {
    annotRef = ctx.register(
      ctx.obj({
        Type: "Annot",
        Subtype: "Link",
        Rect: rect,
        Border: [0, 0, 0],
        A: ctx.obj({ Type: "Action", S: "URI", URI: PDFString.of(obj.url) }),
      })
    );
  } else if (obj.targetPage && pages[obj.targetPage - 1]) {
    annotRef = ctx.register(
      ctx.obj({
        Type: "Annot",
        Subtype: "Link",
        Rect: rect,
        Border: [0, 0, 0],
        Dest: ctx.obj([pages[obj.targetPage - 1].ref, PDFName.of("Fit")]),
      })
    );
  } else {
    return;
  }
  const existing = page.node.Annots();
  if (existing) {
    existing.push(annotRef);
  } else {
    page.node.set(PDFName.of("Annots"), ctx.obj([annotRef]));
  }
}

function uniqueName(base: string, used: Set<string>): string {
  let name = base && base.trim() ? base.trim() : "field";
  let i = 1;
  while (used.has(name)) name = `${base}_${i++}`;
  used.add(name);
  return name;
}

function createTextField(
  doc: PDFDocument,
  page: PDFPage,
  obj: TextFieldObject,
  H: number,
  used: Set<string>,
  font: PDFFont
) {
  const form = doc.getForm();
  const field = form.createTextField(uniqueName(obj.name, used));
  // addToPage must run first so the widget gets a /DA (default appearance);
  // setFontSize/setText both depend on that appearance existing.
  field.addToPage(page, {
    x: obj.x,
    y: H - obj.y - obj.height,
    width: obj.width,
    height: obj.height,
    font,
    borderWidth: 1,
    borderColor: rgb(0.6, 0.6, 0.6),
  });
  field.setFontSize(obj.fontSize);
  if (obj.value) field.setText(obj.value);
}

function createCheckboxField(
  doc: PDFDocument,
  page: PDFPage,
  obj: CheckboxFieldObject,
  H: number,
  used: Set<string>,
  _font: PDFFont
) {
  const form = doc.getForm();
  const field = form.createCheckBox(uniqueName(obj.name, used));
  field.addToPage(page, {
    x: obj.x,
    y: H - obj.y - obj.height,
    width: obj.width,
    height: obj.height,
    borderWidth: 1,
    borderColor: rgb(0.6, 0.6, 0.6),
  });
  if (obj.checked) field.check();
}

// Re-export for callers that want to rotate exported page (kept for parity with
// the editor's page-rotation control).
export function rotatePage(page: PDFPage, deg: number) {
  page.setRotation(degrees(deg));
}
