// backend/data-sources/news-fetcher.js — NewsAPI integration + HK standing context builder
import { ScraperBase } from './scraper-base.js';
import { config } from '../config.js';

export class NewsFetcher extends ScraperBase {
  constructor() {
    super('NewsFetcher');
  }

  async fetchNews(query = 'Hong Kong property real estate', pageSize = 10) {
    if (!config.newsApi.key) {
      console.log('ℹ️ No NEWS_API_KEY set — using standing context only');
      return [];
    }

    const params = new URLSearchParams({
      q: query,
      language: 'en',
      sortBy: 'publishedAt',
      pageSize: String(pageSize),
      apiKey: config.newsApi.key,
    });

    try {
      const url = `${config.newsApi.baseUrl}/everything?${params}`;
      const raw = await this.fetch(url);
      const data = JSON.parse(raw);

      if (data.status !== 'ok') {
        console.warn('⚠️ NewsAPI returned non-ok status:', data.message);
        return [];
      }

      return (data.articles || []).map(a => ({
        title: a.title,
        description: a.description,
        source: a.source?.name || 'Unknown',
        publishedAt: a.publishedAt,
        url: a.url,
      }));
    } catch (err) {
      console.warn('⚠️ News fetch failed:', err.message);
      return [];
    }
  }

  buildContext(articles = []) {
    const standingContext = this.getStandingContext();

    if (articles.length === 0) {
      return standingContext;
    }

    const newsSection = articles
      .map(a => `- [${a.source}] ${a.title} (${a.publishedAt?.slice(0, 10) || 'unknown date'})${a.description ? ': ' + a.description : ''}`)
      .join('\n');

    return `${standingContext}\n\n--- Latest News ---\n${newsSection}`;
  }

  getStandingContext() {
    return `--- Hong Kong Real Estate Standing Context (2025-2026) ---

Key Background Facts:
1. Interest Rate Environment: The US Federal Reserve has been cutting rates since late 2024. HIBOR has fallen, reducing mortgage costs. The HK-US peg means HK rates follow US rates.

2. Stamp Duty: The HK government fully relaxed all demand-side stamp duty measures (BSD, DSD, SSD) in the 2024 Policy Address, removing barriers for all buyers including non-permanent residents and second-home buyers.

3. Northern Metropolis: The government is actively developing the Northern Metropolis across North, Yuen Long, and adjacent areas — a massive new development zone with innovation/tech focus and Shenzhen integration.

4. Kai Tak Development: The former airport site continues to see major residential and commercial development, with new MTR station, cruise terminal, and sports park.

5. Population: Hong Kong experienced net emigration 2020-2022 but has been recovering through Talent Admission schemes. Mainland professionals and families are a growing buyer segment.

6. Mainland China: China's property sector remains under stress (Evergrande, Country Garden restructurings). Some mainland capital continues to seek safe haven in HK property. The GBA integration policies are deepening.

7. Supply Pipeline: Government land sale programme and railway property developments are feeding new supply, particularly in NT areas.

8. Market Sentiment: After significant price corrections in 2022-2023, the market has shown signs of stabilization. Transaction volumes have recovered somewhat following stamp duty removal.

District Price Indices (approximate HKD per sq ft, saleable area):
- Premium HK Island (CW, WC): $15,000-35,000
- Standard HK Island (EA, SO): $8,000-22,000
- Core Kowloon (YTM, KC): $10,000-25,000
- Outer Kowloon (SSP, WTS, KT): $8,000-16,000
- Mature NT (TW, ST, SK): $7,000-18,000
- Developing NT (TM, YL, NO, TP, KI): $5,000-14,000
- Islands: $5,000-14,000`;
  }
}

export default NewsFetcher;
