#!/bin/bash

# Deploy script for IsYourDayOk contracts
# Usage: ./deploy.sh [network]
# Example: ./deploy.sh base-sepolia

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
NETWORK=${1:-base-mainnet}
RPC_URL=""
CHAIN_ID=""

# Network configuration
case $NETWORK in
  base-sepolia)
    RPC_URL="https://sepolia.base.org"
    CHAIN_ID=84532
    ;;
  base-mainnet|base)
    RPC_URL="https://mainnet.base.org"
    CHAIN_ID=8453
    ;;
  localhost|local)
    RPC_URL="http://localhost:8545"
    CHAIN_ID=31337
    ;;
  *)
    echo -e "${RED}❌ Unknown network: $NETWORK${NC}"
    echo "Supported networks: base-mainnet (default), base-sepolia, localhost"
    exit 1
    ;;
esac

echo -e "${BLUE}================================================${NC}"
echo -e "${BLUE}   IsYourDayOk Smart Contract Deployment${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""
echo -e "${YELLOW}Network:${NC} $NETWORK"
echo -e "${YELLOW}RPC URL:${NC} $RPC_URL"
echo -e "${YELLOW}Chain ID:${NC} $CHAIN_ID"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    echo "Please create a .env file with the following variables:"
    echo "  PRIVATE_KEY=your_private_key"
    echo "  ETHERSCAN_API_KEY=your_etherscan_api_key (optional, for verification)"
    exit 1
fi

# Load environment variables
source .env

# Check if private key is set
if [ -z "$PRIVATE_KEY" ]; then
    echo -e "${RED}❌ PRIVATE_KEY not set in .env file${NC}"
    exit 1
fi

# Build contracts
echo -e "${YELLOW}📦 Building contracts...${NC}"
forge build

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed!${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Build successful!${NC}"
echo ""

# Deploy IsYourDayOkPoints
echo -e "${YELLOW}🚀 Deploying IsYourDayOkPoints contract...${NC}"
POINTS_DEPLOY_OUTPUT=$(forge create src/IsYourDayOkPoints.sol:IsYourDayOkPoints \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY \
    --broadcast)

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ IsYourDayOkPoints deployment failed!${NC}"
    exit 1
fi

POINTS_ADDRESS=$(echo "$POINTS_DEPLOY_OUTPUT" | grep "Deployed to:" | awk '{print $3}')
echo -e "${GREEN}✅ IsYourDayOkPoints deployed to: $POINTS_ADDRESS${NC}"
echo ""

# Deploy IsYourDayOkNFT
echo -e "${YELLOW}🚀 Deploying IsYourDayOkNFT contract...${NC}"
NFT_DEPLOY_OUTPUT=$(forge create src/IsYourDayOkNFT.sol:IsYourDayOkNFT \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY \
    --broadcast)

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ IsYourDayOkNFT deployment failed!${NC}"
    exit 1
fi

NFT_ADDRESS=$(echo "$NFT_DEPLOY_OUTPUT" | grep "Deployed to:" | awk '{print $3}')
echo -e "${GREEN}✅ IsYourDayOkNFT deployed to: $NFT_ADDRESS${NC}"
echo ""

# Save deployment addresses
DEPLOYMENT_FILE="deployments/${NETWORK}.json"
mkdir -p deployments

cat > $DEPLOYMENT_FILE << EOF
{
  "network": "$NETWORK",
  "chainId": $CHAIN_ID,
  "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "contracts": {
    "IsYourDayOkPoints": {
      "address": "$POINTS_ADDRESS",
      "txHash": ""
    },
    "IsYourDayOkNFT": {
      "address": "$NFT_ADDRESS",
      "txHash": ""
    }
  }
}
EOF

echo -e "${GREEN}✅ Deployment addresses saved to: $DEPLOYMENT_FILE${NC}"
echo ""

# Contract verification (if API key is set)
if [ ! -z "$ETHERSCAN_API_KEY" ] && [ "$NETWORK" != "localhost" ]; then
    echo -e "${YELLOW}🔍 Verifying contracts on block explorer...${NC}"
    echo ""
    
    # Determine the correct verifier URL
    case $NETWORK in
      base-sepolia)
        VERIFIER_URL="https://api-sepolia.basescan.org/api"
        ;;
      base-mainnet|base)
        VERIFIER_URL="https://api.basescan.org/api"
        ;;
    esac
    
    # Verify IsYourDayOkPoints
    echo -e "${YELLOW}Verifying IsYourDayOkPoints...${NC}"
    forge verify-contract $POINTS_ADDRESS \
        src/IsYourDayOkPoints.sol:IsYourDayOkPoints \
        --chain-id $CHAIN_ID \
        --etherscan-api-key $ETHERSCAN_API_KEY \
        --verifier-url $VERIFIER_URL \
        --watch || echo -e "${YELLOW}⚠️  Points contract verification failed (may need manual verification)${NC}"
    
    echo ""
    
    # Verify IsYourDayOkNFT
    echo -e "${YELLOW}Verifying IsYourDayOkNFT...${NC}"
    forge verify-contract $NFT_ADDRESS \
        src/IsYourDayOkNFT.sol:IsYourDayOkNFT \
        --chain-id $CHAIN_ID \
        --etherscan-api-key $ETHERSCAN_API_KEY \
        --verifier-url $VERIFIER_URL \
        --watch || echo -e "${YELLOW}⚠️  NFT contract verification failed (may need manual verification)${NC}"
else
    echo -e "${YELLOW}⚠️  Skipping contract verification (no API key or localhost network)${NC}"
fi

echo ""
echo -e "${BLUE}================================================${NC}"
echo -e "${GREEN}🎉 Deployment Complete!${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""
echo -e "${YELLOW}Contract Addresses:${NC}"
echo -e "  IsYourDayOkPoints: ${GREEN}$POINTS_ADDRESS${NC}"
echo -e "  IsYourDayOkNFT:    ${GREEN}$NFT_ADDRESS${NC}"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Update your frontend .env.local file with:"
echo -e "   ${BLUE}NEXT_PUBLIC_POINTS_CONTRACT=$POINTS_ADDRESS${NC}"
echo -e "   ${BLUE}NEXT_PUBLIC_NFT_CONTRACT=$NFT_ADDRESS${NC}"
echo -e "   ${BLUE}NEXT_PUBLIC_CHAIN_ID=$CHAIN_ID${NC}"
echo ""
echo "2. Update frontend ABIs:"
echo -e "   ${BLUE}cd ../frontend${NC}"
echo -e "   ${BLUE}cat ../contract/out/IsYourDayOkPoints.sol/IsYourDayOkPoints.json | jq '.abi' > src/lib/abis/IsYourDayOkPoints.json${NC}"
echo -e "   ${BLUE}cat ../contract/out/IsYourDayOkNFT.sol/IsYourDayOkNFT.json | jq '.abi' > src/lib/abis/IsYourDayOkNFT.json${NC}"
echo ""

case $NETWORK in
  base-sepolia)
    echo "3. View on BaseScan:"
    echo -e "   Points: ${BLUE}https://sepolia.basescan.org/address/$POINTS_ADDRESS${NC}"
    echo -e "   NFT:    ${BLUE}https://sepolia.basescan.org/address/$NFT_ADDRESS${NC}"
    ;;
  base-mainnet|base)
    echo "3. View on BaseScan:"
    echo -e "   Points: ${BLUE}https://basescan.org/address/$POINTS_ADDRESS${NC}"
    echo -e "   NFT:    ${BLUE}https://basescan.org/address/$NFT_ADDRESS${NC}"
    ;;
esac

echo ""
echo -e "${GREEN}✨ Happy deploying!${NC}"



forge verify-contract 0xD7498664f74cF7437994C4E523C542761BA7d4a0 \
        src/IsYourDayOkNFT.sol:IsYourDayOkNFT \
        --chain-id $CHAIN_ID \
        --etherscan-api-key $ETHERSCAN_API_KEY

forge verify-contract 0x364784cb19047B68066eEa63286AAd5EA49453C2 src/IsYourDayOkPoints.sol:IsYourDayOkPoints --etherscan-api-key $ETHERSCAN_API_KEY