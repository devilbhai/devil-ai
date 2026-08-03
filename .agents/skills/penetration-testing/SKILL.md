---
name: penetration-testing
description: Ethical hacking and penetration testing - reconnaissance, exploitation, privilege escalation, reporting.
---

# Penetration Testing

## When to Apply
Use this skill for authorized security testing, vulnerability assessment, or penetration testing engagements.

## Core Concepts
- Reconnaissance (passive and active)
- Scanning and enumeration
- Exploitation techniques
- Privilege escalation
- Post-exploitation
- Lateral movement
- Reporting and documentation

## Legal Requirements
- ALWAYS get written authorization
- Define scope clearly
- Stay within authorized boundaries
- Document everything
- Report all findings
- Do not cause unnecessary damage

## Testing Methodology
1. **Reconnaissance**
 - OSINT gathering
 - DNS enumeration
 - Port scanning
 - Service identification

2. **Scanning**
 - Vulnerability scanning
 - Web application scanning
 - Network mapping

3. **Exploitation**
 - Exploit known vulnerabilities
 - Web application attacks
 - Social engineering (with authorization)

4. **Post-Exploitation**
 - Privilege escalation
 - Data exfiltration (controlled)
 - Persistence mechanisms

5. **Reporting**
 - Executive summary
 - Technical findings
 - Remediation recommendations
 - Risk assessment

## Common Tools
- Nmap - Network scanning
- Burp Suite - Web application testing
- Metasploit - Exploitation framework
- John the Ripper - Password cracking
- Wireshark - Network analysis
- Nikto - Web server scanner

## Reporting Template
```markdown
# Penetration Test Report

## Executive Summary
Brief overview of findings and risk level.

## Scope
- Target systems
- Testing period
- Authorization details

## Findings
### Critical
- Finding 1
- Impact
- Remediation

### High
- Finding 2
...

## Recommendations
Prioritized list of improvements.
```
