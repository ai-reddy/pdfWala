import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

// Thin proxy over a free, no-API-key exchange rate provider (Frankfurter,
// backed by European Central Bank reference rates). Keeping this server-side
// avoids exposing a third-party dependency directly to the browser and gives
// us one place to add caching/fallback providers later (spec section 12).
const PROVIDER_BASE = "https://api.frankfurter.app";

export async function GET(req: NextRequest) {
  const base = (req.nextUrl.searchParams.get("base") ?? "USD").toUpperCase();

  try {
    const res = await fetch(`${PROVIDER_BASE}/latest?from=${encodeURIComponent(base)}`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      return NextResponse.json(
        { code: "RATE_UNAVAILABLE", message: "Exchange rate provider is unavailable." },
        { status: 502 }
      );
    }
    const data = (await res.json()) as { base: string; date: string; rates: Record<string, number> };
    return NextResponse.json({
      base: data.base,
      timestamp: new Date(data.date).toISOString(),
      rates: { ...data.rates, [data.base]: 1 },
      provider: "frankfurter.app",
    });
  } catch {
    return NextResponse.json(
      { code: "RATE_UNAVAILABLE", message: "Could not reach the exchange rate provider." },
      { status: 502 }
    );
  }
}
