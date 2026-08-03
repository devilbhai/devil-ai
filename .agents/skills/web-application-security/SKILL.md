---
name: web-application-security
description: Web application security - OWASP Top 10, XSS, SQLi, CSRF, SSRF, authentication bypass, and web app hardening.
---

# Web Application Security

## When to Apply
Use this skill for web application security testing, vulnerability assessment, and hardening of web applications.

## Core Concepts
- OWASP Top 10 (2021)
- Injection attacks
- Broken authentication
- Sensitive data exposure
- XML External Entities (XXE)
- Broken access control
- Security misconfiguration
- Cross-Site Scripting (XSS)
- Insecure deserialization
- Using components with known vulnerabilities
- Insufficient logging and monitoring

## OWASP Top 10 (2021)
1. **A01:2021 - Broken Access Control**
2. **A02:2021 - Cryptographic Failures**
3. **A03:2021 - Injection**
4. **A04:2021 - Insecure Design**
5. **A05:2021 - Security Misconfiguration**
6. **A06:2021 - Vulnerable Components**
7. **A07:2021 - Auth Failures**
8. **A08:2021 - Data Integrity Failures**
9. **A09:2021 - Logging Failures**
10. **A10:2021 - SSRF**

## Injection Attacks
- SQL Injection (SQLi)
- NoSQL Injection
- LDAP Injection
- XPath Injection
- Command Injection
- CRLF Injection

## XSS Types
- Reflected XSS
- Stored XSS
- DOM-based XSS
- Blind XSS
- Mutation XSS (mXSS)

## Authentication Testing
- Brute force attacks
- Credential stuffing
- Session management flaws
- JWT vulnerabilities
- OAuth misconfigurations
- Password reset flaws

## Tools
- **Burp Suite** - Web security proxy
- **OWASP ZAP** - Web security scanner
- **Nuclei** - Vulnerability scanner
- **SQLMap** - SQL injection
- **Dalfox** - XSS scanner
- **FFUF** - Web fuzzing
- **Nikto** - Web server scanner
- **Wapiti** - Web app scanner

## Testing Methodology
1. Reconnaissance
2. Scanning
3. Vulnerability analysis
4. Exploitation
5. Post-exploitation
6. Reporting

## Secure Development
- Input validation
- Output encoding
- Parameterized queries
- CSRF tokens
- Content Security Policy
- Secure headers
- HTTPS everywhere
- Security logging
