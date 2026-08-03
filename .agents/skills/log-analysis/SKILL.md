---
name: log-analysis
description: Log analysis and monitoring - centralized logging, anomaly detection, SIEM queries, and security event analysis.
---

# Log Analysis

## When to Apply
Use this skill for security log analysis, centralized logging setup, anomaly detection, SIEM query development, and incident investigation.

## Core Concepts
- Centralized log management
- Log parsing and normalization
- Anomaly detection
- Correlation rules
- SIEM query development
- Incident investigation

## Log Sources
- **System logs** - Windows Event, syslog, journald
- **Application logs** - Web servers, databases, custom apps
- **Security logs** - Firewall, IDS/IPS, antivirus
- **Network logs** - DNS, proxy, NetFlow
- **Cloud logs** - CloudTrail, Azure AD, GCP Audit
- **Authentication logs** - LDAP, RADIUS, SSO

## Key Log Events
- **Windows**: 4624 (logon), 4625 (failed logon), 4688 (process), 4720 (user created), 4726 (user deleted)
- **Linux**: auth.log, secure, sudo, cron
- **Web**: access.log, error.log
- **Firewall**: allowed/denied connections

## Anomaly Detection
- Baseline establishment
- Deviation detection
- Statistical analysis
- Machine learning approaches
- Threshold-based alerts

## SIEM Queries
- Splunk SPL queries
- Elastic KQL queries
- Wazuh queries
- Sigma rules
- YARA rules

## Incident Investigation
- Timeline analysis
- Log correlation
- IOC extraction
- Root cause analysis
- Impact assessment

## Tools
- **ELK Stack** - Elasticsearch, Logstash, Kibana
- **Splunk** - Enterprise SIEM
- **Wazuh** - Open source XDR
- **Graylog** - Log management
- **GoAccess** - Web log analyzer
- **LogParser** - Windows log analysis
- **Volatility** - Memory forensics

## Correlation Rules
- Multi-source correlation
- Temporal correlation
- Statistical correlation
- Behavioral correlation
- IOC correlation

## Best Practices
- Structured logging
- Log retention policies
- Log integrity protection
- Real-time alerting
- Regular review procedures
- Documentation and runbooks
