---
name: secret-vault
description: Secure storage. Encryption at rest, access control, audit logging.
---

# Secret Vault

## When to Apply

- Storing sensitive information securely
- Managing API keys and credentials
- Encrypting data at rest
- Controlling access to secrets
- Maintaining audit logs

## Core Concepts

- **Encryption at Rest**: Protecting stored data
- **Access Control**: Role-based permissions
- **Audit Logging**: Tracking secret access
- **Secret Rotation**: Regular credential updates
- **Secure Transmission**: Encrypted data transfer

## Implementation

```typescript
interface Secret {
  id: string
  name: string
  value: string
  encryptedValue: string
  metadata: Record<string, string>
  createdAt: Date
  lastAccessed: Date
  expiresAt?: Date
  rotationPolicy?: RotationPolicy
}

interface RotationPolicy {
  intervalDays: number
  lastRotated: Date
  autoRotate: boolean
}

interface AccessLog {
  secretId: string
  userId: string
  action: 'read' | 'write' | 'delete' | 'rotate'
  timestamp: Date
  ipAddress: string
  userAgent: string
}

interface VaultPermission {
  secretId: string
  userId: string
  permissions: ('read' | 'write' | 'delete')[]
  expiresAt?: Date
}

async function encryptSecret(
  value: string,
  encryptionKey: string
): Promise<string> {
  // In real implementation, use proper encryption library
  // This is a mock implementation
  const encoder = new TextEncoder()
  const data = encoder.encode(value)
  
  // Simple XOR encryption for demonstration (NOT secure for production)
  const keyBytes = encoder.encode(encryptionKey)
  const encrypted = new Uint8Array(data.length)
  
  for (let i = 0; i < data.length; i++) {
    encrypted[i] = data[i] ^ keyBytes[i % keyBytes.length]
  }
  
  return Buffer.from(encrypted).toString('base64')
}

async function decryptSecret(
  encryptedValue: string,
  encryptionKey: string
): Promise<string> {
  // In real implementation, use proper decryption library
  const encoder = new TextEncoder()
  const encrypted = Buffer.from(encryptedValue, 'base64')
  
  const keyBytes = encoder.encode(encryptionKey)
  const decrypted = new Uint8Array(encrypted.length)
  
  for (let i = 0; i < encrypted.length; i++) {
    decrypted[i] = encrypted[i] ^ keyBytes[i % keyBytes.length]
  }
  
  return new TextDecoder().decode(decrypted)
}

function logAccess(
  secretId: string,
  userId: string,
  action: 'read' | 'write' | 'delete' | 'rotate',
  ipAddress: string,
  userAgent: string
): AccessLog {
  return {
    secretId,
    userId,
    action,
    timestamp: new Date(),
    ipAddress,
    userAgent,
  }
}
```

## Best Practices

1. Encrypt all secrets at rest and in transit
2. Implement least-privilege access control
3. Rotate secrets regularly
4. Monitor and audit secret access
5. Use hardware security modules for critical keys
6. Backup secrets securely
7. Implement secret versioning
8. Use short-lived credentials when possible
9. Regularly review access permissions
10. Have incident response plan for breaches