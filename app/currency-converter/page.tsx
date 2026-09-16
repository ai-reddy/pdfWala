import type { Metadata } from "next";
import Link from "next/link";
import { CurrencyConverter } from "@/components/tools/CurrencyConverter";

export const metadata: Metadata = {
  title: "Currency Converter — pdfWala",
  description: "Convert between currencies using reference exchange rates.",
};

export default function Page() {
  return (
    <div>
      <div className="mx-auto max-w-2xl px-4 pt-4">
        <Link href="/" className="text-sm text-slate-500 hover:text-brand-600">
          ← All tools
        </Link>
      </div>
      <CurrencyConverter />
    </div>
  );
}
