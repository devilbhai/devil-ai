---
name: travel-planner
description: Travel planning. Itinerary creation, budget management, booking integration.
---

# Travel Planner

## When to Apply

- Creating detailed travel itineraries
- Managing travel budgets
- Booking flights, hotels, and activities
- Planning multi-destination trips
- Organizing travel documents

## Core Concepts

- **Itinerary Creation**: Day-by-day schedules with activities
- **Budget Management**: Tracking expenses across categories
- **Booking Integration**: Flights, accommodations, transportation
- **Travel Logistics**: Visas, insurance, emergency contacts
- **Experience Planning**: Local attractions, dining, cultural experiences

## Implementation

```typescript
interface TravelItinerary {
  id: string
  destination: string
  startDate: Date
  endDate: Date
  days: ItineraryDay[]
  totalBudget: number
  expenses: Expense[]
}

interface ItineraryDay {
  date: Date
  activities: Activity[]
  meals: MealReservation[]
  transportation: Transportation[]
}

interface Activity {
  name: string
  location: string
  startTime: string
  endTime: string
  cost: number
  notes: string
  bookingReference?: string
}

interface Expense {
  category: string
  description: string
  amount: number
  currency: string
  date: Date
  paymentMethod: string
}

function createItinerary(
  destination: string,
  startDate: Date,
  endDate: Date,
  budget: number
): TravelItinerary {
  const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  const itineraryDays: ItineraryDay[] = []
  
  for (let i = 0; i < days; i++) {
    const date = new Date(startDate)
    date.setDate(date.getDate() + i)
    
    itineraryDays.push({
      date,
      activities: [],
      meals: [],
      transportation: [],
    })
  }
  
  return {
    id: crypto.randomUUID(),
    destination,
    startDate,
    endDate,
    days: itineraryDays,
    totalBudget: budget,
    expenses: [],
  }
}

function calculateRemainingBudget(itinerary: TravelItinerary): number {
  const totalExpenses = itinerary.expenses.reduce((sum, expense) => sum + expense.amount, 0)
  return itinerary.totalBudget - totalExpenses
}
```

## Best Practices

1. Research destination thoroughly before planning
2. Build buffer time into itineraries for flexibility
3. Track all expenses in real-time
4. Book accommodations near main attractions
5. Keep digital and physical copies of important documents
6. Consider local transportation options
7. Plan for weather conditions
8. Include both popular attractions and hidden gems
9. Set aside emergency fund for unexpected expenses
10. Share itinerary with trusted contacts