import Link from "next/link";

const countries = [
  {
    flag: "🇺🇸",
    name: "United States",
    detail: "Federal income tax + self-employment tax, Form 1040 & Schedule C drafts.",
  },
  {
    flag: "🇵🇭",
    name: "Philippines",
    detail: "BIR graduated rates, 8% flat option, percentage tax & VAT threshold awareness.",
  },
];

const pipeline = [
  { step: "Connect", detail: "Upload documents — receipts, invoices, pay stubs, marketplace payout reports." },
  { step: "Understand", detail: "OCR + rule-based extraction reads amounts, vendors, and dates automatically." },
  { step: "Categorize", detail: "Income and expenses are sorted by country-specific tax categories." },
  { step: "Estimate", detail: "A real tax engine — not a guess — computes your draft liability with every assumption shown." },
  { step: "Review & approve", detail: "You check the numbers, approve the draft, and see a simulated filing workflow." },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-white to-ink-50">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold text-white">T</div>
          <span className="text-lg font-semibold text-ink-900">Taxiva</span>
        </div>
        <nav className="flex items-center gap-3">
          <Link href="/login" className="btn-secondary">Log in</Link>
          <Link href="/register" className="btn-primary">Try the demo</Link>
        </nav>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-16 text-center">
        <span className="badge bg-brand-100 text-brand-800">Sandbox / MVP build — no real filings are submitted</span>
        <h1 className="mt-6 text-4xl font-semibold tracking-tight text-ink-900 sm:text-5xl">
          Your finances, understood continuously.
          <br />
          Your taxes, ready before you ask.
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-lg text-ink-600">
          Taxiva reads your documents, tracks your income and expenses, finds deductions, and keeps a
          running tax estimate — so when filing season comes, your return is already drafted. You
          review, approve, and file.
        </p>
        <div className="mt-8 flex items-center justify-center gap-3">
          <Link href="/register" className="btn-primary px-6 py-3 text-base">Start free — no card required</Link>
          <Link href="/login" className="btn-secondary px-6 py-3 text-base">I already have an account</Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="grid gap-6 sm:grid-cols-2">
          {countries.map((c) => (
            <div key={c.name} className="card">
              <div className="text-3xl">{c.flag}</div>
              <h3 className="mt-3 text-lg font-semibold text-ink-900">{c.name}</h3>
              <p className="mt-1 text-sm text-ink-600">{c.detail}</p>
            </div>
          ))}
        </div>
        <p className="mt-4 text-center text-xs text-ink-400">
          Built on a country-modular tax engine — each jurisdiction is its own package with its own rules,
          forms, and filing workflow. The Philippines is designed to become the primary expansion market.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-6 py-16">
        <h2 className="text-center text-2xl font-semibold text-ink-900">How it works</h2>
        <ol className="mt-8 grid gap-6 sm:grid-cols-5">
          {pipeline.map((p, i) => (
            <li key={p.step} className="card">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-ink-900 text-xs font-semibold text-white">
                {i + 1}
              </div>
              <h3 className="mt-3 font-medium text-ink-900">{p.step}</h3>
              <p className="mt-1 text-sm text-ink-600">{p.detail}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="mx-auto max-w-4xl px-6 py-16">
        <div className="card border-amber-200 bg-amber-50">
          <h3 className="font-semibold text-amber-900">Important: this is a planning tool, not a filed tax return</h3>
          <p className="mt-2 text-sm text-amber-800">
            Taxiva estimates taxes and drafts forms for planning purposes. It does not currently submit
            returns to the IRS or the BIR — that requires additional infrastructure, credentials, and (in
            many cases) a licensed tax professional. The in-app filing workflow is clearly labeled as a
            sandbox simulation. See our public roadmap for exactly what real e-filing requires.
          </p>
        </div>
      </section>

      <footer className="border-t border-ink-100 py-8 text-center text-sm text-ink-400">
        Taxiva — built for early-stage validation. Not affiliated with the IRS or the BIR.
      </footer>
    </main>
  );
}
