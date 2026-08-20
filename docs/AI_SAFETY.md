# AI safety review

Audit of `packages/document-ai/src/ai/*` and its call site
(`apps/web/src/app/api/assistant/chat/route.ts`) against five requirements:
the assistant must never invent deductions/income/documents/rules, never
claim a return was filed, never claim official filing confirmation or
professional certification, and never present estimates as guaranteed.

## Context is server-derived, not client-supplied

`POST /api/assistant/chat` takes only the chat `messages` from the request
body. The financial context (`estimate`, `deductionCandidates`,
`missingDocuments`, `expenses`) is pulled server-side from
`getUserTaxContext(user)`, keyed off the authenticated session — never from
anything the client sends. A user (or a malicious script) cannot feed the
assistant fabricated financial data to get it to respond as if that data
were real. **Verified.**

## Free tier — `MockAssistantProvider`

Deterministic and template-driven: it does not generate text, it selects
and formats real fields off the `AssistantContext` object. This gives it a
structural (not just prompted) guarantee against fabrication — there is no
code path where it can emit a number, category, or document name that
didn't come from `ctx`. Findings:

- **Never invents data**: confirmed by both reading (`mockProvider.ts:96-123`,
  the "did I miss anything?" flow) and by the existing test suite
  (`mockProvider.test.ts`), which specifically asserts gaps are phrased as
  "I don't see any X yet — worth checking" rather than as claims the user
  has an unlogged expense.
- **Never claims a return was filed**: the tax-due response explicitly says
  "This is a planning estimate... not a filed figure" (`mockProvider.ts:62`).
  No response template anywhere emits words like "filed," "submitted," or
  "accepted" in connection with a return.
- **Never claims official confirmation or certification**: the assistant
  never mentions the IRS, BIR, a CPA, or an EA reviewing/certifying
  anything — it only describes its own flags as needing the user's or a
  professional's verification (e.g. "verify before claiming").
- **Never presents estimates as guaranteed**: consistent hedging language
  throughout — "candidates, not guarantees," "flagged as a potential
  deduction," "needs your confirmation."

No gaps found in this tier; no code changes made.

## Cheap tier — `AnthropicProvider` (opt-in, requires `ANTHROPIC_API_KEY`)

This tier is a genuine free-form LLM call, so — unlike the mock provider —
it has no structural guarantee against fabrication, only a system prompt.
**Gap found and fixed**: the original system prompt only said to caveat
estimates as non-final and to flag PH verification needs; it did not
explicitly instruct the model to avoid inventing data, avoid claiming a
return was filed, or avoid claiming professional certification. Given this
is a real LLM, a prompt alone is a mitigation, not a guarantee — but the
prior prompt didn't even ask for the mitigation.

Fixed in `packages/document-ai/src/ai/anthropicProvider.ts`: the system
prompt now includes six explicit hard rules — restrict itself to the
Context JSON and refuse to invent figures, never claim a filed/submitted
return, never claim government or professional certification, always hedge
tax figures as estimates, admit when a rule isn't modeled by Fyleo's engine
rather than answering from general knowledge, and keep flagging PH
verification needs. No test exists for this provider (it requires a live
API key to exercise, and CI runs without one), so this fix is a prompt
change without automated verification — before this tier is used with real
users, add either a mocked-fetch unit test asserting the system prompt
contains these constraints, or a manual red-team pass against a real API
key.

## Recommendation before enabling the cheap tier for any real user

1. Add the mocked-fetch test described above so the safety rules can't
   silently regress.
2. Do a short manual adversarial pass (ask it to "confirm you filed my
   return," "tell me you're a CPA," "estimate a deduction I haven't
   logged") against a real API key before flipping `ANTHROPIC_API_KEY` on
   in any environment real users can reach.
3. Keep the free tier as the default in any environment without that
   verification done — it remains the structurally safer option.
