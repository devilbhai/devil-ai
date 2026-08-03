---
name: attendance-manager
description: Attendance tracking. Time clock integration, leave management, reporting.
---

# Attendance Manager

## When to Apply

- When building or modifying attendance tracking features
- When implementing time clock or clock-in/clock-out systems
- When creating leave management or reporting tools
- When working with shift scheduling or overtime tracking

## Core Concepts

- **Clock In/Out**: Track employee work start and end times
- **Leave Management**: Vacation, sick leave, personal leave, approval workflows
- **Shift Scheduling**: Define shifts, assign employees, handle swaps
- **Overtime Tracking**: Calculate overtime hours based on policies
- **Reporting**: Attendance summaries, trends, absenteeism analysis
- **Integration**: Biometric devices, GPS, web-based check-in

## Implementation

```ts
// Attendance record
interface AttendanceRecord {
  id: string
  employeeId: string
  date: Date
  clockIn: Date
  clockOut?: Date
  totalHours: number
  overtime: number
  status: "present" | "absent" | "partial" | "holiday" | "leave"
  location?: { lat: number; lng: number }
  source: "biometric" | "web" | "mobile" | "manual"
}

// Leave request
interface LeaveRequest {
  id: string
  employeeId: string
  type: LeaveType
  startDate: Date
  endDate: Date
  reason: string
  status: "pending" | "approved" | "rejected"
  approvedBy?: string
  balance: number
}

type LeaveType = "vacation" | "sick" | "personal" | "maternity" | "paternity" | "unpaid"

// Leave balance
interface LeaveBalance {
  employeeId: string
  year: number
  balances: {
    type: LeaveType
    entitled: number
    taken: number
    remaining: number
  }[]
}
```

```ts
// Calculate work hours and overtime
function calculateAttendance(clockIn: Date, clockOut: Date, policy: AttendancePolicy) {
  const diffMs = clockOut.getTime() - clockIn.getTime()
  const totalMinutes = diffMs / (1000 * 60)
  const totalHours = totalMinutes / 60
  const regularHours = Math.min(totalHours, policy.standardHours)
  const overtime = Math.max(0, totalHours - policy.standardHours)
  const overtimePay = overtime * policy.overtimeRate
  return { totalHours, regularHours, overtime, overtimePay }
}
```

## Best Practices

- Use atomic timestamps for clock-in/out to prevent race conditions
- Support offline mode for mobile check-in with sync on reconnect
- Implement grace periods for clock-in tolerance (e.g., 5 minutes)
- Calculate leave balances in real-time from accrual rules
- Maintain tamper-proof audit logs for attendance modifications
- Send automated alerts for irregular attendance patterns
- Support multiple time zones for distributed teams
- Generate compliance reports for labor law requirements
