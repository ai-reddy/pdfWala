"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { EditorEntitlements } from "@/lib/editor/entitlements";
import { isFileCountAllowed } from "@/lib/editor/entitlements";
import type {
  EditorDocument,
  EditorObject,
  EditorTool,
  FontFamily,
  TextObject,
} from "@/lib/editor/types";
import { FONT_LABELS } from "@/lib/editor/types";
import { SignaturePad } from "./SignaturePad";

interface Props {
  entitlements: EditorEntitlements;
}

// A patch may touch any field of any concrete object type. Partial<EditorObject>
// over a union would only expose the shared keys, so we list editable fields.
interface ObjectPatch {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  rotation?: number;
  text?: string;
  fontFamily?: FontFamily;
  fontSize?: number;
  bold?: boolean;
  italic?: boolean;
  color?: string;
  align?: TextObject["align"];
  opacity?: number;
  src?: string;
  format?: "png" | "jpg";
  url?: string;
  targetPage?: number;
  label?: string;
  strokeColor?: string;
  fillColor?: string | null;
  strokeWidth?: number;
  name?: string;
  value?: string;
  checked?: boolean;
}

type ToolMeta = { tool: EditorTool; label: string; icon: string; hint: string };

const TOOLS: ToolMeta[] = [
  { tool: "select", label: "Select", icon: "⤢", hint: "Select, move and resize objects" },
  { tool: "text", label: "Text", icon: "T", hint: "Click to add text" },
  { tool: "image", label: "Image", icon: "🖼", hint: "Add an image" },
  { tool: "link", label: "Link", icon: "🔗", hint: "Add a URL or page link" },
  { tool: "whiteout", label: "Whiteout", icon: "▧", hint: "Cover content with white" },
  { tool: "shape-rect", label: "Rectangle", icon: "▭", hint: "Draw a rectangle" },
  { tool: "shape-ellipse", label: "Ellipse", icon: "◯", hint: "Draw an ellipse" },
  { tool: "highlight", label: "Highlight", icon: "▬", hint: "Highlight a region" },
  { tool: "strikethrough", label: "Strike", icon: "S", hint: "Strike through" },
  { tool: "underline", label: "Underline", icon: "U", hint: "Underline" },
  { tool: "field-text", label: "Text field", icon: "⌸", hint: "Add a fillable text field" },
  { tool: "field-checkbox", label: "Checkbox", icon: "☑", hint: "Add a checkbox field" },
  { tool: "signature", label: "Signature", icon: "✍", hint: "Add your signature" },
];

const DRAG_TOOLS: EditorTool[] = [
  "whiteout",
  "shape-rect",
  "shape-ellipse",
  "highlight",
  "strikethrough",
  "underline",
];

let objCounter = 0;
const newId = () => `obj_${Date.now()}_${++objCounter}`;

export function ProPdfEditor({ entitlements }: Props) {
  const [docs, setDocs] = useState<EditorDocument[]>([]);
  const [activeDocId, setActiveDocId] = useState<string>("");
  const [objectsByDoc, setObjectsByDoc] = useState<Record<string, EditorObject[]>>({});
  const [tool, setTool] = useState<EditorTool>("select");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [showSignaturePad, setShowSignaturePad] = useState(false);

  const pendingImage = useRef<{ src: string; format: "png" | "jpg"; w: number; h: number } | null>(null);
  const pendingSignature = useRef<{ src: string; w: number; h: number } | null>(null);

  // history stacks per document
  const history = useRef<Record<string, EditorObject[][]>>({});
  const future = useRef<Record<string, EditorObject[][]>>({});

  // Find & replace
  const [findQuery, setFindQuery] = useState("");
  const [replaceValue, setReplaceValue] = useState("");
  const [findCount, setFindCount] = useState<number | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeDoc = useMemo(
    () => docs.find((d) => d.id === activeDocId) ?? null,
    [docs, activeDocId]
  );
  const objects = objectsByDoc[activeDocId] ?? [];
  const selected = objects.find((o) => o.id === selectedId) ?? null;

  const setObjects = useCallback(
    (updater: (prev: EditorObject[]) => EditorObject[], record = true) => {
      setObjectsByDoc((prev) => {
        const current = prev[activeDocId] ?? [];
        if (record) {
          history.current[activeDocId] = [
            ...(history.current[activeDocId] ?? []),
            current,
          ];
          future.current[activeDocId] = [];
        }
        return { ...prev, [activeDocId]: updater(current) };
      });
    },
    [activeDocId]
  );

  const undo = useCallback(() => {
    const stack = history.current[activeDocId] ?? [];
    if (!stack.length) return;
    const prevState = stack[stack.length - 1];
    history.current[activeDocId] = stack.slice(0, -1);
    setObjectsByDoc((prev) => {
      future.current[activeDocId] = [
        prev[activeDocId] ?? [],
        ...(future.current[activeDocId] ?? []),
      ];
      return { ...prev, [activeDocId]: prevState };
    });
    setSelectedId(null);
  }, [activeDocId]);

  const redo = useCallback(() => {
    const stack = future.current[activeDocId] ?? [];
    if (!stack.length) return;
    const nextState = stack[0];
    future.current[activeDocId] = stack.slice(1);
    setObjectsByDoc((prev) => {
      history.current[activeDocId] = [
        ...(history.current[activeDocId] ?? []),
        prev[activeDocId] ?? [],
      ];
      return { ...prev, [activeDocId]: nextState };
    });
    setSelectedId(null);
  }, [activeDocId]);

  const deleteSelected = useCallback(() => {
    if (!selectedId) return;
    setObjects((prev) => prev.filter((o) => o.id !== selectedId));
    setSelectedId(null);
  }, [selectedId, setObjects]);

  // Keyboard: delete + undo/redo
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const typing =
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable;
      if ((e.key === "Delete" || e.key === "Backspace") && !typing) {
        e.preventDefault();
        deleteSelected();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "z" && !typing) {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "y" && !typing) {
        e.preventDefault();
        redo();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [deleteSelected, undo, redo]);

  // ---------------- File loading ----------------

  const openFiles = useCallback(
    async (fileList: FileList | null) => {
      if (!fileList || !fileList.length) return;
      const incoming = Array.from(fileList).filter((f) =>
        f.type.includes("pdf") || f.name.toLowerCase().endsWith(".pdf")
      );
      if (!incoming.length) return;
      setError("");

      const total = docs.length + incoming.length;
      if (!isFileCountAllowed(entitlements, total)) {
        setError(
          `Your plan allows ${entitlements.maxInputFiles} PDF${
            entitlements.maxInputFiles === 1 ? "" : "s"
          } in the editor. You tried to open ${total}. Upgrade to edit more at once.`
        );
        return;
      }
      for (const f of incoming) {
        if (
          entitlements.maxFileSizeBytes > 0 &&
          f.size > entitlements.maxFileSizeBytes
        ) {
          setError(
            `"${f.name}" exceeds the ${Math.round(
              entitlements.maxFileSizeBytes / 1024 / 1024
            )} MB limit for your plan.`
          );
          return;
        }
      }

      setLoading(true);
      try {
        const { loadEditorDocument } = await import("@/lib/editor/loader");
        const loaded: EditorDocument[] = [];
        for (const f of incoming) {
          const doc = await loadEditorDocument(f);
          if (entitlements.maxPages > 0 && doc.pages.length > entitlements.maxPages) {
            setError(
              `"${f.name}" has ${doc.pages.length} pages; your plan allows ${entitlements.maxPages}.`
            );
            setLoading(false);
            return;
          }
          loaded.push(doc);
        }
        setDocs((prev) => [...prev, ...loaded]);
        setObjectsByDoc((prev) => {
          const next = { ...prev };
          for (const d of loaded) next[d.id] = next[d.id] ?? [];
          return next;
        });
        if (!activeDocId && loaded[0]) setActiveDocId(loaded[0].id);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not open PDF.");
      } finally {
        setLoading(false);
      }
    },
    [docs.length, entitlements, activeDocId]
  );

  // ---------------- Object creation ----------------

  function makeDefaultObject(
    type: EditorTool,
    page: number,
    x: number,
    y: number
  ): EditorObject | null {
    const base = { id: newId(), page, x, y };
    switch (type) {
      case "text":
        return {
          ...base,
          type: "text",
          width: 200,
          height: 24,
          text: "Text",
          fontFamily: "Helvetica",
          fontSize: 16,
          bold: false,
          italic: false,
          color: "#111827",
          align: "left",
          opacity: 1,
        };
      case "field-text":
        return {
          ...base,
          type: "field-text",
          width: 160,
          height: 24,
          name: `field_${objCounter}`,
          value: "",
          fontSize: 12,
        };
      case "field-checkbox":
        return {
          ...base,
          type: "field-checkbox",
          width: 18,
          height: 18,
          name: `check_${objCounter}`,
          checked: false,
        };
      case "link":
        return {
          ...base,
          type: "link",
          width: 120,
          height: 18,
          url: "https://",
          label: "Link",
        };
      case "image": {
        const p = pendingImage.current;
        if (!p) return null;
        const w = 180;
        const h = (p.h / p.w) * w;
        return {
          ...base,
          type: "image",
          width: w,
          height: h,
          src: p.src,
          format: p.format,
          opacity: 1,
        };
      }
      case "signature": {
        const p = pendingSignature.current;
        if (!p) return null;
        const w = 160;
        const h = (p.h / p.w) * w;
        return { ...base, type: "signature", width: w, height: h, src: p.src };
      }
      default:
        return null;
    }
  }

  // ---------------- Pointer interactions ----------------

  const interaction = useRef<
    | null
    | {
        kind: "create" | "move" | "resize";
        id: string;
        startX: number;
        startY: number;
        origX: number;
        origY: number;
        origW: number;
        origH: number;
      }
  >(null);

  function pageCoords(e: React.PointerEvent, pageEl: HTMLElement) {
    const rect = pageEl.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / zoom,
      y: (e.clientY - rect.top) / zoom,
    };
  }

  function onPagePointerDown(e: React.PointerEvent, pageIndex: number) {
    if (e.button !== 0) return;
    const pageEl = e.currentTarget as HTMLElement;
    const { x, y } = pageCoords(e, pageEl);

    if (tool === "select") {
      setSelectedId(null);
      return;
    }

    // image/signature require a pending asset
    if (tool === "image" && !pendingImage.current) {
      imageInputRef.current?.click();
      return;
    }
    if (tool === "signature" && !pendingSignature.current) {
      setShowSignaturePad(true);
      return;
    }

    if (DRAG_TOOLS.includes(tool)) {
      const id = newId();
      const color =
        tool === "highlight" ? "#fde047" : tool === "underline" || tool === "strikethrough" ? "#dc2626" : "#2563eb";
      let obj: EditorObject;
      if (tool === "whiteout") {
        obj = { id, type: "whiteout", page: pageIndex, x, y, width: 1, height: 1 };
      } else if (tool === "shape-rect" || tool === "shape-ellipse") {
        obj = {
          id,
          type: tool,
          page: pageIndex,
          x,
          y,
          width: 1,
          height: 1,
          strokeColor: "#2563eb",
          fillColor: null,
          strokeWidth: 1.5,
          opacity: 1,
        };
      } else {
        obj = {
          id,
          type: tool as "highlight" | "strikethrough" | "underline",
          page: pageIndex,
          x,
          y,
          width: 1,
          height: tool === "highlight" ? 16 : 14,
          color,
        };
      }
      setObjects((prev) => [...prev, obj]);
      setSelectedId(id);
      interaction.current = {
        kind: "create",
        id,
        startX: x,
        startY: y,
        origX: x,
        origY: y,
        origW: 1,
        origH: obj.height,
      };
      attachWindowListeners();
      return;
    }

    // click-to-place tools
    const obj = makeDefaultObject(tool, pageIndex, x, y);
    if (!obj) return;
    pendingImage.current = null;
    pendingSignature.current = null;
    setObjects((prev) => [...prev, obj]);
    setSelectedId(obj.id);
    setTool("select");
  }

  function beginMove(e: React.PointerEvent, obj: EditorObject) {
    if (tool !== "select") return;
    e.stopPropagation();
    setSelectedId(obj.id);
    interaction.current = {
      kind: "move",
      id: obj.id,
      startX: e.clientX,
      startY: e.clientY,
      origX: obj.x,
      origY: obj.y,
      origW: obj.width,
      origH: obj.height,
    };
    attachWindowListeners();
  }

  function beginResize(e: React.PointerEvent, obj: EditorObject) {
    e.stopPropagation();
    setSelectedId(obj.id);
    interaction.current = {
      kind: "resize",
      id: obj.id,
      startX: e.clientX,
      startY: e.clientY,
      origX: obj.x,
      origY: obj.y,
      origW: obj.width,
      origH: obj.height,
    };
    attachWindowListeners();
  }

  const attachWindowListeners = useCallback(() => {
    function onMove(e: PointerEvent) {
      const it = interaction.current;
      if (!it) return;
      if (it.kind === "create") {
        updateCreateFromPointer(e);
        return;
      }
      setObjectsByDoc((prev) => {
        const list = prev[activeDocId] ?? [];
        return {
          ...prev,
          [activeDocId]: list.map((o) => {
            if (o.id !== it.id) return o;
            const dx = (e.clientX - it.startX) / zoom;
            const dy = (e.clientY - it.startY) / zoom;
            if (it.kind === "move") {
              return {
                ...o,
                x: Math.max(0, it.origX + dx),
                y: Math.max(0, it.origY + dy),
              };
            }
            // resize
            return {
              ...o,
              width: Math.max(6, it.origW + dx),
              height: Math.max(6, it.origH + dy),
            };
          }),
        };
      });
    }
    function onUp() {
      interaction.current = null;
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    }
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeDocId, zoom]);

  const createPageRef = useRef<HTMLElement | null>(null);
  function updateCreateFromPointer(e: PointerEvent) {
    const it = interaction.current;
    const pageEl = createPageRef.current;
    if (!it || !pageEl) return;
    const rect = pageEl.getBoundingClientRect();
    const px = (e.clientX - rect.left) / zoom;
    const py = (e.clientY - rect.top) / zoom;
    const x = Math.min(it.startX, px);
    const y = Math.min(it.startY, py);
    const width = Math.max(2, Math.abs(px - it.startX));
    setObjectsByDoc((prev) => {
      const list = prev[activeDocId] ?? [];
      return {
        ...prev,
        [activeDocId]: list.map((o) => {
          if (o.id !== it.id) return o;
          const isLine =
            o.type === "underline" || o.type === "strikethrough";
          const height = isLine ? o.height : Math.max(2, Math.abs(py - it.startY));
          return { ...o, x, y, width, height };
        }),
      };
    });
  }

  // ---------------- Property updates ----------------

  function patchSelected(patch: ObjectPatch) {
    if (!selectedId) return;
    setObjects((prev) =>
      prev.map((o) => (o.id === selectedId ? ({ ...o, ...patch } as EditorObject) : o))
    );
  }

  // ---------------- Image / signature intake ----------------

  function onImageChosen(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const src = String(reader.result);
      const img = new Image();
      img.onload = () => {
        pendingImage.current = {
          src,
          format: file.type.includes("png") ? "png" : "jpg",
          w: img.width,
          h: img.height,
        };
        setNotice("Click on a page to place the image.");
        setTool("image");
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  }

  function onSignatureConfirmed(dataUrl: string) {
    const img = new Image();
    img.onload = () => {
      pendingSignature.current = { src: dataUrl, w: img.width, h: img.height };
      setShowSignaturePad(false);
      setNotice("Click on a page to place your signature.");
      setTool("signature");
    };
    img.src = dataUrl;
  }

  // ---------------- Find & replace ----------------

  const runFind = useCallback(async () => {
    if (!activeDoc || !findQuery.trim()) return;
    const { findTextMatches } = await import("@/lib/editor/loader");
    const matches = await findTextMatches(activeDoc.bytes, findQuery);
    setFindCount(matches.length);
    setNotice(`${matches.length} match${matches.length === 1 ? "" : "es"} found.`);
  }, [activeDoc, findQuery]);

  const runReplace = useCallback(async () => {
    if (!activeDoc || !findQuery.trim()) return;
    const { findTextMatches } = await import("@/lib/editor/loader");
    const matches = await findTextMatches(activeDoc.bytes, findQuery);
    if (!matches.length) {
      setNotice("No matches to replace.");
      return;
    }
    const additions: EditorObject[] = [];
    for (const m of matches) {
      additions.push({
        id: newId(),
        type: "whiteout",
        page: m.page,
        x: m.x - 1,
        y: m.y - 1,
        width: m.width + 2,
        height: m.height + 2,
      });
      additions.push({
        id: newId(),
        type: "text",
        page: m.page,
        x: m.x,
        y: m.y,
        width: Math.max(40, m.width + 20),
        height: m.height,
        text: replaceValue,
        fontFamily: "Helvetica",
        fontSize: Math.max(8, m.height / 1.3),
        bold: false,
        italic: false,
        color: "#111827",
        align: "left",
        opacity: 1,
      });
    }
    setObjects((prev) => [...prev, ...additions]);
    setNotice(`Replaced ${matches.length} occurrence(s). Review before applying.`);
    setFindCount(matches.length);
  }, [activeDoc, findQuery, replaceValue, setObjects]);

  // ---------------- Export ----------------

  const applyAndDownload = useCallback(async () => {
    if (!activeDoc) return;
    setExporting(true);
    setError("");
    try {
      const { bakeEditsToPdf } = await import("@/lib/editor/export");
      const result = await bakeEditsToPdf(
        activeDoc.bytes,
        activeDoc.fileName,
        objectsByDoc[activeDoc.id] ?? []
      );
      const blob = new Blob([result.bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setNotice("Exported successfully.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Export failed.");
    } finally {
      setExporting(false);
    }
  }, [activeDoc, objectsByDoc]);

  // ---------------- Render ----------------

  if (!docs.length) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16">
        <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white p-12 text-center">
          <h2 className="text-2xl font-bold">Pro PDF Editor</h2>
          <p className="mt-2 text-slate-600">
            Edit text, add images, links, shapes, whiteout, annotations, form
            fields and signatures — all in your browser.
          </p>
          <p className="mt-1 text-sm text-slate-500">
            Plan: <span className="font-semibold">{entitlements.plan}</span> ·{" "}
            {entitlements.maxInputFiles === 0
              ? "Unlimited PDFs"
              : `Up to ${entitlements.maxInputFiles} PDF${
                  entitlements.maxInputFiles === 1 ? "" : "s"
                } at once`}
          </p>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="mt-6 rounded-lg bg-brand-600 px-6 py-3 font-semibold text-white hover:bg-brand-700"
          >
            {loading ? "Opening…" : "Upload PDF"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            multiple={entitlements.multiFileEnabled}
            className="hidden"
            onChange={(e) => openFiles(e.target.files)}
          />
          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-4rem)] flex-col">
      {/* Top bar */}
      <div className="flex flex-wrap items-center gap-2 border-b bg-white px-3 py-2">
        <span className="font-bold">
          Pro <span className="text-brand-600">Editor</span>
        </span>
        <div className="mx-2 flex gap-1">
          <button onClick={undo} className="rounded px-2 py-1 text-sm hover:bg-slate-100" title="Undo">
            ↶ Undo
          </button>
          <button onClick={redo} className="rounded px-2 py-1 text-sm hover:bg-slate-100" title="Redo">
            ↷ Redo
          </button>
        </div>
        <div className="flex items-center gap-1 text-sm">
          <button
            onClick={() => setZoom((z) => Math.max(0.5, +(z - 0.1).toFixed(2)))}
            className="rounded px-2 py-1 hover:bg-slate-100"
          >
            −
          </button>
          <span className="w-12 text-center">{Math.round(zoom * 100)}%</span>
          <button
            onClick={() => setZoom((z) => Math.min(2, +(z + 0.1).toFixed(2)))}
            className="rounded px-2 py-1 hover:bg-slate-100"
          >
            +
          </button>
        </div>

        {docs.length > 1 && (
          <select
            value={activeDocId}
            onChange={(e) => {
              setActiveDocId(e.target.value);
              setSelectedId(null);
            }}
            className="rounded border border-slate-300 px-2 py-1 text-sm"
          >
            {docs.map((d) => (
              <option key={d.id} value={d.id}>
                {d.fileName}
              </option>
            ))}
          </select>
        )}

        <div className="ml-auto flex items-center gap-2">
          {entitlements.multiFileEnabled && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="rounded-lg border px-3 py-1.5 text-sm font-medium hover:bg-slate-50"
            >
              + Add PDF
            </button>
          )}
          <button
            onClick={applyAndDownload}
            disabled={exporting}
            className="rounded-lg bg-brand-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
          >
            {exporting ? "Applying…" : "Apply changes & download"}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="application/pdf"
            multiple={entitlements.multiFileEnabled}
            className="hidden"
            onChange={(e) => openFiles(e.target.files)}
          />
        </div>
      </div>

      {(error || notice) && (
        <div
          className={`px-3 py-1.5 text-sm ${
            error ? "bg-red-50 text-red-700" : "bg-brand-50 text-brand-700"
          }`}
        >
          {error || notice}
        </div>
      )}

      <div className="flex min-h-0 flex-1">
        {/* Left toolbar */}
        <div className="w-16 shrink-0 overflow-y-auto border-r bg-white py-2">
          {TOOLS.map((t) => (
            <button
              key={t.tool}
              title={t.hint}
              onClick={() => {
                setTool(t.tool);
                if (t.tool === "image") imageInputRef.current?.click();
                if (t.tool === "signature") setShowSignaturePad(true);
              }}
              className={`flex w-full flex-col items-center gap-0.5 px-1 py-2 text-[10px] ${
                tool === t.tool
                  ? "bg-brand-50 text-brand-700"
                  : "text-slate-600 hover:bg-slate-50"
              }`}
            >
              <span className="text-lg leading-none">{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* Canvas */}
        <div className="min-w-0 flex-1 overflow-auto bg-slate-100 p-6">
          <div className="mx-auto flex flex-col items-center gap-6">
            {activeDoc?.pages.map((pg) => {
              const pageObjects = objects.filter((o) => o.page === pg.index);
              return (
                <div
                  key={pg.index}
                  className="relative shadow-lg"
                  style={{
                    width: pg.widthPts * zoom,
                    height: pg.heightPts * zoom,
                    cursor: tool === "select" ? "default" : "crosshair",
                  }}
                  onPointerDown={(e) => {
                    createPageRef.current = e.currentTarget;
                    onPagePointerDown(e, pg.index);
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={pg.preview}
                    alt={`Page ${pg.index}`}
                    draggable={false}
                    className="pointer-events-none absolute inset-0 h-full w-full select-none"
                  />
                  {pageObjects.map((o) => (
                    <ObjectView
                      key={o.id}
                      obj={o}
                      zoom={zoom}
                      selected={o.id === selectedId}
                      onPointerDown={(e) => beginMove(e, o)}
                      onResizeStart={(e) => beginResize(e, o)}
                    />
                  ))}
                  <span className="absolute -top-5 left-0 text-xs text-slate-400">
                    Page {pg.index}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Properties panel */}
        <div className="w-72 shrink-0 overflow-y-auto border-l bg-white p-4">
          <FindReplacePanel
            findQuery={findQuery}
            replaceValue={replaceValue}
            findCount={findCount}
            onFindChange={setFindQuery}
            onReplaceChange={setReplaceValue}
            onFind={runFind}
            onReplace={runReplace}
          />
          <hr className="my-4" />
          {selected ? (
            <PropertiesPanel
              obj={selected}
              onPatch={patchSelected}
              onDelete={deleteSelected}
            />
          ) : (
            <p className="text-sm text-slate-500">
              Select an object to edit its properties, or pick a tool and click a
              page.
            </p>
          )}
        </div>
      </div>

      <input
        ref={imageInputRef}
        type="file"
        accept="image/png,image/jpeg"
        className="hidden"
        onChange={onImageChosen}
      />
      {showSignaturePad && (
        <SignaturePad
          onCancel={() => setShowSignaturePad(false)}
          onConfirm={onSignatureConfirmed}
        />
      )}
    </div>
  );
}

// ---------------- Object rendering ----------------

function ObjectView({
  obj,
  zoom,
  selected,
  onPointerDown,
  onResizeStart,
}: {
  obj: EditorObject;
  zoom: number;
  selected: boolean;
  onPointerDown: (e: React.PointerEvent) => void;
  onResizeStart: (e: React.PointerEvent) => void;
}) {
  const style: React.CSSProperties = {
    position: "absolute",
    left: obj.x * zoom,
    top: obj.y * zoom,
    width: obj.width * zoom,
    height: obj.height * zoom,
    outline: selected ? "1.5px solid #2563eb" : "none",
    cursor: "move",
  };

  let inner: React.ReactNode = null;
  switch (obj.type) {
    case "text":
      inner = (
        <div
          style={{
            fontFamily:
              obj.fontFamily === "Times"
                ? "Georgia, serif"
                : obj.fontFamily === "Courier"
                ? "monospace"
                : "Arial, sans-serif",
            fontSize: obj.fontSize * zoom,
            fontWeight: obj.bold ? 700 : 400,
            fontStyle: obj.italic ? "italic" : "normal",
            color: obj.color,
            textAlign: obj.align,
            opacity: obj.opacity,
            width: "100%",
            height: "100%",
            overflow: "hidden",
            lineHeight: 1.2,
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
          }}
        >
          {obj.text}
        </div>
      );
      break;
    case "whiteout":
      inner = <div style={{ width: "100%", height: "100%", background: "#fff" }} />;
      break;
    case "shape-rect":
      inner = (
        <div
          style={{
            width: "100%",
            height: "100%",
            border: `${obj.strokeWidth * zoom}px solid ${obj.strokeColor}`,
            background: obj.fillColor ?? "transparent",
            opacity: obj.opacity,
          }}
        />
      );
      break;
    case "shape-ellipse":
      inner = (
        <div
          style={{
            width: "100%",
            height: "100%",
            borderRadius: "50%",
            border: `${obj.strokeWidth * zoom}px solid ${obj.strokeColor}`,
            background: obj.fillColor ?? "transparent",
            opacity: obj.opacity,
          }}
        />
      );
      break;
    case "highlight":
      inner = (
        <div style={{ width: "100%", height: "100%", background: obj.color, opacity: 0.4 }} />
      );
      break;
    case "strikethrough":
      inner = (
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: 0,
              right: 0,
              height: 2,
              background: obj.color,
            }}
          />
        </div>
      );
      break;
    case "underline":
      inner = (
        <div style={{ position: "relative", width: "100%", height: "100%" }}>
          <div
            style={{
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              height: 2,
              background: obj.color,
            }}
          />
        </div>
      );
      break;
    case "link":
      inner = (
        <div
          style={{
            color: "#1769d9",
            textDecoration: "underline",
            fontSize: 12 * zoom,
            overflow: "hidden",
          }}
        >
          {obj.label || obj.url}
        </div>
      );
      break;
    case "image":
    case "signature":
      inner = (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={obj.src}
          alt="object"
          draggable={false}
          style={{ width: "100%", height: "100%", objectFit: "fill", opacity: obj.type === "image" ? obj.opacity : 1 }}
        />
      );
      break;
    case "field-text":
      inner = (
        <div
          style={{
            width: "100%",
            height: "100%",
            border: "1px solid #94a3b8",
            background: "rgba(219,234,254,0.5)",
            fontSize: obj.fontSize * zoom,
            padding: 2,
            overflow: "hidden",
            color: "#334155",
          }}
        >
          {obj.value || obj.name}
        </div>
      );
      break;
    case "field-checkbox":
      inner = (
        <div
          style={{
            width: "100%",
            height: "100%",
            border: "1px solid #94a3b8",
            background: "rgba(219,234,254,0.5)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: obj.height * zoom * 0.8,
          }}
        >
          {obj.checked ? "✓" : ""}
        </div>
      );
      break;
  }

  return (
    <div style={style} onPointerDown={onPointerDown}>
      {inner}
      {selected && (
        <span
          onPointerDown={onResizeStart}
          style={{
            position: "absolute",
            right: -5,
            bottom: -5,
            width: 10,
            height: 10,
            background: "#2563eb",
            borderRadius: 2,
            cursor: "nwse-resize",
          }}
        />
      )}
    </div>
  );
}

// ---------------- Properties panel ----------------

function PropertiesPanel({
  obj,
  onPatch,
  onDelete,
}: {
  obj: EditorObject;
  onPatch: (patch: ObjectPatch) => void;
  onDelete: () => void;
}) {
  return (
    <div className="space-y-3 text-sm">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold capitalize">{obj.type.replace("-", " ")}</h3>
        <button
          onClick={onDelete}
          className="rounded px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
        >
          Delete
        </button>
      </div>

      {obj.type === "text" && (
        <TextProps obj={obj} onPatch={onPatch} />
      )}

      {obj.type === "link" && (
        <>
          <Field label="Label">
            <input
              className="w-full rounded border px-2 py-1"
              value={obj.label}
              onChange={(e) => onPatch({ label: e.target.value })}
            />
          </Field>
          <Field label="URL (leave blank for page link)">
            <input
              className="w-full rounded border px-2 py-1"
              value={obj.url ?? ""}
              onChange={(e) => onPatch({ url: e.target.value })}
            />
          </Field>
          <Field label="Target page (for internal link)">
            <input
              type="number"
              min={1}
              className="w-full rounded border px-2 py-1"
              value={obj.targetPage ?? ""}
              onChange={(e) =>
                onPatch({ targetPage: e.target.value ? Number(e.target.value) : undefined })
              }
            />
          </Field>
        </>
      )}

      {(obj.type === "shape-rect" || obj.type === "shape-ellipse") && (
        <>
          <Field label="Border color">
            <input
              type="color"
              value={obj.strokeColor}
              onChange={(e) => onPatch({ strokeColor: e.target.value })}
            />
          </Field>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={obj.fillColor != null}
              onChange={(e) => onPatch({ fillColor: e.target.checked ? "#93c5fd" : null })}
            />
            Fill
          </label>
          {obj.fillColor != null && (
            <Field label="Fill color">
              <input
                type="color"
                value={obj.fillColor}
                onChange={(e) => onPatch({ fillColor: e.target.value })}
              />
            </Field>
          )}
          <Field label="Border width">
            <input
              type="number"
              min={0.5}
              step={0.5}
              className="w-full rounded border px-2 py-1"
              value={obj.strokeWidth}
              onChange={(e) => onPatch({ strokeWidth: Number(e.target.value) })}
            />
          </Field>
        </>
      )}

      {(obj.type === "highlight" ||
        obj.type === "strikethrough" ||
        obj.type === "underline") && (
        <Field label="Color">
          <input
            type="color"
            value={obj.color}
            onChange={(e) => onPatch({ color: e.target.value })}
          />
        </Field>
      )}

      {obj.type === "image" && (
        <Field label={`Opacity ${Math.round(obj.opacity * 100)}%`}>
          <input
            type="range"
            min={0.1}
            max={1}
            step={0.05}
            value={obj.opacity}
            onChange={(e) => onPatch({ opacity: Number(e.target.value) })}
            className="w-full"
          />
        </Field>
      )}

      {obj.type === "field-text" && (
        <>
          <Field label="Field name">
            <input
              className="w-full rounded border px-2 py-1"
              value={obj.name}
              onChange={(e) => onPatch({ name: e.target.value })}
            />
          </Field>
          <Field label="Default value">
            <input
              className="w-full rounded border px-2 py-1"
              value={obj.value}
              onChange={(e) => onPatch({ value: e.target.value })}
            />
          </Field>
        </>
      )}

      {obj.type === "field-checkbox" && (
        <>
          <Field label="Field name">
            <input
              className="w-full rounded border px-2 py-1"
              value={obj.name}
              onChange={(e) => onPatch({ name: e.target.value })}
            />
          </Field>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={obj.checked}
              onChange={(e) => onPatch({ checked: e.target.checked })}
            />
            Checked by default
          </label>
        </>
      )}

      <PositionProps obj={obj} onPatch={onPatch} />
    </div>
  );
}

function TextProps({
  obj,
  onPatch,
}: {
  obj: TextObject;
  onPatch: (patch: ObjectPatch) => void;
}) {
  return (
    <>
      <Field label="Text">
        <textarea
          rows={3}
          className="w-full rounded border px-2 py-1"
          value={obj.text}
          onChange={(e) => onPatch({ text: e.target.value })}
        />
      </Field>
      <Field label="Font">
        <select
          className="w-full rounded border px-2 py-1"
          value={obj.fontFamily}
          onChange={(e) => onPatch({ fontFamily: e.target.value as FontFamily })}
        >
          {(Object.keys(FONT_LABELS) as FontFamily[]).map((f) => (
            <option key={f} value={f}>
              {FONT_LABELS[f]}
            </option>
          ))}
        </select>
      </Field>
      <div className="flex gap-2">
        <Field label="Size">
          <input
            type="number"
            min={6}
            max={144}
            className="w-20 rounded border px-2 py-1"
            value={obj.fontSize}
            onChange={(e) => onPatch({ fontSize: Number(e.target.value) })}
          />
        </Field>
        <Field label="Color">
          <input
            type="color"
            value={obj.color}
            onChange={(e) => onPatch({ color: e.target.value })}
          />
        </Field>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onPatch({ bold: !obj.bold })}
          className={`rounded border px-3 py-1 font-bold ${obj.bold ? "bg-brand-50" : ""}`}
        >
          B
        </button>
        <button
          onClick={() => onPatch({ italic: !obj.italic })}
          className={`rounded border px-3 py-1 italic ${obj.italic ? "bg-brand-50" : ""}`}
        >
          I
        </button>
        <select
          className="rounded border px-2 py-1"
          value={obj.align}
          onChange={(e) => onPatch({ align: e.target.value as TextObject["align"] })}
        >
          <option value="left">Left</option>
          <option value="center">Center</option>
          <option value="right">Right</option>
        </select>
      </div>
      <Field label={`Opacity ${Math.round(obj.opacity * 100)}%`}>
        <input
          type="range"
          min={0.1}
          max={1}
          step={0.05}
          value={obj.opacity}
          onChange={(e) => onPatch({ opacity: Number(e.target.value) })}
          className="w-full"
        />
      </Field>
    </>
  );
}

function PositionProps({
  obj,
  onPatch,
}: {
  obj: EditorObject;
  onPatch: (patch: ObjectPatch) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 border-t pt-3 text-xs">
      <Field label="X">
        <input
          type="number"
          className="w-full rounded border px-2 py-1"
          value={Math.round(obj.x)}
          onChange={(e) => onPatch({ x: Number(e.target.value) })}
        />
      </Field>
      <Field label="Y">
        <input
          type="number"
          className="w-full rounded border px-2 py-1"
          value={Math.round(obj.y)}
          onChange={(e) => onPatch({ y: Number(e.target.value) })}
        />
      </Field>
      <Field label="W">
        <input
          type="number"
          className="w-full rounded border px-2 py-1"
          value={Math.round(obj.width)}
          onChange={(e) => onPatch({ width: Number(e.target.value) })}
        />
      </Field>
      <Field label="H">
        <input
          type="number"
          className="w-full rounded border px-2 py-1"
          value={Math.round(obj.height)}
          onChange={(e) => onPatch({ height: Number(e.target.value) })}
        />
      </Field>
    </div>
  );
}

function FindReplacePanel({
  findQuery,
  replaceValue,
  findCount,
  onFindChange,
  onReplaceChange,
  onFind,
  onReplace,
}: {
  findQuery: string;
  replaceValue: string;
  findCount: number | null;
  onFindChange: (v: string) => void;
  onReplaceChange: (v: string) => void;
  onFind: () => void;
  onReplace: () => void;
}) {
  return (
    <div className="space-y-2 text-sm">
      <h3 className="font-semibold">Find &amp; replace</h3>
      <input
        className="w-full rounded border px-2 py-1"
        placeholder="Find text"
        value={findQuery}
        onChange={(e) => onFindChange(e.target.value)}
      />
      <input
        className="w-full rounded border px-2 py-1"
        placeholder="Replace with"
        value={replaceValue}
        onChange={(e) => onReplaceChange(e.target.value)}
      />
      <div className="flex gap-2">
        <button
          onClick={onFind}
          className="flex-1 rounded border px-2 py-1 font-medium hover:bg-slate-50"
        >
          Find
        </button>
        <button
          onClick={onReplace}
          className="flex-1 rounded bg-brand-600 px-2 py-1 font-medium text-white hover:bg-brand-700"
        >
          Replace all
        </button>
      </div>
      {findCount != null && (
        <p className="text-xs text-slate-500">{findCount} match(es)</p>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-slate-600">{label}</span>
      {children}
    </label>
  );
}
