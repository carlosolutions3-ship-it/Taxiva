# Roadmap: from draft estimates to real e-filing

**Read this before assuming Taxiva can submit anyone's real tax return.**
It currently cannot, on purpose. This document is honest about exactly what
separates "a good tax estimate" from "a legally filed return," what you
could plausibly do yourself, and what requires registration, accreditation,
licensing, or a professional/business partnership. Nothing here is legal
advice — verify with a tax attorney/CPA (US) or a BIR-accredited
practitioner/lawyer (Philippines) before acting on any of it, and re-verify
periodically since filing infrastructure rules change.

## Stage 1 — where this repo is today

Everything below is implemented and running at $0:

- Upload documents, extract text (OCR) and structured fields
- Categorize income and expenses by country-specific rules
- Identify potential deductions, flagged by confidence and whether they
  need human verification
- Estimate taxes using real country-specific tax math (US federal
  brackets + SE tax; PH graduated rates, 8% flat option, percentage tax,
  VAT-threshold awareness), with every assumption listed as a warning
- Explain the calculation, line by line
- Generate draft forms (US 1040/Schedule C; PH 1701A/2551Q) — clearly
  labeled DRAFT, not IRS/BIR-accepted
- Detect missing documents
- An AI tax assistant grounded in the user's real data
- A simulated filing workflow (draft → review → approve → sandbox filed)
  that transmits nothing to any government system

This is the same category of product as a sophisticated calculator + a
document organizer. It is legal to build and operate without any special
tax-preparer registration, **as long as it doesn't file on the user's
behalf or hold itself out as doing so** — which is exactly why every
filing-adjacent screen in the app says "sandbox" / "draft" / "simulation."

## Stage 2 — what real filing actually requires

### United States

| Requirement | What it is | Can you do it yourself? |
|---|---|---|
| **PTIN** (Preparer Tax Identification Number) | Required for anyone who prepares (or substantially prepares) a federal tax return for compensation | Yes — apply directly at irs.gov, ~$20/year, no exam required. Only matters if Taxiva (or a person behind it) is the one preparing returns for pay, not if it's self-prep software the taxpayer directs themselves — get this distinction confirmed by a tax attorney, since AI-assisted "here's your return" can blur the line |
| **EFIN** (Electronic Filing Identification Number) + **Authorized IRS e-file Provider** status | Required to transmit returns electronically to the IRS | You can apply yourself via the IRS e-file Application (Modernized e-File / IRS e-Services), but expect: identity verification, a suitability check for each Principal/Responsible Official (can include a credit check and fingerprinting), and compliance with **IRS Publication 3112**. This takes weeks to months, not days |
| **State e-file authorization** | Most states with an income tax run their own e-file program, separate from the IRS's | Yes, per state, once you have federal EFIN status — significant additional work if you support many states |
| **Alternative: partner with an existing Authorized e-file Provider** | Several companies offer "e-file as a service" APIs — you integrate with a company that already holds EFIN/state authorizations | This is the realistic fast path for an early-stage product: it converts a multi-month accreditation process into an integration + partnership agreement. Requires due diligence on the partner and a commercial agreement, not a government application |
| **IRS Free File Alliance** (optional) | A separate IRS program for approved partners to offer free filing to qualifying taxpayers | Optional, has its own strict membership/revenue-sharing rules — worth knowing about, not a blocker for launching |

### Philippines (BIR)

Philippine e-filing infrastructure and accreditation rules **change via BIR
Revenue Regulations and Revenue Memorandum Circulars**, including recent
changes under the Ease of Paying Taxes Act (RA 11976, 2024). Treat every
row below as "verify directly with BIR / a BIR-accredited practitioner
before building on it" — this table describes the general shape, not a
guarantee of current mechanics.

| Requirement | What it is | Can you do it yourself? |
|---|---|---|
| **BIR registration** (the taxpayer's own) | Every income earner needs a TIN and, for self-employed/business, a Certificate of Registration (BIR Form 2303) from their RDO | Yes, the taxpayer does this themselves (or through an accountant) — Taxiva can guide/checklist this but doesn't do it for them |
| **Official receipts / invoices** | Registered receipts/invoices are required to support reported income; increasingly, larger/certain taxpayers must use BIR-accredited Computerized Accounting Systems (CAS) or e-invoicing | The taxpayer's own compliance step; Taxiva can flag it as a missing-document item (already does) but issuing compliant receipts is the taxpayer's/their accountant's responsibility |
| **eBIRForms** | BIR's offline/online form-prep-and-submit system for taxpayers not required to use eFPS | Individual taxpayers can generally use this themselves. Taxiva preparing the *numbers* the user then types into eBIRForms requires no special accreditation — this is the safest, fastest Stage-2-lite integration point |
| **eFPS** (Electronic Filing and Payment System) | BIR's mandatory e-filing system for certain taxpayer classes (e.g. large taxpayers, top withholding agents) | Enrollment is done by the taxpayer/their authorized representative directly with BIR |
| **Filing/acting on a client's behalf** | Preparing and submitting returns for someone else, especially for compensation | Generally the domain of accredited tax agents/practitioners (CPAs, accredited tax agents) — verify BIR's current accreditation requirements for any party who wants to submit on behalf of taxpayers, including software platforms, before building that capability |
| **Direct system integration with eFPS/eBIRForms** | Programmatic submission (an API) rather than a human using BIR's own interface | Not something to assume exists or is open to third parties — this needs direct confirmation with BIR. The realistic path is very likely partnering with a BIR-accredited accounting/tax firm that handles actual submission, with Taxiva providing the prepared data |

### Cross-cutting requirements for real filing (both countries)

- **Identity verification** — confirming the person filing is who they say
  they are, at a level tax authorities accept (this is a real KYC problem,
  not a checkbox)
- **Electronic signature / authorization** — a legally recognizable way for
  the taxpayer to authorize submission (e.g. IRS Form 8879 e-signature PIN
  process in the US)
- **Secure records retention** — both the IRS and BIR have retention
  requirements for filed returns and supporting documents (multi-year);
  this needs encrypted storage with an actual retention policy, not "we
  keep it in the database"
- **Liability and insurance** — errors in a filed return carry real
  financial/legal consequences; a production filing product typically
  carries errors & omissions insurance and clear terms of service about
  what Taxiva is and isn't liable for
- **Professional oversight** — for anything beyond simple self-prep, having
  a licensed CPA (US) or accredited tax practitioner (PH) in the loop,
  even as a review layer, substantially de-risks both the product and the
  regulatory posture

## What to do next, concretely, when ready for Stage 2

1. Talk to a tax attorney in each country before writing any filing-adjacent
   code — the PTIN/EFIN and BIR-accreditation lines above are exactly the
   kind of thing that's cheap to get confirmed and expensive to get wrong.
2. For the US, evaluate e-file-as-a-service partners rather than pursuing
   your own EFIN first — it's the difference between weeks and months of
   lead time.
3. For the Philippines, the fastest legitimate path is very likely a
   partnership with an accredited accounting/tax practice: Taxiva prepares
   the numbers and draft forms (what it already does), the practice
   reviews and handles actual BIR submission. This also solves the
   "professional oversight" requirement above in one move.
4. Build the identity verification and e-signature flows as their own
   well-tested subsystem before wiring them to anything that actually
   submits a return.
5. Keep the Stage 1 sandbox experience exactly as-is for users/countries
   Stage 2 hasn't reached yet — there's no reason the whole product needs
   to wait on the slowest jurisdiction's accreditation timeline.
