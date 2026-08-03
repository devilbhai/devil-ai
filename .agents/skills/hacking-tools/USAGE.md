# Security Testing Integration Guide

## Overview

This guide explains how to use the integrated security testing tools in Devil AI.

## Quick Start

### 1. Load the Skill

```typescript
// Load the hacking tools skill
skill(name="hacking-tools")
```

### 2. Check Authorization

```typescript
import { AuthorizationMiddleware } from './security-testing/authorization.js'

const middleware = new AuthorizationMiddleware()

// Check if target is authorized
const auth = await middleware.checkAuthorization({
  target: 'https://example.com',
  requestedBy: 'user',
  purpose: 'Security testing',
  scope: ['scan', 'enumerate'],
})

if (!auth.authorized) {
  console.error('Authorization denied:', auth.reason)
  return
}
```

### 3. Execute Tests

```typescript
import { executeTool } from './security-testing/index.js'

// Run Nmap scan
const nmapResult = await executeTool('nmap', ['-sV', '-sC', 'target'])

// Run Nuclei scan
const nucleiResult = await executeTool('nuclei', ['-u', 'target', '-severity', 'critical,high'])

// Run SQLMap test
const sqlmapResult = await executeTool('sqlmap', ['-u', 'target?id=1', '--dbs'])
```

## WordPress Testing

### Quick Test

```typescript
import { quickWordPressTest } from './security-testing/wordpress.js'

const result = await quickWordPressTest('https://example.com', {
  includePlugins: true,
  includeThemes: true,
  includeUsers: true,
})

console.log(result.report)
```

### Full Test

```typescript
import { fullWordPressTest } from './security-testing/wordpress.js'

const result = await fullWordPressTest('https://example.com', {
  includePlugins: true,
  includeThemes: true,
  includeUsers: true,
  includeVulnerabilities: true,
  includeDirectoryBruteforce: true,
  includeSQLInjection: true,
  includeXSSTesting: true,
  aggressive: false,
  verbose: true,
})

console.log(result.report)
console.log('Summary:', result.summary)
```

## Network Scanning

### Basic Scan

```typescript
import { reconNetwork } from './security-testing/index.js'

const results = await reconNetwork('192.168.1.1', {
  fast: true,
  aggressive: false,
})

console.log(results)
```

### Advanced Scan

```typescript
import { reconNetwork } from './security-testing/index.js'

const results = await reconNetwork('192.168.1.1', {
  fast: false,
  aggressive: true,
  ports: '1-65535',
})

console.log(results)
```

## Web Application Testing

### Basic Test

```typescript
import { testWebApp } from './security-testing/index.js'

const results = await testWebApp('https://example.com', {
  directoryBruteforce: true,
  parameterDiscovery: true,
  xssTesting: false,
  sqlInjection: false,
})

console.log(results)
```

### Advanced Test

```typescript
import { testWebApp } from './security-testing/index.js'

const results = await testWebApp('https://example.com', {
  directoryBruteforce: true,
  parameterDiscovery: true,
  xssTesting: true,
  sqlInjection: true,
})

console.log(results)
```

## Tool Information

### List All Tools

```typescript
import { listTools, getToolsByCategory } from './security-testing/index.js'

// List all tools
const allTools = listTools()
console.log('All tools:', allTools)

// List by category
const toolsByCategory = getToolsByCategory()
console.log('Tools by category:', toolsByCategory)
```

### Get Tool Info

```typescript
import { getToolInfo } from './security-testing/index.js'

const nmapInfo = getToolInfo('nmap')
console.log('Nmap info:', nmapInfo)
```

### Check Tool Installation

```typescript
import { isToolInstalled } from './security-testing/index.js'

const nmapInstalled = await isToolInstalled('nmap')
console.log('Nmap installed:', nmapInstalled)
```

## Report Generation

### Generate Report

```typescript
import { generateReport } from './security-testing/index.js'

const report = generateReport(results, 'https://example.com')
console.log(report)
```

## Safety Guidelines

### Always Check Authorization

```typescript
import { checkAuthorization } from './security-testing/index.js'

const authorizations = [
  {
    target: 'https://example.com',
    authorized: true,
    authorizedBy: 'System Owner',
    expiresAt: new Date('2024-12-31'),
    scope: ['scan', 'enumerate'],
  },
]

const auth = checkAuthorization('https://example.com', authorizations)
console.log('Authorization:', auth)
```

### Validate Target

```typescript
import { validateTarget } from './security-testing/index.js'

const isValid = validateTarget('https://example.com')
console.log('Target valid:', isValid)
```

## MCP Server Usage

### Direct MCP Server Calls

```typescript
// Using MCP servers directly
const nmapResult = await mcpServer.call('nmap', {
  target: 'example.com',
  flags: '-sV -sC',
})

const nucleiResult = await mcpServer.call('nuclei', {
  target: 'https://example.com',
  flags: '-severity critical,high',
})
```

## Best Practices

### 1. Always Get Authorization

```typescript
// ❌ Don't do this
const result = await executeTool('nmap', ['target'])

// ✅ Do this instead
const auth = await middleware.checkAuthorization({
  target: 'target',
  requestedBy: 'user',
  purpose: 'Security testing',
  scope: ['scan'],
})

if (auth.authorized) {
  const result = await executeTool('nmap', ['target'])
}
```

### 2. Use Non-Destructive Methods First

```typescript
// Start with safe scans
const results = await reconNetwork('target', {
  fast: true,
  aggressive: false,
})
```

### 3. Document Everything

```typescript
// Log all activities
logger.info('Starting security test', { target, user, purpose })
const result = await executeTool('nmap', ['target'])
logger.info('Test completed', { result })
```

### 4. Follow Up

```typescript
// Verify findings
const verification = await executeTool('nuclei', [
  '-u', 'target',
  '-t', 'vulnerabilities/',
  '-severity', 'critical',
])
```

## Troubleshooting

### Tool Not Found

```bash
# Install the tool
sudo apt-get install toolname

# Or use Docker
docker run -it --rm toolname
```

### Permission Denied

```bash
# Run with sudo (if authorized)
sudo nmap -sV target

# Or use Docker
docker run -it --rm -v $(pwd):/data nmap
```

### Timeout Issues

```typescript
// Increase timeout
const result = await executeTool('nmap', ['-sV', 'target'], {
  timeout: 600000, // 10 minutes
})
```

## Resources

- [HackingTools Documentation](https://github.com/Z4nzu/hackingtool)
- [OWASP Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [PTES](http://www.pentest-standard.org/)

## Support

For issues or questions:
1. Check the documentation
2. Review the safety guidelines
3. Contact the security team
4. Report issues on GitHub

## Disclaimer

This integration is for authorized security testing purposes only. Always obtain proper authorization before testing systems you do not own. The authors are not responsible for any misuse or damage caused by these tools.
