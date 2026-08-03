# HackingTools Quick Reference Card

## Top 10 Most Useful Tools

| # | Tool | Purpose | Command |
|---|------|---------|---------|
| 1 | **Nmap** | Network scanning | `nmap -sV -sC target` |
| 2 | **Nuclei** | Vulnerability scanning | `nuclei -u target -t cves/` |
| 3 | **SQLMap** | SQL injection | `sqlmap -u "url?id=1" --dbs` |
| 4 | **ffuf** | Directory brute-force | `ffuf -u target/FUZZ -w wordlist.txt` |
| 5 | **John** | Password cracking | `john --wordlist=wordlist.txt hash.txt` |
| 6 | **Ghidra** | Reverse engineering | `ghidra` (GUI) |
| 7 | **BloodHound** | AD attack paths | `bloodhound` |
| 8 | **Wireshark** | Packet analysis | `wireshark` (GUI) |
| 9 | **Frida** | Mobile instrumentation | `frida -U -f com.app` |
| 10 | **Trivy** | Container scanning | `trivy image nginx` |

## One-Liner Commands

```bash
# Network Scan
nmap -sV -sC -O -p- target

# Web Scan
nuclei -u target -severity critical,high

# SQL Injection
sqlmap -u "target?id=1" --batch --dbs

# Directory Brute-Force
ffuf -u target/FUZZ -w /usr/share/wordlists/dirb/common.txt

# Password Cracking
hashcat -m 0 hash.txt wordlist.txt

# WiFi Audit
wifite --wps

# AD Enumeration
bloodhound-python -d domain -u user -p pass -c All

# Container Scan
trivy image --severity HIGH,CRITICAL nginx:latest

# Git Secrets
trufflehog git https://github.com/repo

# Email OSINT
theHarvester -d example.com -b all
```

## Category Quick Reference

### Reconnaissance
- `nmap -sV target` - Port scan
- `amass enum -d target` - Subdomain enum
- `theHarvester -d target -b google` - Email harvest

### Web Testing
- `nikto -h target` - Web server scan
- `dirb target wordlist.txt` - Directory scan
- `wafw00f target` - WAF detection

### Wireless
- `airmon-ng start wlan0` - Monitor mode
- `airodump-ng wlan0mon` - Capture packets
- `aireplay-ng -0 5 -a BSSID wlan0mon` - Deauth

### Password Attacks
- `john --wordlist=rockyou.txt hash.txt` - Crack hashes
- `hashcat -m 1000 hash.txt wordlist.txt` - NTLM crack
- `hydra -l admin -P wordlist.txt target ssh` - Brute-force

### Post-Exploitation
- `./linpeas.sh` - Linux priv esc
- `winpeas.exe` - Windows priv esc
- `chisel server --reverse` - Tunnel

### Forensics
- `vol3 -f memory.raw windows.info` - Memory analysis
- `binwalk firmware.bin` - Firmware analysis
- `strings binary | grep password` - String extraction

## Useful Wordlists

```bash
# Kali Linux location
/usr/share/wordlists/

# Common wordlists
rockyou.txt - Passwords
dirb/common.txt - Directories
dirbuster/directory-list-2.3-medium.txt - Medium dirs
SecLists/Discovery/DNS/subdomains-top1million-5000.txt - Subdomains
```

## Installation Cheatsheet

```bash
# Install all tools
curl -sSL https://raw.githubusercontent.com/Z4nzu/hackingtool/master/install.sh | sudo bash

# Install specific tool
sudo apt-get install nmap

# Update tools
sudo apt-get update && sudo apt-get upgrade

# Docker install
docker pull z4nzu/hackingtool
docker run -it --rm z4nzu/hackingtool
```

## Safety Rules

```
1. ALWAYS get written authorization
2. NEVER test systems you don't own
3. DOCUMENT everything you do
4. REPORT findings responsibly
5. RESPECT system owner's wishes
```
