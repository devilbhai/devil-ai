import jwt from "jsonwebtoken"
import crypto from "crypto"
import { net } from "electron"
import { createLogger } from "./logger"
import { getCredential, storeCredential, deleteCredential } from "./credential-store"
import { getTrialState, startTrial } from "./trial-manager"

const log = createLogger("subscription-guard")
const VALIDATE_URL = "https://devil-ai.agribee.in/api/auth/validate"
const HEARTBEAT_INTERVAL = 6 * 60 * 60 * 1000 // 6 hours

function getJWTSecret(): string {
	const machineId = process.env.ELECTRON_MACHINE_ID || process.env.SUGAR_MACHINE_ID || "devil-ai-offline"
	return crypto.createHash("sha256").update(machineId).digest("hex")
}

interface SubscriptionState {
  valid: boolean
  banned?: boolean
  banMessage?: string
  planId: string | null
  expiresAt: string | null
  daysRemaining: number
  lastValidated: number
  offlineValidUntil: number | null
  user: { id: string; email: string; name: string | null } | null
}

let state: SubscriptionState = {
  valid: false,
  planId: null,
  expiresAt: null,
  daysRemaining: 0,
  lastValidated: 0,
  offlineValidUntil: null,
  user: null,
}

let heartbeatTimer: ReturnType<typeof setInterval> | null = null
let onStateChange: ((state: SubscriptionState) => void) | null = null

export function getSubscriptionState(): SubscriptionState {
  return { ...state }
}

export function onSubscriptionStateChange(cb: (state: SubscriptionState) => void): void {
  onStateChange = cb
}

function emitChange(): void {
  onStateChange?.({ ...state })
}

function validateOfflineToken(subToken: string): SubscriptionState | null {
  try {
    const decoded = jwt.verify(subToken, getJWTSecret(), {
      clockTolerance: 30,
    }) as any

    const validUntil = new Date(decoded.expiresAt || decoded.validUntil)
    if (validUntil.getTime() < Date.now()) return null

    return {
      valid: true,
      planId: decoded.planId,
      expiresAt: decoded.expiresAt || decoded.validUntil,
      daysRemaining: Math.ceil((validUntil.getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      lastValidated: decoded.iat * 1000,
      offlineValidUntil: validUntil.getTime(),
      user: decoded.userId ? { id: decoded.userId, email: "", name: null } : null,
    }
  } catch {
    return null
  }
}

export async function validateSubscription(token: string, forceOnline = false): Promise<SubscriptionState> {
  // Try online validation first
  if (forceOnline || Date.now() - state.lastValidated > HEARTBEAT_INTERVAL) {
    try {
      const result = await validateOnline(token)
      if (result) {
        state = result
        // Cache the sub token for offline use
        if (result.valid && result.planId) {
          await storeCredential("subscription-token", token)
          await storeCredential("sub-verify-token", (await import("jsonwebtoken")).default.sign(
            { planId: result.planId, expiresAt: result.expiresAt, userId: result.user?.id },
            getJWTSecret(),
            { expiresIn: "24h" }
          ))
        } else if (!result.valid) {
          // If server explicitly says invalid, remove the cached token
          await deleteCredential("sub-verify-token")
        }
        emitChange()
        return state
      }
    } catch (err) {
      log.warn("Online validation failed, trying offline", err)
    }
  }

  // Fallback to offline validation
  const cachedSubToken = await getCredential("sub-verify-token")
  if (cachedSubToken) {
    const offline = validateOfflineToken(cachedSubToken)
    if (offline) {
      let currentUserId = null;
      try {
        const decodedToken = jwt.decode(token) as any;
        if (decodedToken && decodedToken.id) {
          currentUserId = decodedToken.id;
        }
      } catch (e) {}

      if (currentUserId && offline.user && offline.user.id && currentUserId !== offline.user.id) {
        log.warn("Offline token belongs to a different user, discarding it.", { currentUserId, cachedUserId: offline.user.id })
        await deleteCredential("sub-verify-token")
      } else if (currentUserId && !offline.user) {
        log.warn("Offline token is missing user ID, discarding it for safety.")
        await deleteCredential("sub-verify-token")
      } else {
        state = { ...offline, offlineValidUntil: offline.offlineValidUntil }
        log.info("Using offline subscription validation", { planId: state.planId })
        emitChange()
        return state
      }
    }
  }

  // Check if hardware-locked trial is available
  let trialState = getTrialState()
  if (!trialState.hasStarted) {
    trialState = startTrial()
  }

  if (trialState.isActive) {
    state = {
      valid: true,
      planId: "TRIAL",
      expiresAt: new Date(trialState.expiresAt!).toISOString(),
      daysRemaining: 1,
      lastValidated: Date.now(),
      offlineValidUntil: trialState.expiresAt,
      user: null,
    }
    log.info("Using hardware-locked 1-day trial")
    emitChange()
    return state
  }

  state = {
    valid: false,
    planId: null,
    expiresAt: null,
    daysRemaining: 0,
    lastValidated: 0,
    offlineValidUntil: null,
    user: null,
  }
  emitChange()
  return state
}

function validateOnline(token: string): Promise<SubscriptionState | null> {
  return new Promise((resolve, reject) => {
    const req = net.request({
      url: VALIDATE_URL,
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    })

    let body = ""
    req.on("response", (res) => {
      res.on("data", (chunk) => { body += chunk.toString() })
      res.on("end", () => {
        try {
          const data = JSON.parse(body)

          // Handle banned user (403 from server)
          if (res.statusCode === 403 || data.message?.toLowerCase().includes('banned')) {
            resolve({
              valid: false,
              banned: true,
              banMessage: data.message || 'Account is banned',
              planId: null,
              expiresAt: null,
              daysRemaining: 0,
              lastValidated: Date.now(),
              offlineValidUntil: null,
              user: null,
            })
            return
          }

          if (data.valid) {
            resolve({
              valid: true,
              planId: data.planId,
              expiresAt: data.expiresAt,
              daysRemaining: data.daysRemaining,
              lastValidated: Date.now(),
              offlineValidUntil: null,
              user: data.user,
            })
          } else {
            resolve({
              valid: false,
              planId: null,
              expiresAt: null,
              daysRemaining: 0,
              lastValidated: Date.now(),
              offlineValidUntil: null,
              user: null,
            })
          }
        } catch {
          reject(new Error("Invalid response"))
        }
      })
    })

    req.on("error", reject)
    req.write(JSON.stringify({}))
    req.end()
  })
}

export function startHeartbeat(getToken: () => string | null | Promise<string | null>): void {
  stopHeartbeat()
  heartbeatTimer = setInterval(async () => {
    const token = await Promise.resolve(getToken())
    if (token) {
      log.info("Subscription heartbeat check")
      await validateSubscription(token, true)
    }
  }, HEARTBEAT_INTERVAL)
  log.info("Subscription heartbeat started", { intervalMs: HEARTBEAT_INTERVAL })
}

export function stopHeartbeat(): void {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer)
    heartbeatTimer = null
  }
}

export function isSubscriptionValid(): boolean {
  if (!state.valid) return false
  // Check offline grace period
  if (state.offlineValidUntil && Date.now() > state.offlineValidUntil) return false
  return true
}
