import { config } from "../utils/config.js";

/**
 * Resolves a user-entered symbol into the form expected by Alpha Vantage.
 *
 * Alpha Vantage expects Indian equities with an exchange suffix, e.g.
 * `TATAMOTORS.BSE`. US tickers (AAPL, MSFT) are used as-is. If the user
 * already supplied a suffix (contains a dot) it is respected.
 */
export function resolveSymbol(raw: string): string {
  const symbol = raw.trim().toUpperCase();
  if (symbol.includes(".")) return symbol;
  if (config.DEFAULT_SYMBOL_SUFFIX) {
    return `${symbol}${config.DEFAULT_SYMBOL_SUFFIX}`;
  }
  return symbol;
}

/** The clean ticker without any exchange suffix (used for news queries). */
export function baseSymbol(raw: string): string {
  return raw.trim().toUpperCase().split(".")[0] ?? raw.trim().toUpperCase();
}

/**
 * Maps a user symbol to Yahoo Finance's convention.
 * Yahoo uses `.NS` for NSE and `.BO` for BSE. We translate Alpha Vantage's
 * `.BSE`/`.NSE` suffixes, pass through an explicit Yahoo suffix, and for a bare
 * symbol prefer NSE (better Yahoo coverage) when India mode is configured.
 */
export function yahooSymbol(raw: string): string {
  const s = raw.trim().toUpperCase();
  if (s.endsWith(".NS") || s.endsWith(".BO")) return s;
  if (s.endsWith(".BSE")) return `${s.slice(0, -4)}.BO`;
  if (s.endsWith(".NSE")) return `${s.slice(0, -4)}.NS`;
  if (s.includes(".")) return s; // some other exchange suffix; pass through
  if (config.DEFAULT_SYMBOL_SUFFIX) return `${s}.NS`; // India mode, bare symbol
  return s; // assume US
}
