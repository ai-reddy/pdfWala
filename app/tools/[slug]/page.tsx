import Link from "next/link";
import { notFound } from "next/navigation";
import { getToolBySlug, TOOLS } from "@/lib/tools/catalog";
import { ToolRunner } from "@/components/ToolRunner";

export function generateStaticParams() {
  return TOOLS.map((tool) => ({ slug: tool.slug }));
}

export default function ToolPage({ params }: { params: { slug: string } }) {
  const tool = getToolBySlug(params.slug);
  if (!tool) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <Link
        href="/"
        className="text-sm text-slate-500 hover:text-brand-600"
      >
        ← All tools
      </Link>

      <div className="mt-4 text-center">
        <h1 className="text-3xl font-extrabold tracking-tight">{tool.name}</h1>
        <p className="mt-2 text-slate-600">{tool.description}</p>
      </div>

      <div className="mt-8">
        {tool.implemented ? (
          <ToolRunner tool={tool} />
        ) : (
          <div className="rounded-xl border border-dashed bg-white p-10 text-center text-slate-500">
            This tool is on the roadmap and not available yet.
          </div>
        )}
      </div>
    </div>
  );
}
