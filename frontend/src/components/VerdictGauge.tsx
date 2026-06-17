import type { Recommendation } from "../types";
import { recommendationColor } from "../services/format";
import { FONTS } from "../theme/theme";

interface VerdictGaugeProps {
  score: number; // 0-10
  recommendation: Recommendation;
  confidence: number; // 0-100
  dark: boolean;
}

/**
 * The page's signature element: a circular instrument that reads the overall
 * 0-10 score as a swept arc, ringed in the recommendation's color, with the
 * verdict and confidence stacked at the center like a dial readout.
 */
export default function VerdictGauge({ score, recommendation, confidence, dark }: VerdictGaugeProps) {
  const size = 184;
  const stroke = 13;
  const r = (size - stroke) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, score / 10));
  const color = recommendationColor(recommendation);
  const track = dark ? "#1C2840" : "#E7ECF4";

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 14 }}>
      <div style={{ position: "relative", width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
          <circle cx={cx} cy={cy} r={r} fill="none" stroke={track} strokeWidth={stroke} />
          <circle
            cx={cx}
            cy={cy}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - pct)}
            style={{ transition: "stroke-dashoffset 0.9s cubic-bezier(0.22,1,0.36,1)" }}
          />
        </svg>
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            className="mono"
            style={{
              fontFamily: FONTS.monoFont,
              fontWeight: 600,
              fontSize: 44,
              lineHeight: 1,
              color: dark ? "#F2F5FA" : "#0B1220",
            }}
          >
            {score.toFixed(1)}
          </div>
          <div
            className="eyebrow"
            style={{ marginTop: 4, color: dark ? "#8295B1" : "#6A7790" }}
          >
            / 10 overall
          </div>
        </div>
      </div>

      <div style={{ textAlign: "center" }}>
        <div
          className="display"
          style={{
            fontFamily: FONTS.displayFont,
            fontWeight: 700,
            fontSize: 26,
            letterSpacing: "0.04em",
            color,
          }}
        >
          {recommendation}
        </div>
        <div style={{ fontSize: 13, color: dark ? "#93A4BF" : "#54627B" }}>
          {confidence}% confidence
        </div>
      </div>
    </div>
  );
}
