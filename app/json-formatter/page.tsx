import type { Metadata } from "next";
import Link from "next/link";
import { JsonTool } from "@/components/tools/JsonTool";

export const metadata: Metadata = {
  title: "JSON Formatter — pdfWala",
  description: "Format, minify and validate JSON in your browser.",
};

export default function Page() {
  return (
    <div>
      <div className="mx-auto max-w-5xl px-4 pt-4">
        <Link href="/" className="text-sm text-slate-500 hover:text-brand-600">
          ← All tools
        </Link>
      </div>
      <JsonTool emphasis="format" />
    </div>
  );
}
