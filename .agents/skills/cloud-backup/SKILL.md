---
name: cloud-backup
description: Cloud backup systems. Storage providers, encryption, scheduling, restoration.
---

# Cloud Backup

## When to Apply
Use this skill when implementing cloud backup solutions, data export/import features, or disaster recovery systems.

## Core Concepts
- **Storage providers**: S3, GCS, Azure Blob, R2
- **Encryption**: AES-256 encryption at rest and in transit
- **Compression**: gzip, brotli for reduced storage costs
- **Scheduling**: Cron-based or interval-based backup jobs
- **Versioning**: Keep multiple backup versions for point-in-time recovery

## Implementation
```typescript
// Backup metadata
interface BackupManifest {
  id: string
  timestamp: number
  size: number
  checksum: string
  encrypted: boolean
  files: string[]
}

// Encrypt backup
import crypto from "node:crypto"

function encryptBackup(data: Buffer, key: string): Buffer {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv("aes-256-gcm", Buffer.from(key, "hex"), iv)
  const encrypted = Buffer.concat([cipher.update(data), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, encrypted])
}

function decryptBackup(data: Buffer, key: string): Buffer {
  const iv = data.subarray(0, 16)
  const tag = data.subarray(16, 32)
  const encrypted = data.subarray(32)
  const decipher = crypto.createDecipheriv("aes-256-gcm", Buffer.from(key, "hex"), iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(encrypted), decipher.final()])
}

// Schedule backups
function scheduleBackup(intervalMs: number, backupFn: () => Promise<void>) {
  setInterval(backupFn, intervalMs)
}
```

## Best Practices
- Test restoration regularly — untested backups are not backups
- Use 3-2-1 rule: 3 copies, 2 media types, 1 offsite
- Encrypt backups with user-provided or environment-based keys
- Verify checksums after upload to ensure integrity
- Implement incremental backups to reduce storage costs
- Set retention policies to automatically delete old backups
