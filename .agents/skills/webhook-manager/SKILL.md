---
name: webhook-manager
description: Webhook management. Endpoint configuration, payload validation, retry logic.
---

# Webhook Manager

## When to Apply
Use this skill when implementing webhook endpoints, managing webhook subscriptions, or building event-driven integrations.

## Core Concepts
- **Endpoint management**: Register, store, and manage webhook URLs
- **Payload signing**: HMAC signatures for payload verification
- **Retry logic**: Exponential backoff for failed deliveries
- **Event filtering**: Subscribe to specific event types
- **Delivery logging**: Track success/failure for each delivery

## Implementation
```typescript
// Webhook registry
interface Webhook {
  id: string
  url: string
  events: string[]
  secret: string
  active: boolean
  createdAt: number
}

// Sign payload with HMAC
import crypto from "node:crypto"

function signPayload(payload: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(payload).digest("hex")
}

// Verify incoming webhook
function verifySignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expected = signPayload(payload, secret)
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))
}

// Delivery with retry
async function deliverWithRetry(
  url: string,
  payload: string,
  maxRetries = 3
): Promise<{ success: boolean; attempts: number }> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
      })
      if (res.ok) return { success: true, attempts: attempt + 1 }
    } catch {
      // Wait before retry
      await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt))
    }
  }
  return { success: false, attempts: maxRetries + 1 }
}
```

## Best Practices
- Always verify webhook signatures before processing
- Implement idempotency keys to handle duplicate deliveries
- Log all delivery attempts with timestamps and response codes
- Use exponential backoff with jitter for retries
- Provide a webhook testing UI with payload previews
- Set delivery timeouts (10-30 seconds) to prevent hanging
