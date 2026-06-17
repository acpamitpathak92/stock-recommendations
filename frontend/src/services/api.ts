import axios from "axios";
import type { AnalysisResult, RecommendedStock, TopPicksResponse } from "../types";

// Same-origin relative base; the Vite dev server proxies /api -> :8080.
const api = axios.create({
  baseURL: "/api",
  timeout: 120_000,
  headers: { "Content-Type": "application/json" },
});

/** Extracts a human-readable message from an axios error. */
function toMessage(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    const data = err.response?.data as { error?: string; detail?: string } | undefined;
    if (data?.detail) return data.detail;
    if (data?.error) return data.error;
    if (err.code === "ECONNABORTED") return "The analysis timed out. Please try again.";
    if (err.message) return err.message;
  }
  return fallback;
}

export async function analyzeStock(symbol: string): Promise<AnalysisResult> {
  try {
    const { data } = await api.post<AnalysisResult>("/analyze", { symbol });
    return data;
  } catch (err) {
    throw new Error(toMessage(err, "Failed to analyze stock."));
  }
}

export async function fetchRecommended(): Promise<RecommendedStock[]> {
  try {
    const { data } = await api.get<RecommendedStock[]>("/recommended");
    return data;
  } catch (err) {
    throw new Error(toMessage(err, "Failed to load recommendations."));
  }
}

export async function fetchTopPicks(market: "in" | "us"): Promise<TopPicksResponse> {
  try {
    const { data } = await api.get<TopPicksResponse>("/top-picks", { params: { market } });
    return data;
  } catch (err) {
    throw new Error(toMessage(err, "Failed to screen the market for top picks."));
  }
}
