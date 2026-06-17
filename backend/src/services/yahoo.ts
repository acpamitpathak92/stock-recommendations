import axios from "axios";
import YahooFinance from "yahoo-finance2";
import { createLogger } from "../utils/logger.js";

const log = createLogger("yahoo");

// The MCP servers speak JSON-RPC over stdio, so nothing may write to STDOUT.
// yahoo-finance2 emits notices via its logger; route them to no-ops so the
// protocol stream stays clean. (Our own diagnostics already go to stderr.)
const silentLogger = {
  info: () => {},
  warn: () => {},
  error: () => {},
  debug: () => {},
  dir: () => {},
};
const yf = new YahooFinance({ logger: silentLogger });

// Yahoo Finance's public chart endpoint needs no API key and has strong NSE/BSE
// coverage (RELIANCE.NS, TATAMOTORS.BO, ...). It is used as the primary source
// for price + history and as a fallback when Alpha Vantage has no data or is
// rate-limited. A browser-like User-Agent is required.
const http = axios.create({
  timeout: 20_000,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
      "(KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    Accept: "application/json",
  },
});

const HOSTS = ["https://query1.finance.yahoo.com", "https://query2.finance.yahoo.com"];

function num(v: unknown): number | null {
  if (v === undefined || v === null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

interface ChartMeta {
  regularMarketPrice?: number;
  regularMarketVolume?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  currency?: string;
  exchangeName?: string;
  fullExchangeName?: string;
  longName?: string;
  shortName?: string;
}

interface ChartResult {
  meta?: ChartMeta;
  timestamp?: number[];
  indicators?: { quote?: Array<{ close?: Array<number | null> }> };
}

export interface YahooQuote {
  price: number | null;
  volume: number | null;
  week52High: number | null;
  week52Low: number | null;
  name: string | null;
  exchange: string | null;
  currency: string | null;
}

export interface YahooSeries {
  closes: number[];
  points: { date: string; close: number }[];
  quote: YahooQuote;
}

async function fetchChart(symbol: string, range: string, interval: string): Promise<ChartResult | null> {
  for (const host of HOSTS) {
    try {
      const res = await http.get(`${host}/v8/finance/chart/${encodeURIComponent(symbol)}`, {
        params: { range, interval },
      });
      const body = res.data as { chart?: { result?: ChartResult[] } };
      const result = body?.chart?.result?.[0];
      if (result) return result;
    } catch (err) {
      const status = axios.isAxiosError(err) ? err.response?.status ?? "n/a" : "n/a";
      log.warn("Yahoo chart request failed", { symbol, host, status });
      // Try the next host before giving up.
    }
  }
  return null;
}

function metaToQuote(meta: ChartMeta | undefined): YahooQuote {
  return {
    price: num(meta?.regularMarketPrice),
    volume: num(meta?.regularMarketVolume),
    week52High: num(meta?.fiftyTwoWeekHigh),
    week52Low: num(meta?.fiftyTwoWeekLow),
    name: meta?.longName ?? meta?.shortName ?? null,
    exchange: meta?.fullExchangeName ?? meta?.exchangeName ?? null,
    currency: meta?.currency ?? null,
  };
}

/** One year of daily closes plus a quote, from a single chart call. */
export async function getYahooSeries(symbol: string): Promise<YahooSeries | null> {
  const result = await fetchChart(symbol, "1y", "1d");
  if (!result) return null;

  const timestamps = Array.isArray(result.timestamp) ? result.timestamp : [];
  const closeArr = result.indicators?.quote?.[0]?.close ?? [];
  const points: { date: string; close: number }[] = [];
  for (let i = 0; i < timestamps.length; i++) {
    const c = num(closeArr[i]);
    const ts = timestamps[i];
    if (c !== null && typeof ts === "number") {
      points.push({ date: new Date(ts * 1000).toISOString().slice(0, 10), close: c });
    }
  }

  const quote = metaToQuote(result.meta);
  if (points.length === 0 && quote.price === null) return null;
  return { closes: points.map((p) => p.close), points, quote };
}

/** Lightweight quote only (5-day chart, meta read). */
export async function getYahooQuote(symbol: string): Promise<YahooQuote | null> {
  const result = await fetchChart(symbol, "5d", "1d");
  if (!result) return null;
  const quote = metaToQuote(result.meta);
  return quote.price === null && quote.week52High === null ? null : quote;
}

export interface YahooValuation {
  price: number | null;
  volume: number | null;
  marketCap: number | null;
  peRatio: number | null;
  eps: number | null;
  dividendYield: number | null; // fraction, e.g. 0.012 = 1.2%
  priceToBook: number | null;
  week52High: number | null;
  week52Low: number | null;
  name: string | null;
}

/**
 * Valuation/profile fields via yahoo-finance2's `quote` (market cap, P/E, EPS,
 * dividend yield, 52-week range). This is the main gap-filler for NSE/BSE
 * symbols, where Alpha Vantage's OVERVIEW is typically empty. The library
 * handles Yahoo's cookie/crumb handshake; any failure returns null so callers
 * degrade gracefully.
 */
export async function getYahooValuation(symbol: string): Promise<YahooValuation | null> {
  try {
    const q = (await yf.quote(symbol)) as Record<string, unknown> | undefined;
    if (!q) return null;
    const trailingDiv = num(q["trailingAnnualDividendYield"]);
    const pctDiv = num(q["dividendYield"]);
    const dividendYield = trailingDiv ?? (pctDiv !== null ? pctDiv / 100 : null);
    const v: YahooValuation = {
      price: num(q["regularMarketPrice"]),
      volume: num(q["regularMarketVolume"]),
      marketCap: num(q["marketCap"]),
      peRatio: num(q["trailingPE"]),
      eps: num(q["epsTrailingTwelveMonths"]),
      dividendYield,
      priceToBook: num(q["priceToBook"]),
      week52High: num(q["fiftyTwoWeekHigh"]),
      week52Low: num(q["fiftyTwoWeekLow"]),
      name: (q["longName"] as string) ?? (q["shortName"] as string) ?? null,
    };
    return Object.values(v).some((x) => x !== null && x !== undefined) ? v : null;
  } catch (err) {
    log.warn("Yahoo valuation (quote) failed", { symbol, err: String(err).slice(0, 140) });
    return null;
  }
}

export interface YahooFundamentals {
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
 * Deep fundamentals via Yahoo's quoteSummary (financialData module). This is the
 * free, no-key replacement for FMP on NSE/BSE names — Yahoo covers Indian
 * equities that FMP gates behind a paid plan. Margins/returns/growth come back
 * as fractions (0.18 = 18%); debtToEquity is a percentage, normalised to a ratio
 * to match the rest of the app. ROCE isn't exposed by Yahoo, so it stays null.
 */
export async function getYahooFundamentals(symbol: string): Promise<YahooFundamentals | null> {
  try {
    const summary = (await yf.quoteSummary(symbol, {
      modules: ["financialData"],
    })) as { financialData?: Record<string, unknown> } | undefined;
    const fd = summary?.financialData;
    if (!fd) return null;

    const rawDe = num(fd["debtToEquity"]);
    const out: YahooFundamentals = {
      debtToEquity: rawDe !== null ? rawDe / 100 : null, // Yahoo reports a percentage
      roce: null,
      operatingCashFlow: num(fd["operatingCashflow"]),
      roe: num(fd["returnOnEquity"]),
      netMargin: num(fd["profitMargins"]),
      operatingMargin: num(fd["operatingMargins"]),
      revenueGrowth: num(fd["revenueGrowth"]),
      profitGrowth: num(fd["earningsGrowth"]),
    };
    return Object.values(out).some((v) => v !== null) ? out : null;
  } catch (err) {
    log.warn("Yahoo fundamentals (quoteSummary) failed", { symbol, err: String(err).slice(0, 140) });
    return null;
  }
}
