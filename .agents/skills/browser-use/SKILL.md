---
name: browser-use
description: Browser Use AI agent patterns. Covers autonomous browsing, form filling, data extraction, multi-tab management, cookie handling, session management.
---

# Browser Use AI Agent Patterns

## When to Apply
- Building AI agents that autonomously browse the web
- Automated data extraction from complex sites
- Multi-step workflows (login, navigate, extract)
- Form filling and submission sequences
- Session-aware browsing with cookies

## Core Concepts
- **Agent loop**: Observe page -> decide action -> execute -> observe result
- **Action primitives**: click, type, scroll, navigate, extract, wait
- **State tracking**: Current URL, visible elements, form values
- **Memory**: Remember previous actions and results across steps

## Implementation

### Agent Loop
```ts
interface BrowserAgent {
  page: Page
  memory: Action[]
  goal: string
}

async function agentStep(agent: BrowserAgent): Promise<boolean> {
  const state = await observe(agent.page)
  const action = decide(state, agent.goal, agent.memory)
  agent.memory.push(action)
  const result = await execute(agent.page, action)
  return result.done
}

async function runAgent(agent: BrowserAgent, maxSteps = 50) {
  for (let i = 0; i < maxSteps; i++) {
    const done = await agentStep(agent)
    if (done) break
  }
  return extract(agent.page)
}
```

### Form Filling
```ts
async function fillForm(page: Page, data: Record<string, string>) {
  for (const [label, value] of Object.entries(data)) {
    const field = page.getByLabel(label)
    await field.fill(value)
  }
  await page.getByRole("button", { name: "Submit" }).click()
}
```

### Multi-Tab Management
```ts
const pages: Page[] = []
for (const url of urls) {
  const context = await browser.newContext()
  const page = await context.newPage()
  await page.goto(url)
  pages.push(page)
}
const results = await Promise.all(pages.map(extractPage))
```

### Cookie & Session Handling
```ts
// Save session
const cookies = await context.cookies()

// Restore session
await context.addCookies(savedCookies)
await page.goto("https://site.com/dashboard")
// Already authenticated
```

## Best Practices
- Implement step limits to prevent infinite loops
- Add delays between actions to avoid detection
- Log all actions for debugging and replay
- Use headless mode in production, headed for debugging
- Handle CAPTCHAs gracefully (detect and pause)
- Cache page observations to reduce DOM queries
- Use Playwright's auto-waiting over manual `sleep`
