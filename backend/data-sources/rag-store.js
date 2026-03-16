// backend/data-sources/rag-store.js — Lightweight vector RAG store for HK property news
// Uses vectra (local JSON-based vector DB) + OpenAI-compatible embeddings
import { LocalIndex } from 'vectra';
import path from 'node:path';
import fs from 'node:fs';
import OpenAI from 'openai';
import { config } from '../config.js';
import { ScraperBase } from './scraper-base.js';

const INDEX_DIR = path.resolve('data', 'rag-index');
const scraper = new ScraperBase('RAGScraper');

// ── OpenAI-compatible embeddings (falls back to keyword matching) ──

let embeddingClient = null;
let useEmbeddings = false;

function getEmbeddingClient() {
  if (embeddingClient) return embeddingClient;
  embeddingClient = new OpenAI({
    apiKey: config.llm.apiKey,
    baseURL: config.llm.baseUrl,
    timeout: 30000,
  });
  return embeddingClient;
}

/**
 * Get embedding vector for text. Falls back to simple hash-based vector if
 * the provider doesn't support embeddings.
 */
async function getEmbedding(text) {
  if (!useEmbeddings) {
    return simpleHash(text);
  }
  try {
    const client = getEmbeddingClient();
    const res = await client.embeddings.create({
      model: 'text-embedding-3-small',
      input: text.slice(0, 8000),
    });
    return res.data[0].embedding;
  } catch {
    // Provider doesn't support embeddings — fall back permanently
    useEmbeddings = false;
    return simpleHash(text);
  }
}

/**
 * Simple deterministic hash-based pseudo-embedding (1536 dims).
 * Not semantic, but allows vectra to function as keyword store.
 */
function simpleHash(text) {
  const dims = 1536;
  const vec = new Array(dims).fill(0);
  const words = text.toLowerCase().split(/\s+/);
  for (const word of words) {
    let h = 0;
    for (let i = 0; i < word.length; i++) {
      h = ((h << 5) - h + word.charCodeAt(i)) | 0;
    }
    vec[Math.abs(h) % dims] += 1;
  }
  // Normalize
  const mag = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map(v => v / mag);
}

// ── Index management ──

let index = null;

async function getIndex() {
  if (index) return index;
  index = new LocalIndex(INDEX_DIR);
  if (!await index.isIndexCreated()) {
    await index.createIndex();
    console.log('📦 RAG vector index created at', INDEX_DIR);
  }
  return index;
}

// ── Free RSS / web news sources ──

const NEWS_SOURCES = [
  {
    name: 'RTHK',
    url: 'https://rthk.hk/rthk/news/rss/e_expressnews_elocal.xml',
    type: 'rss',
  },
  {
    name: 'news.gov.hk',
    url: 'https://www.news.gov.hk/en/common/html/topstories.rss.xml',
    type: 'rss',
  },
];

/**
 * Parse RSS XML into article objects
 */
function parseRSS(xml, sourceName) {
  const articles = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const block = match[1];
    const title = block.match(/<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/title>/)?.[1] || '';
    const desc = block.match(/<description>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?<\/description>/)?.[1] || '';
    const link = block.match(/<link>(.*?)<\/link>/)?.[1] || '';
    const pubDate = block.match(/<pubDate>(.*?)<\/pubDate>/)?.[1] || '';
    // Strip HTML tags from description
    const cleanDesc = desc.replace(/<[^>]+>/g, '').trim();
    if (title) {
      articles.push({
        title: title.trim(),
        description: cleanDesc.slice(0, 500),
        source: sourceName,
        url: link.trim(),
        publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
      });
    }
  }
  return articles;
}

/**
 * Fetch news from all free sources
 */
async function fetchAllNews() {
  const allArticles = [];

  for (const src of NEWS_SOURCES) {
    try {
      const raw = await scraper.fetch(src.url);
      if (src.type === 'rss') {
        const articles = parseRSS(raw, src.name);
        allArticles.push(...articles);
      }
    } catch (err) {
      console.warn(`⚠️ RAG: Failed to fetch from ${src.name}:`, err.message);
    }
  }

  // Also use NewsAPI if available
  if (config.newsApi.key) {
    try {
      const params = new URLSearchParams({
        q: 'Hong Kong property OR real estate OR housing',
        language: 'en',
        sortBy: 'publishedAt',
        pageSize: '20',
        apiKey: config.newsApi.key,
      });
      const raw = await scraper.fetch(`${config.newsApi.baseUrl}/everything?${params}`);
      const data = JSON.parse(raw);
      if (data.status === 'ok' && data.articles) {
        for (const a of data.articles) {
          allArticles.push({
            title: a.title || '',
            description: a.description || '',
            source: a.source?.name || 'NewsAPI',
            url: a.url || '',
            publishedAt: a.publishedAt || new Date().toISOString(),
          });
        }
      }
    } catch (err) {
      console.warn('⚠️ RAG: NewsAPI fetch failed:', err.message);
    }
  }

  console.log(`📰 RAG: Fetched ${allArticles.length} articles from ${NEWS_SOURCES.length} sources`);
  return allArticles;
}

// ── Ingest articles into vector store ──

async function ingestArticles(articles) {
  const idx = await getIndex();
  let added = 0;

  for (const article of articles) {
    const text = `${article.title}. ${article.description}`;
    if (text.length < 20) continue;

    // Check for duplicate by URL
    const existingItems = await idx.listItems();
    const isDuplicate = existingItems.some(item =>
      item.metadata?.url === article.url && article.url
    );
    if (isDuplicate) continue;

    try {
      const vector = await getEmbedding(text);
      await idx.insertItem({
        vector,
        metadata: {
          title: article.title,
          description: article.description.slice(0, 300),
          source: article.source,
          url: article.url,
          publishedAt: article.publishedAt,
          ingestedAt: new Date().toISOString(),
        },
      });
      added++;
    } catch (err) {
      console.warn(`⚠️ RAG: Failed to index article "${article.title.slice(0, 50)}":`, err.message);
    }
  }

  console.log(`📦 RAG: Indexed ${added} new articles (${articles.length - added} skipped/duplicates)`);
  return added;
}

// ── Query: retrieve relevant articles for a prompt ──

export async function ragRetrieve(query, topK = 5) {
  try {
    const idx = await getIndex();
    const items = await idx.listItems();
    if (items.length === 0) return '';

    const queryVec = await getEmbedding(query);
    const results = await idx.queryItems(queryVec, topK);

    if (!results || results.length === 0) return '';

    const lines = results
      .filter(r => r.score > 0.3)
      .map(r => {
        const m = r.item.metadata;
        return `- [${m.source}] ${m.title} (${m.publishedAt?.slice(0, 10) || 'unknown'})${m.description ? ': ' + m.description : ''}`;
      });

    if (lines.length === 0) return '';

    return `\n--- Retrieved News Context (RAG) ---\n${lines.join('\n')}`;
  } catch (err) {
    console.warn('⚠️ RAG retrieve error:', err.message);
    return '';
  }
}

/**
 * Get article count in the index
 */
export async function ragStats() {
  try {
    const idx = await getIndex();
    const items = await idx.listItems();
    return { indexed: items.length };
  } catch {
    return { indexed: 0 };
  }
}

// ── Background refresh loop ──

let refreshInterval = null;

export async function startRAGRefresh(intervalMs = 30 * 60 * 1000) {
  // Run once immediately
  try {
    const articles = await fetchAllNews();
    if (articles.length > 0) {
      await ingestArticles(articles);
    }
  } catch (err) {
    console.warn('⚠️ RAG initial refresh failed:', err.message);
  }

  // Then repeat on interval
  refreshInterval = setInterval(async () => {
    try {
      const articles = await fetchAllNews();
      if (articles.length > 0) {
        await ingestArticles(articles);
      }
    } catch (err) {
      console.warn('⚠️ RAG refresh cycle failed:', err.message);
    }
  }, intervalMs);

  console.log(`🔄 RAG: News refresh every ${intervalMs / 60000} minutes`);
}

export function stopRAGRefresh() {
  if (refreshInterval) {
    clearInterval(refreshInterval);
    refreshInterval = null;
  }
}
