import "dotenv/config";
import { z } from "zod";

/**
 * Centralised, validated environment configuration.
 *
 * API keys are optional so the platform can boot without every provider
 * configured. When a key is missing the corresponding data simply resolves
 * to "Data unavailable" rather than crashing the workflow.
 */
const EnvSchema = z.object({
  PORT: z.coerce.number().int().positive().default(8080),
  HOST: z.string().default("0.0.0.0"),

  GOOGLE_API_KEY: z.string().optional().default(""),
  ALPHA_VANTAGE_API_KEY: z.string().optional().default(""),
  NEWS_API_KEY: z.string().optional().default(""),
  FMP_API_KEY: z.string().optional().default(""),

  GEMINI_MODEL: z.string().default("gemini-2.5-flash"),

  /**
   * Default exchange suffix used by Alpha Vantage for Indian symbols
   * (e.g. TATAMOTORS -> TATAMOTORS.BSE). Empty for US tickers.
   */
  DEFAULT_SYMBOL_SUFFIX: z.string().default(""),

  DB_PATH: z.string().default("./data/stock-ai.json"),
});

export type AppConfig = z.infer<typeof EnvSchema>;

export const config: AppConfig = EnvSchema.parse(process.env);

export function hasKey(key: keyof AppConfig): boolean {
  const v = config[key];
  return typeof v === "string" && v.trim().length > 0;
}
