---
name: playwright-automation
description: Playwright browser automation. Covers page navigation, element selection, screenshots, PDF generation, network interception, mobile testing, parallel execution.
---

# Playwright Browser Automation

## When to Apply
- Automated end-to-end testing of web apps
- Screenshot/PDF generation for documentation
- Network request interception and mocking
- Mobile viewport testing
- Parallel test execution across browsers

## Core Concepts
- **Locator API**: Role-based, CSS, and text selectors
- **Browser contexts**: Isolated sessions with separate cookies/storage
- **Network interception**: Route, mock, and modify requests
- **Auto-waiting**: Built-in actionability checks

## Implementation

### Setup
```ts
import { chromium, type Page } from "playwright"

const browser = await chromium.launch()
const context = await browser.newContext({ viewport: { width: 1280, height: 720 } })
const page = await context.newPage()
```

### Navigation & Interaction
```ts
await page.goto("https://example.com")
await page.getByRole("button", { name: "Submit" }).click()
await page.getByLabel("Email").fill("user@example.com")
await page.waitForSelector(".result", { timeout: 10000 })
```

### Screenshot & PDF
```ts
await page.screenshot({ path: "screenshot.png", fullPage: true })
await page.pdf({ path: "page.pdf", format: "A4" })
```

### Network Interception
```ts
await page.route("**/api/data", async (route) => {
  await route.fulfill({
    status: 200,
    contentType: "application/json",
    body: JSON.stringify({ mock: true }),
  })
})
```

### Mobile Testing
```ts
const iphone = playwright.devices["iPhone 13"]
const mobileContext = await browser.newContext({ ...iphone })
const mobilePage = await mobileContext.newPage()
await mobilePage.goto("https://example.com")
```

### Parallel Execution
```ts
import { test, expect } from "@playwright/test"

test.describe.parallel("Feature Suite", () => {
  test("test A", async ({ page }) => { /* ... */ })
  test("test B", async ({ page }) => { /* ... */ })
})
```

## Best Practices
- Use `getByRole`/`getByLabel` over raw CSS selectors
- Always close contexts and browsers in teardown
- Use `page.route` for deterministic tests (no external deps)
- Run with `--workers=4` for CI parallelism
- Use `trace: "on-first-retry"` for debugging failures
- Prefer `locator` over `page.$` for auto-wait guarantees
