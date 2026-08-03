---
name: disk-monitor
description: Disk usage monitoring. Space analysis, cleanup suggestions, health monitoring.
---

# Disk Monitor

## When to Apply
Use this skill when monitoring disk usage: analyzing space consumption, suggesting cleanup actions, monitoring disk health, or tracking I/O performance.

## Core Concepts
- Disk usage: `df` for filesystem, `du` for directory-level analysis
- Inode usage can also fill up independent of space
- SMART data indicates disk health (reallocated sectors, temperature)
- I/O wait indicates disk-bound bottlenecks
- Large files and logs are common space consumers

## Implementation

### Space Analysis
```bash
# Filesystem overview
df -h

# Directory sizes (sorted)
du -sh */ | sort -rh | head -20

# Find large files
find / -type f -size +100M -exec ls -lh {} \; 2>/dev/null | sort -k5 -rh

# Inode usage
df -i
```

### Cleanup Automation
```bash
#!/bin/bash
# Cleanup common space consumers
# Old logs
find /var/log -name "*.gz" -mtime +30 -delete

# Package manager cache
bun cache clean 2>/dev/null
npm cache clean --force 2>/dev/null
yarn cache clean 2>/dev/null

# Docker unused resources
docker system prune -f 2>/dev/null

# Temp files older than 7 days
find /tmp -type f -mtime +7 -delete 2>/dev/null
```

### Health Monitoring
```bash
# SMART data (Linux)
sudo smartctl -a /dev/sda

# SMART data (macOS)
diskutil info disk0

# I/O statistics
iostat -x 1 5
```

### Disk I/O Monitoring
```typescript
import { execSync } from "node:child_process"

function getDiskIO() {
  // Linux
  const stats = execSync("cat /proc/diskstats").toString()
  // Parse read/write sectors for target disk
  return { readBytes: 0, writeBytes: 0 }
}
```

### Watch Disk Usage
```bash
# Watch disk usage in real-time
watch -n 5 "df -h / && echo '---' && du -sh ~/Downloads 2>/dev/null"
```

## Best Practices
- Monitor both space and inode usage
- Set alerts at 80% disk usage for proactive cleanup
- Use `ncdu` for interactive directory analysis
- Schedule regular cleanup of logs, caches, and temp files
- Check SMART data monthly for early failure detection
- Keep at least 10-15% free space for optimal performance
