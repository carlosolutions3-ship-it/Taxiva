# Taxiva

An AI-native tax platform built country-modular from day one. Stage 1 (this
repo, today) is a **free-to-run prototype**: upload documents, get an
AI-assisted tax estimate, draft forms, and a simulated filing workflow — for
the **United States** and the **Philippines**. Stage 2 (not built yet, see
[`docs/ROADMAP.md`](docs/ROADMAP.md)) is what it takes to move from draft
estimates to real, government-accepted e-filing.

**This is a planning tool, not a filed tax return.** No document in this
repo submits anything to the IRS or the BIR. Every draft form and every tax
figure says so.

## Why country-modular

The product bets on the Philippines as the primary long-term expansion
market, while starting in the US and PH simultaneously. So the tax logic is
never allowed to assume "US" anywhere in shared code:

```
packages/
  tax-engine-core/    country-agnostic types + the TaxEngine interface + a registry
  tax-engine-us/      implements TaxEngine for the United States (federal only, MVP)
  tax-engine-ph/      implements TaxEngine for the Philippines (BIR)
  document-ai/        OCR, field extraction, categorization dispatch, AI assistant,
                       proactive insights — all country-agnostic, calls into
                       whichever country engine is registered
apps/
  web/                Next.js app: auth, dashboard, document upload, forms, filing UI
```

Adding a third country means writing a new `packages/tax-engine-<code>`
package that implements the `TaxEngine` interface from `tax-engine-core` and
registering it — no changes anywhere else. See
[`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Quick start (local, $0)

```bash
npm install
cp apps/web/.env.example apps/web/.env   # SQLite by default, no external service
cd apps/web
npx prisma db push                        # creates apps/web/prisma/dev.db
cd ../..
npm run dev                                # http://localhost:3000
```

Register an account, pick United States or Philippines, and go through
Documents → Income/Expenses → Deductions → Tax estimate → Draft forms →
Filing (sandbox) → AI Assistant.

Everything above runs with zero paid services. To turn on a real LLM for the
assistant, set `ANTHROPIC_API_KEY` in `apps/web/.env` (see
[`docs/COST_STRATEGY.md`](docs/COST_STRATEGY.md) — this is the one place a
real API bill enters the picture, and it's opt-in).

## Tests

```bash
npm run test --workspaces --if-present   # 23 tests across the 4 packages
npm run typecheck --workspaces --if-present
```

## Documentation

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — how the country-modular engine works, how to add a country
- [`docs/COST_STRATEGY.md`](docs/COST_STRATEGY.md) — Free → Cheap → Scale for every major component
- [`docs/ROADMAP.md`](docs/ROADMAP.md) — Stage 1 (this repo) vs Stage 2 (real e-filing): what's needed, what requires licensing/partnerships
- [`docs/PH_TAX_VERIFICATION.md`](docs/PH_TAX_VERIFICATION.md) — every Philippine tax rule encoded, with its source and what to verify before relying on it
