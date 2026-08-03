---
name: api-security
description: API security testing - OWASP API Top 10, authentication bypass, authorization flaws, injection attacks, and rate limiting.
---

# API Security

## When to Apply
Use this skill for REST API, GraphQL, and gRPC security testing, authentication/authorization testing, and API vulnerability assessment.

## Core Concepts
- OWASP API Security Top 10
- Authentication and authorization testing
- Input validation and injection attacks
- Rate limiting and abuse prevention
- API documentation security
- GraphQL-specific vulnerabilities

## OWASP API Top 10 (2023)
1. **Broken Object Level Authorization (BOLA)** - Accessing objects via ID manipulation
2. **Broken Authentication** - Weak auth mechanisms
3. **Broken Object Property Level Authorization** - Excessive data exposure
4. **Unrestricted Resource Consumption** - Missing rate limits
5. **Broken Function Level Authorization** - Admin function access
6. **Unrestricted Access to Sensitive Business Flows** - Business logic abuse
7. **Server Side Request Forgery (SSRF)** - Internal service access
8. **Security Misconfiguration** - Default configs, verbose errors
9. **Improper Inventory Management** - Old/unprotected endpoints
10. **Unsafe Consumption of APIs** - Third-party API risks

## Authentication Testing
- JWT token manipulation
- OAuth flow bypass
- API key exposure
- Session management flaws
- Token expiration bypass
- Role escalation

## Authorization Testing
- IDOR testing (BOLA)
- Horizontal privilege escalation
- Vertical privilege escalation
- Function-level access control
- Object-level access control

## Injection Attacks
- SQL injection in API parameters
- NoSQL injection
- Command injection via API
- GraphQL injection
- XML/JSON injection

## Tools
- Postman - API testing
- Burp Suite - HTTP proxy
- OWASP ZAP - API scanning
- Arjun - Parameter discovery
- Kiterunner - API endpoint discovery
- Nuclei - API vulnerability templates
- ffuf - API fuzzing

## GraphQL Security
- Introspection query abuse
- Query depth limiting
- Query complexity analysis
- Authorization bypass
- Batch query abuse

## Rate Limiting
- Token bucket algorithm
- Sliding window
- Fixed window
- Distributed rate limiting
- API gateway rate limiting
