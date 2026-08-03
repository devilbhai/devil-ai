---
name: solidity-smart-contracts
description: Ethereum smart contracts with Solidity - development, testing, deployment, security.
---

# Solidity Smart Contracts

## When to Apply
Use this skill for writing Ethereum smart contracts, testing, deployment, or security auditing.

## Core Concepts
- Solidity syntax and types
- Contract inheritance
- Interfaces and abstract contracts
- Events and logging
- Gas optimization
- Security patterns
- Testing with Hardhat/Foundry

## Best Practices
- Use latest Solidity version
- Implement access control
- Use events for state changes
- Check for reentrancy
- Use SafeMath for older versions
- Test edge cases thoroughly
- Audit before mainnet

## Contract Structure
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";

contract MyToken is Ownable {
    string public name;
    uint256 public totalSupply;
    mapping(address => uint256) public balances;

    event Transfer(address indexed from, address indexed to, uint256 amount);

    constructor(string memory _name) Ownable(msg.sender) {
        name = _name;
    }

    function mint(address to, uint256 amount) public onlyOwner {
        totalSupply += amount;
        balances[to] += amount;
        emit Transfer(address(0), to, amount);
    }
}
```

## Security Patterns
```solidity
// Reentrancy guard
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract Vault is ReentrancyGuard {
    function withdraw(uint256 amount) public nonReentrant {
        require(balances[msg.sender] >= amount);
        balances[msg.sender] -= amount;
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success);
    }
}

// Access control
modifier onlyAuthorized() {
    require(authorized[msg.sender], "Not authorized");
    _;
}
```

## Testing (Hardhat)
```javascript
describe("MyToken", function () {
  it("Should mint tokens", async function () {
    const Token = await ethers.getContractFactory("MyToken");
    const token = await Token.deploy("MyToken");
    await token.mint(addr1.address, 100);
    expect(await token.balances(addr1.address)).to.equal(100);
  });
});
```

## Gas Optimization
- Use uint256 instead of smaller types
- Pack storage variables
- Use events instead of storage
- Cache storage variables in memory
- Use unchecked for safe arithmetic
