---
name: password-manager
description: Password management. Secure storage, generation, breach monitoring.
---

# Password Manager

## When to Apply

- Storing passwords securely
- Generating strong passwords
- Monitoring for password breaches
- Managing credentials across accounts
- Implementing password policies

## Core Concepts

- **Secure Storage**: Encrypted password vault
- **Password Generation**: Creating strong, unique passwords
- **Breach Monitoring**: Checking for compromised credentials
- **Auto-fill**: Browser and app integration
- **Password Policies**: Complexity requirements, expiration

## Implementation

```typescript
interface PasswordEntry {
  id: string
  site: string
  username: string
  password: string
  url?: string
  notes?: string
  category: string
  lastUsed: Date
  lastModified: Date
  strength: number
  isCompromised: boolean
}

interface PasswordPolicy {
  minLength: number
  requireUppercase: boolean
  requireLowercase: boolean
  requireNumbers: boolean
  requireSpecialChars: boolean
  maxAge: number // days
}

function generatePassword(policy: PasswordPolicy): string {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
  const lowercase = 'abcdefghijklmnopqrstuvwxyz'
  const numbers = '0123456789'
  const special = '!@#$%^&*()_+-=[]{}|;:,.<>?'
  
  let chars = ''
  let password = ''
  
  if (policy.requireUppercase) {
    chars += uppercase
    password += uppercase[Math.floor(Math.random() * uppercase.length)]
  }
  
  if (policy.requireLowercase) {
    chars += lowercase
    password += lowercase[Math.floor(Math.random() * lowercase.length)]
  }
  
  if (policy.requireNumbers) {
    chars += numbers
    password += numbers[Math.floor(Math.random() * numbers.length)]
  }
  
  if (policy.requireSpecialChars) {
    chars += special
    password += special[Math.floor(Math.random() * special.length)]
  }
  
  // Fill remaining length
  while (password.length < policy.minLength) {
    password += chars[Math.floor(Math.random() * chars.length)]
  }
  
  // Shuffle password
  return password
    .split('')
    .sort(() => Math.random() - 0.5)
    .join('')
}

function calculatePasswordStrength(password: string): number {
  let strength = 0
  
  if (password.length >= 8) strength += 1
  if (password.length >= 12) strength += 1
  if (/[A-Z]/.test(password)) strength += 1
  if (/[a-z]/.test(password)) strength += 1
  if (/[0-9]/.test(password)) strength += 1
  if (/[^A-Za-z0-9]/.test(password)) strength += 1
  
  return Math.min(6, strength)
}

function checkPasswordBreach(password: string): boolean {
  // In real implementation, use Have I Been Pwned API
  // This is a mock implementation
  const commonPasswords = ['password', '123456', 'qwerty']
  return commonPasswords.includes(password.toLowerCase())
}
```

## Best Practices

1. Use unique passwords for every account
2. Enable two-factor authentication when available
3. Regularly update passwords for critical accounts
4. Use a password manager to store credentials
5. Avoid sharing passwords via insecure channels
6. Check for password breaches regularly
7. Use strong, complex passwords
8. Don't reuse passwords across different sites
9. Secure your master password carefully
10. Backup your password vault regularly