/**
 * Rule-based field extraction from raw OCR text. This is the free/local
 * baseline: regexes tuned for common receipt/invoice layouts in both the
 * US (USD, MM/DD/YYYY) and the Philippines (PHP, "₱", DD/MM or Month DD,
 * YYYY). It intentionally does not try to be a general-purpose document
 * understanding model — for messier documents, route through the AI
 * provider's `analyzeDocument` instead (see ai/provider.ts), which can
 * fall back to an LLM once one is configured.
 */

export type ExtractedDocumentFields = {
  vendor: string | null;
  amount: number | null;
  currency: "USD" | "PHP" | null;
  date: string | null; // ISO date if parseable
  rawText: string;
};

const AMOUNT_PATTERNS = [
  /(?:total|amount due|grand total|total due)\s*[:\-]?\s*(?:php|₱|\$)?\s*([\d,]+\.\d{2})/i,
  /(?:php|₱)\s*([\d,]+\.\d{2})/i,
  /\$\s*([\d,]+\.\d{2})/i,
];

const DATE_PATTERNS = [
  /(\d{4})-(\d{2})-(\d{2})/, // ISO
  /(\d{1,2})\/(\d{1,2})\/(\d{4})/, // MM/DD/YYYY or DD/MM/YYYY
  /(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{1,2}),?\s+(\d{4})/i,
];

const MONTHS: Record<string, number> = {
  jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
};

function detectCurrency(text: string): "USD" | "PHP" | null {
  if (/₱|php/i.test(text)) return "PHP";
  if (/\$|usd/i.test(text)) return "USD";
  return null;
}

function parseAmount(text: string): number | null {
  for (const pattern of AMOUNT_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      const cleaned = match[1].replace(/,/g, "");
      const value = parseFloat(cleaned);
      if (!Number.isNaN(value)) return value;
    }
  }
  return null;
}

function parseDate(text: string): string | null {
  for (const pattern of DATE_PATTERNS) {
    const match = text.match(pattern);
    if (!match) continue;
    if (pattern === DATE_PATTERNS[0]) {
      return `${match[1]}-${match[2]}-${match[3]}`;
    }
    if (pattern === DATE_PATTERNS[1]) {
      // Ambiguous MM/DD vs DD/MM — assume MM/DD (US convention) as a
      // documented simplification; PH receipts vary by vendor.
      const [, a, b, year] = match;
      const month = a.padStart(2, "0");
      const day = b.padStart(2, "0");
      return `${year}-${month}-${day}`;
    }
    if (pattern === DATE_PATTERNS[2]) {
      const [, monthName, day, year] = match;
      const month = MONTHS[monthName.slice(0, 3).toLowerCase()];
      if (month) return `${year}-${String(month).padStart(2, "0")}-${day.padStart(2, "0")}`;
    }
  }
  return null;
}

function guessVendor(text: string): string | null {
  const firstLine = text.split("\n").map((l) => l.trim()).find((l) => l.length > 2);
  return firstLine ?? null;
}

export function extractDocumentFields(rawText: string): ExtractedDocumentFields {
  return {
    vendor: guessVendor(rawText),
    amount: parseAmount(rawText),
    currency: detectCurrency(rawText),
    date: parseDate(rawText),
    rawText,
  };
}
