export interface DiscountResult {
  originalPrice: number;
  discountAmount: number;
  finalPrice: number;
}

export function calculateDiscount(price: number, ratePercent: number): DiscountResult {
  const discountAmount = (price * ratePercent) / 100;
  return { originalPrice: price, discountAmount, finalPrice: price - discountAmount };
}

// Sequential ("stacked") discounts must be applied one after another, not summed.
export function calculateSequentialDiscount(price: number, ratesPercent: number[]): DiscountResult {
  let current = price;
  for (const rate of ratesPercent) {
    current -= (current * rate) / 100;
  }
  return { originalPrice: price, discountAmount: price - current, finalPrice: current };
}

export function originalPriceFromFinal(finalPrice: number, ratePercent: number): number {
  if (ratePercent >= 100) throw new Error("Discount rate must be less than 100%.");
  return finalPrice / (1 - ratePercent / 100);
}

export function discountRateFromAmounts(originalPrice: number, finalPrice: number): number {
  if (originalPrice === 0) throw new Error("Original price cannot be 0.");
  return ((originalPrice - finalPrice) / originalPrice) * 100;
}
