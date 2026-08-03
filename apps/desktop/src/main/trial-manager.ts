import { app } from "electron"
import path from "path"
import fs from "fs"
import crypto from "crypto"

// We store the trial start time in a hidden file in the user data directory
const TRIAL_FILE = path.join(app.getPath("userData"), ".devil-ai-trial")
const TRIAL_DURATION_MS = 24 * 60 * 60 * 1000 // 1 day

export function getTrialState() {
  try {
    if (!fs.existsSync(TRIAL_FILE)) {
      return { hasStarted: false, isActive: false, timeRemaining: 0, expiresAt: null }
    }
    const data = fs.readFileSync(TRIAL_FILE, "utf-8")
    const { startedAt } = JSON.parse(data)
    
    const now = Date.now()
    const expiresAt = startedAt + TRIAL_DURATION_MS
    const timeRemaining = Math.max(0, expiresAt - now)
    const isActive = timeRemaining > 0

    return { hasStarted: true, isActive, timeRemaining, expiresAt }
  } catch (err) {
    return { hasStarted: false, isActive: false, timeRemaining: 0, expiresAt: null }
  }
}

export function startTrial() {
  const state = getTrialState()
  if (state.hasStarted) {
    return state
  }

  const startedAt = Date.now()
  fs.writeFileSync(TRIAL_FILE, JSON.stringify({ startedAt, deviceId: getDeviceId() }), "utf-8")
  
  return getTrialState()
}

function getDeviceId() {
  // A simple machine ID based on network interfaces or just a random persistent ID if not available
  try {
    const { machineIdSync } = require("node-machine-id")
    return machineIdSync()
  } catch {
    return crypto.randomBytes(16).toString("hex")
  }
}
