---
name: mobile-security
description: Mobile application security - Android and iOS app testing, reverse engineering, certificate pinning bypass, and runtime analysis.
---

# Mobile Security

## When to Apply
Use this skill for Android and iOS application security testing, mobile app reverse engineering, and runtime analysis.

## Core Concepts
- Android application security
- iOS application security
- Mobile app reverse engineering
- Certificate pinning bypass
- Runtime analysis and hooking
- Secure data storage testing

## Android Security
- APK decompilation and analysis
- Manifest analysis (AndroidManifest.xml)
- Permission analysis
- Intent filtering vulnerabilities
- Content provider security
- SQLite database security
- Shared preferences security
- Root detection bypass

## iOS Security
- IPA extraction and analysis
- Info.plist analysis
- Keychain security
- Jailbreak detection bypass
- URL scheme vulnerabilities
- App Transport Security (ATS)
- Data protection classes

## Reverse Engineering
- APK decompilation (apktool, jadx)
- IPA extraction (ipainstaller, frida)
- Smali/Java code analysis
- Swift/Objective-C analysis
- Binary analysis (Hopper, IDA)

## Certificate Pinning Bypass
- Frida scripts for pinning bypass
- Objection runtime exploration
- Custom CA certificate installation
- Network security config analysis

## Runtime Analysis
- Frida dynamic instrumentation
- Method hooking and swizzling
- Memory inspection
- Process dumping
- Anti-debugging bypass

## Common Vulnerabilities
- Insecure data storage
- Insecure communication
- Insecure authentication
- Insufficient cryptography
- Insecure authorization
- Client-side injection
- Code tampering
- Reverse engineering

## Tools
- MobSF - Mobile Security Framework
- Frida - Dynamic instrumentation
- Objection - Runtime exploration
- Apktool - APK decompilation
- jadx - Java decompiler
- Ghidra - Binary analysis
- Burp Suite - Network proxy
- SSL Kill Switch - Pinning bypass

## Testing Checklist
- Data storage security
- Network communication security
- Authentication mechanisms
- Authorization controls
- Cryptographic implementations
- Code obfuscation effectiveness
- Anti-tampering mechanisms
- Privacy compliance
