import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getUserTaxContext } from "@/lib/tax";
import { getAIProvider } from "@taxiva/document-ai";

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { messages } = (await req.json()) as {
    messages: { role: "user" | "assistant"; content: string }[];
  };

  const { estimate, deductionCandidates, missingDocuments, expenses, engine } = await getUserTaxContext(user);
  const provider = getAIProvider();
  const reply = await provider.chat(messages, {
    estimate,
    deductionCandidates,
    missingDocuments,
    expenses,
    countryName: engine.countryName,
  });

  return NextResponse.json({ reply, providerName: provider.name, isLocalOrFree: provider.isLocalOrFree });
}
