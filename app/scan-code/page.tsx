import type { Metadata } from "next";
import Link from "next/link";
import { CodeScanner } from "@/components/tools/CodeScanner";

export const metadata: Metadata = {
  title: "Barcode & QR Scanner — pdfWala",
  description: "Decode barcodes and QR codes from an image or your camera.",
};

export default function ScanCodePage() {
  return (
    <div>
      <div className="mx-auto max-w-3xl px-4 pt-4">
        <Link href="/" className="text-sm text-slate-500 hover:text-brand-600">
          ← All tools
        </Link>
      </div>
      <CodeScanner />
    </div>
  );
}
