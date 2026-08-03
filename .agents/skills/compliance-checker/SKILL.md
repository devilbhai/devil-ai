---
name: compliance-checker
description: Compliance verification. Regulatory checking, audit preparation, policy enforcement.
---

# Compliance Checker

## When to Apply

- Verifying regulatory compliance
- Preparing for audits
- Enforcing organizational policies
- Tracking compliance deadlines
- Managing compliance documentation

## Core Concepts

- **Regulatory Framework**: Industry-specific regulations
- **Policy Enforcement**: Internal rules and standards
- **Audit Preparation**: Documentation and evidence collection
- **Risk Assessment**: Identifying compliance gaps
- **Remediation Planning**: Corrective action strategies

## Implementation

```typescript
interface ComplianceRequirement {
  id: string
  regulation: string
  requirement: string
  description: string
  deadline: Date
  status: 'compliant' | 'non-compliant' | 'pending' | 'not-applicable'
  evidence: Evidence[]
  lastChecked: Date
  responsibleParty: string
}

interface Evidence {
  id: string
  type: string
  description: string
  document?: string
  dateCollected: Date
}

interface ComplianceCheck {
  requirementId: string
  isCompliant: boolean
  gaps: string[]
  recommendations: string[]
  riskLevel: 'low' | 'medium' | 'high' | 'critical'
}

function performComplianceCheck(
  requirements: ComplianceRequirement[]
): ComplianceCheck[] {
  return requirements.map((requirement) => {
    const isCompliant = requirement.status === 'compliant'
    const gaps: string[] = []
    const recommendations: string[] = []
    
    if (!isCompliant) {
      if (requirement.evidence.length === 0) {
        gaps.push('No evidence collected')
        recommendations.push('Gather required documentation')
      }
      
      if (new Date() > requirement.deadline) {
        gaps.push('Deadline exceeded')
        recommendations.push('Expedite compliance efforts')
      }
    }
    
    return {
      requirementId: requirement.id,
      isCompliant,
      gaps,
      recommendations,
      riskLevel: calculateRiskLevel(requirement),
    }
  })
}

function calculateRiskLevel(
  requirement: ComplianceRequirement
): 'low' | 'medium' | 'high' | 'critical' {
  if (requirement.status === 'compliant') return 'low'
  
  const daysUntilDeadline = Math.ceil(
    (requirement.deadline.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )
  
  if (daysUntilDeadline < 0) return 'critical'
  if (daysUntilDeadline < 30) return 'high'
  if (daysUntilDeadline < 90) return 'medium'
  return 'low'
}

function generateComplianceReport(checks: ComplianceCheck[]): {
  summary: string
  compliant: number
  nonCompliant: number
  riskDistribution: { low: number; medium: number; high: number; critical: number }
} {
  const compliant = checks.filter((c) => c.isCompliant).length
  const nonCompliant = checks.filter((c) => !c.isCompliant).length
  
  const riskDistribution = {
    low: checks.filter((c) => c.riskLevel === 'low').length,
    medium: checks.filter((c) => c.riskLevel === 'medium').length,
    high: checks.filter((c) => c.riskLevel === 'high').length,
    critical: checks.filter((c) => c.riskLevel === 'critical').length,
  }
  
  return {
    summary: `${compliant} compliant, ${nonCompliant} non-compliant`,
    compliant,
    nonCompliant,
    riskDistribution,
  }
}
```

## Best Practices

1. Regularly review and update compliance requirements
2. Maintain detailed evidence documentation
3. Assign clear responsibilities for compliance tasks
4. Conduct periodic internal audits
5. Stay updated on regulatory changes
6. Document all compliance activities
7. Address non-compliance issues promptly
8. Use compliance management software
9. Train employees on compliance requirements
10. Engage external auditors for objective assessment