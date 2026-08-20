# Cost strategy: Free → Cheap → Scale

Every major component below has three tiers. **Free** is what this repo
actually runs on today — $0, no credit card, works offline where possible.
**Cheap** is the first real money you'd spend, and roughly when you'd spend
it. **Scale** is what you reach for once you have paying users and the
revenue to justify it. Nothing in Stage 1 requires leaving the Free column.

## Database

| Tier | Choice | When |
|---|---|---|
| **Free** (in this repo) | SQLite via Prisma, a single file (`apps/web/prisma/dev.db`) | Local dev, demos, a single-instance early deployment |
| Cheap | Supabase free tier (500MB Postgres, pauses after inactivity) or Neon free tier (serverless Postgres, generous free tier) — flip `provider = "sqlite"` to `"postgresql"` in `prisma/schema.prisma` and point `DATABASE_URL` at it | The moment you deploy somewhere with an ephemeral filesystem (Vercel, most serverless hosts) — SQLite's file won't persist there |
| Scale | Supabase Pro / Neon paid tier / managed RDS or Cloud SQL, with read replicas and PITR backups | Real user data, uptime SLAs matter |

The schema (`apps/web/prisma/schema.prisma`) is written to be
Postgres-compatible from day one — no SQLite-only types — so this is a
connection-string change, not a rewrite.

## Hosting

| Tier | Choice | When |
|---|---|---|
| **Free** | Run `npm run dev` locally, or deploy the Next.js app to Vercel's free Hobby tier / Render's free web service tier | Validating the idea, demoing to early users |
| Cheap | Vercel Pro ($20/mo) or Render's paid web service tier, once you need custom domains at scale, more build minutes, or no cold starts | First paying users, needs your OCR/AI processing to not be rate-limited by a free tier |
| Scale | Multi-region deployment, dedicated Postgres, a real CDN, autoscaling — AWS/GCP/Azure, or Vercel Enterprise | Meaningful traffic, uptime commitments |

## AI (the assistant, document understanding)

| Tier | Choice | When |
|---|---|---|
| **Free/local** (default in this repo) | `MockAssistantProvider` — a deterministic, template-driven assistant that reads the user's real `TaxEstimate`/deductions/missing-documents and answers from that data. Zero API cost, cannot hallucinate a number because it never generates one. | Prototype, demos, cost-sensitive early stage |
| Cheap | Set `ANTHROPIC_API_KEY` — `AnthropicProvider` (`packages/document-ai/src/ai/anthropicProvider.ts`) calls Claude directly over `fetch`, pay-per-token, no minimum spend | Once you want open-ended natural-language conversation, not just templated answers |
| Scale | A router across multiple models by task (cheap/fast model for categorization, a stronger model for open-ended chat), fine-tuned classifiers for document categorization, a dedicated document-understanding pipeline | High volume, cost-per-user-session becomes worth optimizing |

The interface (`AIProvider` in `packages/document-ai/src/ai/provider.ts`)
is the same regardless of tier — nothing in the app changes when you swap
providers.

## Document processing / OCR

| Tier | Choice | When |
|---|---|---|
| **Free/open-source** (default) | Tesseract.js (`packages/document-ai/src/ocr.ts`) — runs locally in Node, no API key, works offline once its language data is cached | Prototype, low volume, receipts/invoices with reasonably clean text |
| Cheap | Google Cloud Vision OCR (free tier: 1,000 units/month, then ~$1.50/1,000 units) or AWS Textract (free tier: 1,000 pages/month for 3 months, then pay-per-page) | Tesseract's accuracy on messy phone photos becomes the bottleneck |
| Scale | A dedicated document-intelligence pipeline (e.g. Azure Document Intelligence's prebuilt receipt/invoice models, or a fine-tuned in-house model) with human-in-the-loop review for low-confidence extractions | High volume, accuracy directly affects trust in tax numbers |

`OcrEngine` (`packages/document-ai/src/ocr.ts`) is an interface with a
`TesseractOcrEngine` and a `MockOcrEngine` (for tests); swapping in a paid
API means adding one more class behind the same interface.

## Auth

| Tier | Choice | When |
|---|---|---|
| **Free** (default) | Hand-rolled: Node's built-in `crypto.scrypt` for password hashing, a `Session` table, an httpOnly cookie (`apps/web/src/lib/auth.ts`) — zero dependencies, zero cost, no vendor account needed | Prototype — this is genuinely fine for early validation |
| Cheap | Clerk or Supabase Auth free tiers (social login, magic links, MFA without building it yourself) | Once "email + password only" starts costing you signups, or you need SSO/social login |
| Scale | Auth0 / Clerk paid tiers, or a dedicated IdP, with SOC 2 compliance docs | Handling real financial documents for many users — this is also roughly where identity verification for Stage 2 real filing starts to matter, see `docs/ROADMAP.md` |

## File storage (uploaded documents)

| Tier | Choice | When |
|---|---|---|
| **Free** (default) | Documents are processed in-memory and only their extracted text/fields are persisted to the database — no file storage needed for the MVP loop | Prototype |
| Cheap | Supabase Storage free tier (1GB) or Cloudflare R2 (10GB free, no egress fees) once you need to keep the original file for audit/re-processing | Users expect to re-download their uploaded receipts |
| Scale | S3/GCS with lifecycle policies, encryption at rest, and retention policies matching each country's record-keeping requirements (see `docs/ROADMAP.md`'s "Secure records" section) | Real filings, compliance retention requirements |

## Background jobs / async processing

| Tier | Choice | When |
|---|---|---|
| **Free** (default) | Everything runs synchronously inside a Next.js server action / route handler — OCR and categorization happen inline on upload | Low volume, OCR of a single receipt takes a few seconds |
| Cheap | A free-tier queue (Upstash QStash free tier, or Supabase's `pg_cron`) to move OCR off the request path | Uploads start timing out on serverless hosts' request-duration limits |
| Scale | A real job queue (BullMQ + Redis, or a managed equivalent) with retries, dead-letter handling, and horizontal worker scaling | High volume, need reliability guarantees |

## Monitoring / error tracking

| Tier | Choice | When |
|---|---|---|
| **Free** | Console logs + your hosting provider's built-in logs (Vercel/Render both give you this for free) | Prototype |
| Cheap | Sentry free tier (5k errors/month) | Real users hitting real edge cases you need to know about |
| Scale | Sentry paid + a real observability stack (structured logs, tracing) | Production reliability commitments |

## Developer tools used in this repo (all free)

- **npm workspaces** — no paid monorepo tool (Nx/Turborepo Cloud) needed at this size
- **Vitest** — free, open-source, fast
- **TypeScript** — free
- **Prisma** — free ORM, its paid "Accelerate"/"Pulse" add-ons are not used here
- **Tailwind CSS** — free, no design system license

## The one thing that costs money if you turn it on

Everything in this repo runs at $0 by default. The single opt-in paid
dependency is `ANTHROPIC_API_KEY` for the AI assistant's "cheap" tier —
and even that has no minimum spend, no monthly fee, pay only for tokens
used, and the app works completely without it (falls back to the free
local assistant).
