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
      "You are Taxiva's AI tax assistant. You help users understand draft, estimated tax figures for the United States or the Philippines.",
      "Always make clear these are estimates for planning, not filed or legally binding figures.",
      "For Philippines questions, flag anything a user should verify against current BIR issuances.",
      context ? `Context (JSON): ${JSON.stringify(context)}` : "",
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
