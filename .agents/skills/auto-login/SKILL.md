---
name: auto-login
description: Automated authentication. Credential management, session handling, MFA support, SSO integration.
---

# Auto Login

## When to Apply
Use when automating login flows, managing credentials, handling multi-factor authentication, or integrating with SSO providers.

## Core Concepts
- **Credential management**: Secure storage and retrieval
- **Session handling**: Cookie and token management
- **MFA support**: Time-based codes, SMS, hardware keys
- **SSO integration**: OAuth, SAML, OpenID Connect
- **CAPTCHA handling**: Detection and resolution strategies
- **Session persistence**: Maintain login across sessions

## Implementation
```
1. Retrieve stored credentials securely
2. Navigate to login page
3. Fill in username/password fields
4. Submit login form
5. Handle MFA if required
6. Store session cookies/tokens
7. Verify successful authentication
```

## Best Practices
- Never log credentials in plaintext
- Use secure credential storage (keychain, vault)
- Handle MFA with user interaction when needed
- Implement session refresh before expiry
- Respect website rate limits and security measures
