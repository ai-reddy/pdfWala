import type { Metadata } from "next";
import Link from "next/link";
import { ResumeBuilder } from "@/components/tools/ResumeBuilder";

export const metadata: Metadata = {
  title: "Resume/CV PDF Builder — pdfWala",
  description: "Build a resume with templates, sections and a deterministic ATS check.",
};

export default function ResumeBuilderPage() {
  return (
    <div>
      <div className="mx-auto max-w-6xl px-4 pt-4">
        <Link href="/" className="text-sm text-slate-500 hover:text-brand-600">
          ← All tools
        </Link>
      </div>
      <ResumeBuilder />
    </div>
  );
}
