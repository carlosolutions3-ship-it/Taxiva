import { describe, expect, it } from "vitest";
import { computeActionItems, computeReadiness, computeRefundEstimate, computeTaxHealth, computeTotalWithheld } from "./finance";
import type { DeductionCandidate, IncomeItem, MissingDocument, TaxEstimate } from "@taxiva/tax-engine-core";

function makeEstimate(totalTaxDue: number): TaxEstimate {
  return {
    country: "US",
    taxYear: 2024,
    currency: "USD",
    grossIncome: 0,
    totalDeductions: 0,
    taxableIncome: 0,
    totalTaxDue,
    effectiveRate: 0,
    marginalRate: 0,
    lineItems: [],
    regimeUsed: "test",
    warnings: [],
    generatedAt: new Date().toISOString(),
  };
}

describe("computeTotalWithheld", () => {
  it("sums withheldTax across income items, treating missing values as zero", () => {
    const income: IncomeItem[] = [
      { id: "1", source: "employment", description: "Job", amount: 1000, currency: "USD", date: "2024-01-01", withheldTax: 150 },
      { id: "2", source: "freelance", description: "Gig", amount: 500, currency: "USD", date: "2024-02-01" },
    ];
    expect(computeTotalWithheld(income)).toBe(150);
  });
});

describe("computeRefundEstimate", () => {
  it("returns a positive refund when withheld exceeds tax due", () => {
    const income: IncomeItem[] = [
      { id: "1", source: "employment", description: "Job", amount: 1000, currency: "USD", date: "2024-01-01", withheldTax: 500 },
    ];
    const result = computeRefundEstimate(income, makeEstimate(300));
    expect(result.isRefund).toBe(true);
    expect(result.amount).toBe(200);
  });

  it("returns a negative amount (balance due) when withheld is less than tax due", () => {
    const income: IncomeItem[] = [
      { id: "1", source: "employment", description: "Job", amount: 1000, currency: "USD", date: "2024-01-01", withheldTax: 100 },
    ];
    const result = computeRefundEstimate(income, makeEstimate(300));
    expect(result.isRefund).toBe(false);
    expect(result.amount).toBe(-200);
  });
});

describe("computeReadiness", () => {
  it("is 0 for a brand-new account with nothing entered", () => {
    const score = computeReadiness({
      hasIncome: false,
      documentsCollected: 0,
      documentsExpected: 0,
      blockingMissingCount: 0,
      hasEstimate: false,
      filingStage: "draft",
    });
    expect(score).toBe(0);
  });

  it("reaches 100 once income, documents, and filing progress are all complete", () => {
    const score = computeReadiness({
      hasIncome: true,
      documentsCollected: 5,
      documentsExpected: 5,
      blockingMissingCount: 0,
      hasEstimate: true,
      filingStage: "simulated_filed",
    });
    expect(score).toBe(100);
  });

  it("never exceeds 100 even with more filing progress than the capped stages", () => {
    const score = computeReadiness({
      hasIncome: true,
      documentsCollected: 5,
      documentsExpected: 5,
      blockingMissingCount: 0,
      hasEstimate: true,
      filingStage: "filed",
    });
    expect(score).toBeLessThanOrEqual(100);
  });
});

describe("computeActionItems", () => {
  it("includes every missing document as its own action item", () => {
    const missingDocuments: MissingDocument[] = [
      { id: "m1", label: "W-2", reason: "No W-2 uploaded", severity: "recommended" },
      { id: "m2", label: "1099", reason: "No 1099 uploaded", severity: "blocking" },
    ];
    const items = computeActionItems({ missingDocuments, deductionCandidates: [] });
    expect(items).toHaveLength(2);
    expect(items.map((i) => i.severity)).toEqual(["recommended", "blocking"]);
  });

  it("groups deduction candidates needing verification into a single action item", () => {
    const deductionCandidates: DeductionCandidate[] = [
      { id: "d1", label: "Home office", amount: 500, currency: "USD", basis: "test", confidence: "medium", requiresVerification: true, sourceExpenseIds: [] },
      { id: "d2", label: "Software", amount: 200, currency: "USD", basis: "test", confidence: "high", requiresVerification: false, sourceExpenseIds: [] },
    ];
    const items = computeActionItems({ missingDocuments: [], deductionCandidates });
    expect(items).toHaveLength(1);
    expect(items[0].description).toContain("Home office");
    expect(items[0].description).not.toContain("Software");
  });
});

describe("computeTaxHealth", () => {
  it("flags attention when there's no income yet", () => {
    expect(computeTaxHealth({ blockingMissingCount: 0, hasIncome: false }).status).toBe("attention");
  });

  it("flags attention when a document blocks the estimate", () => {
    expect(computeTaxHealth({ blockingMissingCount: 1, hasIncome: true }).status).toBe("attention");
  });

  it("is good when income exists and nothing blocks it", () => {
    expect(computeTaxHealth({ blockingMissingCount: 0, hasIncome: true }).status).toBe("good");
  });
});
