# MEMORY.md — HK18 Prophet Project Context

> **Purpose:** This file captures the full history, decisions, and current state of the project so that any AI agent on any machine can resume work seamlessly. Read this file first before making any changes.

---

## 🧑 User Profile

- **Name:** Michael Yeung
- **Background:** Developer working with Node.js, internal IT tools, data extraction, and SQL Server (MSSQL)
- **Existing project:** `extract-minolta-copy-count` — a Node.js tool that extracts Minolta printer copy counts from an internal PaperCut web report, parses HTML tables, and imports data into MSSQL. Uses CommonJS, built-in `http`/`https` modules, `exceljs`, and `mssql`.
- **Goal:** Build a portfolio-worthy AI project for GitHub to strengthen skills in AI/multi-agent systems.
- **Location context:** Based in Hong Kong, familiar with local real estate market and 18 districts.

---

## 💡 Project Origin & Inspiration

1. Michael saw **MiroFish** (https://github.com/666ghj/MiroFish) trending on GitHub — a multi-agent swarm intelligence engine that simulates thousands of AI agents to predict outcomes (12.1k stars, Python + Vue, backed by Shanda Group).
2. He wanted to build something with a **similar MiroFish-like mechanism** (multi-agent debate/simulation) but applied to **Hong Kong real estate price prediction across all 18 districts**.
3. The prediction should factor in 6 real-world dimensions:
   - 🏛️ Latest government decisions (housing policy, stamp duty, land supply)
   - 📊 Latest economic environment (interest rates, USD/HKD peg, GDP)
   - 😊 Latest public emotion/sentiment about real estate
   - 💰 Latest deal/transaction changes
   - 🚇 Latest infrastructure developments (MTR, hospitals, schools)
   - 🇨🇳 Latest Chinese policies affecting HK real estate (GBA, talent schemes, capital flows)

---

## 📁 Project: HK18 Prophet (香港18區樓盤價格預測引擎)

### Tech Stack Chosen
- **Backend:** Node.js (ES Modules), Express, OpenAI SDK (LLM-agnostic)
- **Frontend:** Vue 3 + Vite + Vue Router
- **Database:** SQLite via better-sqlite3
- **LLM:** Any OpenAI SDK-compatible API (OpenAI, DeepSeek, Ollama, Groq, etc.)
- **No Python dependency** — entire project is Node.js to match Michael's skills

### Project Location
```
c:\Users\michael.yeung\Downloads\hk18-prophet\
```

---

## 📂 Complete File Structure (as of session end)

```
hk18-prophet/
├── .env.example              # Environment variable template
├── .gitignore                # node_modules, .env, data/, *.db
├── LICENSE                   # MIT License
├── MEMORY.md                 # THIS FILE
├── package.json              # Root package (ES module, concurrently for dev)
├── README.md                 # Full project README with architecture, districts, API docs
│
├── backend/
│   ├── config.js             # Central config: LLM settings, all 18 districts, simulation params
│   ├── server.js             # Express server with CORS, DB init, route mounting
│   │
│   ├── agents/               # Multi-agent system (MiroFish-inspired)
│   │   ├── base-agent.js         # BaseAgent class: LLM integration, memory, structured JSON output
│   │   ├── government-policy-agent.js  # HK gov housing policy, stamp duty, land supply
│   │   ├── economic-agent.js          # Interest rates, USD/HKD peg, HIBOR, GDP
│   │   ├── sentiment-agent.js         # Public mood, FOMO, immigration sentiment, media
│   │   ├── transaction-agent.js       # Deal volume, price/sqft, CCL index, primary vs secondary
│   │   ├── infrastructure-agent.js    # MTR extensions, Northern Metropolis, hospitals
│   │   ├── china-policy-agent.js      # GBA, capital flows, talent schemes, RMB dynamics
│   │   ├── district-agent.js          # 18 district specialists with deep local knowledge
│   │   ├── moderator-agent.js         # Synthesizer — produces final per-district predictions
│   │   └── index.js                   # Agent registry, createAgentTeam(), getAgentManifest()
│   │
│   ├── simulation/
│   │   ├── engine.js             # Core simulation loop: rounds of thematic → district → moderator
│   │   └── memory-store.js       # In-memory store of past simulation results for agent learning
│   │
│   ├── data-sources/
│   │   ├── scraper-base.js       # HTTP fetcher + HTML table parser (reused from Minolta project)
│   │   └── news-fetcher.js       # NewsAPI integration + HK standing context builder
│   │
│   ├── db/
│   │   ├── schema.sql            # SQLite schema: simulations, district_predictions, actual_outcomes, seed_data
│   │   └── database.js           # DB init, saveDistrictPredictions(), getDistrictHistory()
│   │
│   └── routes/
│       └── api.js                # REST API: simulation CRUD, districts, agents, history
│
└── frontend/
    ├── index.html
    ├── package.json              # Vue 3, vue-router, vite
    ├── vite.config.js            # Vite config with /api proxy to :5001
    └── src/
        ├── main.js               # Vue app + router setup
        ├── App.vue               # Root component: header, dark theme, global styles
        └── views/
            └── Dashboard.vue     # Main view: simulation form, status polling, 18-district result grid
```

---

## 🏗️ Architecture Decisions Made

### 1. Multi-Agent Debate System (Core MiroFish Mechanism)
- **8 agent types:** 6 thematic + 18 district specialists + 1 moderator
- **Debate loop:** For N rounds: thematic agents analyze → district agents analyze (seeing thematic views) → all views passed to next round → moderator synthesizes final report
- **Structured output:** All agents produce JSON with `analysis`, `districtImpacts[]`, `pricePrediction`, `keyFactors[]`, `risksAndUncertainties[]`
- **Memory:** Agents retain conversation memory across rounds within a simulation
- **Parallel execution:** Thematic agents run in parallel; district agents run in batches of 6

### 2. District Knowledge System
- Each of the 18 districts has hardcoded deep knowledge in `district-agent.js`
- Includes: key areas, major estates, character description, key price drivers, price per sqft ranges
- Districts: CW, WC, EA, SO, YTM, SSP, KC, WTS, KT, KI, TW, TM, YL, NO, TP, ST, SK, IS

### 3. Data Flow
```
User Input (seed data + query)  →  NewsFetcher builds context (optionally fetches live news)
    →  SimulationEngine creates agent team
    →  N rounds of debate (thematic → district → next round)
    →  ModeratorAgent synthesizes final report
    →  Report saved to SQLite + returned via API
    →  Frontend polls status and displays 18-district grid
```

### 4. API Design
| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | /api/simulation/start | Start simulation (body: seedData, predictionQuery, rounds) |
| GET | /api/simulation/:id/status | Poll simulation progress |
| GET | /api/simulation/:id/report | Get final prediction report |
| GET | /api/simulation/:id/transcript | Full agent debate transcript |
| GET | /api/districts | List all 18 districts |
| GET | /api/districts/:code/history | Historical predictions for a district |
| GET | /api/agents | Agent manifest |
| GET | /api/simulations | List past simulations |

### 5. Frontend Design
- Dark theme (Figma/Vercel-style, #0f1117 background)
- Single-page dashboard with simulation form, real-time status polling (2s interval), 18-district result grid color-coded by direction (green up, red down, blue stable)
- Shows agent consensus, key themes, recommendations per district

---

## ✅ What Has Been Completed

| # | Task | Status |
|---|------|--------|
| 1 | Project structure, README, package.json, .env.example, .gitignore, LICENSE | ✅ Done |
| 2 | Backend config (config.js) with all 18 districts and LLM settings | ✅ Done |
| 3 | Express server (server.js) with middleware, DB init, route mounting | ✅ Done |
| 4 | Base Agent class with LLM integration, memory, structured JSON output | ✅ Done |
| 5 | All 6 thematic agents (government, economic, sentiment, transaction, infrastructure, china) | ✅ Done |
| 6 | District agent with detailed knowledge for all 18 districts | ✅ Done |
| 7 | Moderator agent (synthesizer) with per-district prediction output | ✅ Done |
| 8 | Agent registry (index.js) with createAgentTeam() and filtering | ✅ Done |
| 9 | Simulation engine with multi-round debate loop | ✅ Done |
| 10 | Memory store for past prediction tracking | ✅ Done |
| 11 | ScraperBase (HTTP fetcher + HTML parser, reused from Minolta project) | ✅ Done |
| 12 | NewsFetcher with NewsAPI and HK standing context | ✅ Done |
| 13 | SQLite schema (simulations, district_predictions, actual_outcomes, seed_data) | ✅ Done |
| 14 | Database helper functions | ✅ Done |
| 15 | REST API routes (all endpoints) | ✅ Done |
| 16 | Vue 3 frontend: App.vue, Dashboard.vue, Vite config, router | ✅ Done |

---

## ❌ What Has NOT Been Done Yet (Roadmap)

These items are planned but not implemented:

1. **`npm install` has NOT been run** — dependencies are declared but not installed
2. **No `git init`** — repo is not yet initialized or pushed to GitHub
3. **Live data scrapers** — RVD property price index, Land Registry transactions, Centaline CCL index (only NewsAPI is wired up)
4. **Interactive HK district map component** — SVG/canvas map with clickable districts (currently just a grid of cards)
5. **Historical accuracy tracking** — comparing past predictions with actual outcomes (schema exists, logic not wired)
6. **Chinese/Cantonese language toggle** — agents respond in English; bilingual UI not implemented
7. **PDF report export** — not implemented
8. **User authentication** — none (single-user local app for now)
9. **Dockerfile / docker-compose** — not created
10. **Tests** — no unit or integration tests written
11. **CI/CD** — no GitHub Actions
12. **Agent chat interface** — ability to talk to individual agents post-simulation (MiroFish has this)
13. **Rate limiting / cost estimation** — no LLM token usage tracking
14. **Mobile responsive** — basic CSS is responsive but not optimized for mobile

---

## 🔧 How to Run (for the next agent or developer)

```bash
cd c:\Users\michael.yeung\Downloads\hk18-prophet

# 1. Copy env and add your LLM API key
cp .env.example .env
# Edit .env → set LLM_API_KEY, LLM_BASE_URL, LLM_MODEL_NAME

# 2. Install dependencies
npm run setup   # installs root + frontend deps

# 3. Start dev servers
npm run dev     # concurrently runs backend (:5001) and frontend (:3000)
```

---

## 🗒️ Key Design Notes for Next Agent

1. **ES Modules throughout** — all backend files use `import/export`, package.json has `"type": "module"`
2. **LLM agnostic** — uses OpenAI SDK but works with any compatible endpoint (DeepSeek, Ollama, Groq, etc.)
3. **response_format: { type: 'json_object' }** — all agents request structured JSON responses
4. **better-sqlite3** — synchronous SQLite, no async needed for DB calls
5. **Vite proxy** — frontend proxies `/api` to `http://localhost:5001` so no CORS issues in dev
6. **Agent temperature** — thematic/district agents use 0.7, moderator uses 0.3 for consistency
7. **Max tokens** — agents get 2000 tokens, moderator gets 6000 for full 18-district report
8. **Batch processing** — district agents run in batches of 6 to avoid rate limiting
9. **Simulation is async** — POST /simulation/start returns immediately; frontend polls /status every 2s
10. **District codes** — 2-3 letter codes: CW, WC, EA, SO, YTM, SSP, KC, WTS, KT, KI, TW, TM, YL, NO, TP, ST, SK, IS

---

## 📝 Conversation History Summary

### Exchange 1: Project Ideation
- Michael asked for project suggestions after seeing MiroFish trending
- 4 project ideas proposed: (1) AI-Powered IT Asset Dashboard, (2) Multi-Agent Web Scraping Orchestrator, (3) RAG Document Q&A, (4) Mini MiroFish
- Recommended #1 or #3 based on his skills

### Exchange 2: Project Selected
- Michael chose: **HK 18-district real estate price prediction** with MiroFish-like multi-agent mechanism
- Specified 6 prediction factors: government, economy, sentiment, transactions, infrastructure, China policy
- Full project was scaffolded in one session: 22 files, complete backend + frontend

### Exchange 3: This Memory File
- Michael requested MEMORY.md for cross-agent continuity
- This file was created

---

*Last updated: March 10, 2026*
