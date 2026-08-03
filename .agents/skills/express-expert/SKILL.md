---
name: express-expert
description: Express.js framework. Middleware, routing, error handling, security, performance.
---

# Express.js Expert

## When to Apply
Use this skill when building or maintaining Express.js web applications, REST APIs, middleware chains, authentication systems, and production-ready servers.

## Core Concepts
- **Middleware**: Application-level, router-level, error-handling, third-party, custom middleware composition
- **Routing**: Route parameters, query strings, route groups, route-level middleware, versioning
- **Error Handling**: Centralized error middleware, async error catching, custom error classes
- **Security**: Helmet.js, CORS configuration, rate limiting, input sanitization, CSRF protection
- **Performance**: Compression, caching headers, response streaming, connection pooling
- **Template Engines**: Server-side rendering with EJS, Pug, or Handlebars
- **File Uploads**: Multer configuration, file validation, storage strategies

## Implementation
```javascript
import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import rateLimit from 'express-rate-limit'

const app = express()

// Security middleware
app.use(helmet())
app.use(cors({ origin: process.env.ALLOWED_ORIGINS?.split(',') }))
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }))

// Body parsing with size limits
app.use(express.json({ limit: '10kb' }))
app.use(express.urlencoded({ extended: true, limit: '10kb' }))

// Request logging and timing
app.use((req, res, next) => {
  const start = Date.now()
  res.on('finish', () => {
    const duration = Date.now() - start
    console.log(`${req.method} ${req.path} ${res.statusCode} ${duration}ms`)
  })
  next()
})

// Async error wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next)
}

// Route with validation and error handling
app.get('/api/users/:id', asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id)
  if (!user) {
    throw new AppError('User not found', 404)
  }
  res.json({ data: user })
}))

// Centralized error handling middleware
app.use((err, req, res, next) => {
  const status = err.statusCode || 500
  const message = err.isOperational ? err.message : 'Internal server error'

  if (status >= 500) {
    console.error(err)
  }

  res.status(status).json({
    error: { message, status, ...(process.env.NODE_ENV === 'development' && { stack: err.stack }) }
  })
})
```

## Best Practices
- Structure routes in separate files using `express.Router()`
- Use async error wrappers to avoid try/catch boilerplate in every route
- Validate request bodies with Zod or Joi before processing
- Return consistent JSON error response formats
- Use `express.json()` with size limits to prevent DoS attacks
- Implement request-id headers for distributed tracing
- Keep route handlers thin — delegate business logic to service layers
- Test with supertest for integration-level route verification
