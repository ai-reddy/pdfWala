import type { Metadata } from "next";
import Link from "next/link";
import { ImageConverter } from "@/components/tools/ImageConverter";

export const metadata: Metadata = {
  title: "JPG / PNG / WebP Converter — pdfWala",
  description: "Batch convert images between JPG, PNG and WebP.",
};

export default function Page() {
  return (
    <div>
      <div className="mx-auto max-w-2xl px-4 pt-4">
        <Link href="/" className="text-sm text-slate-500 hover:text-brand-600">
          ← All tools
        </Link>
      </div>
      <ImageConverter />
    </div>
  );
}
