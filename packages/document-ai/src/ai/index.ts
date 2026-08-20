import type { AIProvider } from "./provider";
import { MockAssistantProvider } from "./mockProvider";
import { AnthropicProvider } from "./anthropicProvider";

export * from "./provider";
export * from "./mockProvider";
export * from "./anthropicProvider";

/**
 * Provider factory. Free by default; opts into a real model only when the
 * operator has explicitly configured an API key. This is the single
 * switch described in docs/COST_STRATEGY.md's "AI" row.
 */
export function getAIProvider(): AIProvider {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (apiKey) {
    return new AnthropicProvider(apiKey, process.env.ANTHROPIC_MODEL || "claude-sonnet-5");
  }
  return new MockAssistantProvider();
}
