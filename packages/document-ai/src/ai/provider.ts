/**
 * Pluggable AI provider interface. Every part of the product that wants
 * "AI" behavior (the assistant chat, richer document understanding,
 * narrated insights) talks to this interface — never to a specific
 * vendor SDK directly. That keeps the free-tier default swappable for a
 * real model without touching product code.
 *
 * FREE:   MockAssistantProvider — deterministic, local, $0, no API key.
 * CHEAP:  AnthropicProvider — pay-per-token Claude API call.
 * SCALE:  a multi-model router (fastest/cheapest model per task type,
 *         fine-tuned classifiers for categorization, a hosted OCR+LLM
 *         document pipeline) — not implemented in the MVP, see
 *         docs/COST_STRATEGY.md.
 */

export type ChatMessage = { role: "user" | "assistant" | "system"; content: string };

export interface AIProvider {
  readonly name: string;
  readonly isLocalOrFree: boolean;
  chat(messages: ChatMessage[], context?: Record<string, unknown>): Promise<string>;
}
