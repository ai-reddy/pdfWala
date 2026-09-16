// Currency conversion consumes a supplied rate rather than performing network
// access itself (spec section 36) — network retrieval lives in the API route
// and the client fetch helper below.
export interface ExchangeRates {
  base: string;
  timestamp: string;
  rates: Record<string, number>;
  provider: string;
}

export const COMMON_CURRENCIES = [
  "USD", "EUR", "GBP", "INR", "JPY", "AUD", "CAD", "CHF", "CNY", "SGD", "AED", "ZAR",
];

export function convertCurrency(amount: number, rates: ExchangeRates, toCurrency: string): number {
  const rate = rates.rates[toCurrency];
  if (rate === undefined) throw new Error(`Rate unavailable for ${toCurrency}.`);
  return amount * rate;
}
