---
name: encryption-manager
description: Encryption management. Key management, algorithm selection, certificate handling.
---

# Encryption Manager

## When to Apply

- Managing encryption keys
- Selecting appropriate algorithms
- Handling digital certificates
- Implementing encryption solutions
- Managing PKI infrastructure

## Core Concepts

- **Key Management**: Generation, storage, rotation
- **Algorithm Selection**: Symmetric vs asymmetric, key sizes
- **Certificate Handling**: X.509, SSL/TLS certificates
- **PKI Infrastructure**: Certificate authorities, trust chains
- **Encryption Standards**: AES, RSA, ECC, hashing

## Implementation

```typescript
interface EncryptionKey {
  id: string
  algorithm: string
  keySize: number
  publicKey?: string
  privateKey?: string
  createdAt: Date
  expiresAt: Date
  isActive: boolean
 用途: string
}

interface Certificate {
  id: string
  commonName: string
  organization: string
  issuer: string
  validFrom: Date
  validTo: Date
  serialNumber: string
  fingerprint: string
  isActive: boolean
}

interface EncryptionConfig {
  algorithm: string
  keySize: number
  mode: string
  padding: string
}

function selectAlgorithm(
  purpose: 'encryption' | 'signing' | 'keyExchange',
  securityLevel: 'low' | 'medium' | 'high'
): EncryptionConfig {
  const configs: Record<string, Record<string, EncryptionConfig>> = {
    encryption: {
      low: { algorithm: 'AES', keySize: 128, mode: 'CBC', padding: 'PKCS7' },
      medium: { algorithm: 'AES', keySize: 256, mode: 'GCM', padding: 'None' },
      high: { algorithm: 'AES', keySize: 256, mode: 'GCM', padding: 'None' },
    },
    signing: {
      low: { algorithm: 'RSA', keySize: 2048, mode: '', padding: 'PSS' },
      medium: { algorithm: 'RSA', keySize: 3072, mode: '', padding: 'PSS' },
      high: { algorithm: 'ECDSA', keySize: 384, mode: '', padding: '' },
    },
    keyExchange: {
      low: { algorithm: 'RSA', keySize: 2048, mode: '', padding: 'OAEP' },
      medium: { algorithm: 'ECDH', keySize: 256, mode: '', padding: '' },
      high: { algorithm: 'ECDH', keySize: 384, mode: '', padding: '' },
    },
  }
  
  return configs[purpose][securityLevel]
}

function generateKeyPair(algorithm: string, keySize: number): {
  publicKey: string
  privateKey: string
} {
  // In real implementation, use crypto library
  // This is a mock implementation
  return {
    publicKey: `mock-public-key-${algorithm}-${keySize}`,
    privateKey: `mock-private-key-${algorithm}-${keySize}`,
  }
}

function validateCertificate(cert: Certificate): {
  isValid: boolean
  daysUntilExpiry: number
  issues: string[]
} {
  const now = new Date()
  const daysUntilExpiry = Math.ceil(
    (cert.validTo.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  )
  
  const issues: string[] = []
  
  if (now < cert.validFrom) {
    issues.push('Certificate not yet valid')
  }
  
  if (now > cert.validTo) {
    issues.push('Certificate expired')
  }
  
  if (daysUntilExpiry < 30) {
    issues.push('Certificate expiring soon')
  }
  
  return {
    isValid: issues.length === 0,
    daysUntilExpiry,
    issues,
  }
}
```

## Best Practices

1. Use appropriate key sizes for security requirements
2. Rotate encryption keys regularly
3. Store private keys securely
4. Validate certificate chains properly
5. Monitor certificate expiration dates
6. Use strong, proven algorithms
7. Implement proper key escrow procedures
8. Follow industry standards and guidelines
9. Regular security audits of encryption practices
10. Keep encryption software updated