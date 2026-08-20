export function formatMoney(amount: number, currency: string, opts?: { compact?: boolean }): string {
  const symbol = currency === "PHP" ? "₱" : "$";
  const abs = Math.abs(amount);
  const formatted = opts?.compact
    ? abs.toLocaleString(undefined, { maximumFractionDigits: 0 })
    : abs.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return `${amount < 0 ? "-" : ""}${symbol}${formatted}`;
}

export function formatPercent(fraction: number, digits = 1): string {
  return `${(fraction * 100).toFixed(digits)}%`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

export function greetingForHour(hour: number): string {
  if (hour < 12) return "Good morning";
  if (hour < 18) return "Good afternoon";
  return "Good evening";
}
