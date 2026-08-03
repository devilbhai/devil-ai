---
name: cloudflare-management
description: Cloudflare DNS and CDN management. Covers DNS records, SSL/TLS, caching rules, firewall rules, workers, analytics.
---

# Cloudflare Management

## When to Apply
Use this skill when managing Cloudflare services including DNS configuration, SSL/TLS setup, CDN optimization, security rules, and Workers deployment.

## Core Concepts
- DNS Management: A, CNAME, MX, TXT records with proxying options
- SSL/TLS: Full, Full (Strict), Flexible modes; edge certificates
- Caching: Cache rules, purge policies, cache tiering
- Security: WAF rules, rate limiting, bot management
- Workers: Serverless edge computing
- Analytics: Traffic analysis, security insights
- Speed: Performance optimization, image optimization
- Zero Trust: Access policies, tunnel configuration

## Implementation
```bash
# Cloudflare API - List zones
curl -X GET "https://api.cloudflare.com/client/v4/zones" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json"

# Create DNS record
curl -X POST "https://api.cloudflare.com/client/v4/zones/ZONE_ID/dns_records" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{
    "type": "A",
    "name": "example.com",
    "content": "192.0.2.1",
    "ttl": 1,
    "proxied": true
  }'

# Purge cache
curl -X POST "https://api.cloudflare.com/client/v4/zones/ZONE_ID/purge_cache" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data '{"purge_everything": true}'

# Worker deployment
wrangler deploy
```

## Best Practices
- Use proxied DNS records (orange cloud) for DDoS protection
- Enable SSL/TLS Full (Strict) for maximum security
- Set appropriate cache TTLs for different content types
- Use Page Rules for specific caching needs
- Enable Brotli compression for better performance
- Configure Firewall Rules for common attack patterns
- Use Workers for edge computing needs
- Monitor analytics for traffic patterns and anomalies
- Enable Bot Fight Mode for protection
- Keep API tokens secure with minimal required permissions
- Use Zones API for bulk operations across domains
- Document DNS record purposes for team reference