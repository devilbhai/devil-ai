---
name: wifi-manager
description: WiFi management. Network scanning, connection management, security checking.
---

# WiFi Manager

## When to Apply

- Scanning available WiFi networks
- Managing WiFi connections
- Checking network security
- Optimizing WiFi performance
- Troubleshooting connectivity issues

## Core Concepts

- **Network Scanning**: Discovering available networks
- **Connection Management**: Connecting, disconnecting, auto-connect
- **Security Analysis**: Encryption types, password strength
- **Performance Monitoring**: Signal strength, speed, latency
- **Channel Optimization**: Reducing interference

## Implementation

```typescript
interface WiFiNetwork {
  ssid: string
  bssid: string
  signalStrength: number // dBm
  signalQuality: number // percentage
  frequency: number // MHz
  channel: number
  encryption: 'none' | 'wep' | 'wpa' | 'wpa2' | 'wpa3'
  isConnected: boolean
  isSaved: boolean
  lastSeen: Date
}

interface WiFiConnection {
  network: WiFiNetwork
  ipAddress: string
  gateway: string
  dns: string[]
  connectedAt: Date
  dataTransferred: { upload: number; download: number }
  speed: number // Mbps
  latency: number // ms
}

interface SecurityAnalysis {
  network: WiFiNetwork
  vulnerabilities: string[]
  recommendations: string[]
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
}

function analyzeSignalStrength(dBm: number): {
  quality: number
  description: string
} {
  // Convert dBm to percentage (approximate)
  const quality = Math.min(100, Math.max(0, 2 * (dBm + 100)))
  
  let description = ''
  if (quality >= 80) description = 'Excellent'
  else if (quality >= 60) description = 'Good'
  else if (quality >= 40) description = 'Fair'
  else if (quality >= 20) description = 'Weak'
  else description = 'Very Weak'
  
  return { quality, description }
}

function analyzeSecurity(network: WiFiNetwork): SecurityAnalysis {
  const vulnerabilities: string[] = []
  const recommendations: string[] = []
  let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low'
  
  switch (network.encryption) {
    case 'none':
      vulnerabilities.push('No encryption - data transmitted in plaintext')
      recommendations.push('Avoid using open networks for sensitive data')
      riskLevel = 'critical'
      break
    case 'wep':
      vulnerabilities.push('WEP encryption is outdated and easily cracked')
      recommendations.push('Upgrade to WPA2 or WPA3')
      riskLevel = 'high'
      break
    case 'wpa':
      vulnerabilities.push('WPA has known vulnerabilities')
      recommendations.push('Upgrade to WPA2 or WPA3')
      riskLevel = 'medium'
      break
    case 'wpa2':
      recommendations.push('Consider upgrading to WPA3 for better security')
      riskLevel = 'low'
      break
    case 'wpa3':
      riskLevel = 'low'
      break
  }
  
  return {
    network,
    vulnerabilities,
    recommendations,
    riskLevel,
  }
}

function optimizeChannel(
  networks: WiFiNetwork[],
  currentChannel: number
): {
  recommendedChannel: number
  interference: number
} {
  // Analyze channel usage
  const channelUsage = new Array(14).fill(0)
  
  networks.forEach((network) => {
    if (network.channel >= 1 && network.channel <= 13) {
      channelUsage[network.channel]++
    }
  })
  
  // Find least congested channel
  let bestChannel = 1
  let minInterference = Infinity
  
  for (let i = 1; i <= 13; i++) {
    const interference = channelUsage[i] + 
      (channelUsage[i-1] || 0) * 0.5 + 
      (channelUsage[i+1] || 0) * 0.5
    
    if (interference < minInterference) {
      minInterference = interference
      bestChannel = i
    }
  }
  
  return {
    recommendedChannel: bestChannel,
    interference: minInterference,
  }
}
```

## Best Practices

1. Use strong, unique WiFi passwords
2. Enable WPA3 encryption when available
3. Regularly check for firmware updates
4. Monitor connected devices
5. Use a VPN on public networks
6. Optimize router placement
7. Change default router credentials
8. Use separate networks for guests
9. Monitor bandwidth usage
10. Regularly scan for unauthorized devices