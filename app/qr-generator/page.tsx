import type { Metadata } from "next";
import Link from "next/link";
import { QrGenerator } from "@/components/tools/QrGenerator";

export const metadata: Metadata = {
  title: "QR Code Generator — pdfWala",
  description: "Generate QR codes for URLs, text, email, phone, SMS and Wi-Fi.",
};

export default function QrGeneratorPage() {
  return (
    <div>
      <div className="mx-auto max-w-3xl px-4 pt-4">
        <Link href="/" className="text-sm text-slate-500 hover:text-brand-600">
          ← All tools
        </Link>
      </div>
      <QrGenerator />
    </div>
  );
}
