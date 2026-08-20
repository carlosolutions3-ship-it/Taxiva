import type { AIProvider, ChatMessage } from "./provider";
import type { TaxEstimate, DeductionCandidate, MissingDocument } from "@taxiva/tax-engine-core";

export type AssistantContext = {
  estimate?: TaxEstimate;
  deductionCandidates?: DeductionCandidate[];
  missingDocuments?: MissingDocument[];
  countryName?: string;
};

function money(amount: number, currency: string): string {
  const symbol = currency === "PHP" ? "₱" : "$";
  return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/**
 * FREE TIER default. A deterministic, template-driven assistant that
 * reasons over the user's *actual* data (their real tax estimate,
 * deduction candidates, missing documents) rather than an LLM. It is
 * intentionally honest about being rule-based, not a general chatbot —
 * see docs/COST_STRATEGY.md for when to graduate to AnthropicProvider.
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
    const { estimate, deductionCandidates = [], missingDocuments = [], countryName } = ctx;

    if (!estimate) {
      return "I don't have any income or expense data for you yet. Upload a document or add a transaction, and I'll start estimating your taxes and looking for deductions.";
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

    return "I can tell you your estimated tax due, explain the calculation, list deduction candidates, or list missing documents — try asking one of those. (I'm the free, local assistant; connect a real AI model for open-ended conversation — see docs/COST_STRATEGY.md.)";
  }
}
