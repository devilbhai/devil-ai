/**
 * Encryption utilities for Devil AI
 * 
 * Uses Web Crypto API for AES-GCM encryption.
 * All sensitive data is encrypted before storage.
 * 
 * @module crypto
 */

const ALGORITHM = "AES-GCM"
const KEY_LENGTH = 256
const IV_LENGTH = 12

// ============================================================
// Key Management
// ============================================================

/**
 * Derive an encryption key from a password
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
 const encoder = new TextEncoder()
 const keyMaterial = await crypto.subtle.importKey(
  "raw",
  encoder.encode(password),
  "PBKDF2",
  false,
  ["deriveKey"]
 )

 return crypto.subtle.deriveKey(
  {
   name: "PBKDF2",
   salt: salt as unknown as ArrayBuffer,
   iterations: 100000,
   hash: "SHA-256",
  },
  keyMaterial,
  { name: ALGORITHM, length: KEY_LENGTH },
  false,
  ["encrypt", "decrypt"]
 )
}

/**
 * Get or create device-specific encryption key
 */
async function getDeviceKey(): Promise<string> {
 let deviceId = localStorage.getItem("devil-ai-device-id")
 if (!deviceId) {
  deviceId = crypto.randomUUID()
  localStorage.setItem("devil-ai-device-id", deviceId)
 }
 
 // Use device ID for key derivation — the key is device-bound
 return deviceId
}

// ============================================================
// Encryption/Decryption
// ============================================================

/**
 * Encrypt data using AES-GCM
 */
export async function encrypt(data: string): Promise<string> {
 try {
  const key = await getDeviceKey()
  const salt = crypto.getRandomValues(new Uint8Array(16))
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH))
  
  const cryptoKey = await deriveKey(key, salt)
  const encoder = new TextEncoder()
  
  const encrypted = await crypto.subtle.encrypt(
   { name: ALGORITHM, iv },
   cryptoKey,
   encoder.encode(data)
  )
  
  // Combine salt + iv + encrypted data
  const result = new Uint8Array(salt.length + iv.length + encrypted.byteLength)
  result.set(salt, 0)
  result.set(iv, salt.length)
  result.set(new Uint8Array(encrypted), salt.length + iv.length)
  
  // Convert to base64
  return btoa(String.fromCharCode(...result))
 } catch (err) {
  console.error("Encryption failed:", err)
  throw new Error("Encryption failed")
 }
}

/**
 * Decrypt data using AES-GCM
 */
export async function decrypt(encryptedData: string): Promise<string> {
 try {
  const key = await getDeviceKey()
  
  // Convert from base64
  const data = Uint8Array.from(atob(encryptedData), (c) => c.charCodeAt(0))
  
  // Extract salt, iv, and encrypted data
  const salt = data.slice(0, 16)
  const iv = data.slice(16, 16 + IV_LENGTH)
  const encrypted = data.slice(16 + IV_LENGTH)
  
  const cryptoKey = await deriveKey(key, salt)
  
  const decrypted = await crypto.subtle.decrypt(
   { name: ALGORITHM, iv },
   cryptoKey,
   encrypted
  )
  
  const decoder = new TextDecoder()
  return decoder.decode(decrypted)
 } catch (err) {
  console.error("Decryption failed:", err)
  throw new Error("Decryption failed")
 }
}

/**
 * Hash data using SHA-256
 */
export async function hash(data: string): Promise<string> {
 const encoder = new TextEncoder()
 const hashBuffer = await crypto.subtle.digest("SHA-256", encoder.encode(data))
 const hashArray = Array.from(new Uint8Array(hashBuffer))
 return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("")
}

/**
 * Generate a random token
 */
export function generateToken(length: number = 32): string {
 const array = new Uint8Array(length)
 crypto.getRandomValues(array)
 return Array.from(array, (b) => b.toString(16).padStart(2, "0")).join("")
}
