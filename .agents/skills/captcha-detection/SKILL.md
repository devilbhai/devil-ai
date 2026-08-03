---
name: captcha-detection
description: CAPTCHA detection and identification. Covers reCAPTCHA, hCaptcha, image CAPTCHA, text CAPTCHA, slider CAPTCHA detection (detection only, not bypass).
---

# CAPTCHA Detection & Identification

## When to Apply
- Detecting when a CAPTCHA is present on a page
- Identifying CAPTCHA type for routing to appropriate handler
- Pausing automation when CAPTCHA blocks progress
- Logging CAPTCHA encounters for manual review

## Core Concepts
- **Detection**: Identifying CAPTCHA elements in DOM
- **Classification**: reCAPTCHA v2/v3, hCaptcha, image, text, slider
- **DOM signatures**: Known selectors and attributes for each type
- **Decision**: Pause, alert, or route to manual intervention

## Implementation

### CAPTCHA Detector
```ts
interface CaptchaResult {
  detected: boolean
  type: "recaptcha-v2" | "recaptcha-v3" | "hcaptcha" | "image" | "text" | "slider" | "unknown" | null
  selector: string
}

async function detectCaptcha(page: Page): Promise<CaptchaResult> {
  const checks: Array<{ type: CaptchaResult["type"]; selector: string }> = [
    { type: "recaptcha-v2", selector: 'iframe[src*="recaptcha"]' },
    { type: "recaptcha-v3", selector: 'div.g-recaptcha[data-size="invisible"]' },
    { type: "hcaptcha", selector: 'iframe[src*="hcaptcha"]' },
    { type: "image", selector: 'img.captcha, img[alt*="captcha"], img[src*="captcha"]' },
    { type: "text", selector: 'input[name*="captcha"], .captcha-input' },
    { type: "slider", selector: '.slider-captcha, .captcha-slider, [data-captcha="slider"]' },
  ]

  for (const { type, selector } of checks) {
    if (await page.locator(selector).count() > 0) {
      return { detected: true, type, selector }
    }
  }

  // Fallback: check for common captcha keywords in visible text
  const bodyText = await page.textContent("body")
  if (bodyText && /prove.*human|verify.*human|are you a robot/i.test(bodyText)) {
    return { detected: true, type: "unknown", selector: "body" }
  }

  return { detected: false, type: null, selector: "" }
}
```

### CAPTCHA Monitor Hook
```ts
async function watchForCaptcha(page: Page, onDetect: (r: CaptchaResult) => void) {
  page.on("framenavigated", async () => {
    const result = await detectCaptcha(page)
    if (result.detected) onDetect(result)
  })
}
```

### Logging
```ts
function logCaptchaEncounter(result: CaptchaResult, url: string) {
  console.warn(`[CAPTCHA] Type: ${result.type} on ${url}`)
  // Store for manual review
  captchaLog.push({
    url,
    type: result.type,
    timestamp: new Date().toISOString(),
  })
}
```

## Best Practices
- Detect BEFORE attempting to interact with the page
- Differentiate between visible and invisible reCAPTCHA
- Log all detections for patterns (specific pages trigger more)
- Pause automation, don't retry automatically
- Alert user or queue for manual intervention
- Monitor detection rate over time
- reCAPTCHA v3 is score-based (invisible) - detect via script tags
