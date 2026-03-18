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
  <img src="https://img.shields.io/badge/estates-180+-blue" />
  <img src="https://img.shields.io/badge/language-繁體中文-yellow" />
</p>

---

## ⚡ What Is This?

HK18 Prophet is an AI-powered prediction engine that forecasts Hong Kong real estate prices across all **18 districts** and **180+ individual estates**. It uses a **multi-agent swarm** where 10 types of specialized AI agents debate, reason, and synthesize predictions grounded in live news via **RAG (Retrieval-Augmented Generation)**.

All reports are generated in **繁體中文 (Traditional Chinese)** with prices in **HKD per square foot**.

### Core Capabilities

| Feature | Description |
|---------|-------------|
| 🗺️ **Interactive Map** | Full-page SVG map of Hong Kong's 18 districts — click any district to start analysis |
| 🏘️ **District Analysis** | 8 agents (6 thematic + 1 district specialist + 1 moderator) produce a comprehensive district report with 1/5/10 year price forecasts, 5+ estate-level predictions, risk/opportunity analysis, and investment recommendations |
| 🔍 **Estate Search** | Search 180 pre-configured estates by English name, Chinese name, or area — or type **any building name** for free-text analysis of any property in Hong Kong |
| 📍 **District Picker** | When analyzing a custom building, choose which district it belongs to for more accurate results (or let AI auto-detect) |
| 📰 **RAG News Grounding** | Automatically scrapes RTHK + news.gov.hk RSS feeds every 30 minutes, indexes articles in a local vector store, and injects the top 5 most relevant articles into every agent's prompt — so predictions cite real events, not hallucinated ones |
| ⚡ **Background Processing** | Analyses run in the background — browse other districts, start multiple estate analyses simultaneously, and get toast notifications when each completes |
| 💾 **Smart Caching + DB Persistence** | Results cached in memory with configurable TTL; also persisted to disk so reports survive server restarts |
| 🛡️ **Production-Ready Security** | Helmet security headers, CORS restriction, per-endpoint rate limiting, API key validation, graceful shutdown |
| 🔌 **LLM Agnostic** | Works with any OpenAI SDK-compatible API — xAI Grok, OpenAI, DeepSeek, Gemini, Groq, Ollama, OpenRouter, etc. |

---

## 📐 How It Works

### District Analysis Flow (8 LLM calls)

```
User clicks district on map
        │
        ▼
┌───────────────────────────────────────┐
│     6 Thematic Agents (sequential)    │
│                                       │
│  🏛️ Government Policy Analyst         │
│  📊 Economic Environment Analyst      │
│  😊 Public Sentiment Analyst          │
│  💰 Transaction Analysis Agent        │
│  🚇 Infrastructure Development Agent  │
│  🇨🇳 China Policy Analyst              │
└───────────────┬───────────────────────┘
                │ thematic summaries
                ▼
┌───────────────────────────────────────┐
│  🏘️ District Specialist Agent         │
│     (hyper-local interpretation)      │
└───────────────┬───────────────────────┘
                │ district-specific analysis
                ▼
┌───────────────────────────────────────┐
│  🎯 District Moderator Agent          │
│     (synthesizes final JSON report)   │
└───────────────┬───────────────────────┘
                │
                ▼
📋 District Prediction Report (繁體中文)
   ├── 整體趨勢: 1年 / 5年 / 10年 price direction & %
   ├── 屋苑預測: ≥5 major estates with individual forecasts
   ├── 新聞分析: ≥4 real news events with sources (from RAG)
   ├── 風險與機遇: risk & opportunity analysis
   └── 投資建議: 買入 / 持有 / 觀望 recommendation
```

### Estate Analysis Flow (4 LLM calls)

```
User searches for an estate
        │
        ├─ Known estate → select from 180 autocomplete results
        │
        └─ Any building → type name → District Picker → choose district or skip
                │
                ▼
┌───────────────────────────────────────┐
│  3 Thematic Agents (sequential)       │
│                                       │
│  📊 Economic Environment Analyst      │
│  💰 Transaction Analysis Agent        │
│  🚇 Infrastructure Development Agent  │
└───────────────┬───────────────────────┘
                │
                ▼
┌───────────────────────────────────────┐
│  🏠 Estate Analyst Agent              │
│     (deep single-estate synthesis)    │
└───────────────┬───────────────────────┘
                │
                ▼
📋 Estate Prediction Report (繁體中文)
   ├── 價格預測: 1年 / 5年 / 10年 (HK$/sqft)
   ├── 強弱分析: strengths & weaknesses
   ├── 可比屋苑: comparable estates
   ├── 新聞影響: ≥3 news events with sources (from RAG)
   ├── 風險與機遇: risk & opportunity analysis
   └── 投資建議: recommendation with detailed reasoning
```

### Full 18-District Simulation Flow

```
POST /api/simulation/start
        │
        ▼
  For each round (configurable):
    ├── Phase 1: All 6 thematic agents run sequentially
    ├── Phase 2: 18 district agents run with thematic context
    └── Phase 3: Global moderator synthesizes all outputs
                    │
                    ▼
              📋 Market-wide report with
                 districtPredictions array
```

---

## 🤖 Agent System (10 Agent Types)

Each agent is a specialized LLM prompt persona. They run sequentially (to avoid overwhelming API rate limits) and share context — each agent can see what previous agents said.

| # | Agent | Chinese Role | What It Analyzes |
|---|-------|-------------|------------------|
| 1 | 🏛️ Government Policy | 政府政策分析員 | HK housing policy, stamp duty (BSD/SSD/NRSD), land supply, URA redevelopment, Policy Address effects |
| 2 | 📊 Economic Environment | 經濟環境分析員 | HIBOR, prime rate, Fed funds rate, USD/HKD peg implications, GDP, unemployment, inflation, capital flow |
| 3 | 😊 Public Sentiment | 市場情緒分析員 | Media mood, buyer/seller psychology, FOMO signals, primary launch queue lengths, migration sentiment |
| 4 | 💰 Transaction Analysis | 成交數據分析員 | Transaction volume, price per sqft trends, CCL/CRI indices, primary vs secondary market, distress indicators |
| 5 | 🚇 Infrastructure | 基建發展分析員 | MTR expansion, Northern Metropolis, Lantau Tomorrow, Kai Tak, highways, hospitals, schools, commercial zones |
| 6 | 🇨🇳 China Policy | 中國政策分析員 | Greater Bay Area integration, mainland capital/talent schemes, Shenzhen cooperation zones, cross-border effects |
| 7 | 🏘️ District Specialist | 地區專家 | Hyper-local interpretation of macro themes for a specific district — uses district profile (key areas, price range, character, major estates) |
| 8 | 🎯 District Moderator | 地區綜合分析師 | Synthesizes all 7 prior agent outputs into a single structured JSON district report with constrained format |
| 9 | 🏠 Estate Analyst | 屋苑專項分析員 | Deep single-estate forecast — leverages full district profile when available, identifies property from search term when district is unknown |
| 10 | 📊 Global Moderator | 全局綜合分析師 | Full 18-district market-level synthesis with portfolio-style summary (used in full simulation mode only) |

### Agent Technical Details

- **LLM Client**: OpenAI SDK with configurable base URL
- **Temperature**: 0.4 for thematic agents, 0.2 for moderators (more deterministic)
- **Max Tokens**: 2,000 for agents, 8,000 for moderators
- **Retries**: 2 attempts with delay on failure
- **Timeout**: 90s normal, 180s for reasoning models (DeepSeek-R1 etc.)
- **JSON Repair**: Automatic `repairJSON()` fallback for malformed LLM output
- **Reasoning Model Detection**: Automatically skips temperature parameter for reasoning models (e.g. `deepseek-r1`, `deepseek-reasoner`, `o1-*`)
- **Memory Continuity**: Agents can reference past simulation outputs when available

---

## 📦 RAG — Retrieval-Augmented Generation

### The Problem

Without RAG, AI agents generate predictions entirely from training data (months out of date). They may **hallucinate** fake news headlines or cite events that never happened.

### The Solution

RAG retrieves **real, recent news articles** from a local index and injects them into every agent's prompt. The AI still does the reasoning, but now with fresh evidence.

```
Without RAG:                          With RAG:

Question → AI → Answer               Question
           ↑                               │
     (old training data,                   ▼
      may hallucinate)              📂 Search vector store
                                     for relevant articles
                                           │
                                           ▼
                                   Question + Real News → AI → Answer
                                                          ↑
                                                    (grounded in
                                                     real evidence)
```

### How RAG Works in This Project

| Step | What Happens | Detail |
|------|-------------|--------|
| **1. Collect** | Scrape news every 30 min | RSS feeds: RTHK (local HK news) + news.gov.hk (government PR). Optional: NewsAPI (if `NEWS_API_KEY` set) |
| **2. Vectorize** | Convert each article to a 1536-dim vector | Uses OpenAI `text-embedding-3-small` if available; falls back to deterministic keyword-hash pseudo-embedding if provider lacks embedding support |
| **3. Store** | Save to local vector DB | [vectra](https://github.com/Stevenic/vectra) — JSON files on disk at `data/rag-index/`. No external database needed. Deduplication by article URL |
| **4. Retrieve** | Query top-5 relevant articles | On each analysis, the engine builds a query (e.g. `"Central & Western 中西區 property real estate"`) and finds the 5 most similar articles (cosine similarity > 0.3) |
| **5. Inject** | Append to agent prompts | Retrieved articles formatted as a block appended to every agent's system prompt |

Example injected context:
```
--- Retrieved News Context (RAG) ---
- [RTHK] HK home prices drop for 3rd month (2026-03-15): Average prices fell 2.1%...
- [news.gov.hk] Government announces new housing policy (2026-03-14): Chief Executive...
- [RTHK] MTR opens new Tung Chung Line extension (2026-03-12): The new station...
```

### RAG vs GraphRAG

This project uses **plain RAG** (vector similarity search over a flat article index), not GraphRAG.

| | Plain RAG (this project) | GraphRAG |
|---|---|---|
| **Storage** | Flat list of articles in a vector store | Knowledge graph with entities & relationships |
| **Search** | Find articles with similar words/meaning | Walk graph edges to discover indirect connections |
| **Example** | "嘉湖山莊" → finds articles mentioning "嘉湖山莊" | "嘉湖山莊" → walks: 嘉湖山莊 → Yuen Long → Northern Metropolis → GBA Policy → Capital Flows |
| **Indirect links?** | ❌ Only directly relevant articles | ✅ Discovers multi-hop connections |
| **Infrastructure** | JSON folder on disk | Graph DB (Neo4j) + entity extraction pipeline |
| **Cost** | Low (no extra LLM calls for indexing) | High (many LLM calls to extract entities & build graph) |

Plain RAG was chosen for the core benefit (real news grounding) with minimal infrastructure. A future GraphRAG upgrade would enable discovery of indirect relationships like "a stamp duty policy affects 嘉湖山莊 through its impact on Yuen Long transaction volumes."

---

## 🗺️ All 18 Districts & 180 Estates

### Hong Kong Island 港島

| Code | District | 中文 | Key Areas | Major Estates (10 each) |
|------|----------|------|-----------|------------------------|
| CW | Central & Western | 中西區 | Central, Sheung Wan, Sai Ying Pun, Mid-Levels, The Peak | The Belcher's 寶翠園, Island Crest 縉城峰, University Heights 翰林軒, Greenview Garden 嘉景花園, Scenic Heights 碧荔花園, Robinson Place 雍景臺, Imperial Court 帝豪閣, Conduit Tower 干德道38號, Townplace Kennedy Town 本舍, The Summa 瑧蓺 |
| WC | Wan Chai | 灣仔 | Wan Chai, Causeway Bay, Happy Valley, Tai Hang | The Leighton Hill 禮頓山, Bamboo Grove 竹林苑, Star Crest 星域軒, The Avenue 囍匯, J Residence 嘉薈軒, Tai Hang Terrace 大坑台, Park Haven 曦巒, yoo Residence 瑧璈, Ventris Place 雲地利道, Broadwood Twelve 樂天峰 |
| EA | Eastern | 東區 | North Point, Quarry Bay, Taikoo, Shau Kei Wan, Chai Wan | Taikoo Shing 太古城, Kornhill 康怡花園, City Garden 城市花園, Healthy Village 健威花園, Grand Promenade 嘉亨灣, Lei King Wan 鯉景灣, Heng Fa Chuen 杏花邨, Provident Centre 和富中心, Harbour Heights 海峰園, Mount Parker Residences 柏蔚山 |
| SO | Southern | 南區 | Aberdeen, Ap Lei Chau, Repulse Bay, Stanley, Pok Fu Lam | South Horizons 海怡半島, Larvotto 南灣, Marinella 深灣9號, The Southside 黃竹坑站上蓋, Chi Fu Fa Yuen 置富花園, Bel-Air 貝沙灣, Residence Bel-Air 貝沙灣, Aberdeen Centre 香港仔中心, South Wave Court 南濤閣, The Repulse Bay 影灣園 |

### Kowloon 九龍

| Code | District | 中文 | Key Areas | Major Estates (10 each) |
|------|----------|------|-----------|------------------------|
| YTM | Yau Tsim Mong | 油尖旺 | Tsim Sha Tsui, Jordan, Yau Ma Tei, Mong Kok, Olympic | The Waterfront 漾日居, The Harbourside 君臨天下, Sorrento 擎天半島, The Arch 凱旋門, One West Kowloon 匯璽, Island Harbourview 港景峯, MASTERPIECE 名鑄, The Austin 柯士甸, Prosperous Garden 富榮花園, Metro Harbour View 都會海逸 |
| SSP | Sham Shui Po | 深水埗 | Sham Shui Po, Cheung Sha Wan, Lai Chi Kok, Mei Foo | Mei Foo Sun Chuen 美孚新邨, Banyan Garden 泓景臺, Liberté 昇悅居, Vista 畢架山峰, Un Chau Estate 元州邨, Nam Cheong Stn Dev., The Pacifica 一號銀海, Aqua Marine 海柏匯, Carnival Mansion 嘉年華大廈, Trinity Towers 丰匯 |
| KC | Kowloon City | 九龍城 | Kowloon City, Kowloon Tong, Ho Man Tin, To Kwa Wan, Kai Tak | Parc City 啟德1號, OASIS KAI TAK 啟德名門, Monaco 嘉峰臺, Mantin Heights 皓畋, Ultima 天鑄, Festival City 宋皇臺站上蓋, Beacon Heights 畢架山花園, Wyler Gardens 偉恆昌新邨, Grand Waterfront 翔龍灣, Victoria Skye 天寰 |
| WTS | Wong Tai Sin | 黃大仙 | Wong Tai Sin, Diamond Hill, Tsz Wan Shan, San Po Kong | Galaxia 星河明居, Mikiki, Plaza Hollywood, Sceneway Garden 景蔚花園, Tsz Ching Estate 慈正邨, Choi Hung Estate 彩虹邨, Fung Tak Estate 鳳德邨, San Po Kong Plaza 新蒲崗廣場, Tropicana Garden 祥華園, Lung Poon Court 龍蟠苑 |
| KT | Kwun Tong | 觀塘 | Kwun Tong, Lam Tin, Yau Tong, Kowloon Bay, Ngau Tau Kok | Laguna City 麗港城, Sceneway Garden 景蔚花園, Amoy Gardens 淘大花園, Telford Gardens 德福花園, Yau Tong Centre 油塘中心, OCEAN ONE 嘉匯, Peninsula East 東岸, Kwun Tong View 觀塘花園大廈, Domain 凱匯, Canaryside 嘉匯2期 |

### New Territories 新界

| Code | District | 中文 | Key Areas | Major Estates (10 each) |
|------|----------|------|-----------|------------------------|
| KI | Kwai Tsing | 葵青 | Kwai Fong, Kwai Chung, Tsing Yi | Mayfair Gardens 美景花園, Greenfield Garden 翠怡花園, Cheung Fat Estate 長發邨, Tierra Verde 海欣花園, Tsing Yi Garden 青衣花園, Rambler Crest 青逸軒, New Kwai Fong Gdns 新葵芳花園, Kwai Chung Estate 葵涌邨, Lai King Estate 荔景邨, Wonderland Villas 華景山莊 |
| TW | Tsuen Wan | 荃灣 | Tsuen Wan, Discovery Park, Belvedere Garden | Belvedere Garden 麗城花園, Discovery Park 愉景新城, Tsuen King Garden 荃景花園, Clague Garden 祈德尊新邨, Allway Garden 荃威花園, Riviera Garden 荃灣花園, The Pavilia Bay 柏傲灣, Ocean Pride 海之戀, Bayview Garden 灣景花園, Vision City 環宇海灣 |
| TM | Tuen Mun | 屯門 | Tuen Mun, Gold Coast, So Kwun Wat, Hung Shui Kiu | Siu Hong Court 兆康苑, Tuen Mun Town Plaza 屯門市廣場, Gold Coast 黃金海岸, Aegean Coast 愛琴海岸, Sam Shing Estate 三聖邨, Melody Garden 美樂花園, Leung King Estate 良景邨, On Ting Estate 安定邨, Lung Mun Oasis 龍門居, Chelsea Court 荃葵青邨 |
| YL | Yuen Long | 元朗 | Yuen Long, Tin Shui Wai, Hung Shui Kiu, Fairview Park | YOHO Town, YOHO Midtown, Grand YOHO, Park YOHO, Fairview Park 錦綉花園, Kingswood Villas 嘉湖山莊, Tin Yuet Estate 天悅邨, Ying Tung Estate 盈豐園, The Reach 尚悅, Residence 88 映御 |
| NO | North | 北區 | Sheung Shui, Fanling, Kwu Tung, Ping Che | Royal Green 御景園, Fanling Centre 粉嶺中心, Regentville 嘉盛苑, Vienna Garden 維也納花園, Sheung Shui Town Centre 上水廣場, Landmark North 上水匯, Avon Park 碧湖花園, Wing Fai Centre 榮輝中心, Flora Plaza 花都廣場, Dawning Views 曉翠花園 |
| TP | Tai Po | 大埔 | Tai Po, Tai Po Market, Science Park, CUHK area | Deerhill Bay 鹿茵山莊, Tai Po Centre 大埔中心, Uptown Plaza 大埔超級城, On Tai Estate 安泰邨, Tai Po Garden 大埔花園, Parc Versailles 帝欣花園, Lake Silver 湖翠, Bright Star Mansion 明星樓, Scenic Panorama 嵐山, The Palazzo 鷹君集團 |
| ST | Sha Tin | 沙田 | Sha Tin, Ma On Shan, Fo Tan, City One, Sha Tin Wai | City One 沙田第一城, Lek Yuen Estate 瀝源邨, Jubilee Garden 銀禧花園, Festival City 名城, Sunshine City 新港城, Bayshore Towers 帝琴灣, Lake Silver 湖翠, Double Cove 迎海, Fo Tan Stn Dev., Sha Tin Heights 沙田嶺 |
| SK | Sai Kung | 西貢 | Tseung Kwan O, Sai Kung Town, Clear Water Bay, LOHAS Park | LOHAS Park 日出康城, Park Central 將軍澳中心, Oscar by the Sea 嘉悅, The Wings 天晉, TKO Plaza 將軍澳廣場, Metro Town 都會駅, Savannah 將軍澳中心, Century Link 世紀連城, Hemera 明翹匯, PopCorn |
| IS | Islands | 離島 | Tung Chung, Discovery Bay, Mui Wo, Cheung Chau, Peng Chau | Caribbean Coast 映灣園, Tung Chung Crescent 東堤灣畔, Coastal Skyline 海堤灣畔, Seaview Crescent 海景灣, The Visionary 昇薈, Discovery Bay 愉景灣, Auberge Discovery Bay 愉景灣酒店, ONETERRACES 映灣園, Mui Wo, Century Link |

> 💡 You can also type **any building name** in the search bar — not limited to the 180 pre-configured estates above.

---

## 💾 Data Persistence & Caching

### Two-Tier Cache Strategy

```
Request → Check in-memory cache (fast)
              │
              ├── HIT + within TTL → return immediately
              │
              └── MISS → Check persistent DB (disk)
                            │
                            ├── HIT + within TTL → rehydrate memory cache + return
                            │
                            └── MISS → run fresh analysis → save to both caches
```

| Layer | Implementation | Scope |
|-------|---------------|-------|
| **In-Memory** | JavaScript `Map` objects (`districtCache`, `estateCache`) | Per-process, lost on restart |
| **Persistent DB** | JSON file on disk (`data/hk18prophet.json`) via custom persistence layer | Survives restarts, capped at 500 reports |

**Cache TTL** is configurable via `CACHE_TTL_HOURS` (default: 1 hour for dev, recommended 24 hours for production).

### Memory Cleanup

- Completed/failed simulations older than **2 hours** are removed from active memory
- Cleanup check runs every **10 minutes**
- Persistent DB is never cleaned — only old entries are overwritten (max 500 reports)

---

## 🛡️ Production Security

| Feature | Detail |
|---------|--------|
| **Helmet** | Security headers: HSTS, X-Frame-Options, X-Content-Type-Options, X-XSS-Protection, Referrer-Policy, etc. |
| **CORS** | Configurable origin restriction via `ALLOWED_ORIGINS` env var. Permissive in dev, locked down in production |
| **Rate Limiting** | Per-IP, per-endpoint: estate analysis (default 10/hour), district analysis (default 30/hour). Uses `express-rate-limit` with standard `RateLimit-*` headers |
| **Trust Proxy** | Enabled in production for correct IP detection behind nginx/Cloudflare |
| **Cache Bypass Protection** | `force=true` query param (bypasses cache) is **blocked in production** — prevents users from burning API credits |
| **API Key Validation** | Server refuses to start if `LLM_API_KEY` is not set |
| **Graceful Shutdown** | Handles `SIGTERM`/`SIGINT` — closes HTTP server cleanly, hard-exits after 10s timeout |

---

## 🖥️ Frontend Features

### Interactive Map
- Full-page SVG map with accurate 18-district polygon boundaries
- Visual state per district:
  - ⬜ Not yet analyzed
  - 🔵 Running (loading pulse animation)
  - 🟢 Analyzed: price up (green)
  - 🔴 Analyzed: price down (red)
  - 🟡 Analyzed: stable (yellow)
- Hover tooltip shows district name (EN/CN) + status
- Click opens analysis modal with live progress tracking

### Estate Search Bar
- Debounced search (250ms) against `/api/estates/search`
- Autocomplete dropdown with district info
- Free-text option: type any building name and press Enter
- District picker modal for custom queries:
  - Grid of 18 districts organized by region
  - "Skip — Let AI determine" option

### Background Task Tracking
- **Floating indicator panel** (top-right corner) — shows all running/completed estate analyses
- **Independent polling** — estate analyses continue even when modal is closed
- **Toast notifications** — popup when each background analysis completes, click to open report

### State Recovery
- On page load, fetches `/api/districts/status` and restores all running/cached district states

---

## 📄 API Reference

### Analysis Endpoints (Rate Limited)

| Method | Path | Rate Limit | Description |
|--------|------|------------|-------------|
| `POST` | `/api/district/:code/analyze` | 30/hour/IP | Start single-district analysis. Returns cached result if within TTL, or starts new analysis. Query `?force=true` bypasses cache (dev only) |
| `POST` | `/api/estate/analyze` | 10/hour/IP | Estate analysis. Body: `{estateName, districtCode}` for known estates, or `{query, districtCode?}` for free-text. Returns cached or starts new |
| `POST` | `/api/simulation/start` | — | Start full 18-district simulation. Body: `{seedData?, predictionQuery?, rounds?}` |

### Query Endpoints (No Rate Limit)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/districts` | List all 18 districts with metadata (code, name, nameCn, region, keyAreas, priceRange) |
| `GET` | `/api/districts/status` | Running/cached statuses for all districts |
| `GET` | `/api/districts/:code/history` | Historical predictions for a specific district |
| `GET` | `/api/estates/search?q=太古城` | Search configured estates by English name, Chinese name, or area |
| `GET` | `/api/simulation/:id/status` | Poll simulation progress (phase, agents completed, round) |
| `GET` | `/api/simulation/:id/report` | Get final prediction report |
| `GET` | `/api/simulation/:id/transcript` | Full agent debate transcript |
| `GET` | `/api/simulation/:id/predictions` | District predictions array for a simulation |
| `GET` | `/api/simulations` | List past simulations |
| `GET` | `/api/agents` | Agent manifest (types and counts) |
| `GET` | `/api/rag/stats` | RAG index stats: `{ indexed: N }` |
| `GET` | `/health` | Server health check |

### Rate Limit Response Headers

All rate-limited endpoints include standard headers:
```
RateLimit-Limit: 10
RateLimit-Remaining: 7
RateLimit-Reset: 1710612345
```

When exceeded, returns HTTP 429:
```json
{ "error": "Rate limit exceeded. Max 10 estate analyses per hour." }
```

---

## 🚀 Quick Start

### Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| Node.js | ≥ 18 | Runtime |
| npm | ≥ 9 | Package manager |
| LLM API Key | — | Any OpenAI SDK-compatible provider |

### 1. Clone & Configure

```bash
git clone https://github.com/moterial/hk18-prophet.git
cd hk18-prophet
cp .env.example .env
```

Edit `.env` with your LLM API details:

```env
LLM_API_KEY=your_api_key_here
LLM_BASE_URL=https://api.x.ai/v1
LLM_MODEL_NAME=grok-4-1-fast-reasoning
```

### 2. Install

```bash
npm run setup    # installs root + frontend dependencies
```

### 3. Run (Development)

```bash
npm run dev      # starts both backend (5001) + frontend (3000)
```

Open http://localhost:3000 and click any district.

### 4. Run (Production)

```bash
# Build frontend
cd frontend && npm run build && cd ..

# Set production env
NODE_ENV=production
CACHE_TTL_HOURS=24
ALLOWED_ORIGINS=https://yourdomain.com

# Start server (serves API + built frontend)
npm start
```

### npm Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `npm run dev` | `concurrently backend + frontend` | Start both servers for development |
| `npm run backend` | `node --watch backend/server.js` | Backend only with auto-restart |
| `npm run frontend` | `cd frontend && npm run dev` | Frontend Vite dev server only |
| `npm run setup` | `npm install && cd frontend && npm install` | Install all dependencies |
| `npm start` | `node backend/server.js` | Production server (serves static frontend from `frontend/dist/`) |

---

## 🔧 Configuration

### All Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `LLM_API_KEY` | *(required)* | API key for your LLM provider |
| `LLM_BASE_URL` | `https://api.openai.com/v1` | OpenAI SDK-compatible base URL |
| `LLM_MODEL_NAME` | `gpt-4o-mini` | Model name to use |
| `PORT` | `5001` | Backend server port |
| `NODE_ENV` | `development` | `development` or `production` |
| `SIMULATION_ROUNDS` | `3` | Number of debate rounds in full simulation |
| `MAX_CONCURRENT_AGENTS` | `10` | Max parallel agents (not currently used; agents run sequentially) |
| `CACHE_TTL_HOURS` | `1` | How long cached results remain valid (hours). Use `24` for production |
| `RATE_LIMIT_CUSTOM_PER_HOUR` | `10` | Max estate analyses per IP per hour |
| `RATE_LIMIT_DISTRICT_PER_HOUR` | `30` | Max district analyses per IP per hour |
| `ALLOWED_ORIGINS` | *(none — permissive)* | Comma-separated allowed CORS origins for production |
| `NEWS_API_KEY` | *(optional)* | [NewsAPI](https://newsapi.org/) key for additional news source |
| `DB_PATH` | `./data/hk18prophet.db` | Database file path |
| `DELAY_BETWEEN_AGENTS` | `1000` | Milliseconds delay between sequential agent calls |

### Compatible LLM Providers

| Provider | Base URL | Recommended Model |
|----------|----------|-------------------|
| **xAI Grok** | `https://api.x.ai/v1` | `grok-4-1-fast-reasoning` |
| **OpenAI** | `https://api.openai.com/v1` | `gpt-4o-mini` |
| **DeepSeek** | `https://api.deepseek.com/v1` | `deepseek-v3` |
| **Google Gemini** | `https://generativelanguage.googleapis.com/v1beta/openai/` | `gemini-2.0-flash` |
| **Groq** (free) | `https://api.groq.com/openai/v1` | `llama-3.3-70b-versatile` |
| **OpenRouter** | `https://openrouter.ai/api/v1` | `meta-llama/llama-3.3-70b-instruct` |
| **Ollama** (local) | `http://localhost:11434/v1` | `llama3.2` |

---

## 🏗️ Project Structure

```
hk18-prophet/
├── backend/
│   ├── server.js                    # Express server: helmet, CORS, trust proxy, static serving, graceful shutdown
│   ├── config.js                    # Central config: LLM settings, 18 districts with 180 estates, cache, rate limits
│   ├── agents/
│   │   ├── base-agent.js            # Base class: OpenAI client, retries, timeout, JSON repair, memory
│   │   ├── government-policy-agent.js   # HK housing policy analysis
│   │   ├── economic-agent.js            # Interest rates, GDP, peg analysis
│   │   ├── sentiment-agent.js           # Public mood & media analysis
│   │   ├── transaction-agent.js         # Volume, price trends, CCL index
│   │   ├── infrastructure-agent.js      # MTR, Northern Metropolis, development
│   │   ├── china-policy-agent.js        # GBA, mainland capital/talent flows
│   │   ├── district-agent.js            # Hyper-local district specialist
│   │   ├── district-moderator-agent.js  # Single-district report synthesizer
│   │   ├── estate-agent.js              # Single-estate deep analyst
│   │   ├── moderator-agent.js           # Full 18-district global synthesizer
│   │   └── index.js                     # Agent registry & team factory functions
│   ├── simulation/
│   │   ├── engine.js                # Core engine: 3 simulation modes, caching, DB persistence, cleanup
│   │   └── memory-store.js          # In-memory store for cross-simulation memory
│   ├── data-sources/
│   │   ├── rag-store.js             # RAG: vectra vector index, RSS scraping, embedding, retrieval
│   │   ├── news-fetcher.js          # NewsAPI client + HK property context builder
│   │   └── scraper-base.js          # HTTP fetcher with redirect following (301/302/307/308)
│   ├── db/
│   │   ├── database.js              # JSON file persistence: simulations, predictions, reports (max 500)
│   │   └── schema.sql               # SQL schema reference (not used at runtime — persistence is JSON)
│   └── routes/
│       └── api.js                   # REST API: rate limiters, all endpoints, cache bypass protection
├── frontend/
│   ├── src/
│   │   ├── App.vue                  # Root component with router-view
│   │   ├── main.js                  # Vue 3 app bootstrap with Vue Router
│   │   ├── views/
│   │   │   └── Dashboard.vue        # Full-page map, modals, search, background tasks, toasts
│   │   └── components/
│   │       └── HKMap.vue            # SVG map with 18 district polygons + visual states
│   ├── index.html
│   ├── package.json                 # Vue 3, Vue Router, Vite, @vitejs/plugin-vue
│   └── vite.config.js              # Dev server on port 3000, API proxy to backend:5001
├── data/
│   ├── hk18prophet.json             # Persistent database (auto-created)
│   └── rag-index/                   # Vector store (auto-created by vectra)
├── .env.example                     # Template with all environment variables
├── package.json                     # Root: express, openai, vectra, helmet, express-rate-limit, uuid, dotenv
├── MEMORY.md                        # Development notes
├── LICENSE                          # All Rights Reserved — Michael Yeung
└── README.md
```

---

## ✅ Feature Checklist

- [x] Multi-agent swarm simulation engine (3 modes: full, district, estate)
- [x] 10 specialized agent types with distinct expertise
- [x] Agent memory continuity across simulations
- [x] Automatic JSON repair for malformed LLM output
- [x] Reasoning model detection (auto-skip temperature for o1/deepseek-r1)
- [x] Interactive HK 18-district SVG map with visual states
- [x] On-demand per-district analysis (click to analyze)
- [x] Background processing with live progress bar and agent counter
- [x] Smart two-tier caching (in-memory + persistent DB fallback)
- [x] Configurable cache TTL
- [x] Traditional Chinese (繁體中文) reports with HKD pricing
- [x] Estate-level predictions (5+ major estates per district report)
- [x] Individual estate search from 180 pre-configured estates
- [x] Free-text building search (any building name in Hong Kong)
- [x] District picker for custom searches
- [x] RAG: vector store news retrieval from RTHK + news.gov.hk RSS
- [x] Auto-refreshing news scraper (every 30 minutes)
- [x] Background estate analysis with floating progress panel & toast notifications
- [x] Per-endpoint rate limiting (configurable per hour)
- [x] Helmet security headers
- [x] CORS origin restriction for production
- [x] Cache bypass blocked in production
- [x] Graceful shutdown (SIGTERM/SIGINT)
- [x] Persistent report storage (survives restarts, capped at 500)
- [x] State recovery on frontend load
- [x] LLM provider agnostic (any OpenAI SDK-compatible API)
- [ ] GraphRAG upgrade (knowledge graph with entity extraction)
- [ ] Live data scraping (Land Registry, RVD, Centaline)
- [ ] Historical prediction accuracy tracking
- [ ] PDF report export
- [x] Mobile-responsive design

---

## 🚀 Things to Improve

### Performance Optimization

- [ ] **Parallelize thematic agents** — The 6 thematic agents are independent of each other. Running them concurrently with `Promise.all()` would turn 6 sequential LLM calls into 1 parallel batch, reducing district analysis time from ~8 calls to ~3 rounds.
- [ ] **Remove inter-agent delays in parallel batches** — `DELAY_BETWEEN_AGENTS` (1s) adds 7 seconds of pure idle time. Within a parallel batch, delays are unnecessary. Only keep delays between phases if proxy rate-limiting is a concern.
- [ ] **Reduce thematic agent token budgets** — Thematic agents use `maxTokens: 2000` but often generate far less. Reducing to 1000 tokens would decrease generation time and shorten the context passed to downstream agents.
- [ ] **Cache thematic results across districts** — Thematic analysis (economy, policy, interest rates) is NOT district-specific. Caching thematic results for 1 hour means only the district agent + moderator need to run for each new district — 2 LLM calls instead of 8.

### RAG Pipeline Improvements

- [ ] **Add structured data sources** — Scrape actual transaction data from Land Registry, Rating and Valuation Department (RVD), and Centaline property index. Numerical data (prices, volumes, trends) would be far more useful than news headlines alone.
- [ ] **Use real embedding models** — Replace the `simpleHash` fallback with a dedicated embedding service (e.g., Cohere, Jina, or OpenAI `text-embedding-3-small`). This enables true semantic search — finding articles about "real estate values decline" when searching for "property prices drop."
- [ ] **Chunk and index full articles** — Currently only article title + 300 chars of description are indexed. Fetching and chunking full article bodies into ~500 token segments would provide much deeper context for agent prompts.
- [ ] **Add temporal weighting** — Recent news should rank higher than older articles. Multiply cosine similarity score by a recency decay factor (e.g., `score * (0.5 + 0.5 * recencyFactor)`) so yesterday's policy announcement beats last month's general article.
- [ ] **Upgrade to GraphRAG** — Build a knowledge graph with entity extraction (district → estate → policy → event relationships). Query by graph traversal instead of just vector similarity. This captures *relationships* between facts, not just individual facts.
- [ ] **Fix `ingestArticles()` O(n×m) performance** — Currently `idx.listItems()` is called inside the ingestion loop for every article, creating O(n×m) complexity. Hoist the duplicate check outside the loop by building a `Set<url>` once, then doing O(1) `.has()` lookups.

### Agent Architecture Improvements

- [ ] **Global LLM concurrency auto-tuning** — Dynamically adjust `LLM_MAX_CONCURRENT` based on observed response times and error rates rather than relying on a static config value.
- [ ] **Agent result quality scoring** — Track and compare prediction accuracy over time to weight reliable agents higher in the moderator's synthesis.
- [ ] **Streaming agent responses** — Use SSE (Server-Sent Events) to stream partial results to the frontend instead of polling, reducing perceived latency.

---

## 📜 License

Copyright (c) 2026 Michael Yeung. All rights reserved.

You must obtain written permission from the author before using, copying, or distributing this software. See [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- Architecture inspired by [MiroFish](https://github.com/666ghj/MiroFish) multi-agent simulation engine
- Hong Kong district data from the [Census and Statistics Department](https://www.censtatd.gov.hk/)
- Vector storage powered by [vectra](https://github.com/Stevenic/vectra)
