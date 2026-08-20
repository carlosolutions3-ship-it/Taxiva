import type { AIProvider, ChatMessage } from "./provider";
import type { TaxEstimate, DeductionCandidate, MissingDocument, ExpenseItem, ExpenseCategory } from "@taxiva/tax-engine-core";

export type AssistantContext = {
  estimate?: TaxEstimate;
  deductionCandidates?: DeductionCandidate[];
  missingDocuments?: MissingDocument[];
  expenses?: ExpenseItem[];
  countryName?: string;
};

function money(amount: number, currency: string): string {
  const symbol = currency === "PHP" ? "₱" : "$";
  return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

// A short, curated list of categories worth proactively asking about for
// business/self-employed taxpayers — not an exhaustive list, and never
// asserted as something the user definitely has. The assistant only ever
// says "I don't see any X logged yet, worth checking" — the absence of
// data, not an invented presence of it.
const COMMONLY_CHECKED_CATEGORIES: { category: ExpenseCategory; label: string }[] = [
  { category: "home_office", label: "Home office" },
  { category: "software_subscriptions", label: "Software subscriptions" },
  { category: "travel", label: "Business mileage and travel" },
  { category: "professional_fees", label: "Professional services" },
];

/**
 * FREE TIER default. A deterministic, template-driven assistant that
 * reasons over the user's *actual* data (their real tax estimate,
 * deduction candidates, missing documents, expenses) rather than an LLM.
 * It is intentionally honest about being rule-based, not a general
 * chatbot — see docs/COST_STRATEGY.md for when to graduate to
 * AnthropicProvider. Every number and every claim below traces back to a
 * field on `ctx` — nothing is invented, and gaps are phrased as
 * questions ("I don't see any X yet") rather than assertions about the
 * user's finances.
 */
export class MockAssistantProvider implements AIProvider {
  readonly name = "mock-local-assistant";
  readonly isLocalOrFree = true;

  async chat(messages: ChatMessage[], context?: Record<string, unknown>): Promise<string> {
    const lastUserMessage = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
    const ctx = (context ?? {}) as AssistantContext;
    return this.respond(lastUserMessage.toLowerCase(), ctx);
  }

  private respond(question: string, ctx: AssistantContext): string {
    const { estimate, deductionCandidates = [], missingDocuments = [], expenses = [], countryName } = ctx;

    if (!estimate) {
      return "I don't have any income or expense data for you yet. Upload a document or add a transaction, and I'll start estimating your taxes and looking for deductions.";
    }

    if (/what.*(missing|missed)|miss(ed)? anything|overlook|worth checking|review.*(everything|all|return|documents)/.test(question)) {
      return this.reviewEverything(ctx);
    }

    if (/how much.*(owe|tax|pay)|total tax|tax due/.test(question)) {
      return `Based on what you've entered so far, your estimated total tax due for ${estimate.taxYear} in ${countryName ?? estimate.country} is ${money(estimate.totalTaxDue, estimate.currency)}, an effective rate of ${(estimate.effectiveRate * 100).toFixed(1)}%. This is a planning estimate (regime used: ${estimate.regimeUsed.replace(/_/g, " ")}) — not a filed figure.`;
    }

    if (/deduct/.test(question)) {
      if (deductionCandidates.length === 0) {
        return "I haven't found any deduction candidates yet — upload some expense documents (receipts, invoices, subscription bills) and I'll flag what looks deductible.";
      }
      const top = deductionCandidates.slice(0, 5).map((d) => `• ${d.label}: ${money(d.amount, d.currency)}${d.requiresVerification ? " (verify before claiming)" : ""}`).join("\n");
      return `Here's what I've flagged as potentially deductible:\n${top}\n\nThese are candidates, not guarantees — I flag anything that needs a human check.`;
    }

    if (/missing|document|upload/.test(question)) {
      if (missingDocuments.length === 0) {
        return "I don't see any obviously missing documents right now, but keep uploading as you receive new income or expense records.";
      }
      const list = missingDocuments.map((d) => `• ${d.label} (${d.severity}) — ${d.reason}`).join("\n");
      return `Here's what I'd still like to see:\n${list}`;
    }

    if (/explain|why|how.*calculat/.test(question)) {
      const lines = estimate.lineItems.map((l) => `• ${l.label}: ${money(l.amount, estimate.currency)}${l.note ? ` — ${l.note}` : ""}`).join("\n");
      return `Here's the line-by-line breakdown:\n${lines}\n\nWarnings/assumptions:\n${estimate.warnings.map((w) => `• ${w}`).join("\n")}`;
    }

    return "I can tell you your estimated tax due, explain the calculation, list deduction candidates, list missing documents, or review everything for gaps — try asking \"did I miss anything?\" (I'm the free, local assistant; connect a real AI model for open-ended conversation — see docs/COST_STRATEGY.md.)";
  }

  /**
   * The "did I miss anything?" response. Every line comes from real data:
   * a real missing document, a real deduction candidate still needing
   * confirmation, or the real absence of a commonly-relevant expense
   * category. Nothing here asserts the user has an expense they haven't
   * logged — only that it's worth them checking.
   */
  private reviewEverything(ctx: AssistantContext): string {
    const { deductionCandidates = [], missingDocuments = [], expenses = [] } = ctx;
    const areas: string[] = [];

    const loggedCategories = new Set(expenses.map((e) => e.category));
    for (const gap of COMMONLY_CHECKED_CATEGORIES) {
      if (!loggedCategories.has(gap.category)) {
        areas.push(`${gap.label} — I don't see any logged yet. Worth checking if this applies to you.`);
      }
    }

    for (const c of deductionCandidates.filter((d) => d.requiresVerification)) {
      areas.push(`${c.label} — flagged as a potential deduction (${money(c.amount, c.currency)}), but needs your confirmation before it counts toward your estimate.`);
    }

    for (const d of missingDocuments) {
      areas.push(`${d.label} — ${d.reason}`);
    }

    if (areas.length === 0) {
      return "I reviewed your income, transactions, and uploaded documents and didn't find anything obviously missing. That's not a guarantee your return is complete — it means nothing in what you've entered is flagging a gap right now.";
    }

    const shown = areas.slice(0, 6);
    const numbered = shown.map((a, i) => `${i + 1}. ${a}`).join("\n");
    const overflow = areas.length > shown.length ? `\n\n...and ${areas.length - shown.length} more — see the Deductions and Documents pages for the full list.` : "";
    return `I reviewed your income, transactions, and uploaded documents. I found ${shown.length} area${shown.length === 1 ? "" : "s"} worth checking:\n\n${numbered}${overflow}`;
  }
}
