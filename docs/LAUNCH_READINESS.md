# Launch readiness

This document draws a hard line between what Fyleo can honestly claim
today and what it would take to let a real customer file a real return.
It exists so the product, marketing, and roadmap never get ahead of what's
actually true. See `docs/TAX_ENGINE_COVERAGE.md` for tax-rule-level detail
and `docs/AI_SAFETY.md` for the AI assistant's safety posture; this
document is the operational/legal/business-readiness view.

Sourcing note: the US and PH sections below are built from research
conducted in August 2026 against IRS.gov, official BIR issuance titles,
and reputable secondary tax/legal sources. Where a source could not be
independently fetched and confirmed, it's marked **[VERIFY]** — treat
those points as "plausible and worth checking," not settled. Nothing here
should be read as legal advice; both sections explicitly recommend getting
real tax/regulatory counsel before spending engineering time on real
filing.

---

## READY NOW

Things that are true today, without further work:

- A working, country-modular tax estimation engine for US federal and PH
  national tax, covering the scenarios listed as VERIFIED/NEEDS
  VERIFICATION in `docs/TAX_ENGINE_COVERAGE.md`.
- A full sandbox product loop: document upload → AI-assisted categorization
  → deduction candidates → tax estimate → draft forms → a clearly-labeled
  sandbox filing simulation. Nothing in this loop is fake in the sense of
  "broken" — it's real software producing real numbers from real
  user-entered data; it's "sandbox" only in the sense that nothing is
  transmitted to a government system.
- An AI assistant that is structurally grounded against the user's actual
  data in its default (free) configuration, and a hardened, if unproven,
  system prompt for its optional LLM-backed tier — see `docs/AI_SAFETY.md`.
- A demo mode with two realistic, clearly-labeled, entirely fictional
  accounts (US freelance designer, PH online seller) that can be shown to
  prospective users or investors without touching anyone's real financial
  data.
- $0 hosting/infra cost at this scale — see `docs/COST_STRATEGY.md`.

**What this supports right now:** demos, user interviews, design-partner
conversations, and "here's what we're building" validation. It does not
support onboarding a real paying customer to actually file a return.

---

## NEEDS DEVELOPMENT

Real engineering work, no new legal status required to build it:

- **Itemized deductions, tax credits (US)** — Child Tax Credit, EITC,
  education credits, etc. are entirely unmodeled. Needed before the US
  engine covers a meaningfully wide range of real filers.
- **AMT modeling (US)**, **Additional Medicare Tax (US)**, **depreciation
  schedules (US)** — flagged gaps in `docs/TAX_ENGINE_COVERAGE.md`.
- **VAT computation and withholding-tax reconciliation (PH)** — currently
  only *detected*, not computed/reconciled. A real PH self-employed filer
  above the VAT threshold, or one with withheld tax from marketplaces, gets
  an incomplete number today.
- **Compensation-income (pure employee) tax path (PH)** — the engine
  currently treats all PH income as self-employment-style gross
  receipts; a pure employee's withholding-table/Form 2316 situation isn't
  separately modeled.
- **State income tax (US)** — completely out of scope currently; federal
  only.
- **A mocked-fetch test for `AnthropicProvider`'s safety system prompt**
  (see `docs/AI_SAFETY.md`) so the hardened rules can't silently regress.
- **An "AI-assisted, human-reviewed" workflow primitive** — none of the
  research below found a realistic path to real filing that doesn't
  eventually put a licensed human (CPA/EA in the US, accredited tax
  practitioner/CPA in the PH) in the loop for at least some portion of
  customers. The product has no concept yet of routing a return to a human
  reviewer, collecting their sign-off, or representing that state to the
  user.

---

## NEEDS LEGAL / COMPLIANCE

Work that is not primarily engineering:

- **A written legal/regulatory opinion** on whether and how a
  substantially-AI-generated return can be prepared and filed without a
  licensed human preparer of record, in both the US and the PH. Both
  research passes below flag this as a genuinely open question, not
  something resolved by "we built software."
- **US**: a PTIN for whoever is the tax-return preparer of record (if
  Fyleo positions itself as preparing returns rather than being pure DIY
  software the taxpayer self-files with); a Written Information Security
  Plan (WISP) satisfying IRS Pub 4557 / the FTC Safeguards Rule before
  handling real taxpayer financial data at any volume; Circular 230
  compliance for any CPA/EA in the loop.
- **PH**: a decision on which BIR forms Fyleo intends to *generate for the
  taxpayer to self-file* (no special accreditation needed) versus which
  ones would require BIR accreditation as a tax agent/practitioner or
  eTSPCert software certification to submit directly. Also: Data Privacy
  Act (RA 10173) compliance — Philippine tax data is classified as
  Sensitive Personal Information, and NPC registration/DPO designation is
  plausibly required before processing real Filipino taxpayer data at any
  meaningful scale, independent of the filing question entirely.
- **Terms of service / marketing language legal review** — every claim on
  the marketing site needs to be checked against actual product capability
  before any real customer signs up (this document is a starting point for
  that review, not a substitute for it).
- **Above ~₱3,000,000 gross receipts (PH)**, a taxpayer legally requires
  CPA-audited financial statements attached to their return — a hard
  statutory line, not a nice-to-have, that a growing PH customer will hit.

---

## NEEDS GOVERNMENT-PROVIDER ACCESS

Access/accreditation that sits outside Fyleo's own control, from a
government body or an accredited intermediary:

- **US**: an EFIN (via IRS suitability check + fingerprinting for
  non-CPA/EA/attorney principals, IRS states up to 45 days, commonly
  60–90 in practice) if Fyleo becomes its own Electronic Return
  Originator/Transmitter — or, more realistically for a small team, a
  commercial relationship with an existing IRS-authorized transmitter/API
  partner (see "US filing roadmap" below) that already carries the
  MeF/Assurance-Testing-System burden.
- **PH**: eTSPCert (Electronic Tax Software Provider Certification) from
  the BIR, required to submit filings directly through eFPS/eBIRForms
  infrastructure as a piece of software rather than the taxpayer doing it
  themselves. Described by secondary sources as selective and rigorous;
  only a small number of companies (e.g. JuanTax, and by self-report,
  Taxumo) have gone through it, over multi-year timeframes.
- **PH**: BIR accreditation as a tax agent/practitioner (generally
  requires being a licensed CPA or attorney plus tax-specific CE/training)
  for anyone who prepares, signs, or certifies a return on a taxpayer's
  behalf before the BIR.

---

## CANNOT BE DONE WITH $0

- **Real e-filing infrastructure, either country.** Both the EFIN path
  (US) and the eTSPCert path (PH) require sustained engineering investment
  and, in the US case, a real Written Information Security Plan/security
  program — not achievable on the $0 architecture described in
  `docs/COST_STRATEGY.md`. The cheapest realistic path in both countries
  is **not building direct government-system integration at all** —
  partnering with an existing authorized transmitter (US) or generating
  accurate forms for the taxpayer to self-file, paired with a referral
  relationship to licensed CPAs/tax agents (PH) — but even that requires
  real money: a compliance/security program (WISP) in the US, and
  licensed-professional relationships (which cost money, even as a
  referral/revenue-share model) in the PH.
- **Any credentialed human review layer** (a CPA, EA, or accredited PH tax
  practitioner reviewing/signing real returns) — this is a services cost,
  not a software cost, and does not go away at any scale.
- **NPC/Data Privacy Act registration and a real Data Privacy Impact
  Assessment (PH)**, and FTC Safeguards Rule-compliant security program
  (US) — both are close to launch-blocking once real taxpayer data is
  handled at meaningful scale, and both cost real money (legal/compliance
  time at minimum) to do properly.

---

## US real-filing roadmap (research summary)

Full research is preserved in this session's record; the operative
conclusions:

- **Direct IRS MeF integration is possible but is a multi-month,
  engineering-team-scale undertaking** — becoming an Authorized IRS e-file
  Provider (Software Developer/Transmitter) requires suitability checks,
  Publication 4164-spec development, and passing the IRS's Assurance
  Testing System (ATS) for every form/schedule supported. Not a near-term
  fit for a small team.
- **A realistic near-term path is a partner integration** with an existing
  IRS-authorized transmitter that exposes filing as an API — companies
  like Column Tax (embeddable, API-first tax filing infrastructure) and
  Taxfyle (adds a human-preparer layer on top) are named examples found in
  research, though their commercial terms weren't independently verified
  and should be confirmed directly with the vendor. **[VERIFY current
  vendor terms directly before committing.]**
- **PTIN**: ~$18.75/year, a same-day online application, required for
  whoever is the "preparer of record" if Fyleo (or a human in the loop) is
  substantially preparing returns for compensation — not required if
  Fyleo's role is limited to self-file software formatting/transmitting a
  taxpayer's own return (the DIY-software carve-out most consumer tax
  software relies on).
- **EFIN**: no IRS fee, but a real suitability/background-check process
  (credit history, tax compliance history, criminal background, e-file
  compliance history) for every Principal/Responsible Official who isn't
  already an attorney/CPA/EA, plus fingerprinting — budget 45–90 days.
- **Ongoing compliance**: Publication 1345 (ERO responsibilities),
  Publication 4557 (a written taxpayer-data security plan is legally
  required, not optional, once handling real taxpayer data), Circular 230
  for any credentialed preparer in the loop.
- **Preparer liability is real and personal**: IRC §6694/§6695 penalties
  attach to whoever is the return's preparer of record for unreasonable
  positions, willful/reckless conduct, or due-diligence failures — this
  materially shapes how much human review is prudent before any return
  generated with AI assistance gets transmitted.
- **Identity/signature**: the Self-Select PIN + prior-year AGI (or Form
  8879 when an ERO enters the PIN on the taxpayer's behalf) is the
  standard e-signature mechanism; Form 8879 must be retained 3 years past
  the later of the due date or filing date.
- **Bottom line**: a "professional-in-the-loop" model — a licensed CPA/EA
  reviews and authorizes before transmission, routed through either
  Fyleo's own EFIN or a partner transmitter's — is the realistic near-term
  path. A fully autonomous, no-human-in-the-loop filing product raises
  open preparer-liability and PTIN-classification questions that do not
  appear to have settled IRS guidance, and should not be assumed safe
  without dedicated legal review.

## Philippines real-filing roadmap (research summary)

- **Registration** (TIN, Certificate of Registration / BIR Form 2303,
  Books of Accounts) is a real, government-verifiable process Fyleo could
  help guide a user through — but the credentials themselves are always
  issued by the BIR (increasingly via its ORUS online portal), not by
  Fyleo.
- **Two realistic tiers of automation**, per the research:
  - **Tier A — "generate accurate forms, taxpayer self-files via
    eBIRForms."** Requires no BIR accreditation of Fyleo as a company.
    This is the realistic near-term tier, and roughly matches what the
    product's sandbox already produces (draft 1701A/2551Q figures) — the
    gap to real is "the taxpayer takes these numbers and actually files
    them themselves," not a software gap.
  - **Tier B — direct submission via eFPS/an accredited Tax Software
    Provider (eTSPCert certification).** A real, named BIR program (with
    confirmed examples: JuanTax was the first certified TSP in 2019;
    Taxumo self-reports certification), but described as selective and a
    multi-year undertaking for the companies that have done it. Not a
    near-term target.
- **CPA/accredited-agent involvement is a hard requirement, not a
  preference, in specific cases**: audited financial statements are
  legally required above ₱3,000,000 gross annual receipts, only
  performable by a BIR- and PRC-accredited CPA; separately, anyone signing
  a return *on behalf of* a taxpayer before the BIR generally needs BIR
  tax-agent accreditation (in practice, usually a CPA or lawyer who's gone
  through that specific accreditation).
- **Recordkeeping**: BIR retention was reduced from 10 to 5 years by
  RR No. 7-2024 (implementing the Ease of Paying Taxes Act), extended
  indefinitely if a protest/assessment/refund claim is pending.
- **Data privacy**: PH tax data is Sensitive Personal Information under
  the Data Privacy Act; NPC registration/DPO designation is plausibly
  required well before real filings launch, independent of which filing
  tier is chosen, since it attaches to processing the data at all.
- **Bottom line**: "generate accurate forms + a referral relationship
  with BIR-accredited CPAs/tax agents for anything requiring
  certification or crossing the ₱3M threshold" is the realistic near-term
  model — closely matching how existing PH tax-prep products (e.g.
  Taxumo's advertised "Consult" offering, self-reported) appear to be
  structured. Direct eFPS/eTSPCert integration is a distinct, later-stage
  initiative, not a prerequisite for a real-money launch.
