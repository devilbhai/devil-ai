---
name: incident-response
description: Incident management, response playbooks, escalation procedures, and post-mortem coordination.
---

# Incident Response

## When to Apply
Use this skill during production incidents, for creating response playbooks, coordinating response teams, or conducting post-mortems.

## Core Concepts
- Severity classification
- Response playbooks
- Communication templates
- Escalation procedures
- Post-mortem process

## Implementation

### Severity Levels
```typescript
type Severity = "SEV1" | "SEV2" | "SEV3" | "SEV4"

interface Incident {
  id: string
  severity: Severity
  title: string
  status: "investigating" | "identified" | "monitoring" | "resolved"
  startTime: Date
  commander: string
  commsChannel: string
  affectedServices: string[]
  timeline: TimelineEntry[]
}

const severityDefinitions: Record<Severity, {
  description: string
  responseTime: string
  updateFrequency: string
  executives: boolean
}> = {
  SEV1: { description: "Complete outage", responseTime: "5 min", updateFrequency: "15 min", executives: true },
  SEV2: { description: "Major feature broken", responseTime: "15 min", updateFrequency: "30 min", executives: true },
  SEV3: { description: "Minor feature broken", responseTime: "1 hour", updateFrequency: "2 hours", executives: false },
  SEV4: { description: "Cosmetic issue", responseTime: "4 hours", updateFrequency: "daily", executives: false }
}
```

### Response Playbook
```markdown
## Incident Response Steps
1. **Detect** - Alert triggers or user reports
2. **Triage** - Assess severity, assign commander
3. **Mitigate** - Restore service (rollback, scale, failover)
4. **Investigate** - Root cause analysis
5. **Resolve** - Confirm fix, monitor
6. **Review** - Post-mortem within 48 hours
```

### Communication Template
```markdown
**[SEV{X}] {Service} - {Issue Summary}**

**Status**: Investigating | Identified | Monitoring | Resolved
**Impact**: {Description of user impact}
**Updates**: {Next update at TIME}
**Workaround**: {If any}
**Commander**: {Name}
```

## Best Practices
- Pre-define incident commander rotation
- Keep playbooks updated quarterly
- Practice with game days
- Blameless post-mortems
- Track action items to completion
