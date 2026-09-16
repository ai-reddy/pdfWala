import type { Metadata } from "next";
import Link from "next/link";
import { ImageResizer } from "@/components/tools/ImageResizer";

export const metadata: Metadata = {
  title: "Image Resize — pdfWala",
  description: "Resize images by dimensions, percentage or preset.",
};

export default function Page() {
  return (
    <div>
      <div className="mx-auto max-w-3xl px-4 pt-4">
        <Link href="/" className="text-sm text-slate-500 hover:text-brand-600">
          ← All tools
        </Link>
      </div>
      <ImageResizer />
    </div>
  );
}
