---
name: web-scraping
description: Web scraping expert. Covers BeautifulSoup, Scrapy, Playwright scraping, anti-bot bypass, proxy rotation, rate limiting, data extraction patterns.
---

# Web Scraping Expert

## When to Apply
- Extracting structured data from websites
- Building scrapers for product listings, news, directories
- Handling anti-bot measures and dynamic content
- Scraping at scale with rate limiting and proxies

## Core Concepts
- **Static scraping**: BeautifulSoup/cheerio for server-rendered HTML
- **Dynamic scraping**: Playwright for JavaScript-rendered pages
- **Anti-bot**: Headers rotation, proxy pools, headless detection evasion
- **Rate limiting**: Respect `robots.txt`, add delays, exponential backoff

## Implementation

### Static Scraping (Cheerio/Node)
```ts
import * as cheerio from "cheerio"

async function scrapeListing(url: string) {
  const res = await fetch(url, { headers: randomHeaders() })
  const html = await res.text()
  const $ = cheerio.load(html)

  return $(".item").map((_, el) => ({
    title: $(el).find(".title").text().trim(),
    price: $(el).find(".price").text().trim(),
    link: $(el).find("a").attr("href"),
  })).get()
}
```

### Dynamic Scraping (Playwright)
```ts
async function scrapeDynamic(url: string) {
  const browser = await chromium.launch({ headless: true })
  const page = await browser.newPage()
  await page.goto(url)
  await page.waitForSelector(".loaded-content")

  const data = await page.evaluate(() =>
    Array.from(document.querySelectorAll(".item")).map((el) => ({
      title: el.querySelector(".title")?.textContent?.trim(),
      price: el.querySelector(".price")?.textContent?.trim(),
    })),
  )
  await browser.close()
  return data
}
```

### Proxy Rotation
```ts
const proxies = ["http://proxy1:8080", "http://proxy2:8080"]

function randomProxy(): string {
  return proxies[Math.floor(Math.random() * proxies.length)]
}

async function fetchWithProxy(url: string) {
  return fetch(url, {
    dispatcher: new ProxyAgent(randomProxy()),
    headers: randomHeaders(),
  })
}
```

### Rate Limiter
```ts
class RateLimiter {
  private queue: Array<() => void> = []
  private running = 0

  constructor(private maxConcurrent: number, private delayMs: number) {}

  async acquire() {
    while (this.running >= this.maxConcurrent) {
      await new Promise((r) => this.queue.push(r))
    }
    this.running++
    await sleep(this.delayMs)
  }

  release() {
    this.running--
    this.queue.shift()?.()
  }
}
```

## Best Practices
- Always check `robots.txt` before scraping
- Rotate user agents and headers
- Add random delays between requests (2-5s)
- Cache responses to avoid re-fetching
- Handle HTTP 429 with exponential backoff
- Store raw HTML for debugging, not just parsed data
- Use `if-none-match` / ETags for conditional requests
