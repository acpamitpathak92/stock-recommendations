import { StateGraph, START, END } from "@langchain/langgraph";
import { GraphState } from "./state.js";
import { marketAgent, technicalAgent, financialAgent } from "../agents/dataAgents.js";
import { newsAgent, sentimentAgent } from "../agents/newsSentimentAgents.js";
import { riskAgent } from "../agents/riskAgent.js";
import { validationAgent } from "../agents/validationAgent.js";
import { committeeAgent } from "../agents/committeeAgent.js";

/**
 * Coordinator workflow.
 *
 *                      ┌─ marketNode ───┐
 *                      ├─ technicalNode ┤
 *   START ──fan-out──> ├─ financialNode ┼─> riskNode ─┐
 *                      ├─ newsNode ─────┤             ├─> validationNode ─> committeeNode ─> END
 *                      └─ sentimentNode ┘─────────────┘
 *
 * Node names are suffixed `Node` so they never collide with the state
 * channels (market, technical, ...) — LangGraph forbids a node name that
 * matches an existing state attribute.
 *
 * The five data agents run in parallel (each writes its own state channel).
 * Risk is derived from market/technical/financial. Validation joins risk,
 * news and sentiment. Committee produces the final recommendation.
 */
export function buildWorkflow() {
  const graph = new StateGraph(GraphState)
    .addNode("marketNode", marketAgent)
    .addNode("technicalNode", technicalAgent)
    .addNode("financialNode", financialAgent)
    .addNode("newsNode", newsAgent)
    .addNode("sentimentNode", sentimentAgent)
    .addNode("riskNode", riskAgent)
    .addNode("validationNode", validationAgent)
    .addNode("committeeNode", committeeAgent)
    // Parallel fan-out from START.
    .addEdge(START, "marketNode")
    .addEdge(START, "technicalNode")
    .addEdge(START, "financialNode")
    .addEdge(START, "newsNode")
    .addEdge(START, "sentimentNode")
    // Risk depends on the three fundamental/price data agents.
    .addEdge("marketNode", "riskNode")
    .addEdge("technicalNode", "riskNode")
    .addEdge("financialNode", "riskNode")
    // Validation joins risk + news + sentiment.
    .addEdge("riskNode", "validationNode")
    .addEdge("newsNode", "validationNode")
    .addEdge("sentimentNode", "validationNode")
    // Committee then END.
    .addEdge("validationNode", "committeeNode")
    .addEdge("committeeNode", END);

  return graph.compile();
}

export type CompiledWorkflow = ReturnType<typeof buildWorkflow>;
