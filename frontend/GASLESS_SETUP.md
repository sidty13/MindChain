# Gasless Transaction Setup Guide

This guide explains how to set up gasless transactions (sponsored gas fees) for IsYourDayOk using Coinbase Developer Platform Paymaster.

## What is Gasless Minting?

Gasless minting allows users to mint their achievement NFTs without paying any gas fees. The transaction costs are sponsored by the app using a Paymaster service.

## Prerequisites

1. Sign up for [Coinbase Developer Platform](https://portal.cdp.coinbase.com/)
2. Navigate to **Onchain Tools > Paymaster**
3. Get your Paymaster service URL

## Environment Variables

Add these environment variables to your `.env.local` file:

```bash
# Paymaster Service URL from Coinbase Developer Platform
# Keep this secret - DO NOT expose on frontend
PAYMASTER_SERVICE_URL=https://api.developer.coinbase.com/rpc/v1/base/YOUR_API_KEY

# Public proxy URL (used by frontend)
# This should point to your /api/paymaster endpoint
NEXT_PUBLIC_PAYMASTER_PROXY_URL=/api/paymaster

# Environment (production or development)
NEXT_PUBLIC_ENVIRONMENT=development
```

## Setup Steps

### 1. Configure Paymaster Allowlist

In Coinbase Developer Platform, add your NFT contract to the allowlist:

```
Contract Address: 0xYourNFTContractAddress
Function: mintAchievement(address,uint8,uint256,string)
```

### 2. Verify Proxy Endpoint

Test the proxy endpoint is working:

```bash
curl http://localhost:3000/api/paymaster
```

Should return:
```json
{
  "status": "configured",
  "message": "Paymaster proxy is ready"
}
```

### 3. Test Gasless Minting

When users mint NFTs, the app will:
1. Check if gasless minting is available
2. Automatically use gasless minting if supported
3. Fall back to regular minting if not available

## How It Works

### Architecture

```
User → Frontend → /api/paymaster (Proxy) → Coinbase Paymaster → Base Blockchain
```

### Flow

1. **User initiates mint**: Clicks "Mint NFT" button
2. **Check capabilities**: App checks if wallet supports gasless transactions
3. **Create achievement**: Database record created
4. **Prepare transaction**: Encode `mintAchievement` function call
5. **Send sponsored tx**: Use `wallet_sendCalls` with paymaster capabilities
6. **Update database**: Store transaction hash and confirm mint

### Files Modified

- `/src/lib/baseAccount.ts` - Base Account SDK utilities
- `/src/lib/gaslessMint.ts` - Gasless minting logic
- `/src/app/api/paymaster/route.ts` - Paymaster proxy endpoint
- `/src/components/mental-health/MintModal.tsx` - UI with gasless support

## Security Notes

⚠️ **Important**: The `PAYMASTER_SERVICE_URL` should **NEVER** be exposed on the frontend. Always use the proxy endpoint (`/api/paymaster`) which:

1. Keeps the actual Paymaster URL secret
2. Runs on your server
3. Forwards requests securely

## Monitoring

Check your Paymaster usage in Coinbase Developer Platform:
- **Dashboard**: View sponsored transaction count
- **Credits**: Monitor remaining gas credits ($15k free during Base Gasless Campaign)
- **Policies**: Review and adjust contract allowlist

## Troubleshooting

### "Paymaster service not configured"
- Check `PAYMASTER_SERVICE_URL` is set in `.env.local`
- Restart your Next.js dev server

### "Paymaster service request failed"
- Verify your API key is valid
- Check contract is in allowlist
- Ensure function signature matches

### Gasless not available
- Check wallet supports Base Account
- Verify `NEXT_PUBLIC_PAYMASTER_PROXY_URL` is correct
- Test proxy endpoint directly

## Testing

Test on Base Sepolia testnet first:
1. Set `NEXT_PUBLIC_ENVIRONMENT=development`
2. Configure Sepolia contracts in allowlist
3. Test minting flow
4. Monitor transactions on Base Sepolia explorer

## Production Checklist

- [ ] Paymaster service URL configured
- [ ] NFT contract added to allowlist
- [ ] Proxy endpoint tested
- [ ] Environment set to `production`
- [ ] Gas credits monitored
- [ ] Fallback to regular minting works

## Resources

- [Base Account Documentation](https://docs.base.org/account)
- [Coinbase Developer Platform](https://portal.cdp.coinbase.com/)
- [ERC-7677 Paymaster Standard](https://eips.ethereum.org/EIPS/eip-7677)
- [Base Gasless Campaign](https://base.org/gasless)

## Support

For issues:
1. Check Coinbase Developer Platform logs
2. Review browser console for errors
3. Test proxy endpoint independently
4. Verify contract allowlist configuration
