export interface EmiResult {
  emi: number;
  principal: number;
  totalInterest: number;
  totalPayment: number;
  schedule: { month: number; emi: number; principal: number; interest: number; balance: number }[];
}

export function calculateEmi(principal: number, annualRate: number, months: number): EmiResult {
  if (principal <= 0) throw new Error("Loan amount must be greater than 0.");
  if (months <= 0) throw new Error("Tenure must be greater than 0.");
  if (annualRate < 0) throw new Error("Interest rate cannot be negative.");

  const monthlyRate = annualRate / 12 / 100;
  const emi =
    monthlyRate === 0
      ? principal / months
      : (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
        (Math.pow(1 + monthlyRate, months) - 1);

  let balance = principal;
  const schedule: EmiResult["schedule"] = [];
  let totalInterest = 0;
  for (let month = 1; month <= months; month++) {
    const interest = monthlyRate === 0 ? 0 : balance * monthlyRate;
    let principalPaid = emi - interest;
    if (month === months) principalPaid = balance; // absorb rounding on the final installment
    balance = Math.max(0, balance - principalPaid);
    totalInterest += interest;
    schedule.push({
      month,
      emi: month === months ? principalPaid + interest : emi,
      principal: principalPaid,
      interest,
      balance,
    });
  }

  return {
    emi,
    principal,
    totalInterest,
    totalPayment: principal + totalInterest,
    schedule,
  };
}
