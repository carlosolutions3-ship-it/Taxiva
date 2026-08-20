import { describe, expect, it } from "vitest";
import { extractDocumentFields } from "./extract";

describe("extractDocumentFields", () => {
  it("extracts vendor, amount, currency, and date from a US-style receipt", () => {
    const text = "Acme Coffee Co\n123 Main St\nDate: 03/14/2024\nTotal: $12.50";
    const fields = extractDocumentFields(text);
    expect(fields.vendor).toBe("Acme Coffee Co");
    expect(fields.amount).toBe(12.5);
    expect(fields.currency).toBe("USD");
    expect(fields.date).toBe("2024-03-14");
  });

  it("extracts a PHP receipt with peso sign", () => {
    const text = "J&T Express\nOfficial Receipt\nJan 5, 2024\nTotal Due: ₱1,250.00";
    const fields = extractDocumentFields(text);
    expect(fields.currency).toBe("PHP");
    expect(fields.amount).toBe(1250);
    expect(fields.date).toBe("2024-01-05");
  });

  it("returns nulls gracefully when nothing matches", () => {
    const fields = extractDocumentFields("");
    expect(fields.amount).toBeNull();
    expect(fields.currency).toBeNull();
  });
});
