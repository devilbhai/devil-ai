---
name: red-team-ops
description: Advanced red team operations - C2 infrastructure, persistence, lateral movement, evasion techniques, and full adversary emulation.
---

# Red Team Operations

## When to Apply
Use this skill for authorized red team engagements, adversary emulation, and advanced persistent threat (APT) simulation.

## Core Concepts
- Command and Control (C2) infrastructure setup
- Initial access vectors and delivery mechanisms
- Persistence mechanisms (registry, scheduled tasks, WMI)
- Privilege escalation (Windows/Linux/macOS)
- Lateral movement techniques
- Defense evasion and anti-forensics
- Data exfiltration methods
- Operational security (OPSEC)

## Legal Requirements
- ALWAYS get written Rules of Engagement (RoE)
- Define clear scope and boundaries
- Establish communication channels and escalation procedures
- Document all actions with timestamps
- Have an emergency halt procedure

## C2 Frameworks
- Sliver, Metasploit, Cobalt Strike, Havoc

## Attack Lifecycle (MITRE ATT&CK)
1. Reconnaissance
2. Resource Development
3. Initial Access
4. Execution
5. Persistence
6. Privilege Escalation
7. Defense Evasion
8. Credential Access
9. Discovery
10. Lateral Movement
11. Collection
12. Exfiltration
13. Impact

## Tools
- Sliver, Metasploit - C2
- Chisel, Ligolo-ng - Tunneling
- BloodHound - AD enumeration
- Certipy - Certificate abuse
- Impacket - Protocol attacks
