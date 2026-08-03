---
name: browser-form-filling
description: Automated form filling patterns. Covers input detection, dropdown selection, file uploads, captcha handling, validation, multi-step forms.
---

# Automated Form Filling Patterns

## When to Apply
- Automating registration, checkout, or application forms
- Filling complex multi-step forms
- Handling dynamic dropdowns and file uploads
- Detecting and responding to form validation errors

## Core Concepts
- **Input detection**: Identify form fields by label, name, placeholder, or type
- **Dropdown handling**: Static selects, custom dropdowns, autocomplete
- **File uploads**: Hidden input triggers, drag-and-drop zones
- **Validation**: Required fields, regex patterns, custom validators
- **Multi-step**: Wizard forms with conditional next steps

## Implementation

### Smart Field Detection
```ts
async function findField(page: Page, label: string) {
  // Try multiple selectors in priority order
  const selectors = [
    page.getByLabel(label),
    page.getByPlaceholder(label),
    page.locator(`[name="${label}"]`),
    page.locator(`[data-testid="${label}"]`),
  ]
  for (const sel of selectors) {
    if (await sel.count() > 0) return sel.first()
  }
  throw new Error(`Field not found: ${label}`)
}
```

### Dropdown Selection
```ts
// Native <select>
await page.selectOption("select#country", "US")

// Custom dropdown (click to open, then click option)
await page.click(".dropdown-trigger")
await page.click(`[data-value="option-3"]`)

// Autocomplete
await page.fill("#city", "New Y")
await page.waitForSelector(".suggestions")
await page.click(".suggestion-item:first-child")
```

### File Upload
```ts
const fileChooserPromise = page.waitForEvent("filechooser")
await page.click("input[type='file']")
const fileChooser = await fileChooserPromise
await fileChooser.setFiles("/path/to/document.pdf")
```

### Validation Error Handling
```ts
async function submitAndWaitForErrors(page: Page) {
  await page.click("button[type='submit']")
  const errors = await page.locator(".field-error").allTextContents()
  if (errors.length > 0) {
    throw new Error(`Validation failed: ${errors.join(", ")}`)
  }
}
```

### Multi-Step Form
```ts
async function completeMultiStepForm(page: Page, steps: Array<Record<string, string>>) {
  for (const stepData of steps) {
    await fillForm(page, stepData)
    await page.click("button:has-text('Next')")
    await page.waitForNavigation()
  }
  await page.click("button:has-text('Submit')")
}
```

## Best Practices
- Always wait for form fields to be visible before interacting
- Handle disabled/enabled state transitions
- Log form field names and types for debugging
- Use `page.evaluate` for custom dropdowns that need JS events
- Test with both valid and invalid data
- Store form field mappings in config, not hardcoded
