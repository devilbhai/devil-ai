---
name: ssl-certificates
description: SSL/TLS certificate management. Covers Let's Encrypt, certificate installation, auto-renewal, wildcard certs, intermediate certs.
---

# SSL/TLS Certificates

## When to Apply
Use this skill when setting up SSL/TLS certificates, configuring HTTPS, renewing certificates, or troubleshooting certificate issues.

## Core Concepts
- Certificate Types: DV, OV, EV validation levels
- Let's Encrypt: Free, automated certificate authority
- ACME Protocol: Automated certificate management
- Certificate Chains: Root, intermediate, and leaf certificates
- CSR (Certificate Signing Request): Request for certificate issuance
- Wildcard Certificates: Covering multiple subdomains
- SAN (Subject Alternative Names): Multiple domains on one cert
- OCSP Stapling: Optimized certificate validation

## Implementation
```bash
# Certbot - Let's Encrypt
# Install certbot
apt install certbot python3-certbot-nginx -y

# Obtain certificate
certbot --nginx -d example.com -d www.example.com

# Wildcard certificate (DNS challenge)
certbot certonly --manual --preferred-challenges dns \
  -d "*.example.com" -d example.com

# Auto-renewal
certbot renew --dry-run

# Check certificate
openssl x509 -in /etc/letsencrypt/live/example.com/fullchain.pem -text -noout

# Certificate chain verification
openssl verify -CAfile /etc/letsencrypt/live/example.com/chain.pem \
  /etc/letsencrypt/live/example.com/fullchain.pem

# Nginx SSL configuration
ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;
ssl_protocols TLSv1.2 TLSv1.3;
ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
ssl_prefer_server_ciphers off;

# OCSP Stapling
ssl_stapling on;
ssl_stapling_verify on;
resolver 8.8.8.8 8.8.4.4 valid=300s;
```

## Best Practices
- Use Let's Encrypt for free, automated certificates
- Set up automatic renewal with cron or systemd timer
- Use fullchain.pem (certificate + intermediates) not just cert.pem
- Enable OCSP stapling for faster validation
- Use TLS 1.2 and 1.3 only, disable older versions
- Test SSL configuration with SSL Labs or similar tools
- Keep private keys secure with proper file permissions
- Use wildcard certificates for multiple subdomains
- Monitor certificate expiration dates
- Use DNS-01 challenge for wildcard certificates
- Backup certificates and private keys securely
- Document certificate locations and renewal processes