# Cost strategy: Free → Cheap → Scale

Every component below has three tiers. **Free MVP** is what this repo
actually runs on today — $0, no credit card, works offline where possible.
**Cheapest Production** is the first real money you'd spend, and roughly
when you'd spend it. **Scale** is what you reach for once you have paying
users and the revenue to justify it. Nothing in the current build requires
leaving the Free MVP column.

| Component | Free MVP | Cheapest Production | Scale |
|---|---|---|---|
| **Database** | SQLite via Prisma, a single file (`apps/web/prisma/dev.db`) — $0 | Supabase free tier (500MB Postgres) or Neon free tier (serverless Postgres) — flip `provider = "sqlite"` to `"postgresql"` in `prisma/schema.prisma`; still $0 until you outgrow the free tier, then ~$10–25/mo | Supabase Pro / Neon paid tier / managed RDS or Cloud SQL, with read replicas and point-in-time-recovery backups — $25–200+/mo depending on volume |
| **Hosting** | `npm run dev` locally, or Vercel Hobby / Render free web service — $0 | Vercel Pro ($20/mo) or Render's paid web service tier, once you need custom domains, more build minutes, or no cold starts | Multi-region deployment, dedicated infra, autoscaling — AWS/GCP/Azure or Vercel Enterprise — $200+/mo, scales with traffic |
| **AI (assistant, document understanding)** | `MockAssistantProvider` — deterministic, template-driven, reads the user's real data and answers from it. $0, cannot hallucinate a number because it never generates one | `ANTHROPIC_API_KEY` set — `AnthropicProvider` calls Claude directly, pay-per-token, no minimum spend — roughly $0.01–0.10 per conversation turn at current model pricing | Model router by task (cheap/fast model for categorization, stronger model for open-ended chat), fine-tuned classifiers, dedicated document-understanding pipeline — cost scales with volume, optimized per-session |
| **OCR** | Tesseract.js — runs locally in Node, no API key, works offline once language data is cached — $0 | Google Cloud Vision OCR (1,000 units/month free, then ~$1.50/1,000 units) or AWS Textract (1,000 pages/month free for 3 months, then pay-per-page) | Azure Document Intelligence prebuilt receipt/invoice models, or a fine-tuned in-house model, with human-in-the-loop review for low-confidence extractions — cost scales with document volume and accuracy requirements |
| **Storage** (uploaded documents) | Extracted text/fields persisted to the database; original files are not retained — $0 | Supabase Storage free tier (1GB) or Cloudflare R2 (10GB free, no egress fees) once original files need to be kept for audit/re-processing | S3/GCS with lifecycle policies, encryption at rest, and retention policies matching each country's record-keeping requirements — a few dollars/mo per 100GB plus egress |
| **Authentication** | Hand-rolled: `crypto.scrypt` password hashing, a `Session` table, an httpOnly cookie — zero dependencies, zero cost | Clerk or Supabase Auth free tiers (social login, magic links, MFA) once "email + password only" starts costing signups | Auth0 / Clerk paid tiers or a dedicated IdP with SOC 2 compliance documentation — $0.02–0.05+ per monthly active user |
| **Email** (reminders, notifications) | Not implemented — the notification *preference* is stored, but no email is actually sent | Resend or Postmark free/starter tier (~3,000 emails/month free, then a few dollars per 1,000) for deadline reminders and missing-document nudges | Dedicated transactional email infra with deliverability monitoring, templated campaigns — scales with user count |
| **Monitoring / error tracking** | Console logs + hosting provider's built-in logs (Vercel/Render both give this for free) | Sentry free tier (5k errors/month) once real users start hitting real edge cases | Sentry paid + a full observability stack (structured logs, tracing, uptime alerting) |
| **Tax filing** | Not built. Fully simulated **Sandbox mode**: the app produces draft forms and a mock "SANDBOX-" confirmation ID; nothing is ever transmitted to the IRS or BIR — $0, and this is intentional, not a placeholder for something missing | A licensed human preparer (CPA/EA in the US, accredited tax practitioner/CPA in the PH) reviews and files the return through *existing* professional channels (IRS-authorized e-file software, BIR eBIRForms/eFPS) — this is a services cost (a preparer's time), not a software cost, likely $30–150 per return depending on complexity | Direct integration with IRS-authorized e-file infrastructure (via a licensed EFIN holder — either the company becomes one, or it partners with/white-labels an existing authorized e-file provider) for the US; for the PH, likely stays "generate accurate forms + licensed accountant partner" for the foreseeable future since third-party BIR system integration is not generally available. See `docs/LAUNCH_READINESS.md` and `docs/TAX_ENGINE_COVERAGE.md` for what this actually requires before it can be turned on |

## Notes on the table

- The schema (`apps/web/prisma/schema.prisma`) is written to be
  Postgres-compatible from day one — no SQLite-only types — so the database
  upgrade is a connection-string change, not a rewrite.
- The `AIProvider` interface (`packages/document-ai/src/ai/provider.ts`) and
  `OcrEngine` interface (`packages/document-ai/src/ocr.ts`) are the same
  regardless of tier — nothing in the app changes when a provider is swapped.
- **Tax filing is the one row that isn't a "flip a config value" upgrade.**
  Every other row is a swap-the-provider change behind an existing interface.
  Real filing requires legal/regulatory work (PTIN/EFIN in the US, licensed
  preparer involvement in both countries) before any engineering spend makes
  sense — see `docs/LAUNCH_READINESS.md`.

## Developer tools used in this repo (all free)

- **npm workspaces** — no paid monorepo tool (Nx/Turborepo Cloud) needed at this size
- **Vitest** — free, open-source, fast
- **TypeScript** — free
- **Prisma** — free ORM; its paid "Accelerate"/"Pulse" add-ons are not used here
- **Tailwind CSS** — free, no design system license

## The one thing that costs money if you turn it on

Everything in this repo runs at $0 by default. The single opt-in paid
dependency is `ANTHROPIC_API_KEY` for the AI assistant's cheap-production
tier — and even that has no minimum spend, no monthly fee, pay only for
tokens used, and the app works completely without it (falls back to the
free local assistant).
