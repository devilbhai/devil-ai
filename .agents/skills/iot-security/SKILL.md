---
name: iot-security
description: IoT device security - firmware analysis, hardware hacking, protocol testing, and embedded system security.
---

# IoT Security

## When to Apply
Use this skill for IoT device security assessments, firmware analysis, hardware hacking, and embedded system security testing.

## Core Concepts
- Firmware analysis and extraction
- Hardware interface exploitation
- IoT protocol security (MQTT, CoAP, BLE, Zigbee)
- Cloud API security
- Device authentication testing
- Network security of IoT devices

## Firmware Analysis
- Firmware extraction (JTAG, UART, SPI)
- File system extraction (binwalk)
- Binary analysis (Ghidra, radare2)
- Hardcoded credentials discovery
- Configuration file analysis
- Update mechanism testing

## Hardware Hacking
- UART console access
- JTAG debugging
- SPI flash reading
- I2C communication
- Voltage glitching
- Side-channel analysis

## IoT Protocols
- **MQTT** - Message Queuing Telemetry Transport
- **CoAP** - Constrained Application Protocol
- **BLE** - Bluetooth Low Energy
- **Zigbee** - Home automation
- **LoRaWAN** - Long range, low power
- **NB-IoT** - Narrowband IoT

## Common Vulnerabilities
- Default credentials
- Hardcoded API keys
- Insecure firmware updates
- Lack of encryption
- Weak authentication
- Insecure cloud APIs
- Local network vulnerabilities
- Physical access exploits

## Tools
- Ghidra - Firmware reverse engineering
- radare2 - Binary analysis
- binwalk - Firmware extraction
- Firmwalker - Firmware file search
- FACT - Firmware analysis toolkit
- GQRTL - SDR analysis
- HackRF - Software defined radio
- Bus Pirate - Hardware hacking

## Testing Methodology
1. Reconnaissance - Device identification
2. Firmware acquisition - Extract firmware
3. Firmware analysis - Find vulnerabilities
4. Hardware analysis - Interface discovery
5. Network analysis - Protocol testing
6. Cloud analysis - API testing
7. Exploitation - Prove impact
8. Reporting - Document findings

## Security Recommendations
- Implement secure boot
- Use encrypted firmware updates
- Implement device authentication
- Encrypt data at rest and in transit
- Disable unused interfaces
- Implement secure key storage
- Regular security updates