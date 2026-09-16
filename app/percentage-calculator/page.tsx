import type { Metadata } from "next";
import Link from "next/link";
import { PercentageCalculator } from "@/components/tools/PercentageCalculator";

export const metadata: Metadata = {
  title: "Percentage Calculator — pdfWala",
  description: "Calculate percentage of a value, percentage change, and reverse percentages.",
};

export default function Page() {
  return (
    <div>
      <div className="mx-auto max-w-2xl px-4 pt-4">
        <Link href="/" className="text-sm text-slate-500 hover:text-brand-600">
          ← All tools
        </Link>
      </div>
      <PercentageCalculator />
    </div>
  );
}
