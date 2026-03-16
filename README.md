# 🏠 HK18 Prophet — 香港18區樓盤價格預測引擎

<p align="center">
  <strong>Multi-Agent Swarm Intelligence Engine for Hong Kong Real Estate Price Prediction</strong><br/>
  <em>基於多智能體群體智能的香港18區樓價預測系統</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/node-%3E%3D18-green" />
  <img src="https://img.shields.io/badge/license-All%20Rights%20Reserved-red" />
  <img src="https://img.shields.io/badge/agents-10%20types-orange" />
  <img src="https://img.shields.io/badge/districts-18-red" />
  <img src="https://img.shields.io/badge/estates-180-blue" />
  <img src="https://img.shields.io/badge/language-繁體中文-yellow" />
</p>

---

## ⚡ 專案簡介 | Project Overview

HK18 Prophet is an AI-powered prediction engine that forecasts Hong Kong real estate prices across all 18 districts. Inspired by [MiroFish](https://github.com/666ghj/MiroFish), it uses **multi-agent simulation** where specialized AI agents debate, reason, and synthesize predictions based on real-world signals.

The frontend is an **interactive SVG map of Hong Kong's 18 districts**. Click any district to trigger an on-demand analysis — agents run in the background while you browse other districts. Reports are generated in **繁體中文 (Traditional Chinese)** with prices in **HKD**.

### How It Works

```
   點擊地圖上任意地區 → 啟動多智能體分析
         │
         ▼
┌─────────────────────────────────────────────────┐
│           Agent Simulation Engine                │
│                                                 │
│  🏛️ 政府政策分析員  Government Policy Agent      │
│  📊 經濟環境分析員  Economic Environment Agent    │
│  😊 市場情緒分析員  Public Sentiment Agent        │
│  💰 成交數據分析員  Transaction Analysis Agent    │
│  🚇 基建發展分析員  Infrastructure Agent          │
│  🇨🇳 中國政策分析員  China Policy Agent            │
│  🏘️ 地區專家        District Specialist Agent     │
│  🎯 綜合分析師      District Moderator Agent      │
│                                                 │
│  Thematic Analysis → District Analysis →        │
│  Moderator Synthesis                            │
└─────────────────────────────────────────────────┘
         │
         ▼
📋 地區預測報告 District Prediction Report
   - 1年 / 5年 / 10年樓價走勢
   - 主要屋苑預測 (≥5個屋苑)
   - 影響因素及新聞來源 (≥4條新聞)
   - 風險與機遇分析
   - 投資建議 (買入/持有/觀望)

🔍 搜尋個別屋苑 → 啟動專項分析
         │
         ▼
┌─────────────────────────────────────────────────┐
│        Estate Analysis Engine                    │
│                                                 │
│  📊 經濟環境分析員  Economic Environment Agent    │
│  💰 成交數據分析員  Transaction Analysis Agent    │
│  🚇 基建發展分析員  Infrastructure Agent          │
│  🏠 屋苑專項分析員  Estate Analyst Agent          │
└─────────────────────────────────────────────────┘
         │
         ▼
📋 屋苑專項報告 Estate Prediction Report
   - 1年 / 5年 / 10年樓價走勢
   - 強弱項分析
   - 可比較屋苑
   - 新聞及政策影響
   - 投資建議及詳細理由
```

### Key Features

- **🗺️ Interactive HK Map** — Full-page SVG map of 18 districts; click to analyze
- **🔍 Estate Search** — Search 180+ estates by name (English/Chinese); get individual building predictions
- **⚡ On-Demand Analysis** — Only analyzes the district/estate you select (saves tokens)
- **🔄 Background Processing** — Analysis runs in background; browse other districts while waiting
- **💾 Smart Caching** — Results cached for 1 hour; instant load on revisit
- **🤖 Multi-Agent Debate** — 8 specialized agents debate and synthesize predictions
- **🏘️ Estate-Level Detail** — Predictions for 5+ major 屋苑 per district
- **📰 News-Driven** — Cites real news events and policy changes with sources
- **🇭🇰 繁體中文報告** — All analysis output in Traditional Chinese, prices in HKD
- **🔌 LLM Agnostic** — Works with any OpenAI SDK-compatible API (xAI Grok, OpenAI, Gemini, Groq, Ollama, etc.)

---

## 🏗️ Architecture

```
hk18-prophet/
├── backend/
│   ├── agents/                  # Multi-agent system
│   │   ├── base-agent.js            # Base class: LLM integration, memory, retries
│   │   ├── government-policy-agent.js
│   │   ├── economic-agent.js
│   │   ├── sentiment-agent.js
│   │   ├── transaction-agent.js
│   │   ├── infrastructure-agent.js
│   │   ├── china-policy-agent.js
│   │   ├── district-agent.js        # District specialist with deep local knowledge
│   │   ├── moderator-agent.js       # Full 18-district moderator
│   │   ├── district-moderator-agent.js  # Single-district focused moderator
│   │   ├── estate-agent.js              # Single-estate focused analyst
│   │   └── index.js                 # Agent registry & team creation
│   ├── simulation/
│   │   ├── engine.js                # Simulation loop + per-district analysis + caching
│   │   └── memory-store.js          # In-memory store for past simulations
│   ├── data-sources/
│   │   ├── scraper-base.js          # HTTP fetcher + HTML parser
│   │   └── news-fetcher.js          # NewsAPI integration + HK context
│   ├── db/
│   │   ├── schema.sql
│   │   └── database.js              # JSON file-based persistence
│   ├── routes/
│   │   └── api.js                   # REST API endpoints
│   ├── config.js                    # Central config with 18-district data
│   └── server.js                    # Express server
├── frontend/                    # Vue 3 + Vite
│   ├── src/
│   │   ├── components/
│   │   │   └── HKMap.vue            # Interactive SVG map of HK 18 districts
│   │   ├── views/
│   │   │   └── Dashboard.vue        # Full-page map + modal dialog for results
│   │   ├── App.vue
│   │   └── main.js
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── data/
│   └── hk18prophet.json         # Persistent database (auto-created)
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

---

## 🚀 Quick Start

### Prerequisites

| Tool    | Version | Purpose                    |
| ------- | ------- | -------------------------- |
| Node.js | ≥ 18    | Backend + Frontend runtime |
| npm     | ≥ 9     | Package manager            |

### 1. Clone & Configure

```bash
git clone https://github.com/YOUR_USERNAME/hk18-prophet.git
cd hk18-prophet

# Copy and edit environment variables
cp .env.example .env
```

Edit `.env` — you need at minimum an LLM API key:

```env
# LLM API (any OpenAI SDK-compatible endpoint)
LLM_API_KEY=your_api_key
LLM_BASE_URL=https://api.x.ai/v1          # xAI Grok
LLM_MODEL_NAME=grok-4-1-fast-reasoning
```

### 2. Install Dependencies

```bash
npm run setup    # installs root + frontend deps
```

### 3. Start Development Server

```bash
npm run dev
```

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:5001

Open the frontend and click any district on the map to start an analysis.

---

## 🔧 Configuration

### Environment Variables

```env
# LLM API (required — any OpenAI SDK-compatible endpoint)
LLM_API_KEY=your_api_key
LLM_BASE_URL=https://api.x.ai/v1
LLM_MODEL_NAME=grok-4-1-fast-reasoning

# Simulation
SIMULATION_ROUNDS=1              # Debate rounds (1 is fast, 3+ for deeper analysis)
MAX_CONCURRENT_AGENTS=10         # Parallel agent limit

# Server
PORT=5001
NODE_ENV=development

# News API (optional — for live news context)
NEWS_API_KEY=your_newsapi_key
```

### Compatible LLM Providers

| Provider | Base URL | Recommended Model |
|----------|----------|-------------------|
| **xAI Grok** | `https://api.x.ai/v1` | `grok-4-1-fast-reasoning` |
| **OpenAI** | `https://api.openai.com/v1` | `gpt-4o-mini` |
| **Google Gemini** | `https://generativelanguage.googleapis.com/v1beta/openai/` | `gemini-2.0-flash` |
| **Groq** (free) | `https://api.groq.com/openai/v1` | `llama-3.3-70b-versatile` |
| **OpenRouter** | `https://openrouter.ai/api/v1` | `meta-llama/llama-3.3-70b-instruct` |
| **Ollama** (local) | `http://localhost:11434/v1` | `llama3.2` |

---

## 🤖 Agent System

### Agent Types

| Agent | Role | Focus |
|-------|------|-------|
| 🏛️ Government Policy | 政府政策分析 | Housing policy, stamp duty, land supply |
| 📊 Economic Environment | 經濟環境分析 | Interest rates, GDP, USD/HKD peg, HIBOR |
| 😊 Public Sentiment | 市場情緒分析 | Buyer/seller sentiment, FOMO, media mood |
| 💰 Transaction Analysis | 成交數據分析 | Deal volume, price/sqft, CCL index trends |
| 🚇 Infrastructure | 基建發展分析 | MTR, Northern Metropolis, hospitals, schools |
| 🇨🇳 China Policy | 中國政策分析 | GBA integration, capital flows, talent schemes |
| 🏘️ District Specialist | 地區專家 | Deep local knowledge per district |
| 🎯 District Moderator | 地區綜合分析 | Synthesizes all views into single-district report |
| � Estate Analyst | 屋苑專項分析 | Deep analysis of a single estate/building |
| �🎯 Moderator | 全局綜合分析 | Synthesizes all views across all 18 districts |

### Per-District Analysis Flow

```
Click district on map
    │
    ├─→ 6 Thematic agents analyze in parallel
    │       (Government, Economic, Sentiment, Transaction, Infrastructure, China)
    │
    ├─→ 1 District specialist agent analyzes (with thematic context)
    │
    └─→ 1 District moderator synthesizes final report
            │
            ├── 1年/5年/10年 price predictions
            ├── 5+ major estates with individual forecasts
            ├── 4+ news events with sources
            ├── Risk & opportunity analysis
            └── Buy/Hold/Wait recommendations
```

### Per-Estate Analysis Flow

```
Search estate (e.g. "太古城") and select from results
    │
    ├─→ 3 Thematic agents analyze sequentially
    │       (Economic, Transaction, Infrastructure)
    │
    └─→ 1 Estate analyst synthesizes detailed report
            │
            ├── 1年/5年/10年 price predictions (HK$/sqft)
            ├── Strengths & weaknesses analysis
            ├── Comparable estates comparison
            ├── 3+ news events with sources
            ├── Risk & opportunity analysis
            └── Buy/Hold/Wait recommendation with reasoning
```

---

## 🗺️ Supported Districts (香港18區)

### Hong Kong Island 港島

| Code | District | 中文 |
|------|----------|------|
| CW | Central & Western | 中西區 |
| WC | Wan Chai | 灣仔 |
| EA | Eastern | 東區 |
| SO | Southern | 南區 |

### Kowloon 九龍

| Code | District | 中文 |
|------|----------|------|
| YTM | Yau Tsim Mong | 油尖旺 |
| SSP | Sham Shui Po | 深水埗 |
| KC | Kowloon City | 九龍城 |
| WTS | Wong Tai Sin | 黃大仙 |
| KT | Kwun Tong | 觀塘 |

### New Territories 新界

| Code | District | 中文 |
|------|----------|------|
| KI | Kwai Tsing | 葵青 |
| TW | Tsuen Wan | 荃灣 |
| TM | Tuen Mun | 屯門 |
| YL | Yuen Long | 元朗 |
| NO | North | 北區 |
| TP | Tai Po | 大埔 |
| ST | Sha Tin | 沙田 |
| SK | Sai Kung | 西貢 |
| IS | Islands | 離島 |

---

## 📄 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/simulation/start` | Start full 18-district simulation |
| `POST` | `/api/district/:code/analyze` | Start single-district analysis (on-demand) |
| `GET`  | `/api/estates/search?q=太古城` | Search estates by name (EN/CN) or area |
| `POST` | `/api/estate/analyze` | Start single-estate analysis |
| `GET`  | `/api/district/:code/status` | Check district analysis status + cached result |
| `GET`  | `/api/district/statuses` | All district statuses (running/cached/none) |
| `GET`  | `/api/simulation/:id/status` | Check simulation progress |
| `GET`  | `/api/simulation/:id/report` | Get prediction report |
| `GET`  | `/api/simulation/:id/transcript` | Full agent debate transcript |
| `GET`  | `/api/districts` | List all 18 districts |
| `GET`  | `/api/districts/:code/history` | Historical predictions for a district |
| `GET`  | `/api/agents` | Agent manifest |
| `GET`  | `/api/simulations` | List past simulations |

---

## 🛣️ Roadmap

- [x] Multi-agent simulation engine
- [x] 9 specialized agent types (6 thematic + district + district moderator + full moderator)
- [x] Agent memory & debate system
- [x] Interactive HK 18-district SVG map
- [x] On-demand per-district analysis (click to analyze)
- [x] Background processing with live progress tracking
- [x] Smart caching (1 hour TTL)
- [x] Traditional Chinese (繁體中文) reports
- [x] HKD pricing throughout
- [x] Estate-level predictions (5+ major 屋苑 per district)
- [x] Individual estate search & analysis (180 estates across 18 districts)
- [x] News/policy citations with sources
- [x] LLM provider agnostic (xAI Grok, OpenAI, Gemini, Groq, Ollama)
- [ ] Live data scraping (Land Registry, RVD, Centaline)
- [ ] Historical accuracy tracking
- [ ] PDF report export
- [ ] Mobile-responsive design

---

## 📜 License

All rights reserved. You must obtain written permission from the author before using, copying, or distributing this software. See [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- Architecture inspired by [MiroFish](https://github.com/666ghj/MiroFish) multi-agent simulation engine
- Hong Kong district data from the [Census and Statistics Department](https://www.censtatd.gov.hk/)
