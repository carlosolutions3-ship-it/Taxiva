import { describe, expect, it } from "vitest";
import { MockAssistantProvider } from "./mockProvider";
import type { DeductionCandidate, ExpenseItem, MissingDocument, TaxEstimate } from "@taxiva/tax-engine-core";

function makeEstimate(overrides: Partial<TaxEstimate> = {}): TaxEstimate {
  return {
    country: "US",
    taxYear: 2024,
    currency: "USD",
    grossIncome: 50_000,
    totalDeductions: 5_000,
    taxableIncome: 45_000,
    totalTaxDue: 6_000,
    effectiveRate: 0.12,
    marginalRate: 0.22,
    lineItems: [],
    regimeUsed: "graduated_with_standard_deduction",
    warnings: [],
    generatedAt: new Date().toISOString(),
    ...overrides,
  };
}

describe("MockAssistantProvider — grounding, never fabricating data", () => {
  const provider = new MockAssistantProvider();

  it("tells the user it has nothing when there's no estimate at all", async () => {
    const reply = await provider.chat([{ role: "user", content: "how much do I owe?" }], {});
    expect(reply.toLowerCase()).toContain("don't have any income or expense data");
  });

  it("'did I miss anything?' only lists real missing documents and deduction candidates, never invented ones", async () => {
    const missingDocuments: MissingDocument[] = [
      { id: "m1", label: "Form W-2", reason: "No W-2 uploaded", severity: "recommended" },
    ];
    const deductionCandidates: DeductionCandidate[] = [
      { id: "d1", label: "Advertising", amount: 300, currency: "USD", basis: "test", confidence: "medium", requiresVerification: true, sourceExpenseIds: [] },
    ];
    const reply = await provider.chat(
      [{ role: "user", content: "Did I miss anything?" }],
      { estimate: makeEstimate(), missingDocuments, deductionCandidates, expenses: [] }
    );
    expect(reply).toContain("Form W-2");
    expect(reply).toContain("Advertising");
    // Must not claim a specific dollar figure that wasn't in the input.
    expect(reply).toContain("$300.00");
  });

  it("phrases an empty expense category as a question, never as an assertion the user has that expense", async () => {
    const reply = await provider.chat(
      [{ role: "user", content: "did I miss anything?" }],
      { estimate: makeEstimate(), missingDocuments: [], deductionCandidates: [], expenses: [] }
    );
    // Home office is in the curated "commonly checked" list and no
    // expenses were logged, so it should appear as a gap — worded as
    // "I don't see any... worth checking", not as a factual claim.
    expect(reply).toContain("Home office");
    expect(reply.toLowerCase()).toContain("worth checking");
  });

  it("does NOT suggest a category the user has already logged expenses for", async () => {
    const expenses: ExpenseItem[] = [
      { id: "e1", category: "home_office", description: "Desk", amount: 200, currency: "USD", date: "2024-01-01" },
    ];
    const reply = await provider.chat(
      [{ role: "user", content: "did I miss anything?" }],
      { estimate: makeEstimate(), missingDocuments: [], deductionCandidates: [], expenses }
    );
    expect(reply).not.toContain("Home office —");
  });

  it("says nothing is flagged when there truly is nothing to flag", async () => {
    const allCategoriesLogged: ExpenseItem[] = [
      "home_office",
      "software_subscriptions",
      "travel",
      "professional_fees",
    ].map((category, i) => ({
      id: `e${i}`,
      category: category as ExpenseItem["category"],
      description: "x",
      amount: 10,
      currency: "USD",
      date: "2024-01-01",
    }));
    const reply = await provider.chat(
      [{ role: "user", content: "did I miss anything?" }],
      { estimate: makeEstimate(), missingDocuments: [], deductionCandidates: [], expenses: allCategoriesLogged }
    );
    expect(reply.toLowerCase()).toContain("didn't find anything obviously missing");
  });

  it("the tax-due answer only reports the figure present on the estimate", async () => {
    const reply = await provider.chat(
      [{ role: "user", content: "how much do I owe?" }],
      { estimate: makeEstimate({ totalTaxDue: 1234.56 }), countryName: "United States" }
    );
    expect(reply).toContain("$1,234.56");
  });
});
