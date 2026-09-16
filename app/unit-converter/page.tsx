import type { Metadata } from "next";
import Link from "next/link";
import { UnitConverter } from "@/components/tools/UnitConverter";

export const metadata: Metadata = {
  title: "Unit Converter — pdfWala",
  description: "Convert length, area, volume, weight, temperature, data and more.",
};

export default function Page() {
  return (
    <div>
      <div className="mx-auto max-w-2xl px-4 pt-4">
        <Link href="/" className="text-sm text-slate-500 hover:text-brand-600">
          ← All tools
        </Link>
      </div>
      <UnitConverter />
    </div>
  );
}
