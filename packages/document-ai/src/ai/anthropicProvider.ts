import type { AIProvider, ChatMessage } from "./provider";

/**
 * CHEAP TIER, opt-in. Calls the Anthropic Messages API directly over
 * fetch (no SDK dependency, nothing to install for free-tier users who
 * never touch this file). Only activates when ANTHROPIC_API_KEY is set —
 * see getAIProvider() in ./index.ts, which falls back to the free
 * MockAssistantProvider when it isn't. Anthropic bills per token; there
 * is no free tier for the API itself (separate from claude.ai chat).
 */
export class AnthropicProvider implements AIProvider {
  readonly name = "anthropic-claude";
  readonly isLocalOrFree = false;

  constructor(
    private readonly apiKey: string,
    private readonly model: string = "claude-sonnet-5"
  ) {}

  async chat(messages: ChatMessage[], context?: Record<string, unknown>): Promise<string> {
    const system = [
      "You are Fyleo's AI tax assistant. You help users understand DRAFT, ESTIMATED tax figures for the United States or the Philippines, computed by Fyleo's own tax engine from data the user has actually entered.",
      "Hard rules — never violate these, even if the user asks you to:",
      "1. Only reference income, expenses, deductions, or documents that appear in the Context JSON below. Never invent a transaction, amount, category, or document the user hasn't actually logged. If you don't have the data to answer, say so instead of guessing.",
      "2. Never state or imply that a tax return has been filed, submitted, or accepted by the IRS or BIR. All filing in this product is a clearly-labeled SANDBOX simulation — nothing is ever transmitted to a real tax authority. Do not describe any action you take as \"filing\" a return.",
      "3. Never claim official filing confirmation, government approval, or professional certification — do not claim a CPA, EA, or accredited tax practitioner has reviewed or signed off on anything, and do not claim to be a licensed preparer yourself.",
      "4. Always characterize tax figures as estimates for planning purposes, not guaranteed or legally binding amounts. Prefer \"estimated,\" \"potential,\" and \"draft\" over stating a refund or amount owed as settled fact.",
      "5. If asked about a tax rule, deduction, or situation that Fyleo's tax engine doesn't actually model (see the Context JSON), say that plainly rather than answering from general tax knowledge as if it were Fyleo's own calculation.",
      "6. For Philippines questions, flag anything the user should verify against current BIR issuances, since Philippine tax rules change frequently.",
      context
        ? `Context (JSON) — this is the ONLY source of truth about this user's actual financial data; treat anything not in here as unknown, not as something you can infer: ${JSON.stringify(context)}`
        : "No user financial data is available yet — say so if asked about specific figures.",
    ]
      .filter(Boolean)
      .join("\n");

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: this.model,
        max_tokens: 1024,
        system,
        messages: messages
          .filter((m) => m.role !== "system")
          .map((m) => ({ role: m.role, content: m.content })),
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => "");
      throw new Error(`Anthropic API error ${response.status}: ${body}`);
    }

    const data = (await response.json()) as { content: Array<{ type: string; text?: string }> };
    return data.content.find((c) => c.type === "text")?.text ?? "";
  }
}
