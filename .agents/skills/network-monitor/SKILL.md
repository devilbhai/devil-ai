---
name: network-monitor
description: Network monitoring. Bandwidth tracking, latency measurement, packet analysis.
---

# Network Monitor

## When to Apply
Use this skill when monitoring network activity: tracking bandwidth usage, measuring latency, analyzing packet flows, or diagnosing connectivity issues.

## Core Concepts
- Bandwidth: data transfer rate measured in bits/bytes per second
- Latency: round-trip time for packets (ping)
- Packet loss: percentage of packets not reaching destination
- Throughput: actual data transfer rate vs theoretical bandwidth
- DNS resolution time affects connection establishment

## Implementation

### Bandwidth Monitoring
```bash
# Real-time bandwidth (Linux)
iftop -i eth0

# macOS alternative
nettop -m tcp

# Simple download speed test
curl -o /dev/null -w "Speed: %{speed_download} bytes/sec\n" https://speed.cloudflare.com/__down?bytes=1000000
```

### Latency Measurement
```bash
# Basic ping
ping -c 10 8.8.8.8

# Traceroute
traceroute 8.8.8.8

# DNS resolution time
dig google.com | grep "Query time"
```

### Connection Monitoring
```bash
# Active connections
ss -tunapl        # Linux
netstat -an       # macOS

# Connections by state
ss -s             # Linux summary

# Listening ports
ss -tlnp          # Linux
lsof -i -P -n | grep LISTEN  # macOS
```

### Packet Analysis
```bash
# Capture packets (requires root)
sudo tcpdump -i eth0 -c 100 -w capture.pcap

# Analyze with tshark
tshark -r capture.pcap -T fields -e ip.src -e ip.dst -e tcp.port

# HTTP traffic
sudo tcpdump -i eth0 'tcp port 80' -A | grep "GET\|POST"
```

### Network Health Check Script
```bash
#!/bin/bash
check_endpoint() {
  local url=$1
  local status=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "$url")
  echo "$url: $status"
}

check_endpoint "https://google.com"
check_endpoint "https://github.com"
```

## Best Practices
- Use `iperf3` for controlled bandwidth testing between endpoints
- Monitor both inbound and outbound traffic
- Set up alerts for unusual traffic spikes or drops
- Use `ss` over deprecated `netstat` on modern Linux
- Capture packets only when diagnosing specific issues (privacy/size concerns)
- Track DNS resolution time separately from connection time
