import { describe, expect, it } from "vitest";
import { calculateGraduatedTax, calculateFlatOptionTax, calculatePercentageTax, isOverVatThreshold } from "./rules";
import { phTaxEngine } from "./engine";
import type { IncomeItem, ExpenseItem, TaxpayerProfile } from "@taxiva/tax-engine-core";

describe("calculateGraduatedTax", () => {
  it("is zero up to ₱250,000", () => {
    expect(calculateGraduatedTax(250_000).tax).toBe(0);
    expect(calculateGraduatedTax(100_000).tax).toBe(0);
  });

  it("applies 15% above ₱250,000 up to ₱400,000", () => {
    const { tax } = calculateGraduatedTax(300_000);
    expect(tax).toBeCloseTo((300_000 - 250_000) * 0.15, 2);
  });

  it("matches the published bracket base for ₱800,000", () => {
    const { tax } = calculateGraduatedTax(800_000);
    expect(tax).toBeCloseTo(102_500, 2);
  });
});

describe("calculateFlatOptionTax", () => {
  it("exempts the first ₱250,000 then applies 8%", () => {
    const tax = calculateFlatOptionTax(1_000_000);
    expect(tax).toBeCloseTo((1_000_000 - 250_000) * 0.08, 2);
  });
});

describe("calculatePercentageTax", () => {
  it("applies flat 3% to gross receipts", () => {
    expect(calculatePercentageTax(500_000)).toBeCloseTo(15_000, 2);
  });
});

describe("isOverVatThreshold", () => {
  it("flags gross receipts above ₱3,000,000", () => {
    expect(isOverVatThreshold(3_000_001)).toBe(true);
    expect(isOverVatThreshold(3_000_000)).toBe(false);
  });
});

describe("phTaxEngine.estimateTax", () => {
  const profile: TaxpayerProfile = {
    id: "t1",
    country: "PH",
    filingStatus: "individual",
    taxYear: 2024,
    taxpayerType: "online_seller",
  };

  it("picks whichever of graduated+percentage or 8% flat is lower", () => {
    const income: IncomeItem[] = [
      { id: "i1", source: "online_selling", description: "Shopee sales", amount: 850_000, currency: "PHP", date: "2024-06-01", platform: "shopee" },
    ];
    const expenses: ExpenseItem[] = [
      { id: "e1", category: "shipping_logistics", description: "J&T Express", amount: 40_000, currency: "PHP", date: "2024-03-01" },
    ];
    const estimate = phTaxEngine.estimateTax({ profile, income, expenses });
    expect(estimate.country).toBe("PH");
    expect(estimate.grossIncome).toBe(850_000);
    expect(estimate.warnings.length).toBeGreaterThan(0);
  });

  it("compares the flat option against the graduated regime's TOTAL burden (income tax + percentage tax), not income tax alone", () => {
    // Regression test: gross 850,000 with OSD (40% = 340,000) beating a
    // 40,000 itemized total. Graduated income tax on 510,000 taxable is
    // 44,500, and percentage tax on gross is 25,500 — a combined 70,000.
    // The 8% flat option is (850,000-250,000)*8% = 48,000. Flat must win
    // because 48,000 < 70,000, even though 48,000 > 44,500 (income tax
    // alone) — comparing against income tax alone was the bug.
    const income: IncomeItem[] = [
      { id: "i1", source: "online_selling", description: "Shopee sales", amount: 850_000, currency: "PHP", date: "2024-06-01" },
    ];
    const expenses: ExpenseItem[] = [
      { id: "e1", category: "shipping_logistics", description: "J&T Express", amount: 40_000, currency: "PHP", date: "2024-03-01" },
    ];
    const estimate = phTaxEngine.estimateTax({ profile, income, expenses });
    expect(estimate.regimeUsed).toBe("flat_8_percent");
    expect(estimate.totalTaxDue).toBeCloseTo(48_000, 2);
    // The displayed taxable income must match the flat option's own
    // ₱250,000 exemption (850,000-250,000=600,000), not the OSD figure
    // (which would wrongly show 510,000 while the tax next to it is
    // computed from a 600,000 base).
    expect(estimate.taxableIncome).toBeCloseTo(600_000, 2);
  });

  it("returns zero tax and no crash for no income", () => {
    const estimate = phTaxEngine.estimateTax({ profile, income: [], expenses: [] });
    expect(estimate.totalTaxDue).toBe(0);
  });
});

describe("phTaxEngine.findDeductionCandidates", () => {
  const profile: TaxpayerProfile = {
    id: "t1",
    country: "PH",
    filingStatus: "individual",
    taxYear: 2024,
    taxpayerType: "online_seller",
  };

  it("does not double-count OSD and itemized deductions as if they were additive", () => {
    const income: IncomeItem[] = [
      { id: "i1", source: "online_selling", description: "Shopee sales", amount: 850_000, currency: "PHP", date: "2024-06-01" },
    ];
    const expenses: ExpenseItem[] = [
      { id: "e1", category: "shipping_logistics", description: "J&T Express", amount: 40_000, currency: "PHP", date: "2024-03-01" },
    ];
    const candidates = phTaxEngine.findDeductionCandidates({ profile, income, expenses });
    const total = candidates.reduce((acc, c) => acc + c.amount, 0);
    // OSD (340,000) beats itemized (40,000) — only one should be surfaced,
    // never both summed together (which would wrongly imply 380,000).
    expect(total).toBeCloseTo(340_000, 2);
  });
});
