import type { Metadata } from "next";
import Link from "next/link";
import { ImageCompressor } from "@/components/tools/ImageCompressor";

export const metadata: Metadata = {
  title: "Image Compressor — pdfWala",
  description: "Reduce image file size by quality or target size.",
};

export default function Page() {
  return (
    <div>
      <div className="mx-auto max-w-2xl px-4 pt-4">
        <Link href="/" className="text-sm text-slate-500 hover:text-brand-600">
          ← All tools
        </Link>
      </div>
      <ImageCompressor />
    </div>
  );
}
