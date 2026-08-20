/**
 * Registers every country engine with the shared core registry. Import
 * this module once (apps/web does it at startup) so `getEngine(country)`
 * works anywhere in the app without every call site importing every
 * country package directly.
 */
import { registerEngine } from "@taxiva/tax-engine-core";
import { usTaxEngine } from "@taxiva/tax-engine-us";
import { phTaxEngine } from "@taxiva/tax-engine-ph";

let registered = false;

export function ensureEnginesRegistered(): void {
  if (registered) return;
  registerEngine(usTaxEngine);
  registerEngine(phTaxEngine);
  registered = true;
}
