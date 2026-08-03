---
name: scada-ics-security
description: SCADA/ICS security - industrial control system testing, PLC programming analysis, OT network security, and critical infrastructure protection.
---

# SCADA/ICS Security

## When to Apply
Use this skill for industrial control system (ICS) security assessments, SCADA system testing, PLC analysis, and operational technology (OT) network security.

## Core Concepts
- Industrial Control System (ICS) architecture
- SCADA system security
- PLC/HMI security testing
- OT network segmentation
- Protocol security (Modbus, DNP3, OPC)
- Critical infrastructure protection

## ICS Architecture
- **Level 0** - Physical process
- **Level 1** - PLCs, RTUs, sensors
- **Level 2** - Control systems (HMI, SCADA)
- **Level 3** - Site operations (historian, MES)
- **Level 4** - Enterprise network
- **Level 5** - Internet/cloud

## OT Protocols
- **Modbus** - Serial/TCP (no authentication)
- **DNP3** - Power grid communication
- **OPC** - Industrial interoperability
- **BACnet** - Building automation
- **EtherNet/IP** - Industrial Ethernet
- **PROFINET** - Industrial Ethernet
- **IEC 61850** - Substation automation

## Common Vulnerabilities
- Default credentials on PLCs/HMIs
- Unencrypted protocols
- Lack of authentication
- Flat network architecture
- Unpatched systems
- Remote access without VPN
- USB attack vectors
- Supply chain attacks

## Testing Methodology
1. Passive reconnaissance (network sniffing)
2. Network mapping (OT-specific tools)
3. Protocol analysis
4. PLC/HMI enumeration
5. Vulnerability identification
6. Controlled exploitation
7. Impact assessment
8. Remediation planning

## Tools
- **Nmap** with ICS scripts (NSE)
- **Metasploit** ICS modules
- **Wireshark** with ICS dissectors
- **Modbus tools** (mbtget, modbus-cli)
- **PLC IDEs** (for analysis)
- **RedHat ICS** toolkit
- **GRFICSv2** - ICS simulation

## Safety Considerations
- NEVER test production systems without authorization
- Use simulation environments when possible
- Have emergency stop procedures
- Coordinate with operations team
- Document all actions
- Consider safety implications of all tests

## Defense Strategies
- Network segmentation (Purdue model)
- Defense-in-depth architecture
- Monitoring and anomaly detection
- Regular patching (when possible)
- Access control and authentication
- Incident response planning
- Backup and recovery procedures
