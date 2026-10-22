import { useEffect, useState } from 'react';
import { useAccount, useSwitchChain } from 'wagmi';
import { base } from 'wagmi/chains';

const TARGET_CHAIN_ID = base.id; // 8453

export function useAutoSwitchChain() {
  const { chain, isConnected } = useAccount();
  const { switchChainAsync } = useSwitchChain();
  const [isSwitching, setIsSwitching] = useState(false);
  const [switchError, setSwitchError] = useState<string | null>(null);

  useEffect(() => {
    async function switchToBase() {
      // Only attempt to switch if:
      // 1. User is connected
      // 2. Not already on Base
      // 3. Not currently switching
      if (isConnected && chain && chain.id !== TARGET_CHAIN_ID && !isSwitching) {
        setIsSwitching(true);
        setSwitchError(null);

        try {
          await switchChainAsync({ chainId: TARGET_CHAIN_ID });
        } catch (error: any) {
          console.error('Failed to switch chain:', error);
          setSwitchError(error.message || 'Failed to switch to Base');
        } finally {
          setIsSwitching(false);
        }
      }
    }

    switchToBase();
  }, [chain, isConnected, switchChainAsync, isSwitching]);

  return {
    isCorrectChain: chain?.id === TARGET_CHAIN_ID,
    isSwitching,
    switchError,
    targetChainId: TARGET_CHAIN_ID,
    currentChainId: chain?.id,
  };
}
