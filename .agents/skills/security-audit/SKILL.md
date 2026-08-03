---
name: security-audit
description: Security auditing, OWASP Top 10, vulnerability scanning, secure coding practices, and secret detection for the Devil AI codebase.
license: MIT
metadata:
  author: devil-ai
  version: "1.0.0"
---

# Security Audit Patterns

Security auditing and secure coding practices for the Devil AI codebase.

## When to Apply

- Auditing code for vulnerabilities
- Implementing security controls
- Scanning for secrets
- Reviewing dependencies
- Hardening applications

---

## 1. OWASP Top 10

### Injection Prevention

```typescript
// ❌ Vulnerable: SQL Injection
const query = `SELECT * FROM users WHERE id = '${userId}'`

// ✅ Secure: Parameterized query
const query = "SELECT * FROM users WHERE id = ?"
db.prepare(query).get(userId)

// ❌ Vulnerable: NoSQL Injection
const user = await User.findOne({ email: req.body.email })

// ✅ Secure: Validate input
const emailSchema = z.string().email()
const email = emailSchema.parse(req.body.email)
const user = await User.findOne({ email })
```

### Broken Authentication

```typescript
// ❌ Vulnerable: Weak password hashing
const hash = await bcrypt.hash(password, 10)

// ✅ Secure: Strong hashing
const hash = await bcrypt.hash(password, 12)

// ❌ Vulnerable: Session fixation
req.session.userId = user.id

// ✅ Secure: Regenerate session
req.session.destroy()
req.session.regenerate(() => {
  req.session.userId = user.id
})
```

### Sensitive Data Exposure

```typescript
// ❌ Vulnerable: Logging sensitive data
console.log("User password:", password)

// ✅ Secure: Never log sensitive data
console.log("User authenticated:", { userId: user.id })

// ❌ Vulnerable: Storing plaintext
localStorage.setItem("token", token)

// ✅ Secure: Use secure storage
await secureStorage.encrypt("token", token)
```

### XML External Entities (XXE)

```typescript
// ❌ Vulnerable: XML parsing
import { parseString } from "xml2js"
parseString(xmlData)

// ✅ Secure: Disable external entities
import { parseString } from "xml2js"
parseString(xmlData, {
  explicitRoot: true,
  explicitCharkey: true,
  // Disable external entities
  xmlns: false,
  xmlnsPrefix: false,
})
```

### Broken Access Control

```typescript
// ❌ Vulnerable: No authorization check
app.delete("/api/users/:id", async (req, res) => {
  await User.findByIdAndDelete(req.params.id)
})

// ✅ Secure: Check authorization
app.delete("/api/users/:id", authMiddleware, async (req, res) => {
  const user = await User.findById(req.params.id)
  
  if (user.id !== req.userId && !req.isAdmin) {
    return res.status(403).json({ error: "Forbidden" })
  }
  
  await User.findByIdAndDelete(req.params.id)
})
```

### Security Misconfiguration

```typescript
// ❌ Vulnerable: Default credentials
const admin = { username: "admin", password: "admin" }

// ✅ Secure: Force password change
const admin = {
  username: "admin",
  password: await bcrypt.hash(randomPassword(), 12),
  mustChangePassword: true,
}
```

### Cross-Site Scripting (XSS)

```tsx
// ❌ Vulnerable: dangerouslySetInnerHTML
<div dangerouslySetInnerHTML={{ __html: userContent }} />

// ✅ Secure: Sanitize HTML
import DOMPurify from "dompurify"
<div dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(userContent) }} />

// ✅ Better: Use text content
<div>{userContent}</div>
```

### Insecure Deserialization

```typescript
// ❌ Vulnerable: Untrusted deserialization
const data = JSON.parse(untrustedInput)

// ✅ Secure: Validate with Zod
const schema = z.object({
  name: z.string(),
  email: z.string().email(),
})
const data = schema.parse(JSON.parse(input))
```

### Using Components with Known Vulnerabilities

```bash
# ✅ Check for vulnerable dependencies
bun audit
npm audit

# ✅ Fix vulnerabilities
bun audit fix
```

### Insufficient Logging

```typescript
// ❌ Vulnerable: No logging
async function login(email: string, password: string) {
  const user = await User.findOne({ email })
  if (!user || !await bcrypt.compare(password, user.password)) {
    throw new Error("Invalid credentials")
  }
}

// ✅ Secure: Log security events
async function login(email: string, password: string) {
  const user = await User.findOne({ email })
  
  if (!user) {
    logger.warn("Login attempt with unknown email", { email })
    throw new Error("Invalid credentials")
  }
  
  if (!await bcrypt.compare(password, user.password)) {
    logger.warn("Invalid password", { userId: user.id })
    throw new Error("Invalid credentials")
  }
  
  logger.info("Successful login", { userId: user.id })
  return user
}
```

---

## 2. Secret Detection

### Common Secrets Patterns

```typescript
// ❌ Hardcoded secrets
const API_KEY = "sk-1234567890abcdef"
const DATABASE_URL = "postgresql://user:password@localhost:5432/db"
const JWT_SECRET = "super-secret-key"

// ✅ Use environment variables
const API_KEY = process.env.API_KEY
const DATABASE_URL = process.env.DATABASE_URL
const JWT_SECRET = process.env.JWT_SECRET
```

### Secret Scanning Tools

```bash
# ✅ Use gitleaks
bunx gitleaks detect --source .

# ✅ Use truffleHog
bunx trufflehog filesystem .

# ✅ Add to pre-commit hook
# .husky/pre-commit
bunx gitleaks protect --staged --no-git
```

### Environment Variables

```bash
# ✅ .env.example (commit this)
API_KEY=
DATABASE_URL=
JWT_SECRET=

# ✅ .env (never commit)
API_KEY=sk-1234567890abcdef
DATABASE_URL=postgresql://user:password@localhost:5432/db
JWT_SECRET=super-secret-key
```

---

## 3. Input Validation

### Zod Validation

```typescript
// ✅ Validate all user input
import { z } from "zod"

const createUserSchema = z.object({
  name: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  age: z.number().int().min(0).max(150),
})

// ✅ Use in API
app.post("/users", async (req, res) => {
  const result = createUserSchema.safeParse(req.body)
  
  if (!result.success) {
    return res.status(400).json({
      error: "Validation failed",
      details: result.error.flatten().fieldErrors,
    })
  }
  
  const user = await createUser(result.data)
  res.json(user)
})
```

### Sanitization

```typescript
// ✅ Sanitize HTML input
import DOMPurify from "dompurify"

function sanitizeInput(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  })
}

// ✅ Sanitize SQL input
function sanitizeSql(input: string): string {
  return input.replace(/['";\\]/g, "")
}
```

---

## 4. Authentication Security

### Password Hashing

```typescript
// ✅ Use bcrypt with high rounds
import bcrypt from "bcrypt"

const SALT_ROUNDS = 12

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS)
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}
```

### JWT Security

```typescript
// ✅ Secure JWT implementation
import jwt from "jsonwebtoken"

const JWT_SECRET = process.env.JWT_SECRET
const JWT_EXPIRES_IN = "1h"
const REFRESH_EXPIRES_IN = "7d"

function generateTokens(user: User) {
  const accessToken = jwt.sign(
    { userId: user.id, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  )
  
  const refreshToken = jwt.sign(
    { userId: user.id },
    JWT_SECRET,
    { expiresIn: REFRESH_EXPIRES_IN }
  )
  
  return { accessToken, refreshToken }
}

function verifyToken(token: string) {
  return jwt.verify(token, JWT_SECRET)
}
```

### Rate Limiting

```typescript
// ✅ Rate limit authentication endpoints
import rateLimit from "express-rate-limit"

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: "Too many login attempts",
  standardHeaders: true,
  legacyHeaders: false,
})

app.post("/login", authLimiter, async (req, res) => {
  // Login logic
})
```

---

## 5. Authorization

### Role-Based Access Control (RBAC)

```typescript
// ✅ RBAC implementation
enum Role {
  ADMIN = "admin",
  USER = "user",
  GUEST = "guest",
}

const permissions = {
  [Role.ADMIN]: ["read", "write", "delete", "manage"],
  [Role.USER]: ["read", "write"],
  [Role.GUEST]: ["read"],
}

function checkPermission(role: Role, permission: string): boolean {
  return permissions[role]?.includes(permission) ?? false
}

// ✅ Middleware
function requirePermission(permission: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user
    
    if (!checkPermission(user.role, permission)) {
      return res.status(403).json({ error: "Insufficient permissions" })
    }
    
    next()
  }
}

// Usage
app.delete("/users/:id", requirePermission("delete"), deleteUser)
```

### Resource-Based Access Control

```typescript
// ✅ Check ownership
async function canAccessResource(userId: string, resourceId: string): Promise<boolean> {
  const resource = await getResource(resourceId)
  
  if (!resource) return false
  
  return resource.ownerId === userId
}

// Usage
app.put("/posts/:id", async (req, res) => {
  if (!await canAccessResource(req.user.id, req.params.id)) {
    return res.status(403).json({ error: "Forbidden" })
  }
  
  // Update post
})
```

---

## 6. Data Protection

### Encryption at Rest

```typescript
// ✅ Encrypt sensitive data
import crypto from "crypto"

const ALGORITHM = "aes-256-gcm"
const IV_LENGTH = 16
const TAG_LENGTH = 16

function encrypt(text: string, secret: string): string {
  const iv = crypto.randomBytes(IV_LENGTH)
  const cipher = crypto.createCipher(ALGORITHM, secret)
  
  let encrypted = cipher.update(text, "utf8", "hex")
  encrypted += cipher.final("hex")
  
  const tag = cipher.getAuthTag()
  
  return `${iv.toString("hex")}:${tag.toString("hex")}:${encrypted}`
}

function decrypt(encryptedData: string, secret: string): string {
  const [ivHex, tagHex, encrypted] = encryptedData.split(":")
  
  const iv = Buffer.from(ivHex, "hex")
  const tag = Buffer.from(tagHex, "hex")
  const decipher = crypto.createDecipher(ALGORITHM, secret)
  
  decipher.setAuthTag(tag)
  
  let decrypted = decipher.update(encrypted, "hex", "utf8")
  decrypted += decipher.final("utf8")
  
  return decrypted
}
```

### Data Masking

```typescript
// ✅ Mask sensitive data
function maskEmail(email: string): string {
  const [local, domain] = email.split("@")
  const maskedLocal = local[0] + "*".repeat(local.length - 2) + local[local.length - 1]
  return `${maskedLocal}@${domain}`
}

function maskPhone(phone: string): string {
  return phone.slice(0, -4).replace(/./g, "*") + phone.slice(-4)
}

function maskCreditCard(card: string): string {
  return card.slice(0, -4).replace(/./g, "*") + card.slice(-4)
}
```

---

## 7. Security Headers

### HTTP Security Headers

```typescript
// ✅ Set security headers
app.use((req, res, next) => {
  // Content Security Policy
  res.setHeader("Content-Security-Policy", "default-src 'self'")
  
  // X-Content-Type-Options
  res.setHeader("X-Content-Type-Options", "nosniff")
  
  // X-Frame-Options
  res.setHeader("X-Frame-Options", "DENY")
  
  // X-XSS-Protection
  res.setHeader("X-XSS-Protection", "1; mode=block")
  
  // Strict-Transport-Security
  res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains")
  
  // Referrer-Policy
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin")
  
  // Permissions-Policy
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
  
  next()
})
```

---

## 8. Audit Checklist

### Code Review Checklist

- [ ] Input validation present
- [ ] Output encoding implemented
- [ ] Authentication required
- [ ] Authorization checked
- [ ] Sensitive data encrypted
- [ ] No hardcoded secrets
- [ ] Error messages don't leak info
- [ ] Logging implemented
- [ ] Rate limiting enabled
- [ ] CORS configured properly

### Dependency Audit

```bash
# ✅ Check for vulnerabilities
bun audit

# ✅ Check for outdated packages
bun outdated

# ✅ Check licenses
bunx license-checker
```

---

## Best Practices

1. **Defense in depth** — Multiple security layers
2. **Least privilege** — Minimal permissions
3. **Validate input** — Never trust user input
4. **Encode output** — Prevent XSS
5. **Use HTTPS** — Always encrypt in transit
6. **Hash passwords** — Use bcrypt with high rounds
7. **Rate limit** — Prevent brute force
8. **Log security events** — Audit trail
9. **Keep updated** — Patch vulnerabilities
10. **Security training** — Educate team
