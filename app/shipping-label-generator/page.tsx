import type { Metadata } from "next";
import Link from "next/link";
import { ShippingLabelGenerator } from "@/components/tools/ShippingLabelGenerator";

export const metadata: Metadata = {
  title: "Shipping Label Generator — pdfWala",
  description: "Create printable shipping labels with sender/recipient and tracking barcode.",
};

export default function ShippingLabelPage() {
  return (
    <div>
      <div className="mx-auto max-w-5xl px-4 pt-4">
        <Link href="/" className="text-sm text-slate-500 hover:text-brand-600">
          ← All tools
        </Link>
      </div>
      <ShippingLabelGenerator />
    </div>
  );
}
