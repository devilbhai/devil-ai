---
name: local-network-scanner
description: Network scanning. Device discovery, port scanning, service detection.
---

# Local Network Scanner

## When to Apply

- Discovering devices on local network
- Scanning for open ports
- Detecting running services
- Monitoring network activity
- Identifying security vulnerabilities

## Core Concepts

- **Device Discovery**: Finding all devices on network
- **Port Scanning**: Identifying open ports and services
- **Service Detection**: Recognizing applications and versions
- **Network Mapping**: Visualizing network topology
- **Security Assessment**: Identifying potential vulnerabilities

## Implementation

```typescript
interface NetworkDevice {
  id: string
  ip: string
  mac: string
  hostname: string
  manufacturer: string
  isOnline: boolean
  lastSeen: Date
  openPorts: Port[]
  services: Service[]
}

interface Port {
  number: number
  protocol: 'tcp' | 'udp'
  state: 'open' | 'closed' | 'filtered'
  service: string
  version?: string
}

interface Service {
  name: string
  version: string
  port: number
  banner?: string
}

interface ScanResult {
  id: string
  networkRange: string
  devices: NetworkDevice[]
  startTime: Date
  endTime: Date
  duration: number
}

function calculateNetworkRange(
  ip: string,
  subnetMask: string
): string {
  // Calculate network range from IP and subnet mask
  const ipParts = ip.split('.').map(Number)
  const maskParts = subnetMask.split('.').map(Number)
  
  const networkParts = ipParts.map((part, i) => part & maskParts[i])
  const broadcastParts = ipParts.map((part, i) => part | ~maskParts[i] & 255)
  
  return `${networkParts.join('.')}/${broadcastParts.join('.')}`
}

function scanPort(
  ip: string,
  port: number,
  timeout: number = 1000
): Promise<Port> {
  return new Promise((resolve) => {
    // In real implementation, use network scanning library
    // This is a mock implementation
    setTimeout(() => {
      resolve({
        number: port,
        protocol: 'tcp',
        state: Math.random() > 0.7 ? 'open' : 'closed',
        service: getServiceName(port),
        version: undefined,
      })
    }, timeout)
  })
}

function getServiceName(port: number): string {
  const commonPorts: Record<number, string> = {
    21: 'FTP',
    22: 'SSH',
    23: 'Telnet',
    25: 'SMTP',
    53: 'DNS',
    80: 'HTTP',
    110: 'POP3',
    143: 'IMAP',
    443: 'HTTPS',
    993: 'IMAPS',
    995: 'POP3S',
    3389: 'RDP',
    5900: 'VNC',
  }
  
  return commonPorts[port] || 'Unknown'
}

function identifyDevice(mac: string): {
  manufacturer: string
  deviceType: string
} {
  // In real implementation, use MAC address lookup database
  // This is a mock implementation
  const manufacturers: Record<string, string> = {
    '00:50:56': 'VMware',
    '08:00:27': 'Oracle VirtualBox',
    '52:54:00': 'QEMU',
    'B8:27:EB': 'Raspberry Pi',
  }
  
  const prefix = mac.substring(0, 8).toUpperCase()
  const manufacturer = manufacturers[prefix] || 'Unknown'
  
  return {
    manufacturer,
    deviceType: manufacturer.includes('VMware') || manufacturer.includes('VirtualBox') ? 'Virtual Machine' : 'Physical Device',
  }
}
```

## Best Practices

1. Only scan networks you own or have permission to scan
2. Use appropriate scanning techniques for your needs
3. Document all discovered devices and services
4. Regularly monitor for unauthorized devices
5. Keep scanning tools updated
6. Use non-intrusive scanning methods
7. Respect network policies and regulations
8. Analyze results for security improvements
9. Integrate with network monitoring systems
10. Maintain detailed scan logs