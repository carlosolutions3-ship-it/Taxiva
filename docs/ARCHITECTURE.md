# Architecture

## The core idea

Every tax rule, form, and filing step lives inside a country package. No
other part of the system is allowed to branch on `if (country === "US")`.
The rest of the app talks to `TaxEngine`, an interface, and never to a
specific country's rules directly.

```
┌──────────────────────────────────────────────────────────────┐
│ apps/web (Next.js)                                            │
│  dashboard pages, server actions, API routes                  │
│      │ calls                                                  │
│      ▼                                                        │
│ @taxiva/document-ai                                            │
│  OCR, field extraction, categorization dispatch,               │
│  proactive insights, AI assistant — country-agnostic           │
│      │ calls getEngine(country)                                │
│      ▼                                                        │
│ @taxiva/tax-engine-core                                        │
│  types.ts     — CountryCode, IncomeItem, ExpenseItem,          │
│                 TaxEstimate, DraftTaxForm, FilingWorkflowState,│
│                 and the TaxEngine interface itself             │
│  registry.ts  — registerEngine() / getEngine() / listSupportedCountries() │
│      │ implemented by                                          │
│      ▼                                                        │
│ @taxiva/tax-engine-us          @taxiva/tax-engine-ph            │
│  rules.ts   — 2024 federal      rules.ts   — TRAIN law tables,  │
│               brackets, SE tax               8% flat option,   │
│  categorize.ts — Schedule C     categorize.ts — BIR categories │
│               keyword rules                  keyword rules     │
│  engine.ts  — implements        engine.ts  — implements        │
│               TaxEngine                       TaxEngine        │
└──────────────────────────────────────────────────────────────┘
```

## `TaxEngine`, the one interface that matters

Defined in `packages/tax-engine-core/src/types.ts`. Every country package
exports one object implementing it:

```ts
interface TaxEngine {
  country: CountryCode;
  countryName: string;
  currency: "USD" | "PHP";
  estimateTax(input): TaxEstimate;
  findDeductionCandidates(input): DeductionCandidate[];
  categorizeExpense(description, vendor?): ExpenseCategory;
  detectMissingDocuments(input): MissingDocument[];
  generateDraftForms(input): DraftTaxForm[];
  getFilingWorkflow(profile): FilingWorkflowState;
}
```

`apps/web/src/lib/tax.ts` calls `getEngine(user.country)` once per request
and uses whatever comes back. It never imports `@taxiva/tax-engine-us` or
`@taxiva/tax-engine-ph` directly — only `@taxiva/document-ai`'s
`ensureEnginesRegistered()`, which registers both, does.

## Adding a third country

1. `packages/tax-engine-<code>/` — copy the shape of `tax-engine-us` or
   `tax-engine-ph`: `rules.ts` (the actual tax math, cited to an official
   source), `categorize.ts` (keyword-based expense categorization),
   `engine.ts` (implements `TaxEngine`), `index.ts`.
2. Register it in `packages/document-ai/src/dispatch.ts`.
3. Add the country to `CountryCode` in `tax-engine-core/src/types.ts`.
4. Add its taxpayer types / filing statuses to the settings page dropdowns
   in `apps/web/src/app/dashboard/settings/page.tsx`.
5. Nothing else changes — the dashboard, document pipeline, AI assistant,
   and filing workflow UI all read from `TaxEngine` generically.

## Why this shape

- **The Philippines is not a lesser US.** Its tax system has genuinely
  different mechanics (percentage tax, an 8%-flat-vs-graduated election,
  OSD, VAT threshold) that don't map onto US concepts like the standard
  deduction. Forcing both into one shared "tax calculator" would have
  meant either breaking PH accuracy or bloating US logic with irrelevant
  branches. Separate packages keep each country's logic honest and
  independently testable (each has its own `engine.test.ts`).
- **AI/document infrastructure is genuinely shared.** OCR, field
  extraction regexes, expense categorization *dispatch* (not the category
  rules themselves), the AI provider abstraction, and the proactive
  insight generator in `@taxiva/document-ai` don't know or care which
  country they're running for — they just call whatever `TaxEngine` is
  registered. That's the actual shared infrastructure the product
  strategy asked for.
- **A stub country teaches you the seams.** If you want to sanity-check
  that a new engine is "real" before writing its tax rules, `registry.test.ts`
  shows the minimal shape a `TaxEngine` needs to satisfy the interface.

## Data flow for one estimate

1. User adds income/expenses (manually or via document upload).
2. `apps/web/src/lib/tax.ts#getUserTaxContext` loads the user's rows from
   Postgres/SQLite, converts them to the domain `IncomeItem[]` /
   `ExpenseItem[]` shapes, and calls `engine.estimateTax(...)`.
3. The engine returns a `TaxEstimate` with a `warnings: string[]` array —
   every assumption the engine had to make is a string in that array,
   surfaced verbatim in the UI (see the "Assumptions & things to verify"
   panel on the Tax Estimate page). This is deliberate: a wrong number
   silently presented as fact is worse than a right number with a visible
   caveat.
4. `@taxiva/document-ai#generateInsights` turns the estimate,
   `findDeductionCandidates()`, and `detectMissingDocuments()` into the
   narrated cards on the Overview page — the "autonomous tax company"
   experience the product asked for, built entirely from real engine
   output, never from an LLM inventing numbers.

## AI is a pluggable adapter, not a load-bearing wall

`packages/document-ai/src/ai/provider.ts` defines one interface,
`AIProvider`. Two implementations ship:

- `MockAssistantProvider` (default, $0, local, deterministic) — answers
  questions by reading the user's actual `TaxEstimate` / deduction
  candidates / missing documents and filling in a template. It cannot
  hallucinate a number that isn't already in the data, because it never
  generates numbers — it reads them.
- `AnthropicProvider` (opt-in via `ANTHROPIC_API_KEY`) — calls the Claude
  Messages API directly over `fetch`, passing the same real data as
  context so the model explains rather than invents.

`getAIProvider()` in `ai/index.ts` picks between them based on whether the
env var is set. Nothing else in the app knows which one is active.
