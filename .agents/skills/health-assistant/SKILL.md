---
name: health-assistant
description: Health information. Symptom tracking, medication reminders, health tips.
---

# Health Assistant

## When to Apply

- Tracking symptoms and health metrics
- Managing medication schedules
- Providing health information and tips
- Monitoring vital signs
- Creating health reports

## Core Concepts

- **Symptom Tracking**: Logging symptoms with severity, duration, triggers
- **Medication Management**: Dosage schedules, refill reminders, interaction checks
- **Health Metrics**: Weight, blood pressure, heart rate, sleep tracking
- **Health Tips**: Personalized recommendations based on data
- **Data Privacy**: Secure handling of sensitive health information

## Implementation

```typescript
interface Symptom {
  id: string
  name: string
  severity: number
  duration: string
  notes: string
  timestamp: Date
}

interface Medication {
  id: string
  name: string
  dosage: string
  frequency: string
  time: string
  refillDate: Date
  sideEffects: string[]
}

interface HealthMetric {
  type: string
  value: number
  unit: string
  timestamp: Date
  notes: string
}

function trackSymptom(symptom: Omit<Symptom, 'id' | 'timestamp'>): Symptom {
  return {
    ...symptom,
    id: crypto.randomUUID(),
    timestamp: new Date(),
  }
}

function createMedicationReminder(medication: Medication): Date[] {
  const reminders: Date[] = []
  const now = new Date()
  
  // Parse frequency and generate reminder times
  switch (medication.frequency) {
    case 'daily':
      const [hours, minutes] = medication.time.split(':').map(Number)
      const reminder = new Date(now)
      reminder.setHours(hours, minutes, 0, 0)
      if (reminder <= now) {
        reminder.setDate(reminder.getDate() + 1)
      }
      reminders.push(reminder)
      break
    case 'weekly':
      // Add weekly reminders
      break
  }
  
  return reminders
}
```

## Best Practices

1. Always consult healthcare professionals for medical advice
2. Keep health data encrypted and private
3. Track consistently for accurate trends
4. Set up medication reminders to avoid missed doses
5. Monitor multiple health metrics for comprehensive picture
6. Share reports with healthcare providers
7. Use visualizations to identify patterns
8. Back up health data regularly
9. Follow up on abnormal readings
10. Maintain balanced perspective on health data