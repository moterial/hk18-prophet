// backend/data-sources/scraper-base.js — HTTP fetcher + HTML table parser
import https from 'node:https';
import http from 'node:http';

export class ScraperBase {
  constructor(name) {
    this.name = name;
  }

  fetch(url, options = {}, _redirects = 0) {
    return new Promise((resolve, reject) => {
      const parsedUrl = new URL(url);
      const client = parsedUrl.protocol === 'https:' ? https : http;

      const req = client.get(url, {
        headers: {
          'User-Agent': 'HK18Prophet/1.0',
          ...options.headers,
        },
        timeout: options.timeout || 15000,
      }, (res) => {
        // Follow redirects (301, 302, 307, 308) up to 5 times
        if ([301, 302, 307, 308].includes(res.statusCode) && res.headers.location && _redirects < 5) {
          const redirectUrl = new URL(res.headers.location, url).toString();
          this.fetch(redirectUrl, options, _redirects + 1).then(resolve, reject);
          return;
        }
        if (res.statusCode < 200 || res.statusCode >= 300) {
          reject(new Error(`HTTP ${res.statusCode} from ${url}`));
          return;
        }
        const chunks = [];
        res.on('data', chunk => chunks.push(chunk));
        res.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
      });

      req.on('error', reject);
      req.on('timeout', () => {
        req.destroy();
        reject(new Error(`Timeout fetching ${url}`));
      });
    });
  }

  parseHtmlTables(html) {
    const tables = [];
    const tableRegex = /<table[^>]*>([\s\S]*?)<\/table>/gi;
    let tableMatch;

    while ((tableMatch = tableRegex.exec(html)) !== null) {
      const tableHtml = tableMatch[1];
      const rows = [];
      const rowRegex = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
      let rowMatch;

      while ((rowMatch = rowRegex.exec(tableHtml)) !== null) {
        const cells = [];
        const cellRegex = /<t[dh][^>]*>([\s\S]*?)<\/t[dh]>/gi;
        let cellMatch;

        while ((cellMatch = cellRegex.exec(rowMatch[1])) !== null) {
          const text = cellMatch[1].replace(/<[^>]+>/g, '').trim();
          cells.push(text);
        }
        if (cells.length > 0) rows.push(cells);
      }
      if (rows.length > 0) tables.push(rows);
    }

    return tables;
  }
}

export default ScraperBase;
