import type { Num, Recommendation } from "../types";

export const UNAVAILABLE = "Data unavailable";

export function isUnavailable(v: unknown): boolean {
  return v === null || v === undefined || v === UNAVAILABLE;
}

/** Compact currency-ish number with magnitude suffixes (e.g. 1.2T, 845.0B). */
export function formatLargeNumber(value: Num): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return UNAVAILABLE;
  const abs = Math.abs(value);
  const units: Array<[number, string]> = [
    [1e12, "T"],
    [1e9, "B"],
    [1e6, "M"],
    [1e3, "K"],
  ];
  for (const [threshold, suffix] of units) {
    if (abs >= threshold) return `${(value / threshold).toFixed(2)}${suffix}`;
  }
  return value.toFixed(2);
}

export function formatPrice(value: Num): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return UNAVAILABLE;
  return value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function formatNumber(value: Num, digits = 2): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return UNAVAILABLE;
  return value.toFixed(digits);
}

export function formatPercent(fraction: Num, digits = 1): string {
  if (fraction === null || fraction === undefined || !Number.isFinite(fraction)) return UNAVAILABLE;
  return `${(fraction * 100).toFixed(digits)}%`;
}

export function formatDate(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

/** Brand-consistent color per recommendation verdict. */
export function recommendationColor(rec: Recommendation): string {
  switch (rec) {
    case "BUY":
      return "#16A34A";
    case "HOLD":
      return "#D97706";
    case "AVOID":
      return "#DC2626";
    default:
      return "#64748B";
  }
}

/** Color for a 0-10 score along a red -> amber -> green ramp. */
export function scoreColor(score: number): string {
  if (score >= 7) return "#16A34A";
  if (score >= 5) return "#D97706";
  return "#DC2626";
}
