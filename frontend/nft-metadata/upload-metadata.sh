#!/bin/bash

# NFT Metadata Upload Helper Script
# This script helps you prepare and upload NFT metadata to IPFS

echo "==================================="
echo "NFT Metadata Upload Helper"
echo "==================================="
echo ""

# Check if image hash is provided
if [ -z "$1" ]; then
    echo "❌ Error: Please provide the IPFS image hash as an argument"
    echo ""
    echo "Usage: ./upload-metadata.sh QmYourImageHash"
    echo ""
    echo "Steps:"
    echo "1. Upload your achievement.png to IPFS (via Pinata or NFT.Storage)"
    echo "2. Copy the IPFS hash (e.g., QmXxXxXx...)"
    echo "3. Run: ./upload-metadata.sh QmXxXxXx..."
    echo ""
    exit 1
fi

IMAGE_HASH=$1
echo "📷 Using image hash: ipfs://$IMAGE_HASH/achievement.png"
echo ""

# Update all JSON files with the image hash
echo "📝 Updating metadata files with image hash..."

# macOS (BSD sed) compatible
if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "s|ipfs://QmYourImageHash/achievement.png|ipfs://$IMAGE_HASH/achievement.png|g" journal-7.json
    sed -i '' "s|ipfs://QmYourImageHash/achievement.png|ipfs://$IMAGE_HASH/achievement.png|g" journal-30.json
    sed -i '' "s|ipfs://QmYourImageHash/achievement.png|ipfs://$IMAGE_HASH/achievement.png|g" meditation-7.json
    sed -i '' "s|ipfs://QmYourImageHash/achievement.png|ipfs://$IMAGE_HASH/achievement.png|g" meditation-30.json
else
    # Linux (GNU sed)
    sed -i "s|ipfs://QmYourImageHash/achievement.png|ipfs://$IMAGE_HASH/achievement.png|g" journal-7.json
    sed -i "s|ipfs://QmYourImageHash/achievement.png|ipfs://$IMAGE_HASH/achievement.png|g" journal-30.json
    sed -i "s|ipfs://QmYourImageHash/achievement.png|ipfs://$IMAGE_HASH/achievement.png|g" meditation-7.json
    sed -i "s|ipfs://QmYourImageHash/achievement.png|ipfs://$IMAGE_HASH/achievement.png|g" meditation-30.json
fi

echo "✅ Metadata files updated!"
echo ""

echo "📤 Next steps:"
echo ""
echo "1. Upload each metadata file to IPFS:"
echo "   - journal-7.json"
echo "   - journal-30.json"
echo "   - meditation-7.json"
echo "   - meditation-30.json"
echo ""
echo "2. Save the IPFS hashes for each file"
echo ""
echo "3. Update ../src/app/api/mint-nft/route.ts with the hashes:"
echo "   const metadataURIs = {"
echo "     'journal-7': 'ipfs://QmHash1/journal-7.json',"
echo "     'journal-30': 'ipfs://QmHash2/journal-30.json',"
echo "     'meditation-7': 'ipfs://QmHash3/meditation-7.json',"
echo "     'meditation-30': 'ipfs://QmHash4/meditation-30.json',"
echo "   };"
echo ""
echo "4. Test your IPFS links:"
echo "   https://ipfs.io/ipfs/$IMAGE_HASH/achievement.png"
echo ""
echo "==================================="
echo "✨ Ready to upload to IPFS!"
echo "==================================="
