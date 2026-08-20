import type { ExpenseCategory } from "@taxiva/tax-engine-core";

// Free/local keyword baseline, tuned for common Philippine SME and online
// seller vendors. Swap in an LLM classifier from @taxiva/document-ai for
// higher accuracy once there's budget for API calls.
const KEYWORD_MAP: Array<{ category: ExpenseCategory; keywords: RegExp }> = [
  { category: "software_subscriptions", keywords: /\b(saas|subscription|canva|shopify|figma|notion|zoom|google workspace|microsoft 365)\b/i },
  { category: "advertising_marketing", keywords: /\b(facebook ads|meta ads|tiktok ads|shopee ads|lazada ads|boost|marketing|promo)\b/i },
  { category: "shipping_logistics", keywords: /\b(j&t|jnt|lbc|ninja van|flash express|grab express|shipping|courier|cod remittance)\b/i },
  { category: "home_office", keywords: /\b(home office|desk|chair|monitor)\b/i },
  { category: "utilities", keywords: /\b(meralco|maynilad|pldt|globe|smart|converge|electric|water bill|internet)\b/i },
  { category: "professional_fees", keywords: /\b(accountant|bookkeeper|lawyer|abogado|consultant|cpa)\b/i },
  { category: "travel", keywords: /\b(grab|angkas|airline|cebu pacific|philippine airlines|hotel|airbnb)\b/i },
  { category: "meals", keywords: /\b(restaurant|jollibee|cafe|coffee|meal|lunch|dinner)\b/i },
  { category: "rent", keywords: /\b(rent|lease|stall|office space|warehouse)\b/i },
  { category: "salaries_and_wages", keywords: /\b(payroll|sahod|salary|wages|13th month)\b/i },
  { category: "taxes_and_licenses", keywords: /\b(bir|dti|barangay permit|business permit|mayor's permit|sss|philhealth|pag-ibig)\b/i },
  { category: "equipment", keywords: /\b(laptop|computer|camera|ring light|printer|equipment)\b/i },
  { category: "supplies", keywords: /\b(packaging|tape|bubble wrap|office supplies|ink|paper)\b/i },
];

export function categorizeExpense(description: string, vendor?: string): ExpenseCategory {
  const text = `${description} ${vendor ?? ""}`;
  for (const { category, keywords } of KEYWORD_MAP) {
    if (keywords.test(text)) return category;
  }
  return "other";
}

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
