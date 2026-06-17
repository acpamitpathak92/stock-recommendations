import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";
import { z } from "zod";
import { analyzeStock } from "../graph/coordinator.js";
import { getRecommended, getStoredAnalysis } from "../services/db.js";
import { baseSymbol } from "../services/symbol.js";
import { createLogger } from "../utils/logger.js";

const log = createLogger("api");

/**
 * Runs `worker` over `items` with at most `concurrency` in flight at once.
 * Failures are dropped (the screen continues) so one bad symbol can't sink the
 * whole batch. Returns only the successful results.
 */
async function runPool<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = [];
  let cursor = 0;
  async function lane(): Promise<void> {
    while (cursor < items.length) {
      const idx = cursor++;
      try {
        results.push(await worker(items[idx]!));
      } catch {
        // skip failed item; screening tolerates partial coverage
      }
    }
  }
  const lanes = Array.from({ length: Math.min(concurrency, items.length) }, () => lane());
  await Promise.all(lanes);
  return results;
}

const AnalyzeBody = z.object({
  symbol: z
    .string()
    .trim()
    .min(1, "symbol is required")
    .max(20, "symbol is too long"),
});

/**
 * Registers all HTTP routes under the Fastify instance.
 *
 * POST /api/analyze            -> run the full agentic workflow for a symbol
 * GET  /api/recommended        -> top recommended stocks from prior analyses
 * GET  /api/analysis/:symbol   -> last persisted analysis for a symbol
 */
export async function registerRoutes(app: FastifyInstance): Promise<void> {
  app.get("/api/health", async () => ({ status: "ok", ts: new Date().toISOString() }));

  app.post(
    "/api/analyze",
    async (request: FastifyRequest, reply: FastifyReply) => {
      const parsed = AnalyzeBody.safeParse(request.body);
      if (!parsed.success) {
        const message = parsed.error.issues.map((i) => i.message).join("; ");
        return reply.status(400).send({ error: "Invalid request", detail: message });
      }

      const symbol = parsed.data.symbol.toUpperCase();
      try {
        const result = await analyzeStock(symbol);
        return reply.send(result);
      } catch (err) {
        log.error("Analysis failed", { symbol, error: String(err) });
        return reply
          .status(502)
          .send({ error: "Analysis failed", detail: String(err instanceof Error ? err.message : err) });
      }
    },
  );

  app.get(
    "/api/top-picks",
    async (request: FastifyRequest<{ Querystring: { market?: string; limit?: string; minScore?: string } }>, reply) => {
      const market = (request.query.market ?? "in").toLowerCase();
      const limit = Math.min(Math.max(Number(request.query.limit ?? 5) || 5, 1), 10);
      // Only surface genuine buys. Overall >= 7 is the BUY band in the scorer.
      const minScore = Number(request.query.minScore ?? 6);

      // Liquid large-cap universes to screen live. Indian names carry an explicit
      // ".NS" so they resolve through Yahoo regardless of India-mode config.
      const universes: Record<string, string[]> = {
        in: [
  "RELIANCE.NS",
  "TCS.NS",
  "HDFCBANK.NS",
  "INFY.NS",
  "ICICIBANK.NS",
  "SBIN.NS",
  "BHARTIARTL.NS",
  "ITC.NS",
  "LT.NS",
  "AXISBANK.NS",
  "KOTAKBANK.NS",
  "HCLTECH.NS",
  "SUNPHARMA.NS",
  "MARUTI.NS",
  "BAJFINANCE.NS",
  "ULTRACEMCO.NS",
  "NTPC.NS",
  "TITAN.NS",
  "ONGC.NS",
  "WIPRO.NS",
  "POWERGRID.NS",
  "ADANIENT.NS",
  "ADANIPORTS.NS",
  "ASIANPAINT.NS",
  "NESTLEIND.NS",
  "TATAMOTORS.NS",
  "M&M.NS",
  "BAJAJFINSV.NS",
  "COALINDIA.NS",
  "HINDUNILVR.NS",
  "GRASIM.NS",
  "JSWSTEEL.NS",
  "TATASTEEL.NS",
  "INDUSINDBK.NS",
  "CIPLA.NS",
  "DRREDDY.NS",
  "EICHERMOT.NS",
  "HEROMOTOCO.NS",
  "APOLLOHOSP.NS",
  "BPCL.NS",
  "SHRIRAMFIN.NS",
  "TRENT.NS",
  "BEL.NS",
  "HAL.NS",
  "SIEMENS.NS",
  "DIXON.NS",
  "BSE.NS",
  "INDIGO.NS",
  "DLF.NS",
  "VEDL.NS",
  "PIDILITIND.NS",
  "GODREJCP.NS",
  "HAVELLS.NS",
  "ABB.NS",
  "BANKBARODA.NS",
  "CANBK.NS",
  "PNB.NS",
  "UNIONBANK.NS",
  "PFC.NS",
  "RECLTD.NS",
  "IRFC.NS",
  "NHPC.NS",
  "IOC.NS",
  "GAIL.NS",
  "HINDALCO.NS",
  "AMBUJACEM.NS",
  "ACC.NS",
  "TORNTPHARM.NS",
  "LUPIN.NS",
  "ZYDUSLIFE.NS",
  "TVSMOTOR.NS",
  "ASHOKLEY.NS",
  "AUBANK.NS",
  "SBILIFE.NS",
  "HDFCLIFE.NS",
  "LICI.NS",
  "MAXHEALTH.NS",
  "FORTIS.NS",
  "POLYCAB.NS",
  "KEI.NS",
  "CGPOWER.NS",
  "SUPREMEIND.NS",
  "PAGEIND.NS",
  "BERGEPAINT.NS",
  "COLPAL.NS",
  "DABUR.NS",
  "MARICO.NS",
  "TATAPOWER.NS",
  "ADANIPOWER.NS",
  "MOTHERSON.NS",
  "BALKRISIND.NS",
  "MPHASIS.NS",
  "PERSISTENT.NS",
  "COFORGE.NS",
  "LTIM.NS",
  "TECHM.NS",
  "NAUKRI.NS",
  "INDHOTEL.NS",
  "CONCOR.NS",
  "BIOCON.NS",
  "ESCORTS.NS"
],
        us: [
          "AAPL", "MSFT", "NVDA", "GOOGL", "AMZN",
          "META", "AVGO", "JPM", "V", "XOM",
        ],
      };
      const universe = universes[market] ?? universes.in!;

      try {
        // Screen the whole universe with the LLM narrative skipped (scores are
        // still computed deterministically), in small concurrent batches so we
        // don't overload the MCP servers or upstream rate limits.
        const screened = await runPool(universe, 4, (sym) =>
          analyzeStock(sym, { skipNarrative: true }),
        );

        // Rank by score, then confidence...
        const ranked = screened
          .slice()
          .sort((a, b) => b.overallScore - a.overallScore || b.confidence - a.confidence);

        // ...but only return stocks that actually clear the buy threshold.
        const picks = ranked
          .filter((r) => r.overallScore >= minScore && r.recommendation !== "AVOID")
          .slice(0, limit)
          .map((r, i) => ({ rank: i + 1, ...r }));

        const board = ranked.map((r) => ({
          symbol: r.resolvedSymbol,
          score: r.overallScore,
          recommendation: r.recommendation,
        }));

        return reply.send({
          market,
          asOf: new Date().toISOString(),
          screened: screened.length,
          universeSize: universe.length,
          minScore,
          qualified: picks.length,
          picks,
          board,
        });
      } catch (err) {
        log.error("Top-picks screen failed", String(err));
        return reply.status(502).send({ error: "Top-picks screen failed", detail: String(err) });
      }
    },
  );

  app.get("/api/recommended", async (_request, reply) => {
    try {
      const items = getRecommended(5);
      return reply.send(items);
    } catch (err) {
      log.error("Failed to load recommendations", String(err));
      return reply.status(500).send({ error: "Failed to load recommendations" });
    }
  });

  app.get(
    "/api/analysis/:symbol",
    async (request: FastifyRequest<{ Params: { symbol: string } }>, reply) => {
      const raw = request.params.symbol ?? "";
      const symbol = baseSymbol(raw.trim().toUpperCase());
      if (!symbol) {
        return reply.status(400).send({ error: "symbol is required" });
      }
      const stored = getStoredAnalysis(symbol);
      if (!stored) {
        return reply.status(404).send({ error: "No analysis found", symbol });
      }
      return reply.send(stored);
    },
  );
}
