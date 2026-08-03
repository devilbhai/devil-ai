---
name: weather-assistant
description: Weather information. Forecast display, severe weather alerts, activity planning.
---

# Weather Assistant

## When to Apply

- Displaying current weather conditions
- Providing multi-day forecasts
- Issuing severe weather alerts
- Planning outdoor activities based on weather
- Tracking weather patterns and trends

## Core Concepts

- **Current Conditions**: Temperature, humidity, wind, precipitation
- **Forecasts**: Daily, hourly, and extended predictions
- **Weather Alerts**: Severe weather warnings and advisories
- **Activity Planning**: Recommending activities based on conditions
- **Historical Data**: Past weather patterns for comparison

## Implementation

```typescript
interface WeatherCondition {
  location: string
  temperature: number
  feelsLike: number
  humidity: number
  windSpeed: number
  windDirection: string
  condition: string
  icon: string
  timestamp: Date
}

interface WeatherForecast {
  date: Date
  high: number
  low: number
  condition: string
  precipitation: number
  humidity: number
  windSpeed: number
  sunrise: Date
  sunset: Date
}

interface WeatherAlert {
  id: string
  type: string
  severity: 'low' | 'medium' | 'high' | 'extreme'
  title: string
  description: string
  start: Date
  end: Date
  affectedAreas: string[]
}

function getWeatherRecommendation(condition: WeatherCondition): string[] {
  const recommendations: string[] = []
  
  if (condition.temperature > 30) {
    recommendations.push('Stay hydrated')
    recommendations.push('Wear sunscreen')
    recommendations.push('Avoid prolonged outdoor exposure')
  } else if (condition.temperature < 10) {
    recommendations.push('Dress in layers')
    recommendations.push('Protect extremities')
    recommendations.push('Limit outdoor time')
  }
  
  if (condition.precipitation > 50) {
    recommendations.push('Bring umbrella or rain gear')
    recommendations.push('Drive carefully')
  }
  
  if (condition.windSpeed > 30) {
    recommendations.push('Secure outdoor items')
    recommendations.push('Be cautious of falling debris')
  }
  
  return recommendations
}

function formatTemperature(temp: number, unit: 'C' | 'F' = 'C'): string {
  if (unit === 'F') {
    return `${Math.round(temp * 9/5 + 32)}°F`
  }
  return `${Math.round(temp)}°C`
}
```

## Best Practices

1. Check weather regularly for changes
2. Understand weather symbols and warnings
3. Plan activities with weather contingencies
4. Monitor severe weather alerts closely
5. Use weather data for event planning
6. Consider microclimates in local areas
7. Track weather patterns over time
8. Prepare emergency kits for severe weather
9. Share weather information with community
10. Use multiple sources for accuracy