import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "pdfWala — Every PDF tool in one place",
  description:
    "Merge, split, compress, convert, edit, secure and apply AI to PDFs. Free and easy to use.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex flex-col">
        <header className="border-b bg-white">
          <div className="mx-auto max-w-6xl px-4 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white font-bold">
                P
              </span>
              <span className="text-xl font-bold tracking-tight">
                pdf<span className="text-brand-600">Wala</span>
              </span>
            </Link>
            <nav className="flex items-center gap-6 text-sm font-medium text-slate-600">
              <Link href="/" className="hover:text-brand-600">
                All Tools
              </Link>
              <a
                href="https://github.com"
                className="hidden sm:inline hover:text-brand-600"
              >
                Docs
              </a>
            </nav>
          </div>
        </header>

        <main className="flex-1">{children}</main>

        <footer className="border-t bg-white">
          <div className="mx-auto max-w-6xl px-4 py-6 text-sm text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
            <p>© {new Date().getFullYear()} pdfWala. Your PDF toolkit.</p>
            <p>Files are processed on demand and not stored permanently.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
