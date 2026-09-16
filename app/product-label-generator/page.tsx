import type { Metadata } from "next";
import Link from "next/link";
import { ProductLabelGenerator } from "@/components/tools/ProductLabelGenerator";

export const metadata: Metadata = {
  title: "Product Label Generator — pdfWala",
  description: "Design printable product labels with barcode/QR, price and branding.",
};

export default function ProductLabelPage() {
  return (
    <div>
      <div className="mx-auto max-w-5xl px-4 pt-4">
        <Link href="/" className="text-sm text-slate-500 hover:text-brand-600">
          ← All tools
        </Link>
      </div>
      <ProductLabelGenerator />
    </div>
  );
}
