import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname } from "node:path";
import { config } from "../utils/config.js";
import { createLogger } from "../utils/logger.js";
import type { AnalysisResult, RecommendedStock } from "../models/types.js";

const log = createLogger("db");

/**
 * Lightweight, dependency-free persistence.
 *
 * Analyses are kept in an in-memory map and mirrored to a single JSON file on
 * disk. This deliberately avoids `node:sqlite` (which is flag-gated on Node
 * 22.5–22.x and unavailable before 22.5) and any native module, so the backend
 * runs unchanged on Node 20+ without experimental flags. The data volume here
 * (one record per analysed symbol) makes synchronous file writes a non-issue.
 */

interface StoredRecord {
  symbol: string;
  overallScore: number;
  recommendation: string;
  confidence: number;
  reason: string;
  payload: AnalysisResult;
  updatedAt: string;
}

type Store = Map<string, StoredRecord>;

let store: Store | null = null;
const filePath = config.DB_PATH;

export function initDb(): void {
  if (store) return;
  store = new Map<string, StoredRecord>();
  mkdirSync(dirname(filePath), { recursive: true });
  if (existsSync(filePath)) {
    try {
      const raw = readFileSync(filePath, "utf8").trim();
      if (raw) {
        const parsed = JSON.parse(raw) as StoredRecord[];
        for (const rec of parsed) {
          if (rec && typeof rec.symbol === "string") store.set(rec.symbol, rec);
        }
      }
    } catch (err) {
      log.warn("Could not read store file; starting empty", String(err));
    }
  }
  log.info("JSON store initialised", { path: filePath, records: store.size });
}

function ensure(): Store {
  if (!store) initDb();
  return store as Store;
}

function persist(s: Store): void {
  try {
    writeFileSync(filePath, JSON.stringify([...s.values()], null, 2), "utf8");
  } catch (err) {
    log.error("Failed to persist store file", String(err));
  }
}

export function saveAnalysis(result: AnalysisResult): void {
  const s = ensure();
  const symbol = result.symbol.toUpperCase();
  s.set(symbol, {
    symbol,
    overallScore: result.overallScore,
    recommendation: result.recommendation,
    confidence: result.confidence,
    reason: buildReason(result),
    payload: result,
    updatedAt: new Date().toISOString(),
  });
  persist(s);
}

export function getStoredAnalysis(symbol: string): AnalysisResult | null {
  const s = ensure();
  const rec = s.get(symbol.toUpperCase());
  return rec ? rec.payload : null;
}

/** Top recommended stocks: highest overall score among BUY/HOLD calls. */
export function getRecommended(limit = 5): RecommendedStock[] {
  const s = ensure();
  return [...s.values()]
    .filter((r) => r.recommendation === "BUY" || r.recommendation === "HOLD")
    .sort((a, b) => b.overallScore - a.overallScore)
    .slice(0, limit)
    .map((r) => ({
      symbol: r.symbol,
      score: r.overallScore,
      recommendation: r.recommendation as RecommendedStock["recommendation"],
      reason: r.reason,
    }));
}

function buildReason(result: AnalysisResult): string {
  const bits: string[] = [];
  if (result.financialScore >= 7) bits.push("strong fundamentals");
  if (result.technicalScore >= 7) bits.push("positive momentum");
  if (result.sentimentScore >= 7) bits.push("favourable sentiment");
  if (result.riskScore >= 7) bits.push("low risk profile");
  if (bits.length === 0) bits.push(`overall score ${result.overallScore.toFixed(1)}/10`);
  return bits.slice(0, 2).join(", ").replace(/^./, (c) => c.toUpperCase());
}
