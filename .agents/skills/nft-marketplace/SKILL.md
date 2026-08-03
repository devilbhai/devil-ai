---
name: nft-marketplace
description: NFT development - ERC-721/1155, minting, marketplace, metadata, IPFS storage.
---

# NFT Marketplace

## When to Apply
Use this skill for building NFT applications, minting platforms, marketplaces, or managing digital assets.

## Core Concepts
- ERC-721 and ERC-1155
- Metadata standards
- IPFS storage
- Royalty management
- Auction mechanisms
- Marketplace logic

## Best Practices
- Use established standards (ERC-721A for cheap minting)
- Store metadata on IPFS
- Implement royalties
- Handle metadata updates carefully
- Test gas optimization
- Implement lazy minting
- Support batch operations

## ERC-721 Contract
```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MyNFT is ERC721, ERC721URIStorage, Ownable {
    uint private _tokenIdCounter;
    uint public royaltyPercent = 5; // 5% royalty
    
    constructor() ERC721("MyNFT", "MNFT") Ownable(msg.sender) {}
    
    function mint(string memory tokenURI) public onlyOwner returns (uint) {
        uint tokenId = _tokenIdCounter++;
        _mint(msg.sender, tokenId);
        _setTokenURI(tokenId, tokenURI);
        return tokenId;
    }
    
    function supportsInterface(bytes4 interfaceId) public view override returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
```

## Marketplace Logic
```solidity
contract NFTMarketplace {
    struct Listing {
        address seller;
        address nftContract;
        uint tokenId;
        uint price;
        bool active;
    }
    
    mapping(uint => Listing) public listings;
    uint public listingFee = 0.001 ether;
    
    function listNFT(address nftContract, uint tokenId, uint price) external payable {
        require(msg.value >= listingFee, "Insufficient listing fee");
        IERC721(nftContract).transferFrom(msg.sender, address(this), tokenId);
        
        listings[counter] = Listing({
            seller: msg.sender,
            nftContract: nftContract,
            tokenId: tokenId,
            price: price,
            active: true
        });
    }
    
    function buyNFT(uint listingId) external payable {
        Listing storage listing = listings[listingId];
        require(listing.active, "Not active");
        require(msg.value >= listing.price, "Insufficient payment");
        
        // Transfer NFT
        IERC721(listing.nftContract).transferFrom(address(this), msg.sender, listing.tokenId);
        
        // Pay seller
        payable(listing.seller).transfer(listing.price);
        listing.active = false;
    }
}
```

## Metadata Structure
```json
{
  "name": "My NFT",
  "description": "A unique digital asset",
  "image": "ipfs://QmHash/image.png",
  "attributes": [
    {"trait_type": "Color", "value": "Blue"},
    {"trait_type": "Rarity", "value": "Rare"}
  ]
}
```
