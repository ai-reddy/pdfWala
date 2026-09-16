import type { Metadata } from "next";
import Link from "next/link";
import { AgeCalculator } from "@/components/tools/AgeCalculator";

export const metadata: Metadata = {
  title: "Age Calculator — pdfWala",
  description: "Calendar-aware age in years, months and days, plus next birthday.",
};

export default function Page() {
  return (
    <div>
      <div className="mx-auto max-w-2xl px-4 pt-4">
        <Link href="/" className="text-sm text-slate-500 hover:text-brand-600">
          ← All tools
        </Link>
      </div>
      <AgeCalculator />
    </div>
  );
}
