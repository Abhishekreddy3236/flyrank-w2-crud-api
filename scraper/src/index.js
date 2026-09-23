const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');

const USER_AGENT = 'FlyRankInternship-A9/1.0 (+https://github.com/Abhishekreddy3236/flyrank-w2-crud-api)';
const CACHE_DIR = path.join(__dirname, '..', 'cache');
const OUTPUT_DIR = path.join(__dirname, '..', 'output');

// Ensure directories exist
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

async function fetchAndCache(url, cacheFilename) {
  const cachePath = path.join(CACHE_DIR, cacheFilename);

  if (fs.existsSync(cachePath)) {
    const html = fs.readFileSync(cachePath, 'utf8');
    return { html, cached: true };
  }

  const response = await fetchWithTimeout(url);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }

  const html = await response.text();
  fs.writeFileSync(cachePath, html, 'utf8');
  return { html, cached: false };
}

async function discoverCataloguePages() {
  let currentUrl = 'https://books.toscrape.com/catalogue/page-1.html';
  const maxPages = 3;
  let pagesProcessed = 0;
  
  const allDiscoveredUrls = [];
  
  while (currentUrl && pagesProcessed < maxPages) {
    const pageNumber = pagesProcessed + 1;
    const cacheFilename = `catalogue-page-${pageNumber}.html`;
    
    const { html, cached } = await fetchAndCache(currentUrl, cacheFilename);
    if (!cached) {
      await sleep(500); // Politely wait between real requests
    }
    
    pagesProcessed++;
    const $ = cheerio.load(html);
    
    // Extract book links
    $('.product_pod h3 a').each((_, el) => {
      const href = $(el).attr('href');
      if (href) {
        const absoluteUrl = new URL(href, currentUrl).href;
        allDiscoveredUrls.push({ url: absoluteUrl, sourcePage: currentUrl });
      }
    });
    
    // Find next page
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
  
  return Array.from(uniqueUrlsMap.entries()).map(([url, sourcePage]) => ({ url, sourcePage }));
}

function safeText($, selector) {
  const el = $(selector).first();
  if (!el.length) return null;
  const text = el.text().trim();
  return text || null;
}

async function extractBookDetails(bookLinks) {
  const records = [];
  let detailPagesProcessed = 0;

  for (const link of bookLinks) {
    const { url, sourcePage } = link;
    // Generate a safe cache filename
    const cacheFilename = `book-${encodeURIComponent(url.replace('https://books.toscrape.com/catalogue/', ''))}.html`;

    const { html, cached } = await fetchAndCache(url, cacheFilename);
    if (!cached) {
      await sleep(500); // Politely wait between real requests
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

    detailPagesProcessed++;
  }

  if (records.length > 0) {
    console.log('--- Sample Raw Record ---');
    console.log(JSON.stringify(records[0], null, 2));
  }

  console.log(`detail_pages=${detailPagesProcessed}`);
  
  return records;
}

async function main() {
  try {
    const bookLinks = await discoverCataloguePages();
    await extractBookDetails(bookLinks);
  } catch (error) {
    console.error('Error during scraping:', error);
  }
}

main();
