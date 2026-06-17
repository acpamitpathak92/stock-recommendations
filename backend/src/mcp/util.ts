import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

/** Wrap any JSON-serialisable payload as an MCP text tool result. */
export function jsonResult(payload: unknown): CallToolResult {
  return { content: [{ type: "text", text: JSON.stringify(payload) }] };
}
