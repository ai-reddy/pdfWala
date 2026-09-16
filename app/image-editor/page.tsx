import type { Metadata } from "next";
import Link from "next/link";
import { ImageEditor } from "@/components/tools/ImageEditor";

export const metadata: Metadata = {
  title: "Image Editor — pdfWala",
  description: "Crop, resize, rotate, flip, adjust and annotate images, then export.",
};

export default function ImageEditorPage() {
  return (
    <div>
      <div className="mx-auto max-w-6xl px-4 pt-4">
        <Link href="/" className="text-sm text-slate-500 hover:text-brand-600">
          ← All tools
        </Link>
      </div>
      <ImageEditor />
    </div>
  );
}
