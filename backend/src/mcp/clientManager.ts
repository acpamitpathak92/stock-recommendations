import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { config } from "../utils/config.js";
import { createLogger } from "../utils/logger.js";

const log = createLogger("mcp:client");
const here = dirname(fileURLToPath(import.meta.url));

/**
 * Whether we are running from TypeScript sources (dev via tsx) or compiled
 * JavaScript (after `npm run build`). Determines how child servers launch.
 */
const isTs = here.includes(`${join("src", "mcp")}`) || fileURLToPath(import.meta.url).endsWith(".ts");
const ext = isTs ? "ts" : "js";

/** Environment forwarded to each spawned MCP server. */
function childEnv(): Record<string, string> {
  const env: Record<string, string> = {};
  for (const [k, v] of Object.entries(process.env)) {
    if (typeof v === "string") env[k] = v;
  }
  return env;
}

function childCommand(serverFile: string): { command: string; args: string[] } {
  const path = join(here, serverFile);
  if (isTs) {
    // node --import tsx <server>.ts  (portable, no shell)
    return { command: process.execPath, args: ["--import", "tsx", path] };
  }
  return { command: process.execPath, args: [path] };
}

export type McpServerName = "market" | "technical" | "financial" | "news" | "sentiment";

const SERVER_FILES: Record<McpServerName, string> = {
  market: `market-server.${ext}`,
  technical: `technical-server.${ext}`,
  financial: `financial-server.${ext}`,
  news: `news-server.${ext}`,
  sentiment: `sentiment-server.${ext}`,
};

interface Connection {
  client: Client;
  transport: StdioClientTransport;
}

/**
 * Singleton manager owning one persistent stdio connection per MCP server.
 * Agents call `callTool` and receive the parsed JSON payload.
 */
class McpClientManager {
  private connections = new Map<McpServerName, Connection>();
  private ready = false;

  async init(): Promise<void> {
    if (this.ready) return;
    const names = Object.keys(SERVER_FILES) as McpServerName[];
    await Promise.all(names.map((n) => this.connect(n)));
    this.ready = true;
    log.info("All MCP servers connected", { servers: names });
  }

  private async connect(name: McpServerName): Promise<void> {
    const { command, args } = childCommand(SERVER_FILES[name]);
    const transport = new StdioClientTransport({
      command,
      args,
      env: childEnv(),
      stderr: "inherit",
    });
    const client = new Client({ name: `${name}-client`, version: "1.0.0" });
    await client.connect(transport);
    this.connections.set(name, { client, transport });
    log.info("Connected MCP server", { name });
  }

  /** Call a tool on a given server and return the parsed JSON payload. */
  async callTool<T>(name: McpServerName, tool: string, args: Record<string, unknown>): Promise<T> {
    if (!this.ready) await this.init();
    const conn = this.connections.get(name);
    if (!conn) throw new Error(`MCP server not connected: ${name}`);
    const result = await conn.client.callTool({ name: tool, arguments: args });
    const content = result.content as Array<{ type: string; text?: string }> | undefined;
    const textBlock = content?.find((c) => c.type === "text");
    if (!textBlock?.text) {
      throw new Error(`MCP tool ${name}.${tool} returned no text content`);
    }
    return JSON.parse(textBlock.text) as T;
  }

  async shutdown(): Promise<void> {
    for (const [name, conn] of this.connections) {
      try {
        await conn.client.close();
      } catch (err) {
        log.warn("Error closing MCP client", { name, err: String(err) });
      }
    }
    this.connections.clear();
    this.ready = false;
  }
}

export const mcp = new McpClientManager();
