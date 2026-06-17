import Fastify from "fastify";
import cors from "@fastify/cors";
import { config } from "./utils/config.js";
import { createLogger } from "./utils/logger.js";
import { registerRoutes } from "./api/routes.js";
import { initDb } from "./services/db.js";
import { mcp } from "./mcp/clientManager.js";

const log = createLogger("server");

async function main(): Promise<void> {
  // Ensure the SQLite schema exists before serving traffic.
  initDb();

  const app = Fastify({ logger: false });

  await app.register(cors, {
    origin: true,
    methods: ["GET", "POST", "OPTIONS"],
  });

  await registerRoutes(app);

  // Warm the MCP client manager (spawns the 5 stdio servers) so the first
  // request does not pay the full startup cost. Failures are non-fatal here:
  // the workflow re-invokes mcp.init() and surfaces a clear error per request.
  try {
    await mcp.init();
    log.info("MCP servers ready");
  } catch (err) {
    log.warn("MCP warm-up failed; will retry on first request", String(err));
  }

  const close = async (signal: string): Promise<void> => {
    log.info(`Received ${signal}, shutting down`);
    try {
      await app.close();
      await mcp.shutdown();
    } catch (err) {
      log.error("Error during shutdown", String(err));
    } finally {
      process.exit(0);
    }
  };

  process.on("SIGINT", () => void close("SIGINT"));
  process.on("SIGTERM", () => void close("SIGTERM"));

  try {
    const address = await app.listen({ port: config.PORT, host: config.HOST });
    log.info(`Stock AI backend listening on ${address}`);
  } catch (err) {
    log.error("Failed to start server", String(err));
    await mcp.shutdown().catch(() => undefined);
    process.exit(1);
  }
}

void main();
