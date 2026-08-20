# Philippine tax rules: what's encoded, and what to verify

Per the product's own ground rule: **don't invent Philippine tax rules,
and flag anything uncertain for verification against current BIR sources.**
This document is that flag, kept in one place. Every rule the PH tax
engine (`packages/tax-engine-ph/src/rules.ts`) uses is listed below with
its claimed legal basis and what specifically needs re-checking. The same
warnings also surface live in the product (every `TaxEstimate.warnings`
array, and the confirmation banner on every draft BIR form).

**Do this before showing PH numbers to a real user for anything beyond a
demo:** have a Philippine CPA or BIR-accredited tax practitioner review
`packages/tax-engine-ph/src/rules.ts` line by line against current BIR
issuances. This document is a starting checklist for that review, not a
substitute for it.

## What's encoded today, and its claimed basis

| Rule | Value used | Claimed basis | What to verify |
|---|---|---|---|
| Graduated income tax brackets | 0% up to ₱250k; 15/20/25/30/35% tiers above, per the TRAIN Law step-down | Sec. 24(A)(2)(a), NIRC as amended by RA 10963 (TRAIN Law), effective 2023 onward | Confirm no subsequent legislation has changed these brackets since TRAIN's 2023 step-down |
| 8% flat tax option | 8% of gross sales/receipts over ₱250,000, in lieu of graduated tax **and** percentage tax, available if gross receipts ≤ VAT threshold | Sec. 24(A)(2)(b), NIRC | Confirm the election mechanics (which form, which deadline, how binding) are current — these are administrative details BIR can update via RMC |
| VAT registration threshold | ₱3,000,000 annual gross sales/receipts | Sec. 109, NIRC / TRAIN Law | Confirm this hasn't been inflation-adjusted or otherwise changed |
| Percentage tax rate | 3% of gross quarterly sales/receipts (for non-VAT-registered taxpayers not electing the 8% option) | Sec. 116, NIRC | This rate was temporarily reduced to 1% during the pandemic (CREATE Act) and reverted to 3% on July 1, 2023 — confirm it's still 3% and no further change occurred |
| Optional Standard Deduction (OSD) | 40% of gross sales/receipts, elected in lieu of itemizing | Sec. 34(L), NIRC | Confirm the rate (40%) and election mechanics are unchanged |
| BIR Form 1701A | Used for the annual ITR draft for individuals earning purely from business/profession | Common BIR form usage as of TRAIN-era filing | Confirm this is still the correct form for the taxpayer profiles Taxiva targets (a mixed-income earner would need 1701 instead — not yet modeled) |
| BIR Form 2551Q | Used for the quarterly percentage tax draft | Standard BIR quarterly percentage tax return | Confirm filing frequency/form hasn't changed under the Ease of Paying Taxes Act (RA 11976, 2024), which has been changing filing mechanics |

## Known gaps (not modeled yet — don't assume they're handled)

- **VAT computation itself.** Taxpayers over the VAT threshold get a
  warning that VAT applies, but the engine does not compute output/input
  VAT or generate a VAT return draft.
- **Withholding tax reconciliation.** BIR Form 2307 (creditable
  withholding) amounts aren't yet subtracted from what's owed — the
  engine tells the user to upload 2307s but doesn't credit them.
- **Mixed-income earners** (both employment and self-employment income in
  the same year) use a different form (1701, not 1701A) and different
  computation nuances — not yet modeled; the engine will still produce
  *a* number but it should not be trusted for this taxpayer type yet.
- **Corporations.** The product vision includes corporations eventually;
  none of the corporate income tax rules (different rates, different
  forms entirely) are implemented.
- **Local government taxes** (business permits, barangay/mayor's permit
  fees) are out of scope — these vary by LGU and aren't a BIR matter.

## How to actually verify (concretely, not hand-wavy)

1. **BIR's own site**, bir.gov.ph — look under "Tax Information" for the
   current NIRC provisions and recent Revenue Regulations/Memorandum
   Circulars affecting individual income tax, percentage tax, and VAT.
2. **Hire a Philippine CPA or BIR-accredited tax practitioner** for a
   one-time review of `packages/tax-engine-ph/src/rules.ts` before any
   real user relies on PH numbers for an actual filing decision — this is
   a bounded, one-time cost, not a recurring one, for the Stage 1 product.
3. **Re-check annually at minimum**, and after any BIR press release about
   TRAIN-law adjustments or new revenue regulations — tax brackets and
   thresholds are exactly the kind of number that drifts silently if
   nobody re-reads the source.
4. When in doubt, the product should say "verify with BIR" rather than
   present a number as authoritative — that's why every PH `TaxEstimate`
   carries a warnings array that's rendered directly in the UI, not
   buried in a tooltip.
