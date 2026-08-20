import { requireUser } from "@/lib/actions";
import { AssistantChat } from "@/components/AssistantChat";

export default async function AssistantPage() {
  await requireUser();
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-ink-900">AI Assistant</h1>
        <p className="mt-1 text-ink-600">
          Grounded in your actual recorded data — figures come from the tax engine, never invented by the
          model. Free by default (local rule-based assistant); set <code>ANTHROPIC_API_KEY</code> to
          upgrade to a real LLM.
        </p>
      </div>
      <AssistantChat />
    </div>
  );
}
