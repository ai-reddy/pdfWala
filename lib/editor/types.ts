// Pro PDF Editor — document object model.
//
// Every edit the user makes is represented as an "editor object" placed on a
// page. Coordinates are stored in PDF points (1/72 inch) with a top-left
// origin (screen convention). The exporter converts to PDF's bottom-left
// origin when baking objects with pdf-lib. This mirrors the command/object
// model described in the platform FRD (ADD_TEXT, ADD_IMAGE, WHITEOUT, …).

export type EditorTool =
  | "select"
  | "edit-text"
  | "text"
  | "image"
  | "link"
  | "whiteout"
  | "shape-rect"
  | "shape-ellipse"
  | "highlight"
  | "strikethrough"
  | "underline"
  | "field-text"
  | "field-checkbox"
  | "signature";

export type EditorObjectType =
  | "text"
  | "image"
  | "link"
  | "whiteout"
  | "shape-rect"
  | "shape-ellipse"
  | "highlight"
  | "strikethrough"
  | "underline"
  | "field-text"
  | "field-checkbox"
  | "signature";

export type FontFamily = "Helvetica" | "Times" | "Courier";

export interface BaseObject {
  id: string;
  type: EditorObjectType;
  /** 1-based page number this object belongs to. */
  page: number;
  /** Position in PDF points, top-left origin. */
  x: number;
  y: number;
  width: number;
  height: number;
  rotation?: number;
}

export interface TextObject extends BaseObject {
  type: "text";
  text: string;
  fontFamily: FontFamily;
  fontSize: number;
  bold: boolean;
  italic: boolean;
  color: string; // hex
  align: "left" | "center" | "right";
  opacity: number; // 0..1
}

export interface ImageObject extends BaseObject {
  type: "image";
  /** data URL (png/jpg) */
  src: string;
  format: "png" | "jpg";
  opacity: number;
}

export interface SignatureObject extends BaseObject {
  type: "signature";
  src: string; // png data URL
}

export interface LinkObject extends BaseObject {
  type: "link";
  url?: string;
  targetPage?: number;
  label: string;
}

export interface WhiteoutObject extends BaseObject {
  type: "whiteout";
}

export interface ShapeObject extends BaseObject {
  type: "shape-rect" | "shape-ellipse";
  strokeColor: string;
  fillColor: string | null;
  strokeWidth: number;
  opacity: number;
}

export interface MarkupObject extends BaseObject {
  // highlight / strikethrough / underline over a rectangular region
  type: "highlight" | "strikethrough" | "underline";
  color: string;
}

export interface TextFieldObject extends BaseObject {
  type: "field-text";
  name: string;
  value: string;
  fontSize: number;
}

export interface CheckboxFieldObject extends BaseObject {
  type: "field-checkbox";
  name: string;
  checked: boolean;
}

export type EditorObject =
  | TextObject
  | ImageObject
  | SignatureObject
  | LinkObject
  | WhiteoutObject
  | ShapeObject
  | MarkupObject
  | TextFieldObject
  | CheckboxFieldObject;

export interface EditorPage {
  /** 1-based page number. */
  index: number;
  /** intrinsic page size in PDF points. */
  widthPts: number;
  heightPts: number;
  /** rendered raster preview (data URL) for the canvas background. */
  preview: string;
  /** rotation from the source PDF, degrees. */
  rotation: number;
}

export interface EditorDocument {
  id: string;
  fileName: string;
  /** original PDF bytes, kept immutable for export baking. */
  bytes: Uint8Array;
  pages: EditorPage[];
}

export const FONT_LABELS: Record<FontFamily, string> = {
  Helvetica: "Helvetica / Arial",
  Times: "Times",
  Courier: "Courier",
};
