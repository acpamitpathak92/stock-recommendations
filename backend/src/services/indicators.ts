/**
 * Pure, deterministic technical-indicator calculations.
 *
 * Every value here is derived in code from a real closing-price series.
 * Nothing in this file calls an LLM or invents data.
 */

/** Simple Moving Average over the last `period` closes. */
export function sma(closes: number[], period: number): number | null {
  if (closes.length < period) return null;
  const slice = closes.slice(closes.length - period);
  const sum = slice.reduce((a, b) => a + b, 0);
  return round(sum / period);
}

/** Exponential Moving Average (latest value). */
export function ema(closes: number[], period: number): number | null {
  if (closes.length < period) return null;
  const k = 2 / (period + 1);
  // Seed with SMA of the first `period` values.
  let prev = closes.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < closes.length; i++) {
    const price = closes[i] as number;
    prev = price * k + prev * (1 - k);
  }
  return round(prev);
}

/** Full EMA series (used internally by MACD). */
function emaSeries(values: number[], period: number): number[] {
  if (values.length < period) return [];
  const k = 2 / (period + 1);
  const out: number[] = [];
  let prev = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  out.push(prev);
  for (let i = period; i < values.length; i++) {
    const price = values[i] as number;
    prev = price * k + prev * (1 - k);
    out.push(prev);
  }
  return out;
}

/** Relative Strength Index (Wilder's smoothing). */
export function rsi(closes: number[], period = 14): number | null {
  if (closes.length < period + 1) return null;
  let gains = 0;
  let losses = 0;
  for (let i = 1; i <= period; i++) {
    const diff = (closes[i] as number) - (closes[i - 1] as number);
    if (diff >= 0) gains += diff;
    else losses -= diff;
  }
  let avgGain = gains / period;
  let avgLoss = losses / period;
  for (let i = period + 1; i < closes.length; i++) {
    const diff = (closes[i] as number) - (closes[i - 1] as number);
    const gain = diff > 0 ? diff : 0;
    const loss = diff < 0 ? -diff : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }
  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return round(100 - 100 / (1 + rs));
}

export interface MacdResult {
  macd: number | null;
  signal: number | null;
  histogram: number | null;
}

/** MACD(12,26,9). */
export function macd(closes: number[], fast = 12, slow = 26, signalPeriod = 9): MacdResult {
  if (closes.length < slow + signalPeriod) {
    return { macd: null, signal: null, histogram: null };
  }
  const fastEma = emaSeries(closes, fast);
  const slowEma = emaSeries(closes, slow);
  // Align the two series to the same (shorter) tail length.
  const len = Math.min(fastEma.length, slowEma.length);
  const fastTail = fastEma.slice(fastEma.length - len);
  const slowTail = slowEma.slice(slowEma.length - len);
  const macdLine = fastTail.map((v, i) => v - (slowTail[i] as number));
  const signalSeries = emaSeries(macdLine, signalPeriod);
  if (signalSeries.length === 0) return { macd: null, signal: null, histogram: null };
  const macdVal = macdLine[macdLine.length - 1] as number;
  const signalVal = signalSeries[signalSeries.length - 1] as number;
  return {
    macd: round(macdVal),
    signal: round(signalVal),
    histogram: round(macdVal - signalVal),
  };
}

/** Naive support/resistance from the trailing window's min/max close. */
export function supportResistance(
  closes: number[],
  window = 60,
): { support: number | null; resistance: number | null } {
  if (closes.length === 0) return { support: null, resistance: null };
  const slice = closes.slice(Math.max(0, closes.length - window));
  return { support: round(Math.min(...slice)), resistance: round(Math.max(...slice)) };
}

/** Annualised volatility from daily log returns. */
export function annualisedVolatility(closes: number[]): number | null {
  if (closes.length < 21) return null;
  const returns: number[] = [];
  for (let i = 1; i < closes.length; i++) {
    const prev = closes[i - 1] as number;
    const cur = closes[i] as number;
    if (prev > 0) returns.push(Math.log(cur / prev));
  }
  if (returns.length < 2) return null;
  const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
  const variance =
    returns.reduce((a, r) => a + (r - mean) ** 2, 0) / (returns.length - 1);
  const daily = Math.sqrt(variance);
  return round(daily * Math.sqrt(252));
}

export function round(n: number, dp = 4): number {
  const f = 10 ** dp;
  return Math.round(n * f) / f;
}
