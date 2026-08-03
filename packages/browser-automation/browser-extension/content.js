/**
 * Devil AI Browser Extension - Content Script
 * Runs in page context for DOM interactions
 */

interface ClickData { selector: string }
interface TypeData { selector: string; text: string }
interface ScreenshotData { options?: { fullPage?: boolean; format?: string; quality?: number } }
interface EvaluateData { script: string; args?: any }
interface WaitData { selector: string; timeout?: number }

let observer: MutationObserver | null = null

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  const { action } = msg

  try {
    switch (action) {
      case "click":
        handleClick(msg as ClickData).then(sendResponse)
        break
      case "type":
        handleType(msg as TypeData).then(sendResponse)
        break
      case "screenshot":
        handleScreenshot(msg as ScreenshotData).then(sendResponse)
        break
      case "evaluate":
        handleEvaluate(msg as EvaluateData).then(sendResponse)
        break
      case "getContent":
        sendResponse({ content: document.documentElement.outerHTML })
        break
      case "getText":
        sendResponse({ text: document.body.innerText })
        break
      case "waitForSelector":
        handleWaitForSelector(msg as WaitData).then(sendResponse)
        break
      case "pressKey":
        handlePressKey(msg.key).then(sendResponse)
        break
      default:
        sendResponse({ error: "Unknown action" })
    }
  } catch (e) {
    sendResponse({ error: e instanceof Error ? e.message : String(e) })
  }

  return true // Async response
})

// ============================================================
// Handlers
// ============================================================

async function handleClick(data: ClickData): Promise<void> {
  const element = await waitForElement(data.selector, 5000)
  if (!element) throw new Error(`Element not found: ${data.selector}`)

  // Scroll into view
  element.scrollIntoView({ behavior: "smooth", block: "center" })
  await sleep(200)

  // Click
  const event = new MouseEvent("click", {
    view: window,
    bubbles: true,
    cancelable: true,
    clientX: element.getBoundingClientRect().left + element.getBoundingClientRect().width / 2,
    clientY: element.getBoundingClientRect().top + element.getBoundingClientRect().height / 2,
  })
  element.dispatchEvent(event)
}

async function handleType(data: TypeData): Promise<void> {
  const element = await waitForElement(data.selector, 5000)
  if (!element) throw new Error(`Element not found: ${data.selector}`)

  // Focus
  element.focus()
  await sleep(100)

  // Clear existing value
  if ("value" in element) {
    ;(element as HTMLInputElement).value = ""
  }

  // Type character by character for realism
  for (const char of data.text) {
    const event = new KeyboardEvent("keydown", { key: char, bubbles: true })
    element.dispatchEvent(event)

    if ("value" in element) {
      ;(element as HTMLInputElement).value += char
    } else {
      element.textContent += char
    }

    const keyupEvent = new KeyboardEvent("keyup", { key: char, bubbles: true })
    element.dispatchEvent(keyupEvent)

    // Trigger input event
    const inputEvent = new Event("input", { bubbles: true })
    element.dispatchEvent(inputEvent)

    await sleep(50 + Math.random() * 100)
  }

  // Trigger change event
  const changeEvent = new Event("change", { bubbles: true })
  element.dispatchEvent(changeEvent)
}

async function handleScreenshot(data: ScreenshotData): Promise<{ data: string }> {
  const canvas = await html2canvas(document.body, {
    scale: 1,
    useCORS: true,
    logging: false,
    ...data.options,
  })

  return { data: canvas.toDataURL("image/png").split(",")[1] }
}

async function handleEvaluate(data: EvaluateData): Promise<any> {
  try {
    const fn = new Function("args", data.script)
    return { result: await fn(data.args) }
  } catch (e) {
    return { error: e instanceof Error ? e.message : String(e) }
  }
}

async function handleWaitForSelector(data: WaitData): Promise<void> {
  const element = await waitForElement(data.selector, data.timeout || 30000)
  if (!element) throw new Error(`Timeout waiting for: ${data.selector}`)
}

async function handlePressKey(key: string): Promise<void> {
  const event = new KeyboardEvent("keydown", { key, bubbles: true })
  document.dispatchEvent(event)
  const keyupEvent = new KeyboardEvent("keyup", { key, bubbles: true })
  document.dispatchEvent(keyupEvent)
}

// ============================================================
// Utilities
// ============================================================

function waitForElement(selector: string, timeout: number): Promise<Element | null> {
  return new Promise((resolve) => {
    const element = document.querySelector(selector)
    if (element) return resolve(element)

    const observer = new MutationObserver(() => {
      const el = document.querySelector(selector)
      if (el) {
        observer.disconnect()
        resolve(el)
      }
    })

    observer.observe(document.body, { childList: true, subtree: true })

    setTimeout(() => {
      observer.disconnect()
      resolve(null)
    }, timeout)
  })
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

// html2canvas implementation (simplified)
async function html2canvas(element: HTMLElement, options: any = {}) {
  const { scale = 1, useCORS = true } = options

  // Create canvas
  const canvas = document.createElement("canvas")
  const ctx = canvas.getContext("2d")!

  const rect = element.getBoundingClientRect()
  canvas.width = rect.width * scale
  canvas.height = rect.height * scale
  ctx.scale(scale, scale)

  // Use native drawWindow if available (Firefox)
  if ((window as any).canvas?.drawWindow) {
    ;(window as any).canvas.drawWindow(window, 0, 0, rect.width, rect.height, "rgb(255,255,255)")
  } else {
    // Fallback: render via SVG
    const svg = await nodeToSvg(element)
    const img = new Image()
    img.src = "data:image/svg+xml;base64," + btoa(svg)
    await new Promise((r) => (img.onload = r))
    ctx.drawImage(img, 0, 0, rect.width, rect.height)
  }

  return canvas
}

async function nodeToSvg(node: HTMLElement): Promise<string> {
  const serializer = new XMLSerializer()
  let svg = serializer.serializeToString(node as any)

  // Clean up
  svg = svg.replace(/xmlns="[^"]*"/g, "")
  return svg
}

console.log("[Devil AI Content Script] Loaded")