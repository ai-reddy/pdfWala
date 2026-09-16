import type { Metadata } from "next";
import Link from "next/link";
import { DateDifferenceCalculator } from "@/components/tools/DateDifferenceCalculator";

export const metadata: Metadata = {
  title: "Date Difference — pdfWala",
  description: "Calendar difference and total days/weeks between two dates.",
};

export default function Page() {
  return (
    <div>
      <div className="mx-auto max-w-2xl px-4 pt-4">
        <Link href="/" className="text-sm text-slate-500 hover:text-brand-600">
          ← All tools
        </Link>
      </div>
      <DateDifferenceCalculator />
    </div>
  );
}
