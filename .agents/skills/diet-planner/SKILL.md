---
name: diet-planner
description: Diet planning. Meal planning, calorie tracking, nutritional analysis.
---

# Diet Planner

## When to Apply

- Creating meal plans for dietary goals
- Tracking daily calorie intake
- Analyzing nutritional content of meals
- Managing dietary restrictions
- Planning grocery lists

## Core Concepts

- **Meal Planning**: Weekly/monthly meal schedules
- **Calorie Tracking**: Daily intake monitoring
- **Macronutrients**: Protein, carbohydrates, fats balance
- **Micronutrients**: Vitamins, minerals tracking
- **Dietary Restrictions**: Allergies, intolerances, preferences

## Implementation

```typescript
interface Meal {
  id: string
  name: string
  foods: Food[]
  totalCalories: number
  protein: number
  carbs: number
  fat: number
  time: string
}

interface Food {
  name: string
  quantity: number
  unit: string
  calories: number
  protein: number
  carbs: number
  fat: number
}

interface DietGoal {
  type: string
  targetCalories: number
  proteinPercentage: number
  carbsPercentage: number
  fatPercentage: number
  restrictions: string[]
}

function createMealPlan(goal: DietGoal): Meal[] {
  const meals: Meal[] = []
  const mealsPerDay = 3
  
  for (let i = 0; i < mealsPerDay; i++) {
    const mealCalories = goal.targetCalories / mealsPerDay
    meals.push({
      id: crypto.randomUUID(),
      name: `Meal ${i + 1}`,
      foods: [],
      totalCalories: mealCalories,
      protein: (mealCalories * goal.proteinPercentage) / 100 / 4,
      carbs: (mealCalories * goal.carbsPercentage) / 100 / 4,
      fat: (mealCalories * goal.fatPercentage) / 100 / 9,
      time: `${8 + i * 4}:00`,
    })
  }
  
  return meals
}

function calculateDailyIntake(meals: Meal[]): {
  calories: number
  protein: number
  carbs: number
  fat: number
} {
  return meals.reduce(
    (acc, meal) => ({
      calories: acc.calories + meal.totalCalories,
      protein: acc.protein + meal.protein,
      carbs: acc.carbs + meal.carbs,
      fat: acc.fat + meal.fat,
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )
}
```

## Best Practices

1. Plan meals in advance to avoid impulsive eating
2. Track all foods including snacks and beverages
3. Balance macronutrients based on activity level
4. Include variety to ensure complete nutrition
5. Read nutrition labels carefully
6. Adjust portions based on individual needs
7. Stay hydrated with water throughout the day
8. Consider meal prep for time efficiency
9. Monitor progress and adjust plan as needed
10. Consult a dietitian for personalized advice