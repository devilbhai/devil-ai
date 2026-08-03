/**
 * Devil AI Browser Extension - Background Service Worker
 * Handles tab management, page actions, and WebSocket communication
 */

const WS_URL = "ws://localhost:9223"
let ws: WebSocket | null = null
let reconnectAttempts = 0
const MAX_RECONNECT = 10

interface TabInfo {
  id: number
  url: string
  title: string
  favicon?: string
  active: boolean
  windowId: number
}

// ============================================================
// WebSocket Connection
// ============================================================

function connect() {
  if (ws?.readyState === WebSocket.OPEN) return

  ws = new WebSocket(WS_URL)

  ws.onopen = () => {
    console.log("[Devil AI Extension] Connected to desktop app")
    reconnectAttempts = 0
    send({ type: "extensionReady" })
  }

  ws.onmessage = async (event) => {
    try {
      const msg = JSON.parse(event.data)
      await handleMessage(msg)
    } catch (e) {
      console.error("[Devil AI Extension] Message error", e)
    }
  }

  ws.onclose = () => {
    console.log("[Devil AI Extension] Disconnected")
    attemptReconnect()
  }

  ws.onerror = (err) => {
    console.error("[Devil AI Extension] WebSocket error", err)
  }
}

function attemptReconnect() {
  if (reconnectAttempts >= MAX_RECONNECT) return
  reconnectAttempts++
  const delay = 1000 * reconnectAttempts
  console.log(`[Devil AI Extension] Reconnecting in ${delay}ms...`)
  setTimeout(connect, delay)
}

function send(msg: any) {
  if (ws?.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(msg))
  }
}

// ============================================================
// Message Handlers
// ============================================================

async function handleMessage(msg: any) {
  const { type, payload, id } = msg

  try {
    let result: any

    switch (type) {
      case "getTabs":
        result = await getTabs()
        break
      case "createTab":
        result = await createTab(payload.url)
        break
      case "switchTab":
        result = await switchTab(payload.tabId)
        break
      case "closeTab":
        result = await closeTab(payload.tabId)
        break
      case "reloadTab":
        result = await reloadTab(payload.tabId)
        break
      case "click":
        result = await click(payload.tabId, payload.selector)
        break
      case "type":
        result = await typeText(payload.tabId, payload.selector, payload.text)
        break
      case "screenshot":
        result = await screenshot(payload.tabId, payload.options)
        break
      case "evaluate":
        result = await evaluate(payload.tabId, payload.script, payload.args)
        break
      case "getContent":
        result = await getContent(payload.tabId)
        break
      case "getText":
        result = await getText(payload.tabId)
        break
      case "waitForSelector":
        result = await waitForSelector(payload.tabId, payload.selector, payload.timeout)
        break
      case "getCookies":
        result = await getCookies(payload.tabId)
        break
      case "setCookies":
        result = await setCookies(payload.tabId, payload.cookies)
        break
      case "pressKey":
        result = await pressKey(payload.tabId, payload.key)
        break
      default:
        throw new Error(`Unknown message type: ${type}`)
    }

    send({ id, result })
  } catch (error) {
    send({ id, error: error instanceof Error ? error.message : String(error) })
  }
}

// ============================================================
// Tab Management
// ============================================================

async function getTabs(): Promise<TabInfo[]> {
  const tabs = await chrome.tabs.query({})
  return tabs.map((tab) => ({
    id: tab.id!,
    url: tab.url || "",
    title: tab.title || "",
    favicon: tab.favIconUrl,
    active: tab.active,
    windowId: tab.windowId,
  }))
}

async function createTab(url: string): Promise<TabInfo> {
  const tab = await chrome.tabs.create({ url, active: true })
  return {
    id: tab.id!,
    url: tab.url || "",
    title: tab.title || "",
    favicon: tab.favIconUrl,
    active: tab.active,
    windowId: tab.windowId,
  }
}

async function switchTab(tabId: number): Promise<void> {
  await chrome.tabs.update(tabId, { active: true })
}

async function closeTab(tabId: number): Promise<void> {
  await chrome.tabs.remove(tabId)
}

async function reloadTab(tabId: number): Promise<void> {
  await chrome.tabs.reload(tabId)
}

// ============================================================
// Page Actions (via content script)
// ============================================================

function sendToContentScript(tabId: number, action: string, data: any): Promise<any> {
  return new Promise((resolve, reject) => {
    chrome.tabs.sendMessage(tabId, { action, ...data }, (response) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message))
      } else {
        resolve(response)
      }
    })
  })
}

async function click(tabId: number, selector: string): Promise<void> {
  await sendToContentScript(tabId, "click", { selector })
}

async function typeText(tabId: number, selector: string, text: string): Promise<void> {
  await sendToContentScript(tabId, "type", { selector, text })
}

async function screenshot(tabId: number, options: any = {}): Promise<string> {
  const response = await sendToContentScript(tabId, "screenshot", { options })
  return response.data
}

async function evaluate(tabId: number, script: string, args: any): Promise<any> {
  const response = await sendToContentScript(tabId, "evaluate", { script, args })
  return response.result
}

async function getContent(tabId: number): Promise<string> {
  const response = await sendToContentScript(tabId, "getContent", {})
  return response.content
}

async function getText(tabId: number): Promise<string> {
  const response = await sendToContentScript(tabId, "getText", {})
  return response.text
}

async function waitForSelector(tabId: number, selector: string, timeout: number): Promise<void> {
  await sendToContentScript(tabId, "waitForSelector", { selector, timeout })
}

async function getCookies(tabId: number): Promise<any[]> {
  const tab = await chrome.tabs.get(tabId)
  if (!tab.url) return []
  const url = new URL(tab.url)
  return chrome.cookies.getAll({ domain: url.hostname })
}

async function setCookies(tabId: number, cookies: any[]): Promise<void> {
  const tab = await chrome.tabs.get(tabId)
  if (!tab.url) return
  const url = new URL(tab.url)
  for (const cookie of cookies) {
    await chrome.cookies.set({
      url: tab.url,
      name: cookie.name,
      value: cookie.value,
      domain: cookie.domain || url.hostname,
      path: cookie.path || "/",
      secure: cookie.secure,
      httpOnly: cookie.httpOnly,
      sameSite: cookie.sameSite,
      expirationDate: cookie.expires,
    })
  }
}

async function pressKey(tabId: number, key: string): Promise<void> {
  await sendToContentScript(tabId, "pressKey", { key })
}

// ============================================================
// Initialize
// ============================================================

connect()

// Handle extension install/update
chrome.runtime.onInstalled.addListener(() => {
  console.log("[Devil AI Extension] Installed")
})

// Keep alive
setInterval(() => {
  if (ws?.readyState === WebSocket.OPEN) {
    send({ type: "ping" })
  }
}, 30000)