import type { Metadata } from "next";
import Link from "next/link";
import { DiscountCalculator } from "@/components/tools/DiscountCalculator";

export const metadata: Metadata = {
  title: "Discount Calculator — pdfWala",
  description: "Single or stacked sequential discounts, plus reverse calculations.",
};

export default function Page() {
  return (
    <div>
      <div className="mx-auto max-w-2xl px-4 pt-4">
        <Link href="/" className="text-sm text-slate-500 hover:text-brand-600">
          ← All tools
        </Link>
      </div>
      <DiscountCalculator />
    </div>
  );
}
