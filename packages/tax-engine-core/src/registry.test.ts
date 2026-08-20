import { describe, expect, it, vi } from "vitest";
import type { TaxEngine } from "./types";

function makeStubEngine(country: "US" | "PH"): TaxEngine {
  return {
    country,
    countryName: country === "US" ? "United States" : "Philippines",
    currency: country === "US" ? "USD" : "PHP",
    supportedTaxpayerTypes: ["employee"],
    supportedForms: [],
    estimateTax: () => ({
      country,
      taxYear: 2024,
      currency: country === "US" ? "USD" : "PHP",
      grossIncome: 0,
      totalDeductions: 0,
      taxableIncome: 0,
      totalTaxDue: 0,
      effectiveRate: 0,
      marginalRate: 0,
      lineItems: [],
      regimeUsed: "stub",
      warnings: [],
      generatedAt: new Date().toISOString(),
    }),
    findDeductionCandidates: () => [],
    categorizeExpense: () => "other",
    detectMissingDocuments: () => [],
    generateDraftForms: () => [],
    getFilingWorkflow: () => ({
      country,
      taxYear: 2024,
      currentStage: "draft",
      steps: [],
      isSandbox: true,
    }),
  };
}

describe("engine registry", () => {
  // The registry is a module-level singleton, so each test gets a fresh
  // module instance to avoid state leaking between assertions.
  async function freshRegistry() {
    vi.resetModules();
    return import("./registry");
  }

  it("registers and retrieves an engine by country", async () => {
    const { registerEngine, getEngine } = await freshRegistry();
    registerEngine(makeStubEngine("US"));
    expect(getEngine("US").country).toBe("US");
  });

  it("throws a helpful error for an unregistered country", async () => {
    const { registerEngine, getEngine } = await freshRegistry();
    registerEngine(makeStubEngine("US"));
    expect(() => getEngine("PH")).toThrow(/No tax engine registered/);
  });

  it("lists supported countries", async () => {
    const { registerEngine, listSupportedCountries } = await freshRegistry();
    registerEngine(makeStubEngine("US"));
    expect(listSupportedCountries().some((c) => c.code === "US")).toBe(true);
  });

  it("reports country support correctly", async () => {
    const { registerEngine, isCountrySupported } = await freshRegistry();
    registerEngine(makeStubEngine("US"));
    expect(isCountrySupported("US")).toBe(true);
    expect(isCountrySupported("XX")).toBe(false);
  });
});
