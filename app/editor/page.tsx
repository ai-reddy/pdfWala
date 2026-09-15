import type { Metadata } from "next";
import Link from "next/link";
import { getEditorEntitlements } from "@/lib/editor/entitlements";
import { ProPdfEditor } from "@/components/editor/ProPdfEditor";

export const metadata: Metadata = {
  title: "Pro PDF Editor — pdfWala",
  description:
    "Edit PDF text, add images, links, shapes, whiteout, annotations, form fields and signatures directly in your browser.",
};

export default function EditorPage() {
  const entitlements = getEditorEntitlements();

  return (
    <div className="flex flex-col">
      <div className="mx-auto w-full max-w-6xl px-4 pt-4">
        <Link href="/" className="text-sm text-slate-500 hover:text-brand-600">
          ← All tools
        </Link>
      </div>
      <ProPdfEditor entitlements={entitlements} />
    </div>
  );
}
