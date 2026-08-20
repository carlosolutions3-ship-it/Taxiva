import { describe, expect, it } from "vitest";
import { calculateBracketTax, calculateSelfEmploymentTax } from "./rules";
import { usTaxEngine } from "./engine";
import type { IncomeItem, ExpenseItem, TaxpayerProfile } from "@taxiva/tax-engine-core";

describe("calculateBracketTax", () => {
  it("taxes only the amount within each bracket (single)", () => {
    const { tax, marginalRate } = calculateBracketTax(50_000, "single");
    // 10% of 11,600 + 12% of (47,150-11,600) + 22% of (50,000-47,150)
    const expected = 11_600 * 0.1 + (47_150 - 11_600) * 0.12 + (50_000 - 47_150) * 0.22;
    expect(tax).toBeCloseTo(expected, 2);
    expect(marginalRate).toBe(0.22);
  });

  it("returns zero tax for zero income", () => {
    expect(calculateBracketTax(0, "single").tax).toBe(0);
  });
});

describe("calculateSelfEmploymentTax", () => {
  it("applies the 92.35% factor and combined 15.3% rate below the wage base", () => {
    const tax = calculateSelfEmploymentTax(10_000);
    const expected = Math.round(10_000 * 0.9235 * 0.153 * 100) / 100;
    expect(tax).toBe(expected);
  });

  it("returns 0 for non-positive income", () => {
    expect(calculateSelfEmploymentTax(0)).toBe(0);
    expect(calculateSelfEmploymentTax(-500)).toBe(0);
  });
});

describe("usTaxEngine.estimateTax", () => {
  const profile: TaxpayerProfile = {
    id: "t1",
    country: "US",
    filingStatus: "single",
    taxYear: 2024,
    taxpayerType: "self_employed",
  };

  it("computes a full estimate for a freelancer with expenses", () => {
    const income: IncomeItem[] = [
      { id: "i1", source: "freelance", description: "Client work", amount: 60_000, currency: "USD", date: "2024-06-01" },
    ];
    const expenses: ExpenseItem[] = [
      { id: "e1", category: "software_subscriptions", description: "Adobe", amount: 600, currency: "USD", date: "2024-02-01" },
    ];
    const estimate = usTaxEngine.estimateTax({ profile, income, expenses });
    expect(estimate.grossIncome).toBe(60_000);
    expect(estimate.totalTaxDue).toBeGreaterThan(0);
    expect(estimate.country).toBe("US");
    expect(estimate.warnings.length).toBeGreaterThan(0);
  });

  it("never returns negative taxable income", () => {
    const estimate = usTaxEngine.estimateTax({ profile, income: [], expenses: [] });
    expect(estimate.taxableIncome).toBe(0);
    expect(estimate.totalTaxDue).toBe(0);
  });
});
