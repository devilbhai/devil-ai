---
name: fitness-planner
description: Fitness planning. Workout design, progress tracking, nutrition guidance.
---

# Fitness Planner

## When to Apply

- Designing workout programs
- Tracking fitness progress
- Creating exercise schedules
- Monitoring nutrition intake
- Setting fitness goals

## Core Concepts

- **Workout Design**: Exercise selection, sets/reps, progressive overload
- **Progress Tracking**: Measurements, photos, performance metrics
- **Periodization**: Training phases (hypertrophy, strength, endurance)
- **Nutrition**: Calorie tracking, macronutrient balance
- **Recovery**: Rest days, sleep, active recovery

## Implementation

```typescript
interface Workout {
  id: string
  name: string
  exercises: Exercise[]
  duration: number
  caloriesBurned: number
  date: Date
}

interface Exercise {
  name: string
  sets: number
  reps: number
  weight: number
  restTime: number
  notes: string
}

interface FitnessGoal {
  type: string
  target: number
  current: number
  deadline: Date
  progress: number
}

interface NutritionEntry {
  meal: string
  foods: Food[]
  totalCalories: number
  protein: number
  carbs: number
  fat: number
}

function createWorkoutPlan(goals: FitnessGoal[]): Workout[] {
  // Generate workout plan based on goals
  const workouts: Workout[] = []
  
  // Example: 3-day split for muscle building
  if (goals.some(g => g.type === 'muscle_gain')) {
    workouts.push({
      id: crypto.randomUUID(),
      name: 'Upper Body',
      exercises: [
        { name: 'Bench Press', sets: 4, reps: 8, weight: 0, restTime: 90, notes: '' },
        { name: 'Bent Over Row', sets: 4, reps: 8, weight: 0, restTime: 90, notes: '' },
      ],
      duration: 60,
      caloriesBurned: 400,
      date: new Date(),
    })
  }
  
  return workouts
}

function calculateBMI(weight: number, height: number): number {
  // weight in kg, height in meters
  return weight / (height * height)
}
```

## Best Practices

1. Start with realistic goals and gradually increase intensity
2. Include both cardio and strength training
3. Track progress consistently with measurements and photos
4. Prioritize proper form over heavy weights
5. Allow adequate rest and recovery between workouts
6. Adjust nutrition based on fitness goals
7. Stay hydrated before, during, and after workouts
8. Warm up properly to prevent injuries
9. Listen to your body and modify exercises as needed
10. Celebrate small victories along the way