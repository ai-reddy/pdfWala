import Link from "next/link";
import {
  TOOLS,
  CATEGORY_LABELS,
  CATEGORY_ORDER,
} from "@/lib/tools/catalog";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <section className="text-center py-8">
        <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
          Every tool you need to work with PDFs
        </h1>
        <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
          Merge, split, compress, convert, edit, and secure PDFs — right in your
          browser. Free and easy to use.
        </p>
      </section>

      {CATEGORY_ORDER.map((category) => {
        const tools = TOOLS.filter((t) => t.category === category);
        if (!tools.length) return null;
        return (
          <section key={category} className="mt-10">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-500 mb-4">
              {CATEGORY_LABELS[category]}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {tools.map((tool) => {
                const card = (
                  <div
                    className={`h-full rounded-xl border bg-white p-5 transition ${
                      tool.implemented
                        ? "hover:border-brand-400 hover:shadow-md"
                        : "opacity-70"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-slate-900">
                        {tool.name}
                      </h3>
                      <div className="flex gap-1">
                        {tool.isNew && (
                          <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-bold uppercase text-brand-700">
                            New
                          </span>
                        )}
                        {!tool.implemented && (
                          <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-500">
                            Soon
                          </span>
                        )}
                      </div>
                    </div>
                    <p className="mt-2 text-sm text-slate-500">
                      {tool.description}
                    </p>
                  </div>
                );

                return tool.implemented ? (
                  <Link key={tool.slug} href={`/tools/${tool.slug}`}>
                    {card}
                  </Link>
                ) : (
                  <div key={tool.slug} className="cursor-not-allowed">
                    {card}
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </div>
  );
}
