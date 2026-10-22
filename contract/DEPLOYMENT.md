# Contract Deployment Guide

This directory contains deployment scripts for the IsYourDayOk smart contracts.

## Prerequisites

1. **Foundry installed**
   ```bash
   curl -L https://foundry.paradigm.xyz | bash
   foundryup
   ```

2. **Environment setup**
   ```bash
   cp .env.example .env
   # Edit .env and add your PRIVATE_KEY and ETHERSCAN_API_KEY
   ```

3. **Funded wallet**
   - For Base Sepolia: Get test ETH from [Base Sepolia Faucet](https://www.coinbase.com/faucets/base-ethereum-goerli-faucet)
   - For Base Mainnet: Ensure your wallet has sufficient ETH

## Deployment Scripts

### `deploy.sh` - Main Deployment Script

Deploys both IsYourDayOkPoints and IsYourDayOkNFT contracts.

**Usage:**
```bash
./deploy.sh [network]
```

**Supported Networks:**
- `base-sepolia` (default) - Base Sepolia testnet
- `base-mainnet` or `base` - Base mainnet
- `localhost` - Local development

**Examples:**
```bash
# Deploy to Base Sepolia (testnet)
./deploy.sh base-sepolia

# Deploy to Base Mainnet
./deploy.sh base-mainnet

# Deploy to localhost (requires anvil running)
./deploy.sh localhost
```

**What it does:**
1. ✅ Builds contracts with Foundry
2. ✅ Deploys IsYourDayOkPoints contract
3. ✅ Deploys IsYourDayOkNFT contract
4. ✅ Saves deployment addresses to `deployments/<network>.json`
5. ✅ Verifies contracts on block explorer (if API key provided)
6. ✅ Provides frontend integration instructions

### `update-frontend.sh` - Frontend Update Script

Updates the frontend with deployed contract addresses and ABIs.

**Usage:**
```bash
./update-frontend.sh <points_address> <nft_address> [chain_id]
```

**Example:**
```bash
./update-frontend.sh 0xF5e051e59165cF8C8EB77a77F58bb47A7693152a 0xAB13910983ec8A4bcF16572464E3EEaf2bB65af8 84532
```

**What it does:**
1. ✅ Updates `frontend/.env.local` with contract addresses
2. ✅ Copies latest ABIs to `frontend/src/lib/abis/`

## Step-by-Step Deployment

### 1. Setup Environment

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your credentials
nano .env  # or use your preferred editor
```

Add your private key (without 0x prefix):
```
PRIVATE_KEY=your_private_key_here
ETHERSCAN_API_KEY=your_basescan_api_key_here
```

### 2. Deploy Contracts

```bash
# Deploy to Base Sepolia testnet
./deploy.sh base-sepolia
```

The script will output:
- ✅ Contract addresses
- 📝 Deployment info saved to `deployments/base-sepolia.json`
- 🔗 Block explorer links
- 📋 Next steps for frontend integration

### 3. Update Frontend

Option A - Use the helper script:
```bash
./update-frontend.sh <points_address> <nft_address> 84532
```

Option B - Manual update:
```bash
# Update .env.local in frontend
cd ../frontend
echo "NEXT_PUBLIC_POINTS_CONTRACT=0x..." >> .env.local
echo "NEXT_PUBLIC_NFT_CONTRACT=0x..." >> .env.local
echo "NEXT_PUBLIC_CHAIN_ID=84532" >> .env.local

# Update ABIs
cd ../contract
cat out/IsYourDayOkPoints.sol/IsYourDayOkPoints.json | jq '.abi' > ../frontend/src/lib/abis/IsYourDayOkPoints.json
cat out/IsYourDayOkNFT.sol/IsYourDayOkNFT.json | jq '.abi' > ../frontend/src/lib/abis/IsYourDayOkNFT.json
```

### 4. Verify Deployment

Check your contracts on BaseScan:
- **Base Sepolia:** https://sepolia.basescan.org/address/YOUR_ADDRESS
- **Base Mainnet:** https://basescan.org/address/YOUR_ADDRESS

## Contract Addresses

Deployed contract addresses are saved in `deployments/<network>.json`:

```json
{
  "network": "base-sepolia",
  "chainId": 84532,
  "timestamp": "2025-10-15T13:00:00Z",
  "contracts": {
    "IsYourDayOkPoints": {
      "address": "0x..."
    },
    "IsYourDayOkNFT": {
      "address": "0x..."
    }
  }
}
```

## Troubleshooting

### "insufficient funds for gas"
- Ensure your wallet has enough ETH for deployment
- Base Sepolia: Get test ETH from faucet
- Base Mainnet: Transfer ETH to your wallet

### "nonce too low"
- Wait a few seconds and retry
- Or reset your wallet nonce

### "Contract verification failed"
- Verification can be done manually on BaseScan
- Go to the contract page → "Verify & Publish"
- Select "Solidity (Single file)" or "Solidity (Standard JSON)"

### Build fails
```bash
# Clean and rebuild
forge clean
forge build
```

## Security Notes

⚠️ **IMPORTANT:**
- Never commit `.env` file to git
- Keep your private key secure
- Use a separate wallet for deployments
- Always test on testnet first
- Verify contract source code on block explorer

## Network Information

### Base Sepolia (Testnet)
- **Chain ID:** 84532
- **RPC:** https://sepolia.base.org
- **Explorer:** https://sepolia.basescan.org
- **Faucet:** https://www.coinbase.com/faucets/base-ethereum-goerli-faucet

### Base Mainnet
- **Chain ID:** 8453
- **RPC:** https://mainnet.base.org
- **Explorer:** https://basescan.org

## Additional Commands

```bash
# Build contracts only
forge build

# Run tests
forge test

# Run tests with gas report
forge test --gas-report

# Check contract size
forge build --sizes

# Clean build artifacts
forge clean
```

## Support

For issues or questions:
- Check Foundry docs: https://book.getfoundry.sh/
- Base docs: https://docs.base.org/
- Open an issue in the repository
