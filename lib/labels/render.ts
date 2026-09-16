import { PDFDocument, StandardFonts, rgb, type PDFFont } from "pdf-lib";
import { renderBarcodeToCanvas, renderQrToCanvas } from "../barcode/render";
import { toPoints, type LengthUnit } from "./units";

export interface LabelTextItem {
  kind: "text";
  x: number;
  y: number;
  size: number;
  bold?: boolean;
  text: string;
  width?: number;
  align?: "left" | "center";
}

export interface LabelImageItem {
  kind: "image";
  x: number;
  y: number;
  width: number;
  height: number;
  dataUrl: string;
}

export type LabelItem = LabelTextItem | LabelImageItem;

export interface LabelLayout {
  widthPt: number;
  heightPt: number;
  items: LabelItem[];
}

export interface ProductLabelData {
  productName: string;
  sku: string;
  price: string;
  currency: string;
  brand: string;
  variant: string;
  size: string;
  color: string;
  batchNumber: string;
  lotNumber: string;
  mfgDate: string;
  expiryDate: string;
  countryOfOrigin: string;
  website: string;
  contact: string;
  customText: string;
  codeType: "barcode" | "qr" | "none";
  codeFormat: string;
  codeValue: string;
}

export interface ShippingAddress {
  name: string;
  company: string;
  address1: string;
  address2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  phone: string;
}

export interface ShippingLabelData {
  sender: ShippingAddress;
  recipient: ShippingAddress;
  weight: string;
  weightUnit: string;
  dimensions: string;
  orderNumber: string;
  trackingNumber: string;
  deliveryInstructions: string;
}

async function dataUrlFromCanvas(canvas: HTMLCanvasElement): Promise<string> {
  return canvas.toDataURL("image/png");
}

async function codeDataUrl(
  codeType: "barcode" | "qr" | "none",
  codeFormat: string,
  codeValue: string
): Promise<string | null> {
  if (codeType === "none" || !codeValue.trim()) return null;
  if (codeType === "qr") {
    const canvas = await renderQrToCanvas({ payload: codeValue, size: 240 });
    return dataUrlFromCanvas(canvas);
  }
  const canvas = renderBarcodeToCanvas({ format: codeFormat, value: codeValue, showText: true });
  return dataUrlFromCanvas(canvas);
}

export async function buildProductLabelLayout(
  data: ProductLabelData,
  widthValue: number,
  heightValue: number,
  unit: LengthUnit
): Promise<LabelLayout> {
  const widthPt = toPoints(widthValue, unit);
  const heightPt = toPoints(heightValue, unit);
  const pad = 8;
  const items: LabelItem[] = [];
  let y = heightPt - pad - 12;

  const line = (text: string, size: number, bold = false) => {
    if (!text) return;
    items.push({ kind: "text", x: pad, y, size, bold, text, width: widthPt - pad * 2 });
    y -= size * 1.35;
  };

  line(data.productName || "Product Name", 13, true);
  if (data.brand) line(data.brand, 9);
  const priceLine = data.price ? `${data.currency || ""} ${data.price}`.trim() : "";
  if (priceLine) line(priceLine, 12, true);
  const variantLine = [data.variant, data.size, data.color].filter(Boolean).join(" · ");
  if (variantLine) line(variantLine, 8);
  if (data.sku) line(`SKU: ${data.sku}`, 8);
  const batchLine = [
    data.batchNumber && `Batch: ${data.batchNumber}`,
    data.lotNumber && `Lot: ${data.lotNumber}`,
  ]
    .filter(Boolean)
    .join("  ");
  if (batchLine) line(batchLine, 7);
  const dateLine = [
    data.mfgDate && `MFG: ${data.mfgDate}`,
    data.expiryDate && `EXP: ${data.expiryDate}`,
  ]
    .filter(Boolean)
    .join("  ");
  if (dateLine) line(dateLine, 7);
  if (data.countryOfOrigin) line(`Made in ${data.countryOfOrigin}`, 7);
  if (data.website) line(data.website, 7);
  if (data.contact) line(data.contact, 7);
  if (data.customText) line(data.customText, 7);

  const dataUrl = await codeDataUrl(data.codeType, data.codeFormat, data.codeValue);
  if (dataUrl) {
    const codeSize = Math.min(widthPt - pad * 2, y - pad);
    const codeW = data.codeType === "qr" ? Math.min(codeSize, 90) : widthPt - pad * 2;
    const codeH = data.codeType === "qr" ? codeW : 40;
    items.push({ kind: "image", x: pad, y: Math.max(pad, y - codeH), width: codeW, height: codeH, dataUrl });
  }

  return { widthPt, heightPt, items };
}

export async function buildShippingLabelLayout(
  data: ShippingLabelData,
  widthValue: number,
  heightValue: number,
  unit: LengthUnit
): Promise<LabelLayout> {
  const widthPt = toPoints(widthValue, unit);
  const heightPt = toPoints(heightValue, unit);
  const pad = 10;
  const items: LabelItem[] = [];
  let y = heightPt - pad - 10;

  const line = (text: string, size: number, bold = false) => {
    if (!text) return;
    items.push({ kind: "text", x: pad, y, size, bold, text, width: widthPt - pad * 2 });
    y -= size * 1.3;
  };

  const addr = (label: string, a: ShippingAddress) => {
    line(label, 9, true);
    if (a.name) line(a.name, 10, true);
    if (a.company) line(a.company, 8);
    if (a.address1) line(a.address1, 8);
    if (a.address2) line(a.address2, 8);
    const cityLine = [a.city, a.state, a.postalCode].filter(Boolean).join(", ");
    if (cityLine) line(cityLine, 8);
    if (a.country) line(a.country, 8);
    if (a.phone) line(`Tel: ${a.phone}`, 8);
    y -= 4;
  };

  addr("FROM", data.sender);
  addr("TO", data.recipient);

  const pkgLine = [
    data.weight && `Weight: ${data.weight} ${data.weightUnit}`,
    data.dimensions && `Dim: ${data.dimensions}`,
  ]
    .filter(Boolean)
    .join("   ");
  if (pkgLine) line(pkgLine, 8);
  if (data.orderNumber) line(`Order #: ${data.orderNumber}`, 8);
  if (data.deliveryInstructions) line(data.deliveryInstructions, 7);

  if (data.trackingNumber.trim()) {
    const canvas = renderBarcodeToCanvas({
      format: "CODE_128",
      value: data.trackingNumber,
      showText: true,
    });
    const dataUrl = await dataUrlFromCanvas(canvas);
    const codeW = widthPt - pad * 2;
    const codeH = 50;
    items.push({ kind: "image", x: pad, y: Math.max(pad, y - codeH), width: codeW, height: codeH, dataUrl });
  }

  return { widthPt, heightPt, items };
}

const PAGE_SIZES: Record<string, [number, number]> = {
  A4: [595.28, 841.89],
  Letter: [612, 792],
};

async function drawLayoutOnPage(
  doc: PDFDocument,
  regular: PDFFont,
  bold: PDFFont,
  layout: LabelLayout,
  originX: number,
  originY: number,
  page: import("pdf-lib").PDFPage
) {
  for (const item of layout.items) {
    if (item.kind === "text") {
      const font = item.bold ? bold : regular;
      page.drawText(item.text, {
        x: originX + item.x,
        y: originY + item.y,
        size: item.size,
        font,
        color: rgb(0.1, 0.1, 0.1),
      });
    } else {
      const bytes = Uint8Array.from(atob(item.dataUrl.split(",")[1]), (c) => c.charCodeAt(0));
      const png = await doc.embedPng(bytes);
      page.drawImage(png, {
        x: originX + item.x,
        y: originY + item.y,
        width: item.width,
        height: item.height,
      });
    }
  }
}

// Tiles a single label layout `copies` times onto a printable sheet.
export async function renderLabelSheetPdf(
  layout: LabelLayout,
  copies: number,
  pageSize: "A4" | "Letter" = "A4"
): Promise<Uint8Array> {
  const [pw, ph] = PAGE_SIZES[pageSize];
  const margin = 20;
  const gap = 8;
  const columns = Math.max(1, Math.floor((pw - margin * 2 + gap) / (layout.widthPt + gap)));
  const rows = Math.max(1, Math.floor((ph - margin * 2 + gap) / (layout.heightPt + gap)));
  const perPage = columns * rows;

  const doc = await PDFDocument.create();
  const regular = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  const total = Math.max(1, copies);
  for (let i = 0; i < total; i += perPage) {
    const page = doc.addPage([pw, ph]);
    const count = Math.min(perPage, total - i);
    for (let c = 0; c < count; c++) {
      const col = c % columns;
      const row = Math.floor(c / columns);
      const originX = margin + col * (layout.widthPt + gap);
      const originY = ph - margin - (row + 1) * layout.heightPt - row * gap;
      await drawLayoutOnPage(doc, regular, bold, layout, originX, originY, page);
    }
  }

  return doc.save();
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image."));
    img.src = src;
  });
}

export async function renderLayoutToCanvas(layout: LabelLayout, scale = 4): Promise<HTMLCanvasElement> {
  const canvas = document.createElement("canvas");
  canvas.width = Math.ceil(layout.widthPt * scale);
  canvas.height = Math.ceil(layout.heightPt * scale);
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#1a1a1a";
  ctx.textBaseline = "bottom";

  for (const item of layout.items) {
    if (item.kind === "text") {
      ctx.font = `${item.bold ? "bold" : ""} ${item.size * scale}px Helvetica, Arial, sans-serif`;
      ctx.fillText(item.text, item.x * scale, canvas.height - item.y * scale);
    } else {
      const img = await loadImage(item.dataUrl);
      ctx.drawImage(
        img,
        item.x * scale,
        canvas.height - (item.y + item.height) * scale,
        item.width * scale,
        item.height * scale
      );
    }
  }
  return canvas;
}
