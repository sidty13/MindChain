# 🚀 Pre-Deployment Checklist for IsYourDayOk

**Date**: October 25, 2025 (Updated)  
**Project**: IsYourDayOk - Mental Health NFT Platform  
**Network**: Base Sepolia (Testnet)

> **⚠️ IMPORTANT**: This checklist has been updated. See `FINAL_DEPLOYMENT_CHECKLIST.md` for the most comprehensive version with all recent UI/UX improvements documented.

---

## 🎯 Recent Updates (October 25, 2025)

### UI/UX Improvements ✅
- ✅ Navigation redesigned: 5 main tabs + Profile in header
- ✅ Header optimized with compact layout
- ✅ Profile button shows basename/truncated address (5+3 chars)
- ✅ Disconnect button icon-only for space efficiency
- ✅ Wallet ordering: Base Account → Coinbase → Farcaster → MetaMask
- ✅ Duplicate connectors removed (Brave wallet filtered)
- ✅ Custom icons for Base Account and Farcaster
- ✅ Navigation icons optimized (no drop shadow, clean styling)
- ✅ Mood page redesigned with cleaner mood selection
- ✅ Profile NFT section fixed with achievement metadata enrichment

### Technical Fixes ✅
- ✅ Achievement data transformation added (icon, title, current, target, status)
- ✅ Basename integration with OnchainKit
- ✅ truncateAddress function updated with configurable lengths
- ✅ Conditional icon rendering (image paths vs emojis)
- ✅ Auto-switch to Base Sepolia network
- ✅ Filtered and sorted wallet connectors

---

## ✅ Critical Items - MUST COMPLETE

### 1. Environment Variables (.env.local)

**Status**: ⚠️ **INCOMPLETE** - Missing 2 required variables

**Current Configuration**:
```bash
✅ NEXT_PUBLIC_POINTS_CONTRACT=0x53D68885D3Bd841B9eD99306eCa07C7f43fDF557
✅ NEXT_PUBLIC_NFT_CONTRACT=0xbe12BEE2433AA6bE6e4f558DA9bCd44F6DD7B981
✅ NEXT_PUBLIC_CHAIN_ID=84532
✅ NEXT_PUBLIC_URL="https://appeared-topics-initial-gore.trycloudflare.com"
```

**Missing Variables**:
```bash
❌ ADMIN_PRIVATE_KEY="0x..."
   Purpose: Server-side NFT minting (contract owner's private key)
   Impact: NFT minting will fail with 500 error
   Location: Backend API only (never exposed to frontend)
   
❌ NEXT_PUBLIC_APP_URL="https://appeared-topics-initial-gore.trycloudflare.com"
   Purpose: Generate metadata URLs for NFTs
   Impact: NFT metadata paths will be incorrect
   Can use: Same as NEXT_PUBLIC_URL value
```

**Action Required**:
1. Get the private key from the wallet that deployed contract `0xbe12BEE2433AA6bE6e4f558DA9bCd44F6DD7B981`
2. Add both variables to `/frontend/.env.local`
3. **NEVER commit .env.local to git** (already in .gitignore)
4. Restart dev server after adding

---

### 2. NFT Assets

#### Achievement Image
**Status**: ❌ **MISSING**

**Required**:
- **Path**: `/frontend/public/nft/achievement.png`
- **Current**: Only `README.md` exists in `/public/nft/`
- **Purpose**: Image displayed on all minted NFTs (same for all 4 types)
- **Recommended Size**: 1000x1000px or 500x500px
- **Format**: PNG with transparency preferred

**Action Required**:
1. Create or select achievement badge/trophy image
2. Place at: `/frontend/public/nft/achievement.png`
3. Accessible at: `https://your-domain.com/nft/achievement.png`

#### Metadata Files
**Status**: ⚠️ **NEEDS UPDATE**

**Files Created** (in `/public/nft-metadata/`):
- ✅ `journal-7.json` (7-Day Journal Streak)
- ✅ `journal-30.json` (30-Day Journal Streak)
- ✅ `meditation-7.json` (7-Day Meditation Streak)
- ✅ `meditation-30.json` (30-Day Meditation Streak)

**Issue**: All files contain placeholder domain:
```json
"image": "https://your-domain.com/nft/achievement.png"
```

**Action Required**:
Replace `your-domain.com` with actual domain in all 4 files:
```json
"image": "https://appeared-topics-initial-gore.trycloudflare.com/nft/achievement.png"
```

---

### 3. Smart Contract Verification

**NFT Contract**: `0xbe12BEE2433AA6bE6e4f558DA9bCd44F6DD7B981`  
**Points Contract**: `0x53D68885D3Bd841B9eD99306eCa07C7f43fDF557`  
**Network**: Base Sepolia (Chain ID: 84532)

**Verify Before Deployment**:
- [ ] Contract owner wallet matches `ADMIN_PRIVATE_KEY`
- [ ] Contract has `mintAchievement(address to, uint8 achievementType, uint8 improvementRating, string uri)` function
- [ ] Contract has `hasUserMinted(address user, uint8 achievementType)` view function
- [ ] Contract emits `AchievementMinted` event with tokenId
- [ ] Test minting from contract owner wallet works

**Check Contract**:
```bash
# View on BaseScan (Sepolia)
https://sepolia.basescan.org/address/0xbe12BEE2433AA6bE6e4f558DA9bCd44F6DD7B981
```

---

### 4. Database Configuration

**Status**: ⚠️ **NEEDS VERIFICATION**

**Required Tables**:
- [x] `User` - Wallet addresses, streaks, points
- [x] `NFTAchievement` - Minted achievements tracking
- [x] `Journal` - Journal entries
- [x] `Meditation` - Meditation sessions
- [x] `MoodLog` - Daily mood tracking
- [x] `DailyActivity` - Activity completion tracking

**Verify**:
- [ ] `DATABASE_URL` environment variable set (production)
- [ ] Prisma migrations applied: `npx prisma migrate deploy`
- [ ] Database accessible from deployment environment
- [ ] Test connection: `npx prisma db pull`

**Critical NFTAchievement Schema**:
```prisma
model NFTAchievement {
  id                String    @id
  userId            String
  type              String    // "journal" or "meditation"
  days              Int       // 7 or 30
  tokenId           String?   @unique
  contractAddress   String?
  transactionHash   String?
  improvementRating Int
  minted            Boolean   @default(false)
  mintedAt          DateTime?
  createdAt         DateTime  @default(now())
}
```

---

## 🧪 Testing Checklist

### Pre-Deployment Tests

#### 1. Environment Setup Test
```bash
cd frontend
npm run dev
# Should start without errors
# Check: http://localhost:3000
```

#### 2. NFT Metadata Endpoint Test
**Test URLs** (replace with your domain):
- `https://your-domain.com/nft-metadata/journal-7.json`
- `https://your-domain.com/nft-metadata/journal-30.json`
- `https://your-domain.com/nft-metadata/meditation-7.json`
- `https://your-domain.com/nft-metadata/meditation-30.json`
- `https://your-domain.com/nft/achievement.png`

**Expected**: All return 200 status with correct content

#### 3. Wallet Connection Test
- [ ] Connect wallet via OnchainKit
- [ ] Wallet address displays correctly
- [ ] Profile loads with correct data
- [ ] Basename resolves (if available)
- [ ] Farcaster profile loads (if connected)

#### 4. Points System Test
- [ ] Log mood → Earn 10 points
- [ ] Write journal → Earn 20 points
- [ ] Complete meditation → Earn 30 points
- [ ] Points update in real-time
- [ ] Points display in Stats tab

#### 5. Streak Tracking Test
- [ ] Journal entry increments journal streak
- [ ] Meditation session increments meditation streak
- [ ] Streaks display in Profile Stats tab
- [ ] Consecutive days tracked correctly

#### 6. Achievement Unlock Test
- [ ] 7 journal entries → "7-Day Journal" achievement appears
- [ ] 30 journal entries → "30-Day Journal" achievement appears
- [ ] 7 meditation sessions → "7-Day Meditation" achievement appears
- [ ] 30 meditation sessions → "30-Day Meditation" achievement appears
- [ ] Achievements show in NFTs tab with correct progress

#### 7. NFT Minting Test (Critical)
- [ ] Click "Mint NFT" on unlocked achievement
- [ ] Modal opens with improvement rating slider
- [ ] Select rating 1-100
- [ ] Click "Mint Achievement"
- [ ] Shows "Minting..." loading state
- [ ] Transaction completes (check for ~30-60 seconds)
- [ ] Success message displays
- [ ] Database updated: `minted=true`, `tokenId`, `transactionHash`
- [ ] Button changes to "Minted ✓" (disabled)
- [ ] NFT visible in wallet (OpenSea testnet or BaseScan)

#### 8. Error Handling Test
- [ ] Try minting same achievement twice → Shows error "Already minted"
- [ ] Disconnect wallet during mint → Graceful error
- [ ] Invalid rating (0 or >100) → Validation error
- [ ] Network error → User-friendly message

#### 9. UI/UX Test
- [ ] Profile tabs work (Stats/History/NFTs)
- [ ] Home icon displays (`/home.PNG`)
- [ ] Minimalist design renders correctly
- [ ] Mobile responsive
- [ ] Dark mode compatibility (if applicable)
- [ ] Loading states show appropriately
- [ ] Empty states display correctly

---

## 🔒 Security Checklist

### Environment Security
- [ ] `.env.local` in `.gitignore` ✅
- [ ] `ADMIN_PRIVATE_KEY` never exposed to frontend ✅
- [ ] No private keys in code/comments ✅
- [ ] API route validates all inputs ✅

### Smart Contract Security
- [ ] Only contract owner can mint (via ADMIN_PRIVATE_KEY) ✅
- [ ] Duplicate minting prevented (`hasUserMinted` check) ✅
- [ ] User address validated before minting ✅
- [ ] Achievement type enum validated (0-3) ✅

### API Security
- [ ] Input validation on all fields ✅
- [ ] Error messages don't leak sensitive info ✅
- [ ] Transaction confirmation awaited ✅
- [ ] Database updates atomic ✅

---

## 🐛 Known Issues & Limitations

### Current Limitations
1. **Testnet Only**: Deployed on Base Sepolia (not mainnet)
2. **Admin Gas Fees**: Server pays gas for all mints (admin wallet must have ETH)
3. **Single Image**: All NFT types use same achievement.png image
4. **Static Metadata**: Metadata doesn't update after minting

### Potential Issues
1. **Admin Wallet Balance**: Must have enough Sepolia ETH for gas
   - Check balance: https://sepolia.basescan.org/address/[ADMIN_WALLET]
   - Get testnet ETH: https://faucet.quicknode.com/base/sepolia

2. **Rate Limiting**: No rate limiting on mint API (consider adding)

3. **Concurrent Minting**: No queue system for multiple simultaneous mints

4. **Metadata Caching**: NFT platforms may cache old metadata
   - Consider versioning metadata files if updating

---

## 📝 Deployment Steps

### Step 1: Complete All Critical Items Above
- [ ] Add `ADMIN_PRIVATE_KEY` to `.env.local`
- [ ] Add `NEXT_PUBLIC_APP_URL` to `.env.local`
- [ ] Add `achievement.png` to `/public/nft/`
- [ ] Update all metadata JSON files with actual domain
- [ ] Verify admin wallet has Sepolia ETH

### Step 2: Test Locally
```bash
cd frontend
npm run dev
# Run through all tests in Testing Checklist
```

### Step 3: Build Production
```bash
npm run build
# Should complete without errors
# Check output for any warnings
```

### Step 4: Test Production Build Locally
```bash
npm start
# Test critical paths again
```

### Step 5: Deploy
```bash
# If using Vercel:
vercel --prod

# If using other platform, follow their deployment guide
```

### Step 6: Configure Production Environment
- [ ] Add all environment variables to hosting platform
- [ ] Set `DATABASE_URL` for production database
- [ ] Run Prisma migrations: `npx prisma migrate deploy`
- [ ] Verify all env vars set correctly

### Step 7: Post-Deployment Verification
- [ ] Visit production URL
- [ ] Test wallet connection
- [ ] Test one full mint flow
- [ ] Check metadata URLs accessible
- [ ] Verify achievement.png loads
- [ ] Check database updates correctly

---

## 🆘 Troubleshooting

### Issue: "Server configuration error" on mint
**Cause**: Missing `ADMIN_PRIVATE_KEY`  
**Fix**: Add private key to `.env.local` and restart server

### Issue: NFT image not showing
**Cause**: Missing `achievement.png` or wrong metadata URL  
**Fix**: 
1. Add image to `/public/nft/achievement.png`
2. Update metadata files with correct domain
3. Clear browser cache

### Issue: "Already minted" error
**Cause**: User already minted this achievement type  
**Expected**: This is correct behavior (each type can only be minted once per user)

### Issue: Transaction fails
**Possible Causes**:
1. Admin wallet out of Sepolia ETH → Get more from faucet
2. Admin wallet not contract owner → Use correct private key
3. Contract paused/revoked → Check contract status
4. Network congestion → Wait and retry

### Issue: Metadata not updating
**Cause**: NFT platforms cache metadata aggressively  
**Fix**: Some platforms have "Refresh Metadata" button, or wait 24-48 hours

---

## 📊 Success Metrics

After deployment, monitor:
- [ ] Successful wallet connections
- [ ] Achievements unlocked per user
- [ ] NFTs minted successfully
- [ ] Average time to mint (should be <2 minutes)
- [ ] Error rate on mint API (<5% acceptable for testnet)
- [ ] User engagement with mental health features

---

## 🔗 Important Links

**Contracts**:
- NFT Contract: https://sepolia.basescan.org/address/0xbe12BEE2433AA6bE6e4f558DA9bCd44F6DD7B981
- Points Contract: https://sepolia.basescan.org/address/0x53D68885D3Bd841B9eD99306eCa07C7f43fDF557

**Resources**:
- Base Sepolia Faucet: https://faucet.quicknode.com/base/sepolia
- Base Sepolia Explorer: https://sepolia.basescan.org/
- OpenSea Testnet: https://testnets.opensea.io/

**Documentation**:
- NFT Minting Setup: `/frontend/NFT_MINTING_SETUP.md`
- Metadata Guide: `/frontend/nft-metadata/README.md`

---

## ✅ Final Sign-Off

**Before deploying to production, confirm**:

- [ ] All ✅ Critical Items completed
- [ ] All 🧪 Tests passed
- [ ] All 🔒 Security items verified
- [ ] Build completes without errors
- [ ] Admin wallet funded with Sepolia ETH
- [ ] Environment variables configured
- [ ] Team reviewed this checklist

**Deployment Ready**: ⬜ YES / ⬜ NO

**Deployed By**: _________________  
**Deployment Date**: _________________  
**Production URL**: _________________

---

**Notes**:
- This is a TESTNET deployment (Base Sepolia)
- NFTs have no real monetary value
- Admin wallet pays gas fees for all mints
- Consider rate limiting before mainnet deployment
- Monitor admin wallet ETH balance regularly

