---
name: dns-management
description: DNS management across providers. Covers A/CNAME/MX/TXT records, TTL management, DNS propagation, zone transfers.
---

# DNS Management

## When to Apply
Use this skill when managing DNS records across different providers, configuring domain settings, troubleshooting DNS issues, or migrating domains between registrars.

## Core Concepts
- DNS Record Types: A, AAAA, CNAME, MX, TXT, NS, SRV, CAA
- TTL (Time to Live): How long records are cached
- DNS Propagation: Global distribution of DNS changes
- Zone Files: Complete DNS configuration for a domain
- Nameservers: Authoritative DNS servers for a domain
- DNS Resolution: How queries traverse the DNS hierarchy
- Split DNS: Different responses based on geography or network
- DNSSEC: DNS Security Extensions for validation

## Implementation
```bash
# Dig commands for DNS lookup
dig example.com A
dig example.com MX
dig example.com TXT
dig +short example.com
dig +trace example.com

# Check DNS propagation
dig @8.8.8.8 example.com
dig @1.1.1.1 example.com

# NS lookup
nslookup -type=NS example.com

# Zone transfer attempt (usually blocked)
dig axfr example.com @ns1.example.com

# DNS record types and usage
# A      - IPv4 address
# AAAA   - IPv6 address
# CNAME  - Canonical name (alias)
# MX     - Mail exchange
# TXT    - Text records (SPF, DKIM, verification)
# NS     - Nameserver
# SRV    - Service location
# CAA    - Certificate Authority Authorization
```

## Best Practices
- Use low TTL (300-600s) for records that change frequently
- Use higher TTL (3600-86400s) for stable records
- Always have at least two nameservers for redundancy
- Set up SPF, DKIM, and DMARC for email authentication
- Document all DNS records and their purposes
- Test DNS changes before increasing TTL
- Use CNAME for subdomains, A records for root domain
- Monitor DNS propagation after changes
- Keep DNS provider access secure with 2FA
- Backup DNS zone files regularly
- Use DNS health check tools regularly
- Plan DNS migrations during low-traffic periods