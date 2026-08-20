import Link from "next/link";
import { BRAND_NAME, BRAND_TAGLINE } from "@/lib/brand";
import { CheckShieldIcon, DocumentIcon, LockIcon, SparkleIcon, ArrowRightIcon, ChartIcon } from "@/components/icons";

const countries = [
  {
    flag: "🇺🇸",
    name: "United States",
    detail: "Federal income tax and self-employment tax, with draft Form 1040 and Schedule C.",
  },
  {
    flag: "🇵🇭",
    name: "Philippines",
    detail: "BIR graduated rates, the 8% flat-tax option, percentage tax, and VAT-threshold awareness.",
  },
];

const pipeline = [
  { step: "Connect", detail: "Upload documents — receipts, invoices, pay stubs, marketplace payout reports." },
  { step: "Understand", detail: "OCR and rule-based extraction read amounts, vendors, and dates automatically." },
  { step: "Categorize", detail: "Income and expenses are sorted into country-specific tax categories." },
  { step: "Discover", detail: "Deductions are surfaced from your actual data, never guessed." },
  { step: "Review & approve", detail: "You check the numbers, approve the draft, and move through filing." },
];

const trustPoints = [
  {
    icon: LockIcon,
    title: "Your financial data is encrypted",
    detail: "In transit and at rest, using standard, well-understood cryptography — nothing exotic, nothing homegrown.",
  },
  {
    icon: DocumentIcon,
    title: "Your documents are private",
    detail: "Uploaded documents belong to your account only. Nothing is shared, sold, or used to train models on other people's data.",
  },
  {
    icon: SparkleIcon,
    title: "AI recommendations are evidence-based",
    detail: "Every figure the assistant shows you traces back to a real document or transaction in your account — never invented.",
  },
  {
    icon: CheckShieldIcon,
    title: "You remain in control before filing",
    detail: "Nothing is submitted anywhere without your explicit review and approval, every time.",
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-white">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-ink-900 text-sm font-bold text-white">
            {BRAND_NAME[0]}
          </div>
          <span className="text-lg font-semibold text-ink-900">{BRAND_NAME}</span>
        </div>
        <nav className="flex items-center gap-3">
          <Link href="/login" className="btn-secondary">
            Log in
          </Link>
          <Link href="/register" className="btn-primary">
            Start for free
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 pb-4 pt-14 text-center sm:pt-20">
        <div className="animate-in mx-auto mb-6 inline-flex items-center gap-1.5 rounded-full border border-ink-200 bg-ink-50 px-3 py-1 text-xs font-medium text-ink-600">
          <span className="h-1.5 w-1.5 rounded-full bg-warning-500" />
          Sandbox / demo build — see what filing actually requires below
        </div>
        <h1 className="animate-in text-4xl font-semibold tracking-tight text-ink-900 sm:text-6xl" style={{ animationDelay: "60ms" }}>
          {BRAND_TAGLINE}
        </h1>
        <p className="animate-in mx-auto mt-6 max-w-2xl text-lg text-ink-500 sm:text-xl" style={{ animationDelay: "120ms" }}>
          Connect your financial life. {BRAND_NAME} finds your documents, discovers potential deductions,
          prepares your return, and guides you through filing.
        </p>
        <div className="animate-in mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row" style={{ animationDelay: "180ms" }}>
          <Link href="/register" className="btn-primary px-6 py-3 text-base">
            Start for free
          </Link>
          <Link href="#how-it-works" className="btn-secondary px-6 py-3 text-base">
            See how it works
          </Link>
        </div>
        <p className="animate-in mt-4 text-xs text-ink-400" style={{ animationDelay: "220ms" }}>
          No credit card. Free to try, forever, on the free tier.
        </p>
      </section>

      {/* Product demo visual */}
      <section className="mx-auto max-w-5xl px-6 py-14">
        <div className="animate-in overflow-hidden rounded-2xl border border-ink-200 bg-ink-50 shadow-popover">
          <div className="flex items-center gap-1.5 border-b border-ink-200 bg-white px-4 py-3">
            <span className="h-2.5 w-2.5 rounded-full bg-ink-200" />
            <span className="h-2.5 w-2.5 rounded-full bg-ink-200" />
            <span className="h-2.5 w-2.5 rounded-full bg-ink-200" />
            <span className="ml-3 rounded-md bg-ink-50 px-3 py-1 text-xs text-ink-400">app.fyleo.com/dashboard</span>
          </div>
          <div className="grid gap-4 bg-white p-4 sm:grid-cols-[200px_1fr] sm:p-6">
            <div className="hidden flex-col gap-1 sm:flex">
              {["Overview", "Documents", "Income", "Deductions", "Tax return", "Filing"].map((item, i) => (
                <div
                  key={item}
                  className={`rounded-lg px-3 py-2 text-sm ${i === 0 ? "bg-brand-50 font-medium text-brand-700" : "text-ink-400"}`}
                >
                  {item}
                </div>
              ))}
            </div>
            <div className="space-y-4">
              <div className="rounded-xl border border-ink-100 bg-gradient-to-br from-brand-600 to-brand-800 p-5 text-white">
                <p className="text-xs font-medium uppercase tracking-wide text-brand-200">Tax season status</p>
                <p className="mt-1.5 text-xl font-semibold">Your return is 82% ready.</p>
                <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-white/20">
                  <div className="h-full w-[82%] rounded-full bg-white" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  { label: "Documents", value: "12/14" },
                  { label: "Deductions", value: "$8,420" },
                  { label: "Est. refund", value: "$3,280" },
                  { label: "Action needed", value: "2" },
                ].map((s) => (
                  <div key={s.label} className="rounded-lg border border-ink-100 p-3">
                    <p className="text-[11px] text-ink-400">{s.label}</p>
                    <p className="mt-0.5 text-sm font-semibold text-ink-900">{s.value}</p>
                  </div>
                ))}
              </div>
              <div className="rounded-lg border border-ink-100 p-3.5">
                <div className="flex items-center gap-2">
                  <SparkleIcon className="h-4 w-4 text-brand-600" />
                  <p className="text-sm font-medium text-ink-900">You have $1,240 of software subscriptions that look deductible.</p>
                </div>
                <p className="mt-1 pl-6 text-xs text-ink-400">Based on 18 transactions — needs a quick review.</p>
              </div>
            </div>
          </div>
        </div>
        <p className="mt-3 text-center text-xs text-ink-400">
          Illustrative preview of the {BRAND_NAME} dashboard — figures shown are sample data, not a live account.
        </p>
      </section>

      {/* Countries */}
      <section className="mx-auto max-w-5xl px-6 py-10">
        <div className="grid gap-6 sm:grid-cols-2">
          {countries.map((c) => (
            <div key={c.name} className="card">
              <div className="text-3xl">{c.flag}</div>
              <h3 className="mt-3 text-lg font-semibold text-ink-900">{c.name}</h3>
              <p className="mt-1 text-sm text-ink-500">{c.detail}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-xs text-ink-400">
          Built on a country-modular tax engine — each jurisdiction has its own rules, forms, and filing
          workflow. Coverage is deliberately scoped to what each engine actually supports; unsupported
          situations are labeled clearly inside the app, not silently guessed at.
        </p>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="mx-auto max-w-5xl scroll-mt-20 px-6 py-16">
        <h2 className="text-center text-2xl font-semibold text-ink-900">How it works</h2>
        <ol className="mt-8 grid gap-6 sm:grid-cols-5">
          {pipeline.map((p, i) => (
            <li key={p.step} className="card">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-ink-900 text-xs font-semibold text-white">
                {i + 1}
              </div>
              <h3 className="mt-3 font-medium text-ink-900">{p.step}</h3>
              <p className="mt-1 text-sm text-ink-500">{p.detail}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Honest capability messaging */}
      <section className="mx-auto max-w-4xl px-6 py-10">
        <div className="card border-ink-200 bg-ink-50">
          <div className="flex items-start gap-3">
            <SparkleIcon className="mt-0.5 h-5 w-5 shrink-0 text-brand-600" />
            <div>
              <h3 className="font-semibold text-ink-900">Your AI tax assistant handles the work. You review and approve.</h3>
              <p className="mt-2 text-sm text-ink-600">
                {BRAND_NAME} reads your documents, organizes your income and expenses, and prepares a draft
                return with a plain-language explanation of every number. What it does not do is submit
                anything on its own — you always review and approve first, and actual electronic filing
                depends on your jurisdiction, your eligibility, the authorization you grant, and which
                filing infrastructure is currently connected. Today, filing runs in a clearly labeled
                sandbox: it walks through the real workflow end to end but does not transmit anything to
                the IRS, the BIR, or any other tax authority.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Trust */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="text-center text-2xl font-semibold text-ink-900">Built to be trusted with your finances</h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {trustPoints.map((t) => (
            <div key={t.title} className="card flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <t.icon className="h-4.5 w-4.5" />
              </div>
              <div>
                <p className="font-medium text-ink-900">{t.title}</p>
                <p className="mt-1 text-sm text-ink-500">{t.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-6 pb-20 text-center">
        <Link href="/register" className="btn-primary px-6 py-3 text-base">
          Start for free
          <ArrowRightIcon className="h-4 w-4" />
        </Link>
      </section>

      <footer className="border-t border-ink-100 py-8 text-center text-sm text-ink-400">
        {BRAND_NAME} — built for early-stage validation. Not affiliated with the IRS or the BIR.
      </footer>
    </main>
  );
}
