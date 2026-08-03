import * as crypto from "node:crypto"

const ALGORITHM = "aes-256-gcm"

function getSecretKey(): Buffer {
	const secret = process.env.TOKEN_SECRET
	if (!secret) {
		throw new Error(
			"FATAL: TOKEN_SECRET environment variable is required. Refusing to start without it.",
		)
	}

	// Ensure the secret is exactly 32 bytes for AES-256
	if (secret.length === 32) {
		return Buffer.from(secret, "utf-8")
	} else if (secret.length === 64) {
		// If it's hex
		return Buffer.from(secret, "hex")
	} else {
		// Hash it to exactly 32 bytes if it's an arbitrary string
		return crypto.createHash("sha256").update(secret).digest()
	}
}

export function encryptToken(text: string): string {
	if (!text) return text

	const key = getSecretKey()
	const iv = crypto.randomBytes(12) // GCM standard IV size

	const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
	let encrypted = cipher.update(text, "utf8", "base64")
	encrypted += cipher.final("base64")

	const authTag = cipher.getAuthTag().toString("base64")

	// Format: iv:authTag:encrypted
	return `${iv.toString("base64")}:${authTag}:${encrypted}`
}

export function decryptToken(encryptedString: string): string {
	if (!encryptedString || !encryptedString.includes(":")) return encryptedString

	try {
		const parts = encryptedString.split(":")
		if (parts.length !== 3) throw new Error("Invalid encrypted string format")

		const [ivBase64, authTagBase64, encryptedBase64] = parts

		const key = getSecretKey()
		const iv = Buffer.from(ivBase64, "base64")
		const authTag = Buffer.from(authTagBase64, "base64")

		const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
		decipher.setAuthTag(authTag)

		let decrypted = decipher.update(encryptedBase64, "base64", "utf8")
		decrypted += decipher.final("utf8")

		return decrypted
	} catch (error) {
		console.error("Failed to decrypt token:", error)
		throw new Error("Token decryption failed")
	}
}
