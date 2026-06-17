import axios from "axios";
import { config, hasKey } from "../utils/config.js";
import { createLogger } from "../utils/logger.js";

const log = createLogger("newsapi");
const BASE = "https://newsapi.org/v2";
const http = axios.create({ baseURL: BASE, timeout: 20_000 });

export interface RawArticle {
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  description: string;
}

/** Fetch recent English articles for a company/ticker query. */
export async function getEverything(query: string): Promise<RawArticle[] | null> {
  if (!hasKey("NEWS_API_KEY")) return null;
  try {
    const res = await http.get("/everything", {
      params: {
        q: query,
        sortBy: "publishedAt",
        language: "en",
        pageSize: "12",
        apiKey: config.NEWS_API_KEY,
      },
    });
    const articles = (res.data?.articles ?? []) as Array<Record<string, unknown>>;
    return articles.map((a) => ({
      title: String(a["title"] ?? "Untitled"),
      source: String((a["source"] as Record<string, unknown> | undefined)?.["name"] ?? "Unknown"),
      url: String(a["url"] ?? ""),
      publishedAt: String(a["publishedAt"] ?? ""),
      description: String(a["description"] ?? ""),
    }));
  } catch (err) {
    log.warn("NewsAPI request failed", { query, err: String(err) });
    return null;
  }
}

const POSITIVE = [
  "surge", "beat", "record", "growth", "profit", "upgrade", "bullish", "gain",
  "expansion", "strong", "rally", "boost", "win", "approval", "partnership",
  "dividend", "buyback", "outperform", "soar", "jump", "rise", "high",
];
const NEGATIVE = [
  "loss", "decline", "downgrade", "lawsuit", "probe", "fraud", "weak", "fall",
  "drop", "miss", "cut", "bearish", "slump", "crash", "warning", "default",
  "recall", "layoff", "scandal", "plunge", "slide", "low", "concern", "risk",
];

/**
 * Lightweight lexicon sentiment for a headline. Deterministic, computed in
 * code (no LLM). Returns a label and a -1..1 score.
 */
export function scoreHeadline(text: string): { label: "positive" | "negative" | "neutral"; score: number } {
  const lower = text.toLowerCase();
  let score = 0;
  for (const w of POSITIVE) if (lower.includes(w)) score += 1;
  for (const w of NEGATIVE) if (lower.includes(w)) score -= 1;
  const label = score > 0 ? "positive" : score < 0 ? "negative" : "neutral";
  const normalised = Math.max(-1, Math.min(1, score / 3));
  return { label, score: normalised };
}
