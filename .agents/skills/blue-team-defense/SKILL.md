---
name: blue-team-defense
description: Security operations center (SOC) defense - SIEM, threat hunting, incident detection, log analysis, and defense-in-depth strategies.
---

# Blue Team Defense

## When to Apply
Use this skill for security monitoring, threat detection, incident response, and building defensive security infrastructure.

## Core Concepts
- Security Information and Event Management (SIEM)
- Threat hunting and proactive detection
- Log aggregation and analysis
- Network monitoring and IDS/IPS
- Endpoint detection and response (EDR)
- Security orchestration (SOAR)
- Defense-in-depth architecture

## SIEM Platforms
- **Splunk** - Enterprise SIEM
- **ELK Stack** - Elasticsearch, Logstash, Kibana
- **Wazuh** - Open source XDR/SIEM
- **Microsoft Sentinel** - Cloud-native SIEM
- **QRadar** - IBM enterprise SIEM

## Threat Detection Rules
- Sigma rules (generic detection format)
- YARA rules (malware detection)
- Snort/Suricata rules (network IDS)
- Osquery (endpoint detection)

## Log Sources to Monitor
- Windows Event Logs (4624, 4625, 4688, 4720, 4726)
- Firewall logs
- DNS logs
- Proxy logs
- Authentication logs
- Application logs
- Cloud audit logs (AWS CloudTrail, Azure AD)

## Threat Hunting Queries
- Unusual process execution
- Lateral movement indicators
- Credential dumping attempts
- Persistence mechanisms
- Data exfiltration patterns
- C2 communication indicators

## Defense Layers
1. **Perimeter** - Firewalls, WAF, email filtering
2. **Network** - IDS/IPS, segmentation, monitoring
3. **Endpoint** - EDR, antivirus, host firewall
4. **Application** - Secure coding, WAF rules
5. **Data** - Encryption, DLP, access controls
6. **Identity** - MFA, PAM, conditional access

## Incident Response Phases
1. Preparation
2. Identification
3. Containment
4. Eradication
5. Recovery
6. Lessons Learned

## Tools
- Wireshark - Packet analysis
- Zeek - Network security monitoring
- OSQuery - Endpoint queries
- Velociraptor - DFIR
- TheHive - Incident response platform
- MISP - Threat intelligence