import type { ExpenseCategory } from "@taxiva/tax-engine-core";

// Keyword-based categorizer. This is the free/local baseline described in
// docs/COST_STRATEGY.md — swap in an LLM-backed classifier from
// @taxiva/document-ai for higher accuracy once there's budget for API calls.
const KEYWORD_MAP: Array<{ category: ExpenseCategory; keywords: RegExp }> = [
  { category: "software_subscriptions", keywords: /\b(saas|subscription|adobe|figma|notion|zoom|github|aws|google workspace|microsoft 365|slack)\b/i },
  { category: "advertising_marketing", keywords: /\b(facebook ads|meta ads|google ads|tiktok ads|marketing|promo|sponsor)\b/i },
  { category: "shipping_logistics", keywords: /\b(ups|fedex|usps|dhl|shipping|postage|freight|courier)\b/i },
  { category: "home_office", keywords: /\b(home office|desk|chair|monitor)\b/i },
  { category: "utilities", keywords: /\b(electric|internet|phone bill|utility|utilities)\b/i },
  { category: "professional_fees", keywords: /\b(accountant|lawyer|attorney|consult(ing|ant)?|bookkeeping)\b/i },
  { category: "travel", keywords: /\b(flight|airline|hotel|uber|lyft|airbnb|mileage)\b/i },
  { category: "meals", keywords: /\b(restaurant|coffee|starbucks|meal|lunch|dinner)\b/i },
  { category: "rent", keywords: /\b(rent|lease|office space)\b/i },
  { category: "salaries_and_wages", keywords: /\b(payroll|salary|wages|contractor payment)\b/i },
  { category: "taxes_and_licenses", keywords: /\b(license|permit|llc fee|registration fee)\b/i },
  { category: "equipment", keywords: /\b(laptop|computer|camera|equipment|hardware|printer)\b/i },
  { category: "supplies", keywords: /\b(office supplies|staples|paper|ink|packaging)\b/i },
];

export function categorizeExpense(description: string, vendor?: string): ExpenseCategory {
  const text = `${description} ${vendor ?? ""}`;
  for (const { category, keywords } of KEYWORD_MAP) {
    if (keywords.test(text)) return category;
  }
  return "other";
}

// IRS Schedule C generally treats these categories as ordinary and
// necessary business expenses. "meals" is capped at 50% and "home_office"
// requires exclusive-use — both flagged for the user to confirm, not
// silently assumed.
export const DEDUCTIBLE_CATEGORIES: ExpenseCategory[] = [
  "supplies",
  "equipment",
  "software_subscriptions",
  "advertising_marketing",
  "shipping_logistics",
  "home_office",
  "utilities",
  "professional_fees",
  "travel",
  "meals",
  "rent",
  "salaries_and_wages",
  "taxes_and_licenses",
  "depreciation",
];
