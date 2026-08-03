---
name: crypto-assistant
description: Cryptocurrency management. Portfolio tracking, price alerts, DeFi guidance.
---

# Crypto Assistant

## When to Apply

- Tracking cryptocurrency portfolios
- Setting price alerts and notifications
- Managing DeFi positions
- Analyzing blockchain data
- Monitoring wallet balances

## Core Concepts

- **Portfolio Tracking**: Multi-wallet, multi-chain tracking
- **Price Alerts**: Customizable price notifications
- **DeFi Management**: Yield farming, staking, liquidity pools
- **Wallet Security**: Private key management, hardware wallets
- **Market Analysis**: On-chain metrics, tokenomics

## Implementation

```typescript
interface CryptoAsset {
  symbol: string
  name: string
  balance: number
  price: number
  value: number
  change24h: number
  network: string
}

interface CryptoPortfolio {
  id: string
  wallets: Wallet[]
  totalValue: number
  totalChange24h: number
  assets: CryptoAsset[]
}

interface Wallet {
  id: string
  name: string
  address: string
  network: string
  assets: CryptoAsset[]
}

interface PriceAlert {
  id: string
  symbol: string
  targetPrice: number
  condition: 'above' | 'below'
  isActive: boolean
  createdAt: Date
}

interface DeFiPosition {
  protocol: string
  type: 'yield' | 'staking' | 'liquidity'
  assets: CryptoAsset[]
  apy: number
  tvl: number
  rewards: CryptoAsset[]
}

function createPriceAlert(
  symbol: string,
  targetPrice: number,
  condition: 'above' | 'below'
): PriceAlert {
  return {
    id: crypto.randomUUID(),
    symbol,
    targetPrice,
    condition,
    isActive: true,
    createdAt: new Date(),
  }
}

function calculatePortfolioPerformance(portfolio: CryptoPortfolio): {
  totalValue: number
  totalChange: number
  topGainers: CryptoAsset[]
  topLosers: CryptoAsset[]
} {
  const sortedAssets = [...portfolio.assets].sort(
    (a, b) => b.change24h - a.change24h
  )
  
  return {
    totalValue: portfolio.totalValue,
    totalChange: portfolio.totalChange24h,
    topGainers: sortedAssets.slice(0, 3),
    topLosers: sortedAssets.slice(-3),
  }
}

function validateAddress(address: string, network: string): boolean {
  // Simple validation (in real implementation, use proper regex for each network)
  switch (network) {
    case 'ethereum':
      return /^0x[a-fA-F0-9]{40}$/.test(address)
    case 'bitcoin':
      return /^(1|3|bc1)[a-zA-HJ-NP-Z0-9]{25,62}$/.test(address)
    default:
      return address.length > 0
  }
}
```

## Best Practices

1. Use hardware wallets for large holdings
2. Enable two-factor authentication on exchanges
3. Diversify across different cryptocurrencies
4. Regularly backup wallet seed phrases
5. Monitor gas fees for transactions
6. Research projects before investing
7. Use stop-loss orders for risk management
8. Keep track of tax implications
9. Stay updated on regulatory changes
10. Never share private keys or seed phrases