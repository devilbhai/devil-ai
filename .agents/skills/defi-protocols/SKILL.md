---
name: defi-protocols
description: DeFi development - lending, DEX, yield farming, liquidity pools, token economics.
---

# DeFi Protocols

## When to Apply
Use this skill for building DeFi applications, lending protocols, DEX, yield farming, or token economics.

## Core Concepts
- Automated Market Makers (AMM)
- Lending and borrowing
- Liquidity pools
- Yield farming
- Flash loans
- Oracle integration
- Token economics

## Best Practices
- Audit all contracts
- Implement circuit breakers
- Use oracle price feeds carefully
- Handle edge cases in math
- Test economic incentives
- Implement governance
- Plan for upgrades

## AMM Pattern (Uniswap V2 style)
```solidity
contract UniswapV2Pair {
    uint public reserve0;
    uint public reserve1;
    
    function swap(uint amount0Out, uint amount1Out, address to) external {
        require(amount0Out > 0 || amount1Out > 0);
        uint balance0 = token0.balanceOf(address(this));
        uint balance1 = token1.balanceOf(address(this));
        
        // K = reserve0 * reserve1
        require(balance0 * balance1 >= reserve0 * reserve1);
        
        // Transfer tokens
        if (amount0Out > 0) token0.transfer(to, amount0Out);
        if (amount1Out > 0) token1.transfer(to, amount1Out);
    }
}
```

## Lending Protocol
```solidity
contract LendingProtocol {
    struct Market {
        uint totalDeposits;
        uint totalBorrows;
        uint interestRate;
    }
    
    function deposit(uint amount) external {
        markets[asset].totalDeposits += amount;
        deposits[msg.sender][asset] += amount;
    }
    
    function borrow(uint amount) external {
        uint collateral = getCollateralValue(msg.sender);
        require(collateral >= amount * 150 / 100); // 150% collateral
        markets[asset].totalBorrows += amount;
        borrows[msg.sender][asset] += amount;
    }
}
```

## Yield Farming
```solidity
contract YieldFarm {
    uint public rewardPerBlock;
    uint public lastRewardBlock;
    
    function deposit(uint amount) external {
        pendingRewards[msg.sender] = calculateRewards(msg.sender);
        lpToken.transferFrom(msg.sender, address(this), amount);
        userShares[msg.sender] += amount;
    }
    
    function calculateRewards(address user) internal view returns (uint) {
        uint blocks = block.number - lastRewardBlock;
        return (userShares[user] * rewardPerBlock * blocks) / totalShares;
    }
}
```
