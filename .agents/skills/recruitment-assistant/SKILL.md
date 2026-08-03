---
name: recruitment-assistant
description: Recruitment automation. Job posting, candidate screening, interview scheduling.
---

# Recruitment Assistant

## When to Apply

- When building or modifying recruitment automation features
- When implementing job posting or candidate management
- When creating screening or interview scheduling tools
- When working with ATS (Applicant Tracking System) functionality

## Core Concepts

- **Job Postings**: Create, publish, and manage job listings across platforms
- **Candidate Pipeline**: Track candidates through stages (applied, screening, interview, offer, hired)
- **Screening**: Resume parsing, keyword matching, qualification scoring
- **Interview Scheduling**: Calendar integration, availability matching, auto-booking
- **Offer Management**: Letter generation, approval workflows, digital signatures

## Implementation

```ts
// Job posting
interface JobPosting {
  id: string
  title: string
  department: string
  location: string
  type: "full_time" | "part_time" | "contract" | "internship"
  description: string
  requirements: string[]
  salaryRange?: { min: number; max: number; currency: string }
  status: "draft" | "published" | "closed"
  postedAt: Date
  closedAt?: Date
}

// Candidate record
interface Candidate {
  id: string
  name: string
  email: string
  resume: DocumentReference
  stage: CandidateStage
  score: number // screening score 0-100
  appliedAt: Date
  notes: Note[]
  interviews: Interview[]
}

type CandidateStage =
  | "applied"
  | "screening"
  | "phone_screen"
  | "interview"
  | "evaluation"
  | "offer"
  | "hired"
  | "rejected"

// Screening result
interface ScreeningResult {
  candidateId: string
  matchScore: number
  matchedCriteria: string[]
  missingCriteria: string[]
  recommendation: "advance" | "review" | "reject"
}
```

```ts
// Schedule interview with availability check
async function scheduleInterview(
  candidateId: string,
  interviewers: string[],
  preferences: InterviewPreferences
): Promise<ScheduledInterview> {
  const availability = await findCommonAvailability(interviewers, preferences.duration)
  const slot = selectBestSlot(availability, preferences)
  const calendarEvent = await createCalendarEvent(slot, interviewers, candidateId)
  await sendInvitations(candidateId, interviewers, calendarEvent)
  return { interviewId: calendarEvent.id, scheduledAt: slot.start }
}
```

## Best Practices

- Track all candidate interactions for compliance and fairness
- Use blind screening where possible to reduce bias
- Automate status update notifications to candidates
- Maintain audit trails for hiring decisions
- Integrate with multiple job boards for wider reach
- Score candidates consistently using predefined criteria
- Respect data retention policies for rejected candidates
- Support collaborative hiring with interviewer feedback forms
