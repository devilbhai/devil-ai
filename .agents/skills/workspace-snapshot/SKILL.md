---
name: workspace-snapshot
description: Workspace state capture. Project snapshots, state restoration, backup management.
---

# Workspace Snapshot

## When to Apply
Use this skill when capturing project state for rollback, creating backups before risky changes, or restoring previous workspace states.

## Core Concepts
- **Git-based snapshots**: Tagged commits as state markers
- **File system snapshots**: tar/archive-based workspace captures
- **State serialization**: Capture open files, cursors, breakpoints
- **Incremental snapshots**: Only changed files since last snapshot
- **Snapshot metadata**: Timestamps, descriptions, change summaries

## Implementation
```bash
# Git snapshot (tagged commit)
git add -A && git commit -m "snapshot: before refactor" && git tag snap-$(date +%s)

# Tar-based workspace snapshot
tar -czf "backup-$(date +%Y%m%d-%H%M%S).tar.gz" \
  --exclude=node_modules --exclude=.git .

# Restore from snapshot
tar -xzf backup-20260705-143000.tar.gz

# List available snapshots
git tag -l "snap-*" | sort -r

# Restore to specific snapshot
git checkout snap-1688584200

# Clean old snapshots (keep last 5)
git tag -l "snap-*" | sort -r | tail -n +6 | xargs git tag -d
```

## Best Practices
- Create snapshots before major refactors or dependency upgrades
- Include meaningful descriptions in snapshot commits
- Store snapshots outside the workspace for critical backups
- Automate periodic snapshots with git hooks or cron
- Verify snapshot integrity before relying on them
- Keep snapshot count manageable — prune old ones regularly
