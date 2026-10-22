# IsYourDayOk 🌱

**Your Daily Mental Wellness Companion on Base**

A comprehensive mental health tracking platform that helps you build lasting wellness habits through daily check-ins, journaling, and mindfulness practices. Earn achievement NFTs for maintaining streaks and connect with a supportive community—all on Base blockchain.

## ✨ Features

- **🎭 Daily Mood Tracking** - Log your emotional state with visual analytics (10 points/day)
- **📔 Private Journaling** - Reflect on your day with secure, private entries (20 points/entry)
- **🧘 Guided Meditation** - Practice mindfulness with meditation sessions (30 points/session)
- **🏆 Achievement NFTs** - Earn unique NFTs for 7-day and 30-day streaks
- **⭐ Points System** - Gamified rewards for consistent engagement
- **💬 Community Chat** - Connect with others on their wellness journey
- **🔗 Farcaster Integration** - Seamless social authentication and profiles

## 🎯 Achievement NFTs

Unlock special NFTs by maintaining consistent habits:
- **7-Day Journal Streak** - Complete 7 consecutive days of journaling
- **30-Day Journal Streak** - Complete 30 consecutive days of journaling
- **7-Day Meditation Streak** - Complete 7 consecutive days of meditation
- **30-Day Meditation Streak** - Complete 30 consecutive days of meditation

Each NFT includes your improvement rating and is permanently yours on Base blockchain.

## 🛠️ Tech Stack

- **Frontend**: Next.js 15 + React 19 + TypeScript
- **Styling**: Tailwind CSS + Shadcn UI
- **Blockchain**: Base (Mainnet) via Wagmi + Viem
- **Smart Contracts**: Solidity (NFT & Points contracts)
- **Authentication**: Farcaster, Base Account, Coinbase Wallet
- **Database**: Prisma + PostgreSQL
- **Identity**: OnchainKit (Basename resolution)

## Getting Started

This is a [NextJS](https://nextjs.org/) + TypeScript + React app.

### Prerequisites

- Node.js 18+ and npm
- PostgreSQL database
- Base wallet with ETH for gas fees (admin wallet for NFT minting)

### Installation

1. **Install dependencies:**

```bash
npm install
```

2. **Set up environment variables:**

Create a `.env.local` file:

```bash
# Contract Addresses (Base Mainnet)
NEXT_PUBLIC_POINTS_CONTRACT=0x53D68885D3Bd841B9eD99306eCa07C7f43fDF557
NEXT_PUBLIC_NFT_CONTRACT=0xbe12BEE2433AA6bE6e4f558DA9bCd44F6DD7B981
NEXT_PUBLIC_CHAIN_ID=8453
NEXT_PUBLIC_URL="http://localhost:3000"

# Admin wallet private key (for minting NFTs)
ADMIN_PRIVATE_KEY="0x..."

# Database
DATABASE_URL="postgresql://..."
```

3. **Set up the database:**

```bash
npx prisma generate
npx prisma migrate dev
```

4. **Run the development server:**

```bash
npm run dev
```

5. **Open the app:**

Navigate to [http://localhost:3000](http://localhost:3000)

### Testing with Farcaster

To test your mini app in Farcaster's playground or in Base App, use a tunneling tool like [ngrok](https://ngrok.com/):

```bash
ngrok http 3000
```

Then use the ngrok URL in Farcaster's mini app developer tools.

## 📦 Smart Contracts

The project uses two smart contracts deployed on Base Mainnet:

- **IsYourDayOkPoints** (`0x53D68885D3Bd841B9eD99306eCa07C7f43fDF557`) - ERC20 token for activity rewards
- **IsYourDayOkNFT** (`0xbe12BEE2433AA6bE6e4f558DA9bCd44F6DD7B981`) - Achievement NFTs with metadata

## 🎨 Project Structure

```
frontend/
├── src/
│   ├── app/                  # Next.js app router
│   │   ├── api/             # API routes (NFT minting, etc.)
│   │   └── .well-known/     # Farcaster configuration
│   ├── components/
│   │   ├── mental-health/   # Feature components
│   │   ├── providers/       # Wagmi & Frame providers
│   │   └── ui/              # Reusable UI components
│   └── lib/
│       ├── abis/            # Smart contract ABIs
│       ├── api.ts           # Backend API client
│       └── useContracts.ts  # Contract interaction hooks
├── prisma/
│   └── schema.prisma        # Database schema
└── public/
    ├── icons/               # App icons
    ├── emojis/             # Mood emoji assets
    ├── nft/                # NFT images
    └── nft-metadata/       # NFT metadata JSON files
```

## 🚀 Deployment

See [DEPLOYMENT_QUICKSTART.md](./DEPLOYMENT_QUICKSTART.md) for deployment instructions.

## 📝 License

MIT

## 🙏 Acknowledgments

- Built with [OnchainKit](https://onchainkit.xyz/) by Coinbase
- Powered by [Base](https://base.org/) blockchain
- Integrated with [Farcaster](https://www.farcaster.xyz/) protocol

## Relevant Links
- [Mini Apps in Base App Docs](https://docs.base.org/base-app/introduction/mini-apps)
- [MiniKit Docs](https://docs.base.org/base-app/build-with-minikit/overview)