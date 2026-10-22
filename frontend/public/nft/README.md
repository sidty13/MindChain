# NFT Assets - Publicly Accessible

This folder contains the NFT achievement image that will be served from your website.

## Setup

1. **Add your achievement image here:**
   - Name it: `achievement.png`
   - Size: 512x512px or larger (1000x1000px recommended)
   - Format: PNG (or SVG)
   - Same image will be used for all 4 achievement types

2. **Update metadata files** in `/public/nft-metadata/`:
   - Replace `https://your-domain.com` with your actual domain
   - All 4 JSON files reference this same image

## Benefits of Using Website Hosting

✅ **Fast loading** - Served from your CDN/hosting
✅ **No IPFS needed** - Simpler setup, no extra costs
✅ **Updatable** - Can change the image anytime
✅ **Reliable** - Your hosting uptime = NFT image uptime
✅ **Quick** - No IPFS gateway delays

## Current Image URL

The metadata files point to:
```
https://your-domain.com/nft/achievement.png
```

Update the domain in `/public/nft-metadata/*.json` files to your actual domain.

## Testing

After adding your image and deploying:
```
https://your-domain.com/nft/achievement.png
https://your-domain.com/nft-metadata/journal-7.json
```

Make sure both URLs are publicly accessible!
