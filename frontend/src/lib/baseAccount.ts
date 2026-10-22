import { createBaseAccountSDK, getCryptoKeyAccount, base } from '@base-org/account';
import { numberToHex, encodeFunctionData, type Hex } from 'viem';

/**
 * Base Account SDK Utilities for Gasless Transactions
 * 
 * This module provides helper functions to:
 * 1. Initialize the Base Account SDK
 * 2. Check paymaster support
 * 3. Send sponsored transactions
 */

// Initialize Base Account SDK
export function createBaseAccount() {
  return createBaseAccountSDK({
    appName: 'MindChain',
    appLogoUrl: 'https://is-your-day-ok.vercel.app/icons/MindChainfinal.png',
    appChainIds: [
      base.constants.CHAIN_IDS.base, // Mainnet
    ],
  });
}

/**
 * Check if the connected wallet supports paymaster services
 */
export async function checkPaymasterSupport(chainId: number = base.constants.CHAIN_IDS.base): Promise<boolean> {
  try {
    const sdk = createBaseAccount();
    const provider = sdk.getProvider();
    const cryptoAccount = await getCryptoKeyAccount();
    const address = cryptoAccount?.account?.address;

    if (!address) {
      console.warn('No account address found');
      return false;
    }

    const capabilities = await provider.request({
      method: 'wallet_getCapabilities',
      params: [address],
    }) as Record<number, any>;

    const chainCapabilities = capabilities[chainId];
    const isSupported = chainCapabilities?.paymasterService?.supported === true;
    
    console.log(`Paymaster support for chain ${chainId}:`, isSupported);
    return isSupported;
  } catch (error) {
    console.error('Failed to check paymaster capabilities:', error);
    return false;
  }
}

/**
 * Send a sponsored transaction using wallet_sendCalls
 * 
 * @param calls - Array of transaction calls to execute
 * @param chainId - Chain ID (default: Base mainnet)
 * @returns Transaction hash or error
 */
export async function sendSponsoredTransaction(
  calls: Array<{
    to: Hex;
    value: Hex;
    data: Hex;
  }>,
  chainId: number = base.constants.CHAIN_IDS.base
) {
  try {
    const sdk = createBaseAccount();
    const provider = sdk.getProvider();
    const cryptoAccount = await getCryptoKeyAccount();
    const fromAddress = cryptoAccount?.account?.address;

    if (!fromAddress) {
      throw new Error('No account found. Please connect your wallet.');
    }

    // Use the proxy URL to keep the actual Paymaster URL secure
    const paymasterProxyUrl = process.env.NEXT_PUBLIC_PAYMASTER_PROXY_URL || '/api/paymaster';
    
    console.log('🚀 Sending sponsored transaction:', {
      from: fromAddress,
      chainId,
      callsCount: calls.length,
      paymasterProxyUrl,
    });

    // Send the transaction with paymaster capabilities
    const result = await provider.request({
      method: 'wallet_sendCalls',
      params: [{
        version: '1.0',
        chainId: numberToHex(chainId),
        from: fromAddress,
        calls: calls,
        capabilities: {
          paymasterService: {
            url: paymasterProxyUrl,
          },
        },
      }],
    });

    console.log('✅ Sponsored transaction sent:', result);
    return result;
  } catch (error: any) {
    console.error('❌ Sponsored transaction failed:', error);
    throw new Error(error.message || 'Failed to send sponsored transaction');
  }
}

/**
 * Generic helper to encode any contract function call
 */
export function encodeContractCall(
  contractAddress: Hex,
  abi: any,
  functionName: string,
  args?: any[],
  value: Hex = '0x0'
): { to: Hex; value: Hex; data: Hex } {
  return {
    to: contractAddress,
    value,
    data: encodeFunctionData({
      abi,
      functionName,
      args: args || [],
    }),
  };
}

/**
 * Send a sponsored contract transaction (generic)
 */
export async function sendSponsoredContractCall(
  contractAddress: Hex,
  abi: any,
  functionName: string,
  args?: any[],
  value: Hex = '0x0',
  chainId: number = base.constants.CHAIN_IDS.base
) {
  const call = encodeContractCall(contractAddress, abi, functionName, args, value);
  return sendSponsoredTransaction([call], chainId);
}

/**
 * Helper to encode NFT mint function call (backward compatibility)
 */
export function encodeNFTMintCall(
  nftContractAddress: Hex,
  toAddress: Hex,
  abi: any
): { to: Hex; value: Hex; data: Hex } {
  return encodeContractCall(nftContractAddress, abi, 'safeMint', [toAddress]);
}

/**
 * Send a sponsored NFT mint transaction
 */
export async function sendSponsoredNFTMint(
  nftContractAddress: Hex,
  toAddress: Hex,
  abi: any,
  chainId: number = base.constants.CHAIN_IDS.base
) {
  const call = encodeNFTMintCall(nftContractAddress, toAddress, abi);
  return sendSponsoredTransaction([call], chainId);
}

/**
 * Get the current chain ID from environment
 */
export function getChainId(): number {
  const isProduction = process.env.NEXT_PUBLIC_ENVIRONMENT === 'production';
  return isProduction ? base.constants.CHAIN_IDS.base : base.constants.CHAIN_IDS.baseSepolia;
}
