import axios from "axios";
import { config, hasKey } from "../utils/config.js";
import { createLogger } from "../utils/logger.js";

const log = createLogger("alpha-vantage");
const BASE = "https://www.alphavantage.co/query";

const http = axios.create({ baseURL: BASE, timeout: 20_000 });

/** Parse a possibly-empty Alpha Vantage numeric string. */
function num(v: unknown): number | null {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  if (s === "" || s === "None" || s === "-" || s.toLowerCase() === "nan") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

function str(v: unknown): string | null {
  if (v === undefined || v === null) return null;
  const s = String(v).trim();
  if (s === "" || s === "None") return null;
  return s;
}

/**
 * Alpha Vantage applies a free-tier rate limit (and returns a `Note` or
 * `Information` field when exceeded). We detect that and treat it as
 * unavailable data rather than throwing.
 */
function rateLimited(data: Record<string, unknown>): boolean {
  return Boolean(data["Note"] || data["Information"]);
}

async function call(params: Record<string, string>): Promise<Record<string, unknown> | null> {
  if (!hasKey("ALPHA_VANTAGE_API_KEY")) {
    log.warn("ALPHA_VANTAGE_API_KEY not set; skipping call", params["function"]);
    return null;
  }
  try {
    const res = await http.get("", {
      params: { ...params, apikey: config.ALPHA_VANTAGE_API_KEY },
    });
    const data = res.data as Record<string, unknown>;
    if (rateLimited(data)) {
      log.warn("Alpha Vantage rate limit hit", { fn: params["function"] });
      return null;
    }
    return data;
  } catch (err) {
    log.error("Alpha Vantage request failed", { fn: params["function"], err: String(err) });
    return null;
  }
}

export interface AvQuote {
  price: number | null;
  volume: number | null;
}

export async function getQuote(symbol: string): Promise<AvQuote | null> {
  const data = await call({ function: "GLOBAL_QUOTE", symbol });
  const q = data?.["Global Quote"] as Record<string, unknown> | undefined;
  if (!q || Object.keys(q).length === 0) return null;
  return { price: num(q["05. price"]), volume: num(q["06. volume"]) };
}

export interface AvOverview {
  name: string | null;
  sector: string | null;
  industry: string | null;
  marketCap: number | null;
  peRatio: number | null;
  eps: number | null;
  dividendYield: number | null;
  week52High: number | null;
  week52Low: number | null;
  beta: number | null;
  profitMargin: number | null;
  operatingMargin: number | null;
  roe: number | null;
  revenueGrowthYoY: number | null;
  earningsGrowthYoY: number | null;
}

export async function getOverview(symbol: string): Promise<AvOverview | null> {
  const d = await call({ function: "OVERVIEW", symbol });
  if (!d || Object.keys(d).length === 0 || str(d["Symbol"]) === null) return null;
  return {
    name: str(d["Name"]),
    sector: str(d["Sector"]),
    industry: str(d["Industry"]),
    marketCap: num(d["MarketCapitalization"]),
    peRatio: num(d["PERatio"]),
    eps: num(d["EPS"]),
    dividendYield: num(d["DividendYield"]),
    week52High: num(d["52WeekHigh"]),
    week52Low: num(d["52WeekLow"]),
    beta: num(d["Beta"]),
    profitMargin: num(d["ProfitMargin"]),
    operatingMargin: num(d["OperatingMarginTTM"]),
    roe: num(d["ReturnOnEquityTTM"]),
    revenueGrowthYoY: num(d["QuarterlyRevenueGrowthYOY"]),
    earningsGrowthYoY: num(d["QuarterlyEarningsGrowthYOY"]),
  };
}

export interface DailySeries {
  /** Oldest -> newest closing prices. */
  closes: number[];
  /** Oldest -> newest [date, close]. */
  points: { date: string; close: number }[];
}

export async function getDailySeries(symbol: string, full = true): Promise<DailySeries | null> {
  const d = await call({
    function: "TIME_SERIES_DAILY",
    symbol,
    outputsize: full ? "full" : "compact",
  });
  const series = d?.["Time Series (Daily)"] as Record<string, Record<string, string>> | undefined;
  if (!series) return null;
  const dates = Object.keys(series).sort(); // ascending by ISO date
  const points: { date: string; close: number }[] = [];
  for (const date of dates) {
    const close = num(series[date]?.["4. close"]);
    if (close !== null) points.push({ date, close });
  }
  if (points.length === 0) return null;
  return { closes: points.map((p) => p.close), points };
}

export interface AvNewsItem {
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  sentimentScore: number; // -1..1
  sentimentLabel: string;
}

export interface AvNewsResult {
  items: AvNewsItem[];
  overallSentiment: number | null; // -1..1
}

/** Alpha Vantage NEWS_SENTIMENT — real news with quantified sentiment. */
export async function getNewsSentiment(tickers: string): Promise<AvNewsResult | null> {
  const d = await call({ function: "NEWS_SENTIMENT", tickers, sort: "LATEST", limit: "20" });
  const feed = d?.["feed"] as Array<Record<string, unknown>> | undefined;
  if (!feed || feed.length === 0) return null;
  const items: AvNewsItem[] = [];
  let sum = 0;
  let count = 0;
  for (const f of feed.slice(0, 12)) {
    const tickerSent = (f["ticker_sentiment"] as Array<Record<string, unknown>> | undefined)?.find(
      (t) => String(t["ticker"]).toUpperCase().includes(tickers.split(".")[0]!.toUpperCase()),
    );
    const score = num(tickerSent?.["ticker_sentiment_score"]) ?? num(f["overall_sentiment_score"]) ?? 0;
    sum += score;
    count += 1;
    items.push({
      title: str(f["title"]) ?? "Untitled",
      source: str(f["source"]) ?? "Unknown",
      url: str(f["url"]) ?? "",
      publishedAt: str(f["time_published"]) ?? "",
      sentimentScore: score,
      sentimentLabel: str(f["overall_sentiment_label"]) ?? "Neutral",
    });
  }
  return { items, overallSentiment: count > 0 ? sum / count : null };
}
