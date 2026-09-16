import type { Metadata } from "next";
import Link from "next/link";
import { TextCounter } from "@/components/tools/TextCounter";

export const metadata: Metadata = {
  title: "Character Counter — pdfWala",
  description: "Count characters, code points and lines with Unicode awareness.",
};

export default function Page() {
  return (
    <div>
      <div className="mx-auto max-w-3xl px-4 pt-4">
        <Link href="/" className="text-sm text-slate-500 hover:text-brand-600">
          ← All tools
        </Link>
      </div>
      <TextCounter />
    </div>
  );
}
