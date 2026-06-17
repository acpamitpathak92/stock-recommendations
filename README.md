# Helix — Agentic Stock Research Platform

A production-style, locally-runnable equity research platform. Enter a ticker and a
desk of parallel agents researches it through **MCP tools**, scores the evidence
**in code**, and a committee agent writes the final call. Google Gemini is used
**only** to write prose (bull/bear case, thesis, analysis) — never to invent prices,
ratios, news, or scores.

```
stock-ai/
├── backend/    Node 20+ · TypeScript · Fastify · LangGraphJS · MCP SDK · Gemini
└── frontend/   React · TypeScript · Vite · Ant Design · Recharts
```

---

## Architecture

```
                         React UI (Vite :5173)
                                │  /api  (proxied)
                                ▼
                       Fastify API (:8080)
                                │
                        Coordinator (LangGraphJS)
                                │
          ┌──────────┬─────────┴──────────┬──────────┐   ← parallel fan-out
          ▼          ▼                     ▼          ▼
       Market    Technical   Financial   News   Sentiment   (each calls an MCP tool)
          └────────┬─┴─────────┘          │          │
                   ▼                       │          │
                 Risk  (derived)           │          │
                   └───────────┬───────────┴──────────┘
                               ▼
                          Validation
                               ▼
                     Investment Committee  ──►  scored recommendation
```

- **Five MCP servers** (`market`, `technical`, `financial`, `news`, `sentiment`)
  each run as a separate stdio process and expose one tool. The backend spawns and
  connects to all five through the MCP SDK client; agents fetch all factual data
  through these tools.
- **Risk**, **Validation**, and **Committee** are analytical agents derived from the
  data already gathered (no external calls).
- **All scoring is computed in code** (`src/scoring/score.ts`). Weights: Financial
  35%, Technical 25%, Sentiment 15%, Risk 15%, News 10%. Overall ≥ 7 → **BUY**,
  ≥ 5 → **HOLD**, else **AVOID**. Risk is expressed as a *safety* score (10 = lowest
  risk) so it contributes positively to the weighted total.
- **Gemini 2.5 Flash** receives a verified fact sheet and returns JSON prose only,
  with a tight token budget. Without a key, a deterministic template narrative is
  used instead.

---

## Prerequisites

- **Node.js 20 or newer.** (The backend has zero native dependencies and uses a JSON file store for persistence.)
  Check with `node --version`.

---

## Setup & Run

Open two terminals.

### 1) Backend

```bash
cd backend
npm install
cp .env.example .env     # then add any API keys you have (all optional)
npm run dev              # starts Fastify on http://localhost:8080
```

### 2) Frontend

```bash
cd frontend
npm install
npm run dev              # starts Vite on http://localhost:5173
```

Open **http://localhost:5173** and analyze a ticker (e.g. `AAPL`).

The Vite dev server proxies `/api/*` to the backend, so no extra configuration is
needed.

---

## API keys (all optional)

Put these in `backend/.env`. Every key is optional: when one is missing, that data
source resolves to `"Data unavailable"` and the platform degrades gracefully rather
than crashing or inventing values.

| Variable                 | Powers                                   | Get a free key |
|--------------------------|------------------------------------------|----------------|
| `GOOGLE_API_KEY`         | Gemini narrative (bull/bear/thesis)      | https://aistudio.google.com/apikey |
| `ALPHA_VANTAGE_API_KEY`  | Quote, overview, price history, sentiment| https://www.alphavantage.co/support/#api-key |
| `NEWS_API_KEY`           | Latest headlines                         | https://newsapi.org/register |
| `FMP_API_KEY`            | Fundamental ratios, growth, cash flow    | https://site.financialmodelingprep.com/developer/docs |

### Coverage notes (please read)

- **Price, technicals, and valuation work for NSE/BSE with no API key**, sourced
  from Yahoo Finance (`yahoo-finance2` + Yahoo's public chart endpoint). Indian
  symbols resolve via Yahoo's `.NS` (NSE) / `.BO` (BSE) suffixes — e.g.
  `RELIANCE.NS`, `TATAMOTORS.NS`. Bare Indian symbols are mapped to `.NS`.
- **Deep fundamentals (margins, ROE, revenue/profit growth, debt/equity)** are
  the one remaining gap for Indian stocks on free tiers: FMP gates non-US data
  behind a paid plan (HTTP 402) and Alpha Vantage's `OVERVIEW` is thin for
  NSE/BSE. Those fields show `Data unavailable` for many Indian tickers; price,
  technicals, market cap, P/E, EPS and dividend yield still populate via Yahoo.
- **US tickers (AAPL, MSFT, NVDA)** give the fullest results across every source.
- The free Alpha Vantage tier is rate-limited (~25 requests/day); Yahoo has no
  key and no hard daily cap, so it's the primary price/quote source.
- With **no keys at all**, the app runs end to end on Yahoo data; only the
  Gemini narrative and a few Alpha-Vantage/FMP-only fields fall back.

---

## API endpoints

| Method | Path                    | Description                                   |
|--------|-------------------------|-----------------------------------------------|
| `POST` | `/api/analyze`          | Body `{ "symbol": "AAPL" }` → full analysis   |
| `GET`  | `/api/recommended`      | Top 5 recommendations from prior analyses     |
| `GET`  | `/api/sample?market=in` | Analyze 5 curated stocks (`in` or `us`) at once|
| `GET`  | `/api/analysis/:symbol` | Last persisted analysis for a symbol          |
| `GET`  | `/api/health`           | Liveness probe                                |

Analyses are persisted to a JSON file at `backend/data/stock-ai.json` (created
automatically) and power the recommendations leaderboard.

---

## Scripts

**Backend**

| Script             | Action                                            |
|--------------------|---------------------------------------------------|
| `npm run dev`      | Run with `tsx` watch (spawns MCP servers via tsx) |
| `npm run build`    | Type-check and compile to `dist/`                 |
| `npm start`        | Run the compiled build                            |
| `npm run typecheck`| `tsc --noEmit`                                     |

**Frontend**

| Script             | Action                          |
|--------------------|---------------------------------|
| `npm run dev`      | Vite dev server                 |
| `npm run build`    | Type-check + production build   |
| `npm run preview`  | Preview the production build    |

---

## How factual integrity is enforced

1. Agents only ever return values that came from an MCP tool response; any missing
   field is set to the `Data unavailable` sentinel (string) or `null` (numeric).
2. Scoring functions operate purely on those verified numbers.
3. The committee builds a fact sheet from verified data and asks Gemini to *explain*
   it. The prompt forbids inventing figures, and scores/recommendation are attached
   in code **after** the model returns, so the LLM can never move a number.

---

## Tech stack

**Backend:** Node.js 20+, TypeScript (NodeNext ESM), Fastify, `@fastify/cors`,
LangGraphJS (`@langchain/langgraph`), MCP SDK (`@modelcontextprotocol/sdk`),
`@google/genai` (Gemini 2.5 Flash), `yahoo-finance2` (free NSE/BSE + US quotes), Axios, Zod, a dependency-free JSON file store.

**Frontend:** React 18, TypeScript, Vite, Ant Design 5, Recharts, Axios.

---

## Notes & limitations

- Free data tiers are rate-limited; if you see many `Data unavailable` fields in a
  row you may have hit a provider's daily cap — wait and retry, or use US tickers.
- The JSON data file is created on first run; delete `backend/data/` to reset
  the leaderboard.
- This project is for research and demonstration. It is **not** investment advice.
