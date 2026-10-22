#!/bin/bash

# Verify contracts on Base mainnet
# Usage: ./verify.sh

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}   IsYourDayOk Contract Verification${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    echo "Please create a .env file with ETHERSCAN_API_KEY"
    exit 1
fi

# Load environment variables
source .env

# Check if API key is set
if [ -z "$ETHERSCAN_API_KEY" ]; then
    echo -e "${RED}❌ ETHERSCAN_API_KEY not set in .env file${NC}"
    exit 1
fi

# Base Mainnet configuration
CHAIN_ID=8453
VERIFIER_URL="https://api.basescan.org/api"

# Your deployed contract addresses
NFT_ADDRESS="0xD7498664f74cF7437994C4E523C542761BA7d4a0"
POINTS_ADDRESS="0x364784cb19047B68066eEa63286AAd5EA49453C2"

echo -e "${YELLOW}Network:${NC} Base Mainnet"
echo -e "${YELLOW}Chain ID:${NC} $CHAIN_ID"
echo -e "${YELLOW}Verifier:${NC} $VERIFIER_URL"
echo ""

# Verify IsYourDayOkNFT
echo -e "${YELLOW}🔍 Verifying IsYourDayOkNFT at $NFT_ADDRESS...${NC}"
forge verify-contract $NFT_ADDRESS \
    src/IsYourDayOkNFT.sol:IsYourDayOkNFT \
    --chain-id $CHAIN_ID \
    --etherscan-api-key $ETHERSCAN_API_KEY \
    --verifier blockscout \
    --verifier-url https://base.blockscout.com/api \
    --watch

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ IsYourDayOkNFT verified successfully!${NC}"
else
    echo -e "${RED}❌ IsYourDayOkNFT verification failed${NC}"
fi

echo ""

# Verify IsYourDayOkPoints
echo -e "${YELLOW}🔍 Verifying IsYourDayOkPoints at $POINTS_ADDRESS...${NC}"
forge verify-contract $POINTS_ADDRESS \
    src/IsYourDayOkPoints.sol:IsYourDayOkPoints \
    --chain-id $CHAIN_ID \
    --etherscan-api-key $ETHERSCAN_API_KEY \
    --verifier blockscout \
    --verifier-url https://base.blockscout.com/api \
    --watch

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ IsYourDayOkPoints verified successfully!${NC}"
else
    echo -e "${RED}❌ IsYourDayOkPoints verification failed${NC}"
fi

echo ""
echo -e "${BLUE}================================================${NC}"
echo -e "${GREEN}🎉 Verification Complete!${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""
echo -e "${YELLOW}View on BaseScan:${NC}"
echo -e "  NFT:    ${BLUE}https://basescan.org/address/$NFT_ADDRESS#code${NC}"
echo -e "  Points: ${BLUE}https://basescan.org/address/$POINTS_ADDRESS#code${NC}"
echo ""
