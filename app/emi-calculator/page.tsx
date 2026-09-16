import type { Metadata } from "next";
import Link from "next/link";
import { EmiCalculator } from "@/components/tools/EmiCalculator";

export const metadata: Metadata = {
  title: "EMI Calculator — pdfWala",
  description: "Monthly loan EMI, total interest and amortization schedule.",
};

export default function Page() {
  return (
    <div>
      <div className="mx-auto max-w-3xl px-4 pt-4">
        <Link href="/" className="text-sm text-slate-500 hover:text-brand-600">
          ← All tools
        </Link>
      </div>
      <EmiCalculator />
    </div>
  );
}
