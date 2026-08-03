---
name: hacking-tools
description: "Complete guide to 185+ security testing tools from hackingtool repository for authorized penetration testing and security research"
license: MIT
metadata:
  author: Z4nzu
  source: https://github.com/Z4nzu/hackingtool
  version: "1.0"
  last_updated: "2024-12-19"
  tags:
    - security
    - penetration-testing
    - hacking
    - network-security
    - web-security
    - ethical-hacking
  platform:
    - Linux
    - macOS
    - Docker
---

# HackingTools - Complete Security Testing Toolkit

## Overview

185+ security testing tools organized into 20 categories for authorized penetration testing and security research.

**WARNING:** Only use with proper authorization. Unauthorized access to computer systems is illegal.

## Installation

```bash
# One-liner install
curl -sSL https://raw.githubusercontent.com/Z4nzu/hackingtool/master/install.sh | sudo bash

# Manual install
git clone https://github.com/Z4nzu/hackingtool.git
cd hackingtool
sudo python3 install.py

# Docker
docker build -t hackingtool .
docker run -it --rm hackingtool
```

## Tool Categories & Usage

### 1. Information Gathering (26 tools)

| Tool | Purpose | Usage |
|------|---------|-------|
| **Nmap** | Network scanner | `nmap -sV -sC target` |
| **Amass** | Subdomain enumeration | `amass enum -d example.com` |
| **Subfinder** | Subdomain discovery | `subfinder -d example.com` |
| **Masscan** | Fast port scanning | `masscan -p1-65535 target` |
| **RustScan** | Fast port scanner | `rustscan -a target` |
| **theHarvester** | Email/subdomain harvesting | `theHarvester -d example.com -b google` |
| **ReconSpider** | OSINT framework | `python3 reconspider.py -t example.com` |
| **SpiderFoot** | Automated OSINT | `spiderfoot -s example.com` |
| **Shodanfy** | IoT device search | `python3 shodanfy.py --target example.com` |
| **Holehe** | Email to account finder | `python3 holehe.py email@example.com` |
| **Maigret** | Username OSINT | `maigret username` |
| **TruffleHog** | Git secrets scanner | `trufflehog git https://github.com/repo` |
| **Gitleaks** | Code secrets scanner | `gitleaks detect --source .` |

**Use Case:** Reconnaissance, target profiling, OSINT

---

### 2. Wordlist Generation (7 tools)

| Tool | Purpose | Usage |
|------|---------|-------|
| **Cupp** | Personalized wordlist | `cupp -i` (interactive mode) |
| **WordlistCreator** | Custom wordlist generator | `python3 wordlistcreator.py` |
| **Hashcat** | Password hash cracker | `hashcat -m 0 hash.txt wordlist.txt` |
| **John the Ripper** | Password cracker | `john --wordlist=wordlist.txt hash.txt` |
| **haiti** | Hash type identifier | `haiti hash` |

**Use Case:** Password cracking, credential testing

---

### 3. Wireless Attack (13 tools)

| Tool | Purpose | Usage |
|------|---------|-------|
| **WiFi-Pumpkin** | Evil Twin attack | `wifi-pumpkin` |
| **Wifiphisher** | WiFi phishing | `wifiphisher` |
| **Wifite** | WiFi auditing | `wifite` |
| **Bettercap** | MITM framework | `bettercap -iface wlan0` |
| **Airgeddon** | WiFi auditing suite | `airgeddon` |
| **hcxdumptool** | Handshake capture | `hcxdumptool -i wlan0` |
| **EvilTwin** | Fake AP creation | `python3 eviltwin.py` |

**Use Case:** WiFi security testing, wireless auditing

---

### 4. SQL Injection (7 tools)

| Tool | Purpose | Usage |
|------|---------|-------|
| **SQLMap** | SQL injection automation | `sqlmap -u "url?id=1" --dbs` |
| **NoSqlMap** | NoSQL injection | `python3 nosqlmap.py` |
| **DSSS** | SQL injection scanner | `python3 dsss.py -u url` |
| **Leviathan** | Mass SQL injection | `python3 leviathan.py -f targets.txt` |
| **SQLScan** | SQL vulnerability scanner | `python3 sqlscan.py -u url` |

**Use Case:** Database security testing, SQL vulnerability discovery

---

### 5. Phishing Attack (17 tools)

| Tool | Purpose | Usage |
|------|---------|-------|
| **Setoolkit** | Social engineering | `setoolkit` |
| **SocialFish** | Social media phishing | `python3 SocialFish.py` |
| **HiddenEye** | Advanced phishing | `python3 HiddenEye.py` |
| **Evilginx3** | 2FA bypass phishing | `./evilginx3` |
| **ShellPhish** | Phishing framework | `bash shellphish.sh` |
| **BlackEye** | 30+ phishing templates | `bash blackeye.sh` |
| **QRLJacking** | QR code phishing | `python3 qrljacking.py` |
| **dnstwist** | Domain phishing detection | `dnstwist example.com` |

**Use Case:** Social engineering testing, credential harvesting

---

### 6. Web Attack (20 tools)

| Tool | Purpose | Usage |
|------|---------|-------|
| **Nuclei** | Vulnerability scanner | `nuclei -u url -t templates/` |
| **ffuf** | Directory brute-force | `ffuf -u url/FUZZ -w wordlist.txt` |
| **Feroxbuster** | Content discovery | `feroxbuster -u url` |
| **Nikto** | Web server scanner | `nikto -h url` |
| **wafw00f** | WAF detection | `wafw00f url` |
| **OWASP ZAP** | Web app testing | `zap-cli quick-scan url` |
| **Katana** | Web crawler | `katana -u url` |
| **Gobuster** | Directory brute-force | `gobuster dir -u url -w wordlist.txt` |
| **Dirsearch** | Directory scanner | `dirsearch -u url` |
| **Arjun** | Parameter finder | `arjun -u url` |
| **mitmproxy** | MITM proxy | `mitmproxy` |

**Use Case:** Web application security testing, vulnerability discovery

---

### 7. Post Exploitation (10 tools)

| Tool | Purpose | Usage |
|------|---------|-------|
| **pwncat-cs** | Reverse shell manager | `pwncat-cs -lp 4444` |
| **Sliver** | C2 framework | `sliver` |
| **Havoc** | Post-exploitation | `./havoc server` |
| **PEASS-ng** | Privilege escalation | `./linpeas.sh` / `winpeas.exe` |
| **Ligolo-ng** | Network pivoting | `./ligolo-proxy` |
| **Chisel** | HTTP tunnel | `chisel server --reverse` |
| **Evil-WinRM** | Windows remote mgmt | `evil-winrm -i target -u user -p pass` |
| **Mythic** | C2 framework | `./mythic` |

**Use Case:** Post-compromise operations, lateral movement

---

### 8. Forensics (8 tools)

| Tool | Purpose | Usage |
|------|---------|-------|
| **Autopsy** | Digital forensics | GUI application |
| **Wireshark** | Packet analysis | `wireshark` |
| **Bulk Extractor** | Data extraction | `bulk_extractor -o output image.raw` |
| **Volatility 3** | Memory forensics | `vol3 -f memory.raw windows.info` |
| **Binwalk** | Firmware analysis | `binwalk firmware.bin` |
| **pspy** | Process monitoring | `./pspy` |

**Use Case:** Incident response, evidence collection, digital forensics

---

### 9. Payload Creation (8 tools)

| Tool | Purpose | Usage |
|------|---------|-------|
| **The FatRat** | Payload generator | `fatrat` |
| **Brutal** | RAT creator | `python3 brutal.py` |
| **MSFvenom Payload Creator** | MSF payloads | `./msfpc.sh` |
| **Venom** | Payload generator | `python3 venom.py` |
| **Mob-Droid** | Android payloads | `python3 mob-droid.py` |

**Use Case:** Custom payload creation for authorized testing

---

### 10. Exploit Framework (4 tools)

| Tool | Purpose | Usage |
|------|---------|-------|
| **RouterSploit** | Router exploits | `rsf` |
| **WebSploit** | Web exploits | `python3 websploit.py` |
| **Commix** | Command injection | `commix -u url` |

**Use Case:** Known vulnerability exploitation

---

### 11. Reverse Engineering (5 tools)

| Tool | Purpose | Usage |
|------|---------|-------|
| **Ghidra** | Reverse engineering | GUI application |
| **Radare2** | RE framework | `r2 binary` |
| **JadX** | Android decompiler | `jadx app.apk` |
| **Androguard** | Android analysis | `androguard` |

**Use Case:** Binary analysis, malware research, code analysis

---

### 12. DDoS Testing (5 tools)

| Tool | Purpose | Usage |
|------|---------|-------|
| **SlowLoris** | HTTP DoS | `slowloris target 80` |
| **Asyncrone** | Async DDoS | `python3 asyncrone.py` |
| **GoldenEye** | HTTP DoS | `goldeneye url` |

**Use Case:** Load testing (authorized only)

---

### 13. RAT (1 tool)

| Tool | Purpose | Usage |
|------|---------|-------|
| **Pyshell** | Remote access | `python3 pyshell.py` |

**Use Case:** Remote system access (authorized only)

---

### 14. XSS Attack (9 tools)

| Tool | Purpose | Usage |
|------|---------|-------|
| **DalFox** | XSS scanner | `dalfox url url` |
| **XSStrike** | XSS tool | `xsstrike -u url` |
| **XSpear** | XSS analysis | `xspear -u url` |
| **XSS-Freak** | XSS generator | `python3 xssfreak.py` |

**Use Case:** Cross-site scripting vulnerability discovery

---

### 15. Steganography (4 tools)

| Tool | Purpose | Usage |
|------|---------|-------|
| **StegoCracker** | Steganography detector | `stegocracker image.png` |
| **Whitespace** | Whitespace steganography | `python3 whitespace.py` |

**Use Case:** Hidden data detection/extraction

---

### 16. Active Directory (6 tools)

| Tool | Purpose | Usage |
|------|---------|-------|
| **BloodHound** | AD attack paths | `bloodhound` |
| **NetExec** | Network execution | `nxc smb target` |
| **Impacket** | Network protocols | `impacket-smbclient` |
| **Responder** | LLMNR poisoning | `responder -I eth0` |
| **Certipy** | AD CS attacks | `certipy find` |
| **Kerbrute** | Kerberos brute-force | `kerbrute userenum -d domain users.txt` |

**Use Case:** Active Directory security testing

---

### 17. Cloud Security (4 tools)

| Tool | Purpose | Usage |
|------|---------|-------|
| **Prowler** | AWS audit | `prowler aws` |
| **ScoutSuite** | Multi-cloud audit | `scout aws` |
| **Pacu** | AWS exploitation | `pacu` |
| **Trivy** | Container scanner | `trivy image nginx` |

**Use Case:** Cloud infrastructure security testing

---

### 18. Mobile Security (3 tools)

| Tool | Purpose | Usage |
|------|---------|-------|
| **MobSF** | Mobile security testing | `python3 mobsf.py` |
| **Frida** | Dynamic instrumentation | `frida -U -f com.app` |
| **Objection** | Mobile exploration | `objection explore` |

**Use Case:** Mobile application security testing

---

### 19. IDN Homograph (1 tool)

| Tool | Purpose | Usage |
|------|---------|-------|
| **EvilURL** | IDN homograph attack | `python3 evilurl.py` |

**Use Case:** Internationalized domain name attacks

---

### 20. Email Tools (2 tools)

| Tool | Purpose | Usage |
|------|---------|-------|
| **Knockmail** | Email verification | `python3 knockmail.py email` |

**Use Case:** Email reconnaissance

---

### 21. Other Tools (24 tools)

| Category | Tools |
|----------|-------|
| **Social Media** | Sherlock, SocialScan |
| **Android** | Keydroid, EvilApp |
| **WiFi** | WifiJammer, WiFi-Pumpkin3 |
| **Hash** | Hash Buster |

---

## Integration with Devil AI

### MCP Server Configuration

```json
{
  "mcpServers": {
    "hackingtool": {
      "command": ["python3", "/path/to/hackingtool/hackingtool.py"],
      "description": "Security testing toolkit with 185+ tools"
    }
  }
}
```

### Usage in Code

```typescript
// Example: Nmap scan
async function scanNetwork(target: string) {
  const result = await mcpServer.call("nmap", {
    target: target,
    flags: "-sV -sC"
  })
  return result
}

// Example: SQL injection test
async function testSQLInjection(url: string) {
  const result = await mcpServer.call("sqlmap", {
    url: url,
    flags: "--dbs --batch"
  })
  return result
}
```

## Ethical Guidelines

```
⚠️  ONLY use with proper authorization
⚠️  Document all testing activities
⚠️  Report findings responsibly
⚠️  Follow responsible disclosure
⚠️  Respect system owner's wishes
⚠️  Do not cause unnecessary damage
⚠️  Comply with all laws and regulations
```

## Common Testing Workflow

```
1. Authorization → Get written permission
2. Reconnaissance → Gather target information
3. Scanning → Identify vulnerabilities
4. Exploitation → Test vulnerabilities
5. Post-Exploitation → Assess impact
6. Reporting → Document findings
7. Remediation → Help fix issues
```

## Quick Reference

```bash
# Network scanning
nmap -sV -sC -O target

# Web vulnerability scanning
nuclei -u target -t cves/

# SQL injection testing
sqlmap -u "target?id=1" --dbs

# Directory brute-forcing
ffuf -u target/FUZZ -w /usr/share/wordlists/dirb/common.txt

# WiFi auditing
wifite

# Password cracking
hashcat -m 0 hash.txt wordlist.txt

# Active Directory testing
bloodhound
```

## Troubleshooting

### Common Issues

1. **Permission Denied**
   ```bash
   sudo python3 install.py
   ```

2. **Missing Dependencies**
   ```bash
   apt-get install -y python3-pip
   pip3 install -r requirements.txt
   ```

3. **Docker Issues**
   ```bash
   docker build -t hackingtool .
   docker run -it --rm hackingtool
   ```

4. **Tool Not Found**
   ```bash
   # Check installation
   which toolname
   
   # Reinstall if needed
   sudo apt-get install toolname
   ```

## Resources

- **GitHub:** https://github.com/Z4nzu/hackingtool
- **Documentation:** README.md in repository
- **Issues:** GitHub Issues page
- **Contributing:** Pull requests welcome

## License

MIT License - Free to use, modify, and distribute.

## Disclaimer

This toolkit is for educational and authorized security testing purposes only. The author is not responsible for any misuse or damage caused by this tool. Always obtain proper authorization before testing systems you do not own.
