# The Polite Scraper

## Target classification

- **Target**: Books to Scrape (https://books.toscrape.com/)
- **Why it is appropriate**: It is the practice sandbox specified by the assignment.
- **Scope**:
  - first 3 catalogue pages only
  - 60 unique books
- **Data collected**:
  - title
  - product URL
  - price text
  - availability text
  - rating text
  - description
  - source page
  - fetched timestamp
- **robots.txt result**: No robots file found (HTTP 404).
- **Why this scope is appropriate**: This small scope prevents placing undue burden on the target server while being sufficient to demonstrate the required scraping, normalization, and validation skills.

I will not reuse this code on another site without checking its rules and terms first.

## Technology Lane
- Node.js
- fetch
- Cheerio
- Zod

## Running the Scraper
The data needed by this assignment is already present in the HTML returned by the server, so browser automation would add unnecessary cost and complexity.

1. Navigate to the `scraper` directory.
2. Run `npm install`
3. Run `npm start`

## Expected Output
Running the scraper generates output files in `output/`:
- `books.json`: Exactly 60 normalized and validated records.
- `errors.json`: Any invalid records.
- `run-report.json`: Metrics for the scraping run.

## Record Schema
```json
{
  "title": "string",
  "product_url": "string",
  "price_text": "string",
  "price_gbp": "number",
  "availability_text": "string",
  "rating_text": "string",
  "description": "string | null",
  "source_page": "string",
  "fetched_at": "string"
}
```

## Politeness Rules
- **User-Agent**: Custom User-Agent string identifying the scraper.
- **Delay**: At least 500ms delay between real network requests.
- **Timeout**: Timeout enforced for every network request.
- **Status Checking**: Only 200 HTTP status is considered successful.
- **Cache**: Successful HTML responses are cached to disk to avoid repeated network requests during development.

## Validation Behavior
Every extracted record is strictly validated using Zod. Valid records are stored in `books.json`. Invalid records (if any) are diverted to `errors.json`.

## Error Handling
The scraper processes each book detail page independently. If a page fails to fetch or parse, it records the failure, skips that page, and continues. Failed pages do not crash the entire scraping process.
- 5xx and timeout errors trigger exactly one retry.
- 404/403 errors are not retried.

## Idempotency Behavior
Rerunning the scraper will not produce duplicate records. It processes unique URLs and will reliably result in exactly 60 records every time.

## Run-report Explanation
`run-report.json` contains honesty metrics about the run, including duration, cache hits, pages fetched, valid records, invalid records, and failed pages.

## Sample Run Report
```json
{
  "start_time": "2026-09-23T18:37:55.064Z",
  "duration_seconds": 0,
  "pages_fetched": 63,
  "cache_hits": 63,
  "valid_records": 60,
  "invalid_records": 0,
  "failed_pages": 0
}
```

## Limitations
One limitation is that this scraper is heavily coupled to the HTML structure of `books.toscrape.com`. Any changes to the CSS classes or DOM structure on the target site will break the extraction logic.

## Ethics Note
- Always use an official API when one exists.
- Never bypass logins, paywalls, or blocks.
- Collect only what is needed.
