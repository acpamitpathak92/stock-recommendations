import axios from "axios";
import { config, hasKey } from "../utils/config.js";
import { createLogger } from "../utils/logger.js";

const log = createLogger("fmp");

// FMP migrated off the legacy `/api/v3/<endpoint>/<symbol>` routes (which now
// return 403) to the "stable" API: `/stable/<endpoint>?symbol=<SYMBOL>`.
const BASE = "https://financialmodelingprep.com/stable";
const http = axios.create({ baseURL: BASE, timeout: 20_000 });

function num(v: unknown): number | null {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

/** First finite number found across a list of candidate field names. */
function pickField(obj: Record<string, unknown> | undefined, keys: string[]): number | null {
  if (!obj) return null;
  for (const k of keys) {
    const n = num(obj[k]);
    if (n !== null) return n;
  }
  return null;
}

/** Stable responses are arrays of objects; tolerate a bare object too. */
function firstRow(data: unknown): Record<string, unknown> | undefined {
  if (Array.isArray(data)) return data[0] as Record<string, unknown> | undefined;
  if (data && typeof data === "object") return data as Record<string, unknown>;
  return undefined;
}

async function get(endpoint: string, params: Record<string, string> = {}): Promise<{ data: unknown | null; status: number | null }> {
  if (!hasKey("FMP_API_KEY")) return { data: null, status: null };
  try {
    const res = await http.get(`/${endpoint}`, {
      params: { ...params, apikey: config.FMP_API_KEY },
    });
    return { data: res.data, status: res.status };
  } catch (err) {
    const status = axios.isAxiosError(err) ? err.response?.status ?? null : null;
    return { data: null, status };
  }
}

export interface FmpFinancials {
  debtToEquity: number | null;
  roce: number | null;
  operatingCashFlow: number | null;
  roe: number | null;
  netMargin: number | null;
  operatingMargin: number | null;
  revenueGrowth: number | null;
  profitGrowth: number | null;
}

/**
 * Supplemental financial metrics from FMP (stable API). Fills gaps that Alpha
 * Vantage OVERVIEW does not cover. Field names are read through fallback chains
 * because the stable schema renamed several keys from the legacy v3 API.
 * Returns null when FMP has no usable data for the symbol.
 */
export async function getFinancials(symbol: string): Promise<FmpFinancials | null> {
  const sym = symbol.toUpperCase();
  if (!hasKey("FMP_API_KEY")) return null;

  // Probe with one endpoint first. A 402/403 means the symbol isn't covered by
  // the current plan (FMP's free tier is US-only), so skip the other three
  // calls and emit a single clear line instead of four noisy warnings.
  const ratios = await get("ratios-ttm", { symbol: sym });
  if (ratios.status === 402 || ratios.status === 403) {
    log.warn("FMP has no data for this symbol on the current plan", {
      symbol: sym,
      status: ratios.status,
      hint: "FMP's free tier covers US exchanges only; non-US symbols need a paid plan.",
    });
    return null;
  }

  const [metrics, growth, cash] = await Promise.all([
    get("key-metrics-ttm", { symbol: sym }),
    get("income-statement-growth", { symbol: sym, limit: "1" }),
    get("cash-flow-statement", { symbol: sym, limit: "1" }),
  ]);

  const r = firstRow(ratios.data);
  const m = firstRow(metrics.data);
  const g = firstRow(growth.data);
  const c = firstRow(cash.data);
  if (!r && !m && !g && !c) {
    log.warn("FMP returned no usable rows", { symbol: sym });
    return null;
  }

  return {
    debtToEquity: pickField(r, ["debtToEquityRatioTTM", "debtEquityRatioTTM", "debtToEquityTTM"]),
    roce:
      pickField(r, ["returnOnCapitalEmployedTTM"]) ??
      pickField(m, ["returnOnCapitalEmployedTTM", "roicTTM", "returnOnInvestedCapitalTTM"]),
    operatingCashFlow: pickField(c, ["operatingCashFlow", "netCashProvidedByOperatingActivities"]),
    roe:
      pickField(r, ["returnOnEquityTTM"]) ?? pickField(m, ["returnOnEquityTTM"]),
    netMargin: pickField(r, ["netProfitMarginTTM", "netIncomeMarginTTM", "netMarginTTM"]),
    operatingMargin: pickField(r, ["operatingProfitMarginTTM", "operatingMarginTTM"]),
    revenueGrowth: pickField(g, ["growthRevenue", "revenueGrowth"]),
    profitGrowth: pickField(g, ["growthNetIncome", "netIncomeGrowth"]),
  };
}
