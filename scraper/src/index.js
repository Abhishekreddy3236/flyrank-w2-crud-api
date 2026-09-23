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
    console.log(`CACHE HIT ${url} (${html.length} bytes)`);
    return { html, cached: true };
  }

  console.log(`FETCH ${url}`);
  const response = await fetchWithTimeout(url);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }

  const html = await response.text();
  console.log(`FETCHED ${url} (${html.length} bytes)`);
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
  
  const uniqueUrls = new Set(allDiscoveredUrls.map(item => item.url));
  
  console.log('--- Checkpoint ---');
  console.log(`catalogue_pages=${pagesProcessed}`);
  console.log(`discovered=${allDiscoveredUrls.length}`);
  console.log(`unique_urls=${uniqueUrls.size}`);
  
  return Array.from(uniqueUrls).map(url => allDiscoveredUrls.find(item => item.url === url));
}

async function main() {
  try {
    const bookLinks = await discoverCataloguePages();
  } catch (error) {
    console.error('Error during scraping:', error);
  }
}

main();
