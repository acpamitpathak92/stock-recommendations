import { GoogleGenAI } from "@google/genai";
import { config, hasKey } from "../utils/config.js";
import { createLogger } from "../utils/logger.js";

const log = createLogger("gemini");

/**
 * Gemini is used ONLY to turn already-computed facts and scores into readable
 * narrative (bull case, bear case, thesis, explanation). It is never asked to
 * invent prices, ratios, news or scores — those are passed in as ground truth.
 *
 * Token usage is kept minimal: a compact JSON-only prompt, low temperature,
 * and a hard output-token cap.
 */
const ai = hasKey("GOOGLE_API_KEY") ? new GoogleGenAI({ apiKey: config.GOOGLE_API_KEY }) : null;

export interface CommitteeNarrative {
  bullCase: string[];
  bearCase: string[];
  investmentThesis: string;
  analysis: string;
}

const SYSTEM_INSTRUCTION =
  "You are an equity investment committee writer. You are given verified facts " +
  "and pre-computed scores. Explain and summarise ONLY using the supplied data. " +
  "Never invent prices, ratios, news, or numbers. If a fact is 'Data unavailable', " +
  "acknowledge the gap. Respond with strict JSON only, no markdown.";

/**
 * Produce narrative from a compact fact sheet. The recommendation, scores and
 * confidence are decided in code and passed in for explanation only.
 */
export async function generateNarrative(factSheet: string, skip = false): Promise<CommitteeNarrative> {
  const fallback: CommitteeNarrative = {
    bullCase: ["Data unavailable"],
    bearCase: ["Data unavailable"],
    investmentThesis: "Data unavailable",
    analysis: "Narrative generation unavailable (GOOGLE_API_KEY not configured or request failed).",
  };
  if (skip) {
    // Screening mode: skip the LLM call entirely for speed and quota safety.
    return fallback;
  }
  if (!ai) {
    log.warn("GOOGLE_API_KEY not set; returning fallback narrative");
    return fallback;
  }

  const prompt =
    `Given this verified fact sheet, write the committee narrative.\n${factSheet}\n\n` +
    `Return JSON with keys: bullCase (3-5 short strings), bearCase (3-5 short strings), ` +
    `investmentThesis (2-3 sentences), analysis (3-4 sentences). ` +
    `Base every statement strictly on the fact sheet.`;

  try {
    const res = await ai.models.generateContent({
      model: config.GEMINI_MODEL,
      contents: prompt,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.3,
        // gemini-2.5-* are reasoning models with "thinking" ON by default.
        // This is a deterministic summarisation task that needs no internal
        // reasoning, so we disable thinking — otherwise the model can spend the
        // whole output budget on thoughts and return empty/truncated text.
        thinkingConfig: { thinkingBudget: 0 },
        // Headroom so the JSON object is never truncated mid-string.
        maxOutputTokens: 1024,
        responseMimeType: "application/json",
      },
    });
    const text = (res.text ?? "").trim();
    if (!text) {
      // Surface *why* the model returned nothing so this is debuggable.
      const finish = res.candidates?.[0]?.finishReason;
      const usage = res.usageMetadata;
      log.error("Gemini returned empty text", {
        finishReason: finish ?? "unknown",
        promptTokens: usage?.promptTokenCount,
        thoughtsTokens: usage?.thoughtsTokenCount,
        outputTokens: usage?.candidatesTokenCount,
      });
      return fallback;
    }
    const parsed = JSON.parse(stripFences(text)) as Partial<CommitteeNarrative>;
    return {
      bullCase: arr(parsed.bullCase),
      bearCase: arr(parsed.bearCase),
      investmentThesis: typeof parsed.investmentThesis === "string" ? parsed.investmentThesis : "Data unavailable",
      analysis: typeof parsed.analysis === "string" ? parsed.analysis : fallback.analysis,
    };
  } catch (err) {
    log.error("Gemini narrative generation failed", String(err));
    return fallback;
  }
}

function stripFences(s: string): string {
  return s.replace(/```json/gi, "").replace(/```/g, "").trim();
}

function arr(v: unknown): string[] {
  if (Array.isArray(v) && v.every((x) => typeof x === "string") && v.length > 0) {
    return v as string[];
  }
  return ["Data unavailable"];
}
