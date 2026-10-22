#!/bin/bash

# Update frontend with deployed contract addresses and ABIs
# Usage: ./update-frontend.sh <points_address> <nft_address> [chain_id]

set -e

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

POINTS_ADDRESS=$1
NFT_ADDRESS=$2
CHAIN_ID=${3:-84532}

if [ -z "$POINTS_ADDRESS" ] || [ -z "$NFT_ADDRESS" ]; then
    echo "Usage: ./update-frontend.sh <points_address> <nft_address> [chain_id]"
    echo "Example: ./update-frontend.sh 0x123... 0x456... 84532"
    exit 1
fi

echo -e "${BLUE}Updating frontend with new contract addresses...${NC}"
echo ""

# Update frontend .env.local
ENV_FILE="../frontend/.env.local"

# Create or update .env.local
if [ -f "$ENV_FILE" ]; then
    # Remove old contract addresses if they exist
    sed -i '' '/NEXT_PUBLIC_POINTS_CONTRACT/d' "$ENV_FILE"
    sed -i '' '/NEXT_PUBLIC_NFT_CONTRACT/d' "$ENV_FILE"
    sed -i '' '/NEXT_PUBLIC_CHAIN_ID/d' "$ENV_FILE"
fi

# Append new values
cat >> "$ENV_FILE" << EOF

# Contract Addresses (Updated $(date))
NEXT_PUBLIC_POINTS_CONTRACT=$POINTS_ADDRESS
NEXT_PUBLIC_NFT_CONTRACT=$NFT_ADDRESS
NEXT_PUBLIC_CHAIN_ID=$CHAIN_ID
EOF

echo -e "${GREEN}✅ Updated $ENV_FILE${NC}"

# Update ABIs
echo -e "${YELLOW}Updating contract ABIs...${NC}"

mkdir -p ../frontend/src/lib/abis

cat out/IsYourDayOkPoints.sol/IsYourDayOkPoints.json | jq '.abi' > ../frontend/src/lib/abis/IsYourDayOkPoints.json
cat out/IsYourDayOkNFT.sol/IsYourDayOkNFT.json | jq '.abi' > ../frontend/src/lib/abis/IsYourDayOkNFT.json

echo -e "${GREEN}✅ Updated contract ABIs${NC}"
echo ""
echo -e "${GREEN}🎉 Frontend updated successfully!${NC}"
echo ""
echo -e "${YELLOW}Contract Addresses:${NC}"
echo -e "  Points: $POINTS_ADDRESS"
echo -e "  NFT:    $NFT_ADDRESS"
echo -e "  Chain:  $CHAIN_ID"
