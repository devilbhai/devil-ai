---
name: web3-development
description: Web3 development - Ethers.js, wallet integration, dApp architecture, transaction management.
---

# Web3 Development

## When to Apply
Use this skill for building dApps, integrating wallets, managing transactions, or interacting with smart contracts.

## Core Concepts
- Ethers.js / Web3.js
- Wallet connection
- Transaction management
- Event listening
- Contract interaction
- IPFS integration
- Multi-chain support

## Best Practices
- Handle network switching
- Implement proper error handling
- Cache blockchain data
- Use multicall for batch reads
- Handle pending transactions
- Implement gas estimation
- Support multiple wallets

## Ethers.js Setup
```javascript
import { ethers } from "ethers";

// Provider
const provider = new ethers.BrowserProvider(window.ethereum);

// Signer
const signer = await provider.getSigner();

// Contract
const contract = new ethers.Contract(address, abi, signer);
```

## Wallet Connection
```javascript
async function connectWallet() {
  if (!window.ethereum) {
    throw new Error("No wallet found");
  }
  
  const provider = new ethers.BrowserProvider(window.ethereum);
  const accounts = await provider.send("eth_requestAccounts", []);
  const signer = await provider.getSigner();
  
  return { provider, signer, address: accounts[0] };
}
```

## Transaction Management
```javascript
async function sendTransaction(contract, method, args) {
  try {
    // Estimate gas
    const gasEstimate = await contract[method].estimateGas(...args);
    
    // Get gas price
    const feeData = await provider.getFeeData();
    
    // Send transaction
    const tx = await contract[method](...args, {
      gasLimit: gasEstimate * 120 / 100, // 20% buffer
      maxFeePerGas: feeData.maxFeePerGas,
    });
    
    // Wait for confirmation
    const receipt = await tx.wait();
    return receipt;
  } catch (error) {
    if (error.code === "ACTION_REJECTED") {
      throw new Error("Transaction rejected by user");
    }
    throw error;
  }
}
```

## Event Listening
```javascript
contract.on("Transfer", (from, to, amount) => {
  console.log(`Transfer: ${from} -> ${to}: ${amount}`);
});

// Filter events
const filter = contract.filters.Transfer(null, userAddress);
contract.on(filter, (from, to, amount) => {
  // Only incoming transfers
});
```
