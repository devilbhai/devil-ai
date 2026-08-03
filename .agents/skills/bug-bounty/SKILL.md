---
name: bug-bounty
description: Bug bounty hunting methodology - target reconnaissance, vulnerability discovery, report writing, and maximizing bounty rewards.
---

# Bug Bounty Hunting

## When to Apply
Use this skill for participating in bug bounty programs, discovering vulnerabilities in authorized targets, and writing effective vulnerability reports.

## Core Concepts
- Program scope and rules analysis
- Passive and active reconnaissance
- Vulnerability identification and validation
- Impact assessment
- Report writing for maximum bounty
- Responsible disclosure

## Methodology
1. **Scope Analysis**
   - Read program rules carefully
   - Identify in-scope assets
   - Understand excluded攻击vectors
   - Note special requirements

2. **Reconnaissance**
   - Subdomain enumeration (subfinder, amass, dnsx)
   - Port scanning (nmap, masscan)
   - Technology fingerprinting (httpx, wappalyzer)
   - URL harvesting (waybackurls, gau)
   - JavaScript analysis

3. **Vulnerability Discovery**
   - IDOR testing
   - Authentication bypass
   - XSS (reflected, stored, DOM)
   - SQL injection
   - SSRF testing
   - File upload vulnerabilities
   - Business logic flaws

4. **Impact Assessment**
   - Data sensitivity
   - User impact
   - Business impact
   - CVSS scoring

5. **Report Writing**
   - Clear title
   - Summary with impact
   - Step-by-step reproduction
   - PoC with screenshots
   - Remediation suggestions

## High-Value Vulnerabilities
- Remote Code Execution (RCE)
- SQL Injection with data access
- Authentication bypass
- IDOR with sensitive data
- SSRF leading to internal access
- Stored XSS with session hijacking
- Business logic flaws with financial impact

## Tools
- subfinder, amass - Subdomain discovery
- httpx - HTTP probing
- nuclei - Vulnerability scanning
- ffuf, gobuster - Directory brute force
- sqlmap - SQL injection
- dalfox - XSS scanning
- Burp Suite - Web testing proxy

## Report Template
```markdown
# [Vulnerability Type] in [Endpoint]

## Summary
Brief description of the vulnerability.

## Impact
What an attacker can achieve.

## Steps to Reproduce
1. Step 1
2. Step 2
3. Step 3

## Proof of Concept
Screenshots/requests/responses.

## Remediation
How to fix the issue.
```

## Tips for Higher Bounties
- Focus on business logic flaws
- Chain multiple low-severity issues
- Demonstrate real-world impact
- Provide clear fix suggestions
- Be professional in communication