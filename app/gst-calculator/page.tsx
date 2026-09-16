import type { Metadata } from "next";
import Link from "next/link";
import { GstCalculator } from "@/components/tools/GstCalculator";

export const metadata: Metadata = {
  title: "GST Calculator — pdfWala",
  description: "Add or remove GST, with CGST/SGST and IGST breakdowns.",
};

export default function Page() {
  return (
    <div>
      <div className="mx-auto max-w-2xl px-4 pt-4">
        <Link href="/" className="text-sm text-slate-500 hover:text-brand-600">
          ← All tools
        </Link>
      </div>
      <GstCalculator />
    </div>
  );
}
