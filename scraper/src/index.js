const fs = require('fs');
const path = require('path');

const USER_AGENT = 'FlyRankInternship-A9/1.0 (+https://github.com/Abhishekreddy3236/flyrank-w2-crud-api)';
const CACHE_DIR = path.join(__dirname, '..', 'cache');
const OUTPUT_DIR = path.join(__dirname, '..', 'output');

// Ensure directories exist
if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

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
    return html;
  }

  console.log(`FETCH ${url}`);
  const response = await fetchWithTimeout(url);

  if (!response.ok) {
    throw new Error(`HTTP ${response.status} for ${url}`);
  }

  const html = await response.text();
  console.log(`FETCHED ${url} (${html.length} bytes)`);
  fs.writeFileSync(cachePath, html, 'utf8');
  return html;
}

async function runStage1() {
  const url = 'https://books.toscrape.com/catalogue/page-1.html';
  await fetchAndCache(url, 'catalogue-page-1.html');
}

async function main() {
  try {
    await runStage1();
  } catch (error) {
    console.error('Error during scraping:', error);
  }
}

main();
