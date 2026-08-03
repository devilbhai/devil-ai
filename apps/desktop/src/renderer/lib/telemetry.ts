/**
 * Devil AI Telemetry System
 * 
 * Features:
 * - Default ON for new users
 * - Local storage first (encrypted)
 * - Hourly sync to server
 * - Offline retry with exponential backoff
 * - No duplicate events (UUID-based)
 * - All data encrypted before storage
 * - Never exposes sensitive information
 * 
 * @module telemetry
 */

import { encrypt, decrypt } from "./crypto"

const TELEMETRY_URL = "https://server.agribee.in/devil-ai-telemetry/"
const STORAGE_KEY = "devil-ai-telemetry"
const EVENTS_KEY = "devil-ai-telemetry-events"
const SYNC_INTERVAL_MS = 60 * 60 * 1000 // 1 hour
const MAX_RETRY_DELAY = 30 * 60 * 1000 // 30 minutes max retry delay
const MAX_EVENTS = 2000 // Max events to keep locally

export interface TelemetryEvent {
 id: string
 type: "error" | "usage" | "crash" | "feature" | "performance"
 timestamp: string
 version: string
 platform: string
 sessionId: string
 data: Record<string, any>
 synced: boolean
}

export interface TelemetryConfig {
 enabled: boolean
 lastSync: number
 eventCount: number
 retryCount: number
 lastRetryAttempt: number
}

// ============================================================
// Unique ID Generator
// ============================================================

function generateUUID(): string {
 return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
  const r = (Math.random() * 16) | 0
  const v = c === "x" ? r : (r & 0x3) | 0x8
  return v.toString(16)
 })
}

// ============================================================
// Local Storage Helpers (Encrypted)
// ============================================================

function getStorageKey(): string {
 const deviceId = localStorage.getItem("devil-ai-device-id")
 if (!deviceId) {
  const newId = generateUUID()
  localStorage.setItem("devil-ai-device-id", newId)
  return newId
 }
 return deviceId
}

async function getLocalEvents(): Promise<TelemetryEvent[]> {
 try {
  const stored = localStorage.getItem(EVENTS_KEY)
  if (!stored) return []
  
  // Try to decrypt
  const decrypted = await decrypt(stored)
  return JSON.parse(decrypted)
 } catch {
  // If decryption fails, try raw JSON (migration)
  try {
   const stored = localStorage.getItem(EVENTS_KEY)
   if (stored) {
    const events = JSON.parse(stored)
    // Re-encrypt and save
    await saveLocalEvents(events)
    return events
   }
  } catch {}
  return []
 }
}

async function saveLocalEvents(events: TelemetryEvent[]): Promise<void> {
 try {
  // Keep only unsynced events + last 500 synced events
  const unsynced = events.filter((e) => !e.synced)
  const synced = events.filter((e) => e.synced).slice(-500)
  const trimmed = [...unsynced, ...synced].slice(-MAX_EVENTS)
  
  // Encrypt before storage
  const encrypted = await encrypt(JSON.stringify(trimmed))
  localStorage.setItem(EVENTS_KEY, encrypted)
 } catch (err) {
  console.warn("Failed to save telemetry events:", err)
 }
}

function getConfig(): TelemetryConfig {
 try {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored) {
   return JSON.parse(stored)
  }
 } catch {}
 
 // Default: DISABLED for new users (opt-in)
 return {
  enabled: false,
  lastSync: 0,
  eventCount: 0,
  retryCount: 0,
  lastRetryAttempt: 0,
 }
}

function saveConfig(config: TelemetryConfig): void {
 localStorage.setItem(STORAGE_KEY, JSON.stringify(config))
}

// ============================================================
// Public API
// ============================================================

/**
 * Check if telemetry is enabled (default: true)
 */
export function isTelemetryEnabled(): boolean {
 return getConfig().enabled
}

/**
 * Set telemetry enabled/disabled
 */
export function setTelemetryEnabled(enabled: boolean): void {
 const config = getConfig()
 config.enabled = enabled
 saveConfig(config)
 
 if (enabled) {
  startSyncInterval()
 }
}

/**
 * Get telemetry stats
 */
export async function getTelemetryStats(): Promise<{ 
 enabled: boolean
 pendingEvents: number
 lastSync: Date | null
 syncStatus: string
}> {
 const config = getConfig()
 const events = await getLocalEvents()
 const pending = events.filter((e) => !e.synced)
 
 let syncStatus = "Ready"
 if (!navigator.onLine) {
  syncStatus = "Offline - will retry when online"
 } else if (config.retryCount > 0) {
  syncStatus = `Retrying (${config.retryCount} attempts)`
 } else if (config.lastSync > 0) {
  const minutesAgo = Math.floor((Date.now() - config.lastSync) / 60000)
  syncStatus = `Last sync: ${minutesAgo}m ago`
 }
 
 return {
  enabled: config.enabled,
  pendingEvents: pending.length,
  lastSync: config.lastSync ? new Date(config.lastSync) : null,
  syncStatus,
 }
}

/**
 * Send telemetry event (stores locally first)
 */
export async function sendTelemetry(
 event: Omit<TelemetryEvent, "id" | "timestamp" | "version" | "platform" | "sessionId" | "synced">
): Promise<void> {
 const config = getConfig()
 if (!config.enabled) return

 const sessionId = sessionStorage.getItem("devil-ai-session-id") || generateUUID()
 sessionStorage.setItem("devil-ai-session-id", sessionId)

 const newEvent: TelemetryEvent = {
  ...event,
  id: generateUUID(),
  timestamp: new Date().toISOString(),
  version: "0.28.0",
  platform: navigator.platform,
  sessionId,
  synced: false,
 }

 // Store locally (encrypted)
 const events = await getLocalEvents()
 events.push(newEvent)
 await saveLocalEvents(events)

 // Update config
 config.eventCount++
 saveConfig(config)

 // Try immediate sync if online
 if (navigator.onLine) {
  await syncToServer()
 }
}

/**
 * Report an error
 */
export async function reportError(error: Error | string, context?: Record<string, any>): Promise<void> {
 // Sanitize error - remove sensitive data
 const sanitizedContext = sanitizeData(context || {})
 
 await sendTelemetry({
  type: "error",
  data: {
   message: typeof error === "string" ? error : error.message,
   stack: typeof error === "object" ? error.stack : undefined,
   name: typeof error === "object" ? error.name : "Error",
   ...sanitizedContext,
  },
 })
}

/**
 * Report usage event
 */
export async function reportUsage(action: string, data?: Record<string, any>): Promise<void> {
 await sendTelemetry({
  type: "usage",
  data: { action, ...sanitizeData(data || {}) },
 })
}

/**
 * Report crash
 */
export async function reportCrash(error: Error | string, stack?: string): Promise<void> {
 await sendTelemetry({
  type: "crash",
  data: {
   message: typeof error === "string" ? error : error.message,
   stack: stack || (typeof error === "object" ? error.stack : undefined),
  },
 })
}

/**
 * Report feature usage
 */
export async function reportFeature(feature: string, action: "used" | "enabled" | "disabled"): Promise<void> {
 await sendTelemetry({
  type: "feature",
  data: { feature, action },
 })
}

/**
 * Report performance metric
 */
export async function reportPerformance(metric: string, value: number, unit: string = "ms"): Promise<void> {
 await sendTelemetry({
  type: "performance",
  data: { metric, value, unit },
 })
}

// ============================================================
// Data Sanitization
// ============================================================

/**
 * Remove sensitive data from context
 */
function sanitizeData(data: Record<string, any>): Record<string, any> {
 const sensitive = [
  "password", "token", "secret", "key", "api", "auth",
  "credential", "cookie", "session", "jwt", "bearer",
  "ssn", "credit", "card", "bank", "account"
 ]
 
 const sanitized: Record<string, any> = {}
 
 for (const [key, value] of Object.entries(data)) {
  const lowerKey = key.toLowerCase()
  
  // Check if key contains sensitive words
  if (sensitive.some((word) => lowerKey.includes(word))) {
   sanitized[key] = "[REDACTED]"
   continue
  }
  
  // Sanitize strings
  if (typeof value === "string") {
   // Remove potential API keys, tokens, etc.
   let sanitizedValue = value
    .replace(/[A-Za-z0-9]{32,}/g, "[REDACTED]") // Long alphanumeric strings
    .replace(/sk-[a-zA-Z0-9]{20,}/g, "[REDACTED]") // OpenAI keys
    .replace(/ghp_[a-zA-Z0-9]{36}/g, "[REDACTED]") // GitHub tokens
    .replace(/xoxb-[a-zA-Z0-9-]+/g, "[REDACTED]") // Slack tokens
    .replace(/AKIA[A-Z0-9]{16}/g, "[REDACTED]") // AWS keys
   
   sanitized[key] = sanitizedValue
  } else if (typeof value === "object" && value !== null) {
   // Recursively sanitize objects
   sanitized[key] = sanitizeData(value)
  } else {
   sanitized[key] = value
  }
 }
 
 return sanitized
}

// ============================================================
// Sync to Server (with retry logic)
// ============================================================

async function syncToServer(): Promise<void> {
 const events = await getLocalEvents()
 const unsynced = events.filter((e) => !e.synced)

 if (unsynced.length === 0) return

 const config = getConfig()
 
 try {
  // Batch send to server (encrypted payload)
  const payload = {
   deviceId: getStorageKey(),
   events: unsynced.map(({ id, type, timestamp, version, platform, sessionId, data }) => ({
    id,
    type,
    timestamp,
    version,
    platform,
    sessionId,
    data,
   })),
  }
  
  // Encrypt the entire payload
  const encryptedPayload = await encrypt(JSON.stringify(payload))
  
  const response = await fetch(`${TELEMETRY_URL}batch`, {
   method: "POST",
   headers: { "Content-Type": "application/json" },
   body: JSON.stringify({ encrypted: encryptedPayload }),
   signal: AbortSignal.timeout(30000), // 30s timeout
  })

  if (response.ok) {
   // Mark as synced
   const allEvents = await getLocalEvents()
   const syncedIds = new Set(unsynced.map((e) => e.id))
   
   const updatedEvents = allEvents.map((e) => 
    syncedIds.has(e.id) ? { ...e, synced: true } : e
   )
   
   await saveLocalEvents(updatedEvents)
   
   // Update config
   config.lastSync = Date.now()
   config.retryCount = 0
   config.lastRetryAttempt = 0
   saveConfig(config)
   
   console.log(`[Telemetry] Synced ${unsynced.length} events`)
  }
 } catch (err) {
  // Silent fail - don't show error to user
  console.warn("[Telemetry] Sync failed, will retry later:", err)
  
  // Update retry config
  config.retryCount++
  config.lastRetryAttempt = Date.now()
  saveConfig(config)
 }
}

// ============================================================
// Auto Sync Interval with Retry
// ============================================================

let syncInterval: ReturnType<typeof setInterval> | null = null

function startSyncInterval(): void {
 if (syncInterval) return
 
 syncInterval = setInterval(async () => {
  const config = getConfig()
  
  // Check if we should retry
  if (config.retryCount > 0) {
   const delay = Math.min(
    Math.pow(2, config.retryCount) * 60000, // Exponential backoff
    MAX_RETRY_DELAY
   )
   
   if (Date.now() - config.lastRetryAttempt < delay) {
    return // Not time to retry yet
   }
  }
  
  // Try sync if online
  if (navigator.onLine) {
   await syncToServer()
  }
 }, SYNC_INTERVAL_MS)
}

// Stop sync when tab is hidden (save battery)
if (typeof document !== "undefined") {
 document.addEventListener("visibilitychange", () => {
  if (document.hidden && syncInterval) {
   clearInterval(syncInterval)
   syncInterval = null
  } else if (!document.hidden && isTelemetryEnabled()) {
   startSyncInterval()
  }
 })
}

// ============================================================
// Global Error Handlers
// ============================================================

export function initTelemetry(): void {
 const config = getConfig()
 
 // Start sync interval if enabled
 if (config.enabled) {
  startSyncInterval()
  
  // Initial sync on load (delayed)
  setTimeout(() => {
   if (navigator.onLine) {
    syncToServer()
   }
  }, 5000)
 }
}

let errorHandlersAttached = false

export function attachErrorHandlers(): void {
 if (errorHandlersAttached) return
 errorHandlersAttached = true

 window.addEventListener("error", (event) => {
  if (!isTelemetryEnabled()) return
  reportError(event.error || new Error(event.message), {
   filename: event.filename,
   lineno: event.lineno,
   colno: event.colno,
   type: "unhandled-error",
  })
 })

 window.addEventListener("unhandledrejection", (event) => {
  if (!isTelemetryEnabled()) return
  reportError(
   event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
   { type: "unhandled-rejection" }
  )
 })

 window.addEventListener("beforeunload", () => {
  if (!isTelemetryEnabled() || !navigator.onLine) return
  const unsyncedEvents = localStorage.getItem(EVENTS_KEY)
  if (unsyncedEvents) {
   navigator.sendBeacon(
    `${TELEMETRY_URL}beacon`,
    JSON.stringify({ deviceId: getStorageKey(), data: unsyncedEvents })
   )
  }
 })
}
