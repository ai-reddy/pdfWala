// GST calculation with a versioned rate registry (spec section 6) rather than
// hard-coded rates in the UI. Rates below reflect commonly used India GST
// slabs at the time of writing and should be reviewed/updated periodically.
export interface GstRateEntry {
  rate: number;
  label: string;
}

export const GST_RATE_REGISTRY = {
  country: "IN",
  taxType: "GST",
  version: 1,
  effectiveFrom: "2024-04-01",
  rates: [
    { rate: 0, label: "0% (Exempt)" },
    { rate: 3, label: "3%" },
    { rate: 5, label: "5%" },
    { rate: 12, label: "12%" },
    { rate: 18, label: "18%" },
    { rate: 28, label: "28%" },
  ] as GstRateEntry[],
};

export interface GstBreakdown {
  base: number;
  gstAmount: number;
  total: number;
  cgst: number;
  sgst: number;
  igst: number;
}

export function addGst(baseAmount: number, rate: number, split: "intra" | "inter" = "intra"): GstBreakdown {
  const gstAmount = (baseAmount * rate) / 100;
  const total = baseAmount + gstAmount;
  return {
    base: baseAmount,
    gstAmount,
    total,
    cgst: split === "intra" ? gstAmount / 2 : 0,
    sgst: split === "intra" ? gstAmount / 2 : 0,
    igst: split === "inter" ? gstAmount : 0,
  };
}

export function removeGst(inclusiveAmount: number, rate: number, split: "intra" | "inter" = "intra"): GstBreakdown {
  const base = (inclusiveAmount * 100) / (100 + rate);
  const gstAmount = inclusiveAmount - base;
  return {
    base,
    gstAmount,
    total: inclusiveAmount,
    cgst: split === "intra" ? gstAmount / 2 : 0,
    sgst: split === "intra" ? gstAmount / 2 : 0,
    igst: split === "inter" ? gstAmount : 0,
  };
}
