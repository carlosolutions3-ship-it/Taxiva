import { requireUser } from "@/lib/actions";
import { AssistantChat } from "@/components/AssistantChat";
import { SectionHeader } from "@/components/ui";

export default async function AssistantPage() {
  await requireUser();
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="AI Tax Agent"
        title="Ask your assistant anything"
        description="Grounded in your actual recorded data — every figure comes from the tax engine, never invented. Free by default; set ANTHROPIC_API_KEY to upgrade to a real LLM."
      />
      <AssistantChat />
    </div>
  );
}
