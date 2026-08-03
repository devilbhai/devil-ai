---
name: hr-assistant
description: HR management. Employee records, policy management, compliance tracking.
---

# HR Assistant

## When to Apply

- When building or modifying HR management features
- When implementing employee record systems
- When creating policy management or compliance tracking tools
- When working with org charts, departments, or team structures

## Core Concepts

- **Employee Records**: Personal info, employment history, documents, certifications
- **Policy Management**: Create, distribute, acknowledge, and track company policies
- **Compliance Tracking**: Training completion, certification expiry, regulatory requirements
- **Org Structure**: Departments, reporting lines, positions, hierarchy
- **Onboarding/Offboarding**: Checklists, document collection, access provisioning
- **Leave Management**: Policies, balances, requests, accruals

## Implementation

```ts
// Employee record
interface Employee {
  id: string
  personalInfo: {
    firstName: string
    lastName: string
    email: string
    phone: string
    dateOfBirth: Date
    address: Address
  }
  employment: {
    department: string
    position: string
    manager: string | null
    startDate: Date
    endDate?: Date
    status: "active" | "on_leave" | "terminated"
  }
  documents: EmployeeDocument[]
  certifications: Certification[]
}

// Policy acknowledgment
interface PolicyAcknowledgment {
  policyId: string
  employeeId: string
  acknowledgedAt: Date
  version: string
  method: "digital_signature" | "click" | "email"
}

// Compliance status
interface ComplianceStatus {
  employeeId: string
  requirement: string
  status: "compliant" | "pending" | "overdue" | "exempt"
  dueDate: Date
  completedDate?: Date
}
```

## Best Practices

- Store sensitive employee data with encryption at rest
- Implement role-based access for different HR data categories
- Maintain version history for all policy changes
- Send automated reminders for expiring certifications and pending acknowledgments
- Keep PII separate from employment records where possible
- Support bulk operations for common HR tasks (mass onboarding, policy updates)
- Maintain audit logs for all record modifications
- Ensure GDPR/local privacy law compliance for employee data
