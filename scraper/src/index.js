const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const { z } = require('zod');

const USER_AGENT = 'FlyRankInternship-A9/1.0 (+https://github.com/Abhishekreddy3236/flyrank-w2-crud-api)';
const CACHE_DIR = path.join(__dirname, '..', 'cache');
const OUTPUT_DIR = path.join(__dirname, '..', 'output');

if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function fetchWithTimeout(url, options = {}, timeoutMs = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  const mergedOptions = {
    ...options,
    headers: {
      'User-Agent': USER_AGENT,
      ...(options.headers || {})
    },
    signal: controller.signal
  };

  try {
    const response = await fetch(url, mergedOptions);
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

async function fetchAndCache(url, cacheFilename, isRetry = false) {
  const cachePath = path.join(CACHE_DIR, cacheFilename);
  if (fs.existsSync(cachePath)) {
    const html = fs.readFileSync(cachePath, 'utf8');
    return { html, cached: true, ok: true };
  }
  
  try {
    const response = await fetchWithTimeout(url);
    if (!response.ok) {
      if (!isRetry && (response.status >= 500 || response.status === 408)) {
        await sleep(1000);
        return fetchAndCache(url, cacheFilename, true);
      }
      return { html: null, cached: false, ok: false, error: `HTTP ${response.status}` };
    }
    const html = await response.text();
    fs.writeFileSync(cachePath, html, 'utf8');
    return { html, cached: false, ok: true };
  } catch (error) {
    if (!isRetry) {
      await sleep(1000);
      return fetchAndCache(url, cacheFilename, true);
    }
    return { html: null, cached: false, ok: false, error: error.message };
  }
}

async function discoverCataloguePages(stats) {
  let currentUrl = 'https://books.toscrape.com/catalogue/page-1.html';
  const maxPages = 3;
  let pagesProcessed = 0;
  const allDiscoveredUrls = [];
  
  while (currentUrl && pagesProcessed < maxPages) {
    const pageNumber = pagesProcessed + 1;
    const cacheFilename = `catalogue-page-${pageNumber}.html`;
    
    const { html, cached, ok, error } = await fetchAndCache(currentUrl, cacheFilename);
    stats.pages_fetched++;
    if (cached) stats.cache_hits++;
    
    if (!ok) {
      console.error(`Failed to fetch catalogue page: ${error}`);
      break;
    }
    if (!cached) {
      await sleep(500);
    }
    
    pagesProcessed++;
    const $ = cheerio.load(html);
    
    $('.product_pod h3 a').each((_, el) => {
      const href = $(el).attr('href');
      if (href) {
        const absoluteUrl = new URL(href, currentUrl).href;
        allDiscoveredUrls.push({ url: absoluteUrl, sourcePage: currentUrl });
      }
    });
    
    const nextUrlRel = $('.next a').attr('href');
    if (nextUrlRel && pagesProcessed < maxPages) {
      currentUrl = new URL(nextUrlRel, currentUrl).href;
    } else {
      currentUrl = null;
    }
  }
  
  const uniqueUrlsMap = new Map();
  for (const item of allDiscoveredUrls) {
    if (!uniqueUrlsMap.has(item.url)) {
      uniqueUrlsMap.set(item.url, item.sourcePage);
    }
  }
  
  const links = Array.from(uniqueUrlsMap.entries()).map(([url, sourcePage]) => ({ url, sourcePage }));
  
  if (process.env.FAILURE_TEST === '1') {
    links.push({
      url: 'https://books.toscrape.com/catalogue/this-book-does-not-exist_9999/index.html',
      sourcePage: 'https://books.toscrape.com/catalogue/page-1.html'
    });
  }
  
  return links;
}

function safeText($, selector) {
  const el = $(selector).first();
  if (!el.length) return null;
  const text = el.text().trim();
  return text || null;
}

const BookSchema = z.object({
  title: z.string().min(1),
  product_url: z.string().url().startsWith('https://'),
  price_text: z.string(),
  price_gbp: z.number().nonnegative(),
  availability_text: z.string(),
  rating_text: z.string().nullable(),
  description: z.string().nullable(),
  source_page: z.string().url(),
  fetched_at: z.string().datetime()
});

async function extractBookDetails(bookLinks, stats) {
  const records = [];

  for (const link of bookLinks) {
    const { url, sourcePage } = link;
    const cacheFilename = `book-${encodeURIComponent(url.replace('https://books.toscrape.com/catalogue/', ''))}.html`;

    const { html, cached, ok, error } = await fetchAndCache(url, cacheFilename);
    stats.pages_fetched++;
    if (cached) stats.cache_hits++;
    
    if (!ok) {
      console.error(`Failed to fetch ${url}: ${error}`);
      stats.failed_pages++;
      continue;
    }
    
    if (!cached) {
      await sleep(500);
    }

    const $ = cheerio.load(html);

    const title = safeText($, '.product_main h1');
    const priceText = safeText($, '.product_main .price_color');
    const availabilityText = safeText($, '.product_main .instock.availability');
    
    let ratingText = null;
    const starRatingEl = $('.product_main .star-rating');
    if (starRatingEl.length) {
      const classes = starRatingEl.attr('class').split(' ');
      ratingText = classes.find(c => c !== 'star-rating') || null;
    }

    let description = null;
    const descHeader = $('#product_description');
    if (descHeader.length) {
      description = descHeader.next('p').text().trim() || null;
    }

    records.push({
      title,
      product_url: url,
      price_text: priceText,
      availability_text: availabilityText,
      rating_text: ratingText,
      description,
      source_page: sourcePage,
      fetched_at: new Date().toISOString()
    });
  }

  return records;
}

function processRecords(rawRecords, stats) {
  const validRecords = [];
  const invalidRecords = [];
  
  const uniqueRecordsMap = new Map();

  for (const raw of rawRecords) {
    const normalized = { ...raw };
    if (typeof normalized.price_text === 'string') {
      const match = normalized.price_text.match(/[\d.]+/);
      if (match) {
        normalized.price_gbp = parseFloat(match[0]);
      }
    }

    const parsed = BookSchema.safeParse(normalized);
    if (parsed.success) {
      uniqueRecordsMap.set(parsed.data.product_url, parsed.data);
    } else {
      invalidRecords.push({
        record: raw,
        error: parsed.error.issues
      });
    }
  }

  const valid = Array.from(uniqueRecordsMap.values());
  stats.valid_records = valid.length;
  stats.invalid_records = invalidRecords.length;

  return { valid, invalid: invalidRecords };
}

async function main() {
  const startTime = Date.now();
  const stats = {
    start_time: new Date().toISOString(),
    duration_seconds: 0,
    pages_fetched: 0,
    cache_hits: 0,
    valid_records: 0,
    invalid_records: 0,
    failed_pages: 0
  };

  try {
    const bookLinks = await discoverCataloguePages(stats);
    const rawRecords = await extractBookDetails(bookLinks, stats);
    
    const { valid, invalid } = processRecords(rawRecords, stats);
    
    fs.writeFileSync(path.join(OUTPUT_DIR, 'books.json'), JSON.stringify(valid, null, 2), 'utf8');
    fs.writeFileSync(path.join(OUTPUT_DIR, 'errors.json'), JSON.stringify(invalid, null, 2), 'utf8');
    
    stats.duration_seconds = Math.round((Date.now() - startTime) / 1000);
    fs.writeFileSync(path.join(OUTPUT_DIR, 'run-report.json'), JSON.stringify(stats, null, 2), 'utf8');
    
    console.log(`Saved ${valid.length} valid records to books.json`);
    console.log(`Saved ${invalid.length} invalid records to errors.json`);
    console.log(`Run report saved to run-report.json`);
  } catch (error) {
    console.error('Error during scraping:', error);
  }
}

main();
