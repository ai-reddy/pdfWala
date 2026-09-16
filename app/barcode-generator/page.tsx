import type { Metadata } from "next";
import Link from "next/link";
import { BarcodeGenerator } from "@/components/tools/BarcodeGenerator";

export const metadata: Metadata = {
  title: "Barcode Generator — pdfWala",
  description: "Generate CODE128, EAN, UPC, ITF and Codabar barcodes in your browser.",
};

export default function BarcodeGeneratorPage() {
  return (
    <div>
      <div className="mx-auto max-w-3xl px-4 pt-4">
        <Link href="/" className="text-sm text-slate-500 hover:text-brand-600">
          ← All tools
        </Link>
      </div>
      <BarcodeGenerator />
    </div>
  );
}
