import type { Metadata } from "next";
import Link from "next/link";
import { JsonTool } from "@/components/tools/JsonTool";

export const metadata: Metadata = {
  title: "JSON Validator — pdfWala",
  description: "Validate JSON syntax with line/column error details.",
};

export default function Page() {
  return (
    <div>
      <div className="mx-auto max-w-5xl px-4 pt-4">
        <Link href="/" className="text-sm text-slate-500 hover:text-brand-600">
          ← All tools
        </Link>
      </div>
      <JsonTool emphasis="validate" />
    </div>
  );
}
