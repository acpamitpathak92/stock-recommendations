import type { ReactNode } from "react";
import { Card } from "antd";
import { FONTS } from "../theme/theme";

interface SectionCardProps {
  title: string;
  eyebrow?: string;
  extra?: ReactNode;
  dark: boolean;
  children: ReactNode;
  bodyPadding?: number;
}

export default function SectionCard({
  title,
  eyebrow,
  extra,
  dark,
  children,
  bodyPadding = 18,
}: SectionCardProps) {
  return (
    <Card className="hover-lift" style={{ height: "100%" }} styles={{ body: { padding: bodyPadding } }}>
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 14,
        }}
      >
        <div>
          {eyebrow && (
            <div className="eyebrow" style={{ color: dark ? "#7E92B0" : "#73819A", marginBottom: 3 }}>
              {eyebrow}
            </div>
          )}
          <div
            className="display"
            style={{
              fontFamily: FONTS.displayFont,
              fontWeight: 600,
              fontSize: 16,
              color: dark ? "#EAF0F8" : "#16203A",
            }}
          >
            {title}
          </div>
        </div>
        {extra}
      </div>
      {children}
    </Card>
  );
}
