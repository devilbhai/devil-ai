---
name: stock-market-assistant
description: Stock market analysis. Portfolio tracking, technical analysis, news impact.
---

# Stock Market Assistant

## When to Apply

- Tracking stock portfolios
- Performing technical analysis
- Monitoring market news and events
- Analyzing investment performance
- Creating watchlists and alerts

## Core Concepts

- **Portfolio Management**: Tracking holdings, gains, losses
- **Technical Analysis**: Charts, indicators, patterns
- **Fundamental Analysis**: Company financials, ratios
- **Market Sentiment**: News impact, social media trends
- **Risk Assessment**: Volatility, diversification analysis

## Implementation

```typescript
interface StockHolding {
  symbol: string
  shares: number
  averageCost: number
  currentPrice: number
  purchaseDate: Date
  sector: string
}

interface Portfolio {
  id: string
  name: string
  holdings: StockHolding[]
  totalValue: number
  totalGain: number
  totalGainPercentage: number
}

interface TechnicalIndicator {
  name: string
  value: number
  signal: 'buy' | 'sell' | 'hold'
  description: string
}

function calculatePortfolioMetrics(holdings: StockHolding[]): Portfolio {
  let totalValue = 0
  let totalCost = 0
  
  const updatedHoldings = holdings.map((holding) => {
    const currentValue = holding.shares * holding.currentPrice
    const costBasis = holding.shares * holding.averageCost
    
    totalValue += currentValue
    totalCost += costBasis
    
    return {
      ...holding,
      currentValue,
      gain: currentValue - costBasis,
      gainPercentage: ((currentValue - costBasis) / costBasis) * 100,
    }
  })
  
  return {
    id: crypto.randomUUID(),
    name: 'My Portfolio',
    holdings: updatedHoldings,
    totalValue,
    totalGain: totalValue - totalCost,
    totalGainPercentage: ((totalValue - totalCost) / totalCost) * 100,
  }
}

function calculateMovingAverage(prices: number[], period: number): number[] {
  const movingAverages: number[] = []
  
  for (let i = period - 1; i < prices.length; i++) {
    const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0)
    movingAverages.push(sum / period)
  }
  
  return movingAverages
}

function calculateRSI(prices: number[], period: number = 14): number {
  const changes: number[] = []
  
  for (let i = 1; i < prices.length; i++) {
    changes.push(prices[i] - prices[i - 1])
  }
  
  const gains = changes.filter((c) => c > 0)
  const losses = changes.filter((c) => c < 0).map((l) => Math.abs(l))
  
  const avgGain = gains.slice(-period).reduce((a, b) => a + b, 0) / period
  const avgLoss = losses.slice(-period).reduce((a, b) => a + b, 0) / period
  
  if (avgLoss === 0) return 100
  
  const rs = avgGain / avgLoss
  return 100 - 100 / (1 + rs)
}
```

## Best Practices

1. Diversify portfolio across sectors
2. Set stop-loss orders to limit downside
3. Monitor market trends and news regularly
4. Use both technical and fundamental analysis
5. Consider long-term investment strategy
6. Track transaction costs and taxes
7. Rebalance portfolio periodically
8. Stay informed about economic indicators
9. Avoid emotional trading decisions
10. Consult financial advisors for major decisions