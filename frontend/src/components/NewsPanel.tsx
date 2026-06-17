import { Empty, Tag } from "antd";
import { LinkOutlined } from "@ant-design/icons";
import type { NewsArticle, NewsData } from "../types";
import SectionCard from "./SectionCard";
import { formatDate } from "../services/format";
import { FONTS } from "../theme/theme";

interface Props {
  news: NewsData;
  dark: boolean;
}

const SENTIMENT_COLOR: Record<NewsArticle["sentiment"], string> = {
  positive: "#16A34A",
  negative: "#DC2626",
  neutral: "#64748B",
};

export default function NewsPanel({ news, dark }: Props) {
  const articles = news.articles ?? [];

  return (
    <SectionCard
      title="Latest news"
      eyebrow={`${articles.length} item${articles.length === 1 ? "" : "s"} analysed`}
      dark={dark}
      bodyPadding={0}
    >
      {articles.length === 0 ? (
        <div style={{ padding: 18 }}>
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="No news available" style={{ padding: "32px 0" }} />
        </div>
      ) : (
        <div className="scroll-soft" style={{ maxHeight: 360, overflowY: "auto", padding: "2px 18px 18px" }}>
          {articles.map((a, idx) => (
            <a
              key={idx}
              href={a.url}
              target="_blank"
              rel="noreferrer noopener"
              className="hover-lift"
              style={{
                display: "block",
                textDecoration: "none",
                padding: "12px 0",
                borderBottom: idx < articles.length - 1 ? `1px solid ${dark ? "#1A2538" : "#EEF2F8"}` : "none",
              }}
            >
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                <span
                  style={{
                    marginTop: 6,
                    flex: "0 0 auto",
                    width: 7,
                    height: 7,
                    borderRadius: 999,
                    background: SENTIMENT_COLOR[a.sentiment],
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13.5,
                      lineHeight: 1.45,
                      fontWeight: 500,
                      color: dark ? "#DCE5F1" : "#1F2A40",
                    }}
                  >
                    {a.title}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 5, flexWrap: "wrap" }}>
                    <Tag
                      color={SENTIMENT_COLOR[a.sentiment]}
                      style={{ fontSize: 10, lineHeight: "16px", marginInlineEnd: 0, textTransform: "capitalize" }}
                    >
                      {a.sentiment}
                    </Tag>
                    <span
                      className="mono"
                      style={{ fontFamily: FONTS.monoFont, fontSize: 11, color: dark ? "#7C8DA8" : "#7A879C" }}
                    >
                      {a.source} · {formatDate(a.publishedAt)}
                    </span>
                    <LinkOutlined style={{ fontSize: 11, color: dark ? "#5E7088" : "#9AA6B8" }} />
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </SectionCard>
  );
}
