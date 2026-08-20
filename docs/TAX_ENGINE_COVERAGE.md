# Tax engine coverage

This document exists so the product never gives the impression that it
supports every possible tax situation. Every rule implemented in
`packages/tax-engine-us` and `packages/tax-engine-ph` is classified below as:

- **VERIFIED** — matches a cited statute/regulation as of the date noted, and
  the arithmetic has a passing unit test.
- **NEEDS VERIFICATION** — implemented and plausible, but depends on a figure
  or mechanic that changes often (inflation adjustments, BIR issuances) and
  has not been independently re-checked against a current official source as
  part of this review.
- **NOT IMPLEMENTED** — the situation exists in real tax law and the engine
  either ignores it, approximates it, or refuses to model it. Anything in
  this bucket must not be silently absent from the product's messaging.

Both engines emit `warnings: string[]` on every `TaxEstimate`, and every
`DeductionCandidate` carries `requiresVerification`/`confidence` fields — the
UI is expected to surface these, not just this document.

---

## United States (`packages/tax-engine-us`)

Reviewed against `src/rules.ts`, `src/engine.ts`, `src/categorize.ts`.
Federal only. Tax year modeled: **2024** (returns filed 2025).

### Supported taxpayer types
`employee`, `self_employed`, `freelancer`, `online_seller`, `mixed`.

### Supported forms (draft only, never filed)
- Form 1040 (partial — see line coverage below)
- Schedule C (partial, generated only when self-employment/business/freelance/online-selling income is present)

### Income tax calculation

| Rule | Status | Notes |
|---|---|---|
| 2024 graduated brackets for single, MFJ, MFS, HoH | **NEEDS VERIFICATION** | Sourced from Rev. Proc. 2023-34 per the code comment; bracket thresholds change annually via IRS inflation adjustments and have not been re-checked against irs.gov as part of this review. Re-verify before rolling `taxYear` forward or relying on this for tax year 2025+. |
| Standard deduction (single/MFJ/MFS/HoH) | **NEEDS VERIFICATION** | Same source and same caveat as brackets. |
| Marginal-bracket arithmetic itself (progressive calculation) | **VERIFIED** | Correct progressive-bracket math, covered by unit tests in `packages/tax-engine-us/src/*.test.ts`. |
| **Qualifying widow(er)** filing status | **NOT IMPLEMENTED** | Not in `FEDERAL_BRACKETS`; any profile with this status is silently treated as "single" with a warning pushed to `TaxEstimate.warnings`. |
| **Itemized deductions** (mortgage interest, SALT, charitable giving, etc.) | **NOT IMPLEMENTED** | Only the standard deduction is ever applied. A taxpayer for whom itemizing would be better gets no signal of that. |
| **Tax credits** (Child Tax Credit, EITC, education credits, Saver's Credit, dependent care, etc.) | **NOT IMPLEMENTED** | Explicitly excluded, flagged in a `warnings` entry on every estimate. |
| **Alternative Minimum Tax (AMT)** | **NOT IMPLEMENTED** | Not modeled at all; no warning is currently emitted specifically for AMT exposure. |
| **State income tax** | **NOT IMPLEMENTED** | Federal-only by design; every estimate carries a warning saying so. |
| **Capital gains / investment income** (Schedule D, qualified dividends, etc.) | **NOT IMPLEMENTED** | The engine only models wage and self-employment income sources. |
| **Rental income (Schedule E)** | **NOT IMPLEMENTED** | Not a modeled income source. |
| **Dependents** | **NOT IMPLEMENTED** | No dependent data model exists; head-of-household status is accepted but its dependent-eligibility rules are not checked. |

### Self-employment tax

| Rule | Status | Notes |
|---|---|---|
| Schedule SE core mechanics (92.35% net-earnings factor, 12.4% Social Security up to wage base, 2.9% Medicare) | **NEEDS VERIFICATION** | 2024 Social Security wage base ($168,600) is hardcoded per the code comment; changes annually and was not re-checked against SSA/IRS sources in this review. |
| Half-of-SE-tax income adjustment | **VERIFIED** | Correctly implemented as an above-the-line deduction; covered by unit tests. |
| **Additional Medicare Tax** (0.9% over $200k single / $250k MFJ) | **NOT IMPLEMENTED** | Explicitly called out in the code comment and surfaced as a warning whenever there's net SE income. |

### Deductions (Schedule C categories)

| Rule | Status | Notes |
|---|---|---|
| General ordinary-and-necessary business expense treatment (supplies, equipment, software, advertising, shipping, utilities, professional fees, rent, wages, taxes/licenses) | **VERIFIED** | Straightforward IRC §162 categorization; cited in-code. |
| Meals capped at 50% | **VERIFIED** | IRC §274(n), correctly applied and cited in-code, `requiresVerification: false` is NOT set — it's flagged `requiresVerification: true` because the 50% cap itself has edge cases (e.g., some meals are 100% deductible in specific circumstances) not modeled here. |
| Home office deduction | **NEEDS VERIFICATION** | Flagged `requiresVerification: true` in-code because "regular and exclusive use" is a factual test the engine cannot evaluate from a dollar amount alone — this is working as intended (a real gap surfaced honestly), not a bug. |
| Depreciation (Section 179, bonus depreciation, MACRS) | **NOT IMPLEMENTED** | `depreciation` exists as an `ExpenseCategory` and is in `DEDUCTIBLE_CATEGORIES`, but no depreciation *schedule* logic exists — a depreciable asset entered as a single expense would be deducted in full immediately, which is generally wrong. This is a real gap, not yet surfaced to the user with its own warning. |
| Home-office square-footage / simplified method calculation | **NOT IMPLEMENTED** | The engine takes whatever dollar amount was logged; it does not compute the IRS simplified method ($5/sq ft) or actual-expense method itself. |

### Missing-document detection
W-2 (employment income present), 1099-NEC/1099-K (self-employment/platform income present), and a blocking "no income logged yet" case. **VERIFIED as implemented**, but this is a coverage heuristic, not tax law — it does not know whether a specific 1099 was actually issued, only that income of a type that typically generates one was logged.

### Filing status coverage
`single`, `married_filing_jointly`, `married_filing_separately`, `head_of_household` are modeled. Any other value → falls back to "single" with a warning. **NOT IMPLEMENTED**: qualifying surviving spouse.

---

## Philippines (`packages/tax-engine-ph`)

Reviewed against `src/rules.ts`, `src/engine.ts`, `src/categorize.ts`, and
`docs/PH_TAX_VERIFICATION.md`. Tax year modeled: **2024**, encoding the TRAIN
Law (RA 10963) schedule effective 2023 onward.

**Standing caveat that applies to every row below:** Philippine tax rules
change frequently via BIR Revenue Regulations and Revenue Memorandum
Circulars (the Ease of Paying Taxes Act, RA 11976, changed filing mechanics
in 2024). Every PH figure is architecturally treated as "needs
re-verification," which is why every `TaxEstimate` for PH carries a
standing warning pointing at `docs/PH_TAX_VERIFICATION.md`, and why every PH
`DeductionCandidate` has `requiresVerification: true` unconditionally
(unlike the US engine, which sets it per-category).

### Supported taxpayer types
`employee`, `self_employed`, `professional`, `online_seller`, `freelancer`, `mixed_income_earner`.

### Supported forms (draft only, never filed)
- BIR Form 1701A (Annual Income Tax Return, individuals, graduated or 8% option)
- BIR Form 2551Q (Quarterly Percentage Tax Return)

### Income tax calculation

| Rule | Status | Notes |
|---|---|---|
| Graduated brackets (0%/15%/20%/25%/30%/35%) | **NEEDS VERIFICATION** | Cited to Sec. 24(A)(2)(a) NIRC as amended by TRAIN, code comment explicitly flags this as the step most likely to have changed and asks for re-verification against bir.gov.ph. |
| 8% flat option on gross sales/receipts over ₱250,000, in lieu of graduated tax + percentage tax | **NEEDS VERIFICATION** | Cited to Sec. 24(A)(2)(b) NIRC; election mechanics (BIR Form 1905, generally-irrevocable-for-the-year) are described in a comment but not modeled — the engine only computes which option is cheaper, it does not track or enforce an actual election. |
| Correct comparison of 8% option against the *combined* graduated-tax + percentage-tax burden (not income tax alone) | **VERIFIED** | This is a real correctness detail: an earlier version could have wrongly steered someone into the 8% option using only income tax as the comparison. The code comment documents that the total graduated-regime burden is what's compared. Covered by unit tests. |
| 3% percentage tax (Sec. 116) for non-VAT-registered taxpayers who don't elect 8% | **NEEDS VERIFICATION** | Code comment notes the rate reverted to 3% on July 1, 2023 after a temporary 1% CREATE Act rate — current rate not re-checked against a live BIR source in this review. |
| Optional Standard Deduction (40% of gross sales/receipts) vs. itemized, engine picks whichever is larger | **NEEDS VERIFICATION** | Cited to Sec. 34(L) NIRC; correctly implemented as mutually exclusive with itemizing (no double-counting), but the election's actual BIR filing mechanics are not modeled, only estimated. |
| VAT (12%) — output/input VAT computation | **NOT IMPLEMENTED** | The engine only *detects* that gross sales/receipts exceed the ₱3,000,000 VAT threshold and emits a warning; it does not compute any VAT liability, does not model input VAT credits, and does not generate a VAT return. Any taxpayer over threshold gets an explicit warning that VAT obligations are unaddressed. |
| Withholding tax reconciliation (BIR Form 2307 credits) | **NOT IMPLEMENTED** | Explicitly flagged via warning on every PH estimate: "withholding taxes already deducted at source... are not yet reconciled." The estimate is pre-withholding-credit, i.e., likely overstates what's actually still owed for anyone who had tax withheld by clients/marketplaces. |
| Employee (compensation-income) taxation, i.e. income already subject to employer withholding under the graduated table | **PARTIALLY IMPLEMENTED / NEEDS VERIFICATION** | `employee` is a supported taxpayer type, but the engine's income-tax path treats all recorded income as "gross sales/receipts" (self-employment framing) — it does not separately apply the compensation-income withholding-tax table or Form 2316 reconciliation that a pure employee's situation actually requires. This is a meaningful gap for a `taxpayerType: employee` profile and should be called out to users, not just developers. |
| Corporations / partnerships | **NOT IMPLEMENTED** | Only individual taxpayer types are supported; no corporate income tax (RCIT/MCIT) logic exists. |

### Deductions
Itemized categories map to `Sec. 34 NIRC` generally; every candidate is unconditionally `requiresVerification: true`. **NEEDS VERIFICATION** across the board — no PH deduction category has been independently re-confirmed against current BIR rules as part of this review (this is the intended conservative posture, not an oversight).

### Missing-document detection
BIR Certificate of Registration (2303), Form 2307 (withholding), official receipts/invoices, and a blocking "no income logged" case. **VERIFIED as implemented** as a coverage heuristic — same caveat as the US engine: it flags a document category as relevant, it does not verify the document is correct or that BIR would accept it.

---

## Cross-cutting gaps (both countries)

| Gap | Status |
|---|---|
| Multi-year carryforwards (net operating losses, unused deductions) | **NOT IMPLEMENTED** — each `TaxEstimate` is computed from a single tax year's data with no memory of prior years. |
| Amended returns | **NOT IMPLEMENTED** — no concept of correcting a previously "filed" (sandbox) return. |
| Multi-state (US) / multi-RDO or multi-registration (PH) situations | **NOT IMPLEMENTED**. |
| Any jurisdiction other than US federal and PH national tax | **NOT IMPLEMENTED** — no other country's tax law is modeled at all; the country selector only ever offers these two. |

## What this means for the product

- The UI must keep surfacing `TaxEstimate.warnings` and per-candidate
  `requiresVerification`/`confidence` — this document is only honest as long
  as those fields keep reaching the user.
- "NEEDS VERIFICATION" rows are not a todo list to silently fix by guessing
  updated numbers — they require checking a current official source
  (irs.gov / bir.gov.ph) before the figures are trusted for anything beyond
  a rough planning estimate, and that check should be re-run at least
  annually regardless of who does it.
- Nothing in this engine should be described to a user as "complete" or
  "covers your situation" without checking this table first.
