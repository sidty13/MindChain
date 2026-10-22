# Gasless Transactions - Quick Reference

## 🎯 What Changed?

**All onchain transactions now automatically use gasless (sponsored) transactions when available.**

## 📋 Modified Files

1. **`/src/lib/baseAccount.ts`** - Added generic helpers
2. **`/src/lib/useContracts.ts`** - Updated mood/journal/meditation functions
3. **`/src/components/wallet/WalletActions.tsx`** - Updated demo components

## 🔧 How It Works

### For Developers

Every transaction now follows this pattern:

```typescript
// 1. Check paymaster support
const gaslessAvailable = await checkPaymasterSupport(chainId);

if (gaslessAvailable) {
  try {
    // 2. Try gasless first
    const hash = await sendSponsoredContractCall(
      contractAddress,
      abi,
      functionName,
      args
    );
  } catch (error) {
    // 3. Fall back to regular
    const hash = await writeContract(config, {...});
  }
} else {
  // 4. Use regular if not available
  const hash = await writeContract(config, {...});
}
```

### For Users

**Nothing changes!** Users will:
- See ⚡ emoji when gasless is active
- Pay no gas fees when gasless works
- Automatically fall back to regular transactions if needed

## 🚀 Quick Setup

### 1. Get Paymaster URL
```bash
# Sign up: https://portal.cdp.coinbase.com/
# Navigate to: Onchain Tools > Paymaster
# Copy your Paymaster service URL
```

### 2. Set Environment Variable
```bash
PAYMASTER_SERVICE_URL=https://api.developer.coinbase.com/rpc/v1/base/YOUR_API_KEY
```

### 3. Configure Allowlist
Add these contracts and functions:
- **Points Contract**: `0x364784cb19047B68066eEa63286AAd5EA49453C2`
  - `logMood()`
  - `submitJournal()`
  - `completeMeditation()`
- **NFT Contract**: `0xD7498664f74cF7437994C4E523C542761BA7d4a0`
  - `mintAchievement(address,uint8,uint256,string)`

### 4. Test
```bash
npm run dev
# Try logging mood, journal, or meditation
# Check console for: ⚡ Using gasless transaction
```

## 📊 Monitoring

### Console Indicators
| Log | Meaning |
|-----|---------|
| `⚡ Using gasless transaction` | Gasless is working |
| `⛽ Using regular transaction` | Using fallback |
| `Gasless transaction failed, falling back` | Error occurred, fallback used |

### Check Paymaster Status
```bash
curl http://localhost:3000/api/paymaster
# Should return: {"status":"configured","message":"Paymaster proxy is ready"}
```

## 🎯 Affected Operations

### Main App Features (Now Gasless)
- ✅ Mood logging (`logMood`)
- ✅ Journal submission (`submitJournal`)
- ✅ Meditation completion (`completeMeditation`)
- ✅ NFT minting (`mintAchievement`)

### Demo Features (Now Gasless)
- ✅ Send ETH demo
- ✅ Send Transaction demo

## 🐛 Troubleshooting

### "Paymaster service not configured"
```bash
# Check environment variable is set
echo $PAYMASTER_SERVICE_URL

# Restart dev server
npm run dev
```

### "Paymaster service request failed"
```bash
# 1. Verify API key in URL
# 2. Check contract is in allowlist
# 3. Confirm function signature matches
```

### Transactions not gasless
```bash
# Check console for:
# - "Paymaster support for chain [id]: false"
# This means wallet doesn't support paymaster

# Try with Base Account or compatible wallet
```

## 📖 Related Documentation

- [Full Implementation Guide](./GASLESS_IMPLEMENTATION.md)
- [Setup Guide](./GASLESS_SETUP.md)
- [Base Account Docs](https://docs.base.org/account)
- [Coinbase Developer Platform](https://portal.cdp.coinbase.com/)

## ✅ Checklist

- [ ] Paymaster service URL obtained
- [ ] Environment variable set
- [ ] Contracts added to allowlist
- [ ] Dev server restarted
- [ ] Test mood logging
- [ ] Test journal submission
- [ ] Test meditation completion
- [ ] Test NFT minting
- [ ] Verify console logs show ⚡
- [ ] Check Paymaster dashboard for usage

---

**Ready to test?** Just configure the Paymaster service and all transactions will automatically become gasless! 🎉
