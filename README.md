# 🏠 HK18 Prophet — 香港18區樓盤價格預測引擎

<p align="center">
  <strong>A Multi-Agent Swarm Intelligence Engine for Hong Kong Real Estate Price Prediction</strong><br/>
  <em>基於多智能體群體智能的香港18區樓價預測系統</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/node-%3E%3D18-green" />
  <img src="https://img.shields.io/badge/license-MIT-blue" />
  <img src="https://img.shields.io/badge/agents-8%20types-orange" />
  <img src="https://img.shields.io/badge/districts-18-red" />
</p>

---

## ⚡ Project Overview

HK18 Prophet is an AI-powered prediction engine that forecasts Hong Kong real estate prices across all 18 districts. Inspired by [MiroFish](https://github.com/666ghj/MiroFish), it uses **multi-agent simulation** where specialized AI agents debate, reason, and synthesize predictions based on real-world signals.

### How It Works

Instead of a single model, HK18 Prophet deploys **8 specialized agents** that each analyze the market from a different angle, then engage in structured debate rounds to produce a consensus prediction:

```
📰 Seed Data (News, Policies, Transactions)
        │
        ▼
┌─────────────────────────────────────────────┐
│           Agent Simulation Engine            │
│                                             │
│  🏛️ Government Policy Agent                 │
│  📊 Economic Environment Agent              │
│  😊 Public Sentiment Agent                  │
│  💰 Transaction Analysis Agent              │
│  🚇 Infrastructure Agent                    │
│  🇨🇳 China Policy Agent                     │
│  🏘️ District Specialist Agent (×18)          │
│  🎯 Moderator Agent (synthesizer)           │
│                                             │
│  Round 1 → Round 2 → ... → Round N         │
│  (Agents debate with evidence & memory)     │
└─────────────────────────────────────────────┘
        │
        ▼
📋 Prediction Report per District
   - Price trend (⬆️⬇️➡️)
   - Confidence score
   - Key driving factors
   - Risk analysis
   - 3/6/12 month outlook
```

### Key Features

- **🤖 Multi-Agent Debate** — Agents argue with evidence, challenge each other, and converge on predictions
- **🗺️ 18 District Coverage** — Dedicated specialist for each HK district with local knowledge
- **📡 Real-Time Data Ingestion** — Scrapes government data, news, transaction records
- **🧠 Agent Memory** — Agents remember past predictions and accuracy for self-improvement
- **📊 Interactive Dashboard** — Vue.js frontend with HK district map and drill-down views
- **🔌 LLM Agnostic** — Works with OpenAI, Anthropic, Ollama, or any OpenAI-compatible API

---

## 🏗️ Architecture

```
hk18-prophet/
├── backend/
│   ├── agents/              # Multi-agent system
│   │   ├── base-agent.js        # Base agent class with LLM integration
│   │   ├── government-policy-agent.js
│   │   ├── economic-agent.js
│   │   ├── sentiment-agent.js
│   │   ├── transaction-agent.js
│   │   ├── infrastructure-agent.js
│   │   ├── china-policy-agent.js
│   │   ├── district-agent.js    # Spawns 18 district specialists
│   │   ├── moderator-agent.js   # Synthesizes final prediction
│   │   └── index.js
│   ├── simulation/          # Simulation engine
│   │   ├── engine.js            # Core debate/simulation loop
│   │   └── memory-store.js      # Agent memory persistence
│   ├── data-sources/        # Data ingestion
│   │   ├── scraper-base.js
│   │   └── news-fetcher.js
│   ├── db/                  # Database
│   │   ├── schema.sql
│   │   └── database.js
│   ├── routes/              # API routes
│   │   └── api.js
│   ├── config.js
│   └── server.js
├── frontend/                # Vue 3 + Vite
│   ├── src/
│   │   ├── components/
│   │   │   └── DistrictMap.vue
│   │   ├── views/
│   │   │   └── Dashboard.vue
│   │   ├── App.vue
│   │   └── main.js
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
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
# Edit .env with your API keys
```

### 2. Install Dependencies

```bash
# Install all dependencies (root + backend + frontend)
npm run setup
```

### 3. Start Services

```bash
# Start both backend and frontend
npm run dev
```

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5001`

---

## 🔧 Configuration

Edit `.env` file:

```env
# LLM API (any OpenAI-compatible endpoint)
LLM_API_KEY=your_api_key
LLM_BASE_URL=https://api.openai.com/v1
LLM_MODEL_NAME=gpt-4o-mini

# Simulation settings
SIMULATION_ROUNDS=5          # Number of debate rounds
AGENTS_PER_DISTRICT=1        # District specialist count
MAX_CONCURRENT_AGENTS=10     # Parallel agent limit

# Data source API keys (optional, for live data)
NEWS_API_KEY=your_newsapi_key
```

---

## 🤖 Agent System

### Agent Types

| Agent | Role | Data Sources |
|-------|------|-------------|
| 🏛️ Government Policy | Analyzes HK government housing policies, stamp duty changes, land supply | GovHK press releases, Policy Address |
| 📊 Economic Environment | Macro indicators: interest rates, unemployment, GDP, USD/HKD peg | HKMA, Census dept |
| 😊 Public Sentiment | Gauges buyer/seller sentiment from news & social media | News articles, forums |
| 💰 Transaction Analysis | Tracks deal volume, price per sq ft trends, new vs secondary | Land Registry, Centaline |
| 🚇 Infrastructure | New MTR lines, highways, hospitals, schools impact | Development Bureau, MTR Corp |
| 🇨🇳 China Policy | Greater Bay Area integration, capital controls, talent schemes | Mainland policy announcements |
| 🏘️ District Specialist | Deep local knowledge for each of 18 districts | All sources, district-focused |
| 🎯 Moderator | Synthesizes all agent views into final prediction report | Agent debate transcripts |

### Simulation Flow

1. **Data Collection** — Fetch latest data from all sources
2. **Agent Briefing** — Each agent receives relevant data for their domain
3. **Debate Rounds** — Agents present views, challenge each other, refine positions
4. **Synthesis** — Moderator agent produces per-district prediction report
5. **Memory Update** — Store predictions for future accuracy tracking

---

## 🗺️ Supported Districts (香港18區)

| # | District | 中文 | | # | District | 中文 |
|---|----------|------|---|---|----------|------|
| 1 | Central & Western | 中西區 | | 10 | Kwun Tong | 觀塘 |
| 2 | Wan Chai | 灣仔 | | 11 | Sham Shui Po | 深水埗 |
| 3 | Eastern | 東區 | | 12 | Kowloon City | 九龍城 |
| 4 | Southern | 南區 | | 13 | Wong Tai Sin | 黃大仙 |
| 5 | Yau Tsim Mong | 油尖旺 | | 14 | Sai Kung | 西貢 |
| 6 | Islands | 離島 | | 15 | Sha Tin | 沙田 |
| 7 | Kwai Tsing | 葵青 | | 16 | Tai Po | 大埔 |
| 8 | North | 北區 | | 17 | Tsuen Wan | 荃灣 |
| 9 | Tuen Mun | 屯門 | | 18 | Yuen Long | 元朗 |

---

## 📡 Data Sources

The system can ingest data from:

- **Hong Kong Land Registry** — Transaction records (成交紀錄)
- **Rating and Valuation Department (RVD)** — Property price indices
- **Hong Kong Monetary Authority (HKMA)** — Interest rates, monetary policy
- **Census and Statistics Department** — Economic indicators
- **GovHK** — Policy announcements, press releases
- **News APIs** — Real-time news for sentiment analysis
- **Centaline / Midland** — Market reports (manual upload)

---

## 📄 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/simulation/start` | Start a new prediction simulation |
| `GET`  | `/api/simulation/:id/status` | Check simulation progress |
| `GET`  | `/api/simulation/:id/report` | Get prediction report |
| `GET`  | `/api/districts` | List all 18 districts |
| `GET`  | `/api/districts/:code/history` | Historical predictions for a district |
| `GET`  | `/api/agents/:simulationId/transcript` | View agent debate transcript |

---

## 🛣️ Roadmap

- [x] Multi-agent simulation engine
- [x] 8 specialized agent types
- [x] Agent memory & debate system
- [ ] Live data scraping (Land Registry, RVD)
- [ ] Interactive HK district map
- [ ] Historical accuracy tracking
- [ ] Cantonese/Chinese language support in reports
- [ ] Export to PDF report
- [ ] Webhook notifications for significant predictions
- [ ] Mobile-responsive design

---

## 📜 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- Architecture inspired by [MiroFish](https://github.com/666ghj/MiroFish) multi-agent simulation engine
- Hong Kong district data from the [Census and Statistics Department](https://www.censtatd.gov.hk/)
