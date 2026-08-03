---
name: technical-architecture
description: Technical architecture - system design, architecture patterns, documentation, decision records.
---

# Technical Architecture

## When to Apply
Use this skill for system design, architecture decisions, documentation, or technical leadership.

## Core Concepts
- Architecture patterns (microservices, monolith, serverless)
- System design principles
- Architecture Decision Records (ADR)
- Technical documentation
- Performance considerations
- Scalability patterns

## Best Practices
- Document decisions with ADRs
- Consider trade-offs
- Design for change
- Keep it simple first
- Plan for failure
- Measure everything
- Security by design

## Architecture Decision Record
```markdown
# ADR-001: Use Microservices

## Status
Accepted

## Context
Our monolith is becoming difficult to scale and deploy independently.

## Decision
We will split the application into microservices.

## Consequences
### Positive
- Independent deployment
- Technology flexibility
- Better scalability

### Negative
- Increased complexity
- Network overhead
- Data consistency challenges

## Alternatives Considered
1. Modular monolith - Rejected: still coupled deployment
2. Serverless - Rejected: vendor lock-in concerns
```

## System Design Template
```markdown
# System Design: User Authentication

## Requirements
- Support 1M users
- 99.9% uptime
- < 100ms response time
- Social login support

## Architecture
┌─────────────┐
│ Load Balancer │
└──────┬──────┘
       │
┌──────┴──────┐
│ API Gateway │
└──────┬──────┘
       │
┌──────┴──────┐
│ Auth Service │
└──────┬──────┘
       │
┌──────┴──────┐
│ User DB │
└─────────────┘

## Components
- Load Balancer: NGINX
- API Gateway: Kong
- Auth Service: Node.js
- Database: PostgreSQL
- Cache: Redis

## Data Flow
1. User sends credentials
2. API Gateway routes to Auth Service
3. Auth Service validates credentials
4. Auth Service generates JWT
5. JWT returned to client

## Security Considerations
- Password hashing with bcrypt
- Rate limiting
- CORS configuration
- HTTPS enforcement
```
