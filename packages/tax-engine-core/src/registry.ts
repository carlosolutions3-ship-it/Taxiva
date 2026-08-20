import type { CountryCode, TaxEngine } from "./types";

/**
 * The engine registry is the one place the rest of the product asks
 * "which country am I in, and what engine handles it." Adding a new
 * country means writing a new package that implements TaxEngine and
 * calling registerEngine — nothing else in the app should change.
 */
const engines = new Map<CountryCode, TaxEngine>();

export function registerEngine(engine: TaxEngine): void {
  engines.set(engine.country, engine);
}

export function getEngine(country: CountryCode): TaxEngine {
  const engine = engines.get(country);
  if (!engine) {
    throw new Error(
      `No tax engine registered for country "${country}". Available: ${Array.from(
        engines.keys()
      ).join(", ") || "(none)"}`
    );
  }
  return engine;
}

export function listSupportedCountries(): { code: CountryCode; name: string }[] {
  return Array.from(engines.values()).map((e) => ({ code: e.country, name: e.countryName }));
}

export function isCountrySupported(country: string): country is CountryCode {
  return engines.has(country as CountryCode);
}
