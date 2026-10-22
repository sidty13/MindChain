"use client";

import React, { useState, useCallback, useMemo } from "react";
import {
  useAccount,
  useSendTransaction,
  useSignMessage,
  useSignTypedData,
  useWaitForTransactionReceipt,
  useDisconnect,
  useConnect,
  useSwitchChain,
  useChainId,
} from "wagmi";
import { config } from "~/components/providers/WagmiProvider";
import { Button } from "~/components/ui/Button";
import { truncateAddress } from "~/lib/truncateAddress";
import { base, optimism } from "wagmi/chains";
import { BaseError, UserRejectedRequestError, type Hex } from "viem";
import { checkPaymasterSupport, sendSponsoredTransaction, getChainId } from "~/lib/baseAccount";

import { SignInWithBaseButton } from "@base-org/account-ui/react";
import { createBaseAccountSDK } from "@base-org/account";
import { METADATA } from "~/lib/utils";
import { SiweMessage } from "siwe";

// dylsteck.base.eth
const RECIPIENT_ADDRESS = "0x8342A48694A74044116F330db5050a267b28dD85";

const baseAccountSDK = createBaseAccountSDK({
  appName: METADATA.name,
  appLogoUrl: METADATA.iconImageUrl
});

const renderError = (error: Error | null): React.ReactElement | null => {
  if (!error) return null;
  if (error instanceof BaseError) {
    const isUserRejection = error.walk(
      (e) => e instanceof UserRejectedRequestError
    );

    if (isUserRejection) {
      return <div className="text-red-500 text-xs mt-1">Rejected by user.</div>;
    }
  }

  return <div className="text-red-500 text-xs mt-1">{error.message}</div>;
};

export function WalletConnect() {
  const { address, isConnected, connector } = useAccount();
  const { disconnect } = useDisconnect();
  const chainId = useChainId();
  const { connectors, connect } = useConnect();
  const [baseSignedIn, setBaseSignedIn] = useState(false);
  const [showConnectors, setShowConnectors] = useState(false);

  const handleBaseSignIn = async () => {
    try {
      await baseAccountSDK.getProvider().request({ method: 'wallet_connect' });
      setBaseSignedIn(true);
    } catch (error) {
      console.error('Base sign in failed:', error);
    }
  };

  const getConnectorIcon = (connectorId: string) => {
    if (connectorId.includes('metaMask') || connectorId.includes('injected')) {
      return '🦊';
    }
    if (connectorId.includes('coinbase')) {
      return '🔵';
    }
    if (connectorId.includes('farcaster')) {
      return '💜';
    }
    if (connectorId.includes('base')) {
      return '🔷';
    }
    return '👛';
  };

  const getConnectorName = (connectorName: string, connectorId: string) => {
    if (connectorId.includes('injected')) {
      return 'MetaMask / Browser Wallet';
    }
    return connectorName;
  };

  return (
    <>
      {!isConnected ? (
        <>
          <div className="mb-4">
            <Button
              onClick={() => setShowConnectors(!showConnectors)}
              className="w-full"
            >
              {showConnectors ? "Hide Options" : "Connect Wallet"}
            </Button>
          </div>

          {showConnectors && (
            <div className="mb-4 p-4 bg-white border border-border rounded-xl">
              <h3 className="font-semibold mb-3 text-foreground">Choose a Wallet</h3>
              <div className="space-y-2">
                {connectors.map((conn) => (
                  <button
                    key={conn.uid}
                    onClick={() => {
                      connect({ connector: conn });
                      setShowConnectors(false);
                    }}
                    disabled={!conn.ready}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left bg-gray-50 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <span className="text-2xl">{getConnectorIcon(conn.id)}</span>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{getConnectorName(conn.name, conn.id)}</p>
                      {!conn.ready && (
                        <p className="text-xs text-gray-500">Not available</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Base Account Sign In Button */}
          <div className="mb-4">
            <SignInWithBaseButton 
              align="center"
              variant="solid"
              colorScheme="light"
              onClick={handleBaseSignIn}
            />
            {baseSignedIn && (
              <div className="mt-2 text-center text-sm text-green-600">
                ✅ Connected to Base Account
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="mb-4">
          <Button
            onClick={() => disconnect()}
            className="w-full bg-red-500 hover:bg-red-600"
          >
            Disconnect
          </Button>
        </div>
      )}

      {isConnected && address && chainId && (
        <div className="mt-4 p-4 bg-white border border-border rounded-xl">
          <div className="flex justify-between items-center text-sm">
            <div>
              <span className="text-muted-foreground">Address:</span>
              <div className="font-mono text-foreground mt-1">{truncateAddress(address)}</div>
            </div>
            <div className="text-right">
              <span className="text-muted-foreground">Chain:</span>
              <div className="font-mono text-foreground mt-1">{chainId}</div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export function SignMessage() {
  const { isConnected } = useAccount();
  const { connectAsync } = useConnect();
  const {
    signMessage,
    data: signature,
    error: signError,
    isError: isSignError,
    isPending: isSignPending,
  } = useSignMessage();

  const handleSignMessage = useCallback(async (): Promise<void> => {
    if (!isConnected) {
      await connectAsync({
        chainId: base.id,
        connector: config.connectors[0],
      });
    }

    signMessage({ message: "Hello from Frames v2!" });
  }, [connectAsync, isConnected, signMessage]);

  return (
    <>
      <Button
        onClick={handleSignMessage}
        disabled={isSignPending}
        isLoading={isSignPending}
      >
        Sign Message
      </Button>
      {isSignError && renderError(signError)}
      {signature && (
        <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
          <div className="text-gray-600 mb-1">Response</div>
          <div className="text-green-600 font-mono break-all">{signature}</div>
        </div>
      )}
    </>
  );
}

export function SignSiweMessage() {
  const { address, isConnected } = useAccount();
  const { connectAsync } = useConnect();
  const chainId = useChainId();
  const {
    signMessage,
    data: signature,
    error: signError,
    isError: isSignError,
    isPending: isSignPending,
  } = useSignMessage();

  const handleSignSiweMessage = useCallback(async (): Promise<void> => {
    if (!isConnected || !address) {
      await connectAsync({
        chainId: base.id,
        connector: config.connectors[0],
      });
      return;
    }

    const siweMessage = new SiweMessage({
      domain: window.location.host,
      address,
      statement: "Sign in with Ethereum to the app.",
      uri: window.location.origin,
      version: "1",
      chainId: chainId || base.id,
      nonce: Math.random().toString(36).substring(2, 15),
    });

    signMessage({ message: siweMessage.prepareMessage() });
  }, [connectAsync, isConnected, address, chainId, signMessage]);

  return (
    <>
      <Button
        onClick={handleSignSiweMessage}
        disabled={isSignPending}
        isLoading={isSignPending}
      >
        Sign Message (SIWE)
      </Button>
      {isSignError && renderError(signError)}
      {signature && (
        <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
          <div className="text-gray-600 mb-1">Response</div>
          <div className="text-green-600 font-mono break-all">{signature}</div>
        </div>
      )}
    </>
  );
}

export function SendEth() {
  const { isConnected, address } = useAccount();
  const [txHash, setTxHash] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isGasless, setIsGasless] = useState(false);

  const {
    sendTransaction,
    data,
    error: sendTxError,
    isError: isSendTxError,
    isPending: isSendTxPending,
  } = useSendTransaction();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash: (txHash || data) as `0x${string}` | undefined,
    });

  const handleSend = useCallback(async (): Promise<void> => {
    if (!address) return;
    
    setError(null);
    setIsPending(true);
    
    try {
      const chainId = getChainId();
      const gaslessAvailable = await checkPaymasterSupport(chainId);
      
      if (gaslessAvailable) {
        console.log('⚡ Using gasless transaction for ETH send');
        setIsGasless(true);
        try {
          const result = await sendSponsoredTransaction(
            [{
              to: RECIPIENT_ADDRESS as Hex,
              value: '0x1' as Hex, // 1 wei
              data: '0x' as Hex,
            }],
            chainId
          );
          setTxHash(result as string);
        } catch (gaslessError: any) {
          console.warn('Gasless transaction failed, falling back:', gaslessError);
          setIsGasless(false);
          // Fallback to regular transaction
          sendTransaction({
            to: RECIPIENT_ADDRESS,
            value: 1n,
          });
        }
      } else {
        console.log('⛽ Using regular transaction for ETH send');
        setIsGasless(false);
        sendTransaction({
          to: RECIPIENT_ADDRESS,
          value: 1n,
        });
      }
    } catch (err: any) {
      setError(err);
    } finally {
      setIsPending(false);
    }
  }, [address, sendTransaction]);

  return (
    <>
      <Button
        onClick={handleSend}
        disabled={!isConnected || isPending || isSendTxPending}
        isLoading={isPending || isSendTxPending}
      >
        Send Transaction (ETH) {isGasless && '⚡'}
      </Button>
      {(isSendTxError || error) && renderError(error || sendTxError)}
      {data && (
        <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
          <div className="text-gray-600 mb-1">Response</div>
          <div className="text-green-600 font-mono break-all">Hash: {truncateAddress(data)}</div>
          <div className="text-green-600 font-mono">
            Status:{" "}
            {isConfirming
              ? "Confirming..."
              : isConfirmed
              ? "Confirmed!"
              : "Pending"}
          </div>
        </div>
      )}
    </>
  );
}

export function SignTypedData() {
  const chainId = useChainId();
  const { isConnected } = useAccount();
  const {
    signTypedData,
    error: signTypedError,
    isError: isSignTypedError,
    isPending: isSignTypedPending,
  } = useSignTypedData();

  const signTyped = useCallback((): void => {
    signTypedData({
      domain: {
        name: "Frames v2 Demo",
        version: "1",
        chainId,
      },
      types: {
        Message: [{ name: "content", type: "string" }],
      },
      message: {
        content: "Hello from Frames v2!",
      },
      primaryType: "Message",
    });
  }, [chainId, signTypedData]);

  return (
    <>
      <Button
        onClick={signTyped}
        disabled={!isConnected || isSignTypedPending}
        isLoading={isSignTypedPending}
      >
        Sign Typed Data
      </Button>
      {isSignTypedError && renderError(signTypedError)}
    </>
  );
}

export function SwitchChain() {
  const chainId = useChainId();
  const {
    switchChain,
    error: switchChainError,
    isError: isSwitchChainError,
    isPending: isSwitchChainPending,
  } = useSwitchChain();

  const handleSwitchChain = useCallback((): void => {
    switchChain({ chainId: chainId === base.id ? optimism.id : base.id });
  }, [switchChain, chainId]);

  return (
    <>
      <Button
        onClick={handleSwitchChain}
        disabled={isSwitchChainPending}
        isLoading={isSwitchChainPending}
      >
        Switch to {chainId === base.id ? "Optimism" : "Base"}
      </Button>
      {isSwitchChainError && renderError(switchChainError)}
    </>
  );
}

export function SendTransaction() {
  const { isConnected, address } = useAccount();
  const [txHash, setTxHash] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [isGasless, setIsGasless] = useState(false);
  
  const {
    sendTransaction,
    error: sendTxError,
    isError: isSendTxError,
    isPending: isSendTxPending,
  } = useSendTransaction();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash: txHash as `0x${string}`,
    });

  const sendTx = useCallback(async (): Promise<void> => {
    if (!address) return;
    
    setError(null);
    setIsPending(true);
    
    try {
      const chainId = getChainId();
      const gaslessAvailable = await checkPaymasterSupport(chainId);
      
      if (gaslessAvailable) {
        console.log('⚡ Using gasless transaction for contract call');
        setIsGasless(true);
        try {
          const result = await sendSponsoredTransaction(
            [{
              to: RECIPIENT_ADDRESS as Hex,
              value: '0x0' as Hex,
              data: "0x9846cd9efc000023c0" as Hex,
            }],
            chainId
          );
          setTxHash(result as string);
        } catch (gaslessError: any) {
          console.warn('Gasless transaction failed, falling back:', gaslessError);
          setIsGasless(false);
          // Fallback to regular transaction
          sendTransaction(
            {
              to: RECIPIENT_ADDRESS as `0x${string}`,
              data: "0x9846cd9efc000023c0",
            },
            {
              onSuccess: (hash) => {
                setTxHash(hash);
              },
            }
          );
        }
      } else {
        console.log('⛽ Using regular transaction for contract call');
        setIsGasless(false);
        sendTransaction(
          {
            to: RECIPIENT_ADDRESS as `0x${string}`,
            data: "0x9846cd9efc000023c0",
          },
          {
            onSuccess: (hash) => {
              setTxHash(hash);
            },
          }
        );
      }
    } catch (err: any) {
      setError(err);
    } finally {
      setIsPending(false);
    }
  }, [address, sendTransaction]);

  return (
    <>
      <Button
        onClick={sendTx}
        disabled={!isConnected || isPending || isSendTxPending}
        isLoading={isPending || isSendTxPending}
      >
        Send Transaction (Contract) {isGasless && '⚡'}
      </Button>
      {(isSendTxError || error) && renderError(error || sendTxError)}
      {txHash && (
        <div className="mt-2 p-2 bg-gray-100 rounded text-xs">
          <div className="text-gray-600 mb-1">Response</div>
          <div className="text-green-600 font-mono break-all">Hash: {truncateAddress(txHash)}</div>
          <div className="text-green-600 font-mono">
            Status:{" "}
            {isConfirming
              ? "Confirming..."
              : isConfirmed
              ? "Confirmed!"
              : "Pending"}
          </div>
        </div>
      )}
    </>
  );
}

 