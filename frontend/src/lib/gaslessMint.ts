import { encodeFunctionData, type Hex } from 'viem';
import { sendSponsoredTransaction, getChainId, checkPaymasterSupport } from './baseAccount';
import { IsYourDayOkNFTABI } from './abis/IsYourDayOkNFT';

/**
 * Gasless NFT Minting Utilities
 * 
 * This module provides functions to mint NFTs using sponsored transactions
 * via Coinbase Developer Platform Paymaster
 */

const NFT_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_NFT_CONTRACT as Hex;

interface MintParams {
  userAddress: Hex;
  achievementType: 'journal-7' | 'journal-30' | 'meditation-7' | 'meditation-30';
  improvementRating: number;
  metadataUri: string;
}

// Achievement type enum mapping (must match smart contract)
const ACHIEVEMENT_TYPE_MAP = {
  'journal-7': 0,
  'journal-30': 1,
  'meditation-7': 2,
  'meditation-30': 3,
} as const;

/**
 * Check if gasless minting is available for the user
 */
export async function isGaslessMintingAvailable(): Promise<boolean> {
  try {
    const chainId = getChainId();
    return await checkPaymasterSupport(chainId);
  } catch (error) {
    console.error('Failed to check gasless minting availability:', error);
    return false;
  }
}

/**
 * Mint NFT using gasless transaction (sponsored by Paymaster)
 * 
 * This allows users to mint NFTs without paying gas fees.
 * The transaction is sponsored via Coinbase Developer Platform Paymaster.
 */
export async function mintNFTGasless(params: MintParams) {
  try {
    const { userAddress, achievementType, improvementRating, metadataUri } = params;

    // Validate inputs
    if (!userAddress) {
      throw new Error('User address is required');
    }

    if (improvementRating < 1 || improvementRating > 100) {
      throw new Error('Improvement rating must be between 1 and 100');
    }

    if (!NFT_CONTRACT_ADDRESS) {
      throw new Error('NFT contract address not configured');
    }

    // Map achievement type to contract enum
    const achievementTypeEnum = ACHIEVEMENT_TYPE_MAP[achievementType];
    if (achievementTypeEnum === undefined) {
      throw new Error('Invalid achievement type');
    }

    console.log('🎨 Preparing gasless NFT mint:', {
      contract: NFT_CONTRACT_ADDRESS,
      user: userAddress,
      type: achievementType,
      typeEnum: achievementTypeEnum,
      rating: improvementRating,
    });

    // Encode the mint function call
    const mintCallData = encodeFunctionData({
      abi: IsYourDayOkNFTABI,
      functionName: 'mintAchievement',
      args: [
        userAddress,
        achievementTypeEnum,
        BigInt(improvementRating),
        metadataUri,
      ],
    });

    // Prepare the transaction call
    const calls = [
      {
        to: NFT_CONTRACT_ADDRESS,
        value: '0x0' as Hex,
        data: mintCallData,
      },
    ];

    // Send the sponsored transaction
    const chainId = getChainId();
    const result = await sendSponsoredTransaction(calls, chainId);

    console.log('✅ Gasless NFT mint successful:', result);
    return result;
  } catch (error: any) {
    console.error('❌ Gasless NFT mint failed:', error);
    throw new Error(error.message || 'Failed to mint NFT with gasless transaction');
  }
}

/**
 * Get metadata URI for achievement type
 */
export function getMetadataUri(achievementType: string): string {
  const baseUrl = 'https://is-your-day-ok.vercel.app';
  const metadataURIs: Record<string, string> = {
    'journal-7': `${baseUrl}/nft-metadata/journal-7.json`,
    'journal-30': `${baseUrl}/nft-metadata/journal-30.json`,
    'meditation-7': `${baseUrl}/nft-metadata/meditation-7.json`,
    'meditation-30': `${baseUrl}/nft-metadata/meditation-30.json`,
  };

  return metadataURIs[achievementType] || '';
}

/**
 * Complete gasless mint flow:
 * 1. Create achievement record in database
 * 2. Mint NFT using gasless transaction
 * 3. Update database with transaction details
 */
export async function completeGaslessMint(
  achievementId: string,
  userAddress: Hex,
  achievementType: string,
  improvementRating: number
) {
  try {
    console.log('🚀 Starting complete gasless mint flow');

    // Get metadata URI
    const metadataUri = getMetadataUri(achievementType);
    if (!metadataUri) {
      throw new Error('Invalid achievement type for metadata');
    }

    // Execute gasless mint
    const txResult = await mintNFTGasless({
      userAddress,
      achievementType: achievementType as any,
      improvementRating,
      metadataUri,
    });

    console.log('📝 Updating database with transaction details');

    // Update achievement in database with transaction hash
    const updateResponse = await fetch('/api/achievements', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: achievementId,
        transactionHash: txResult,
        minted: true,
        contractAddress: NFT_CONTRACT_ADDRESS,
      }),
    });

    if (!updateResponse.ok) {
      console.error('Failed to update database, but NFT was minted');
      // Don't throw - NFT was minted successfully
    }

    console.log('✅ Complete gasless mint flow successful');
    return txResult;
  } catch (error) {
    console.error('❌ Complete gasless mint flow failed:', error);
    throw error;
  }
}
