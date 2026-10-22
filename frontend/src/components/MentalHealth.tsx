"use client";

import { useState, useEffect, lazy, Suspense } from "react";
import { useAccount } from "wagmi";
import { useFrameContext } from "./providers/FrameProvider";
import { useContracts } from "~/lib/useContracts";
import { useAutoSwitchChain } from "~/lib/useAutoSwitchChain";
import { Dashboard } from "./mental-health/Dashboard";
import { MoodLog } from "./mental-health/MoodLog";
import { truncateAddress } from "~/lib/truncateAddress";
import { useConnect, useDisconnect } from "wagmi";
import { config } from "./providers/WagmiProvider";
import { getName } from '@coinbase/onchainkit/identity';
import { base } from 'viem/chains';

// Lazy load heavy components
const Journal = lazy(() => import("./mental-health/Journal").then(m => ({ default: m.Journal })));
const JournalView = lazy(() => import("./mental-health/JournalView").then(m => ({ default: m.JournalView })));
const Meditation = lazy(() => import("./mental-health/Meditation").then(m => ({ default: m.Meditation })));
const Achievements = lazy(() => import("./mental-health/Achievements").then(m => ({ default: m.Achievements })));
const ChatRoom = lazy(() => import("./mental-health/ChatRoom").then(m => ({ default: m.ChatRoom })));
const MintModal = lazy(() => import("./mental-health/MintModal").then(m => ({ default: m.MintModal })));
const Profile = lazy(() => import("./mental-health/Profile").then(m => ({ default: m.Profile })));
const OnboardingModal = lazy(() => import("./mental-health/OnboardingModal").then(m => ({ default: m.OnboardingModal })));

type View =
  | "dashboard"
  | "mood"
  | "journal"
  | "journal-view"
  | "meditation"
  | "achievements"
  | "chat"
  | "profile";

export function MentalHealth() {
  const { address, isConnected, connector } = useAccount();
  const { connectors, connect } = useConnect();
  const { disconnect } = useDisconnect();
  const frameContext = useFrameContext();
  const [currentView, setCurrentView] = useState<View>("dashboard");
  const [showMintModal, setShowMintModal] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<any>(null);
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);
  const [basename, setBasename] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  
  // Auto-switch to Base
  const { isCorrectChain, isSwitching, switchError } = useAutoSwitchChain();

  // Check if user is visiting for the first time
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const hasCompletedOnboarding = localStorage.getItem('onboarding_complete');
      if (!hasCompletedOnboarding) {
        setShowOnboarding(true);
      }
    }
  }, []);

  // Handle onboarding completion
  const handleOnboardingComplete = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('onboarding_complete', 'true');
    }
    setShowOnboarding(false);
  };

  // Fetch Basename for the connected address
  useEffect(() => {
    async function fetchBasename() {
      if (!address) {
        setBasename(null);
        return;
      }

      try {
        const name = await getName({ address, chain: base });
        setBasename(name);
      } catch (error) {
        console.error('Error fetching Basename:', error);
        setBasename(null);
      }
    }

    fetchBasename();
  }, [address]);

  // Filter out duplicate and unwanted wallets, then reorder
  const filteredConnectors = connectors
    .filter((conn, index, self) => {
      // Remove Brave wallet
      if (conn.name.toLowerCase().includes('brave')) return false;
      
      // Keep only the first injected/MetaMask connector
      if (conn.id.includes('injected') || conn.id.includes('metaMask')) {
        const firstMetaMaskIndex = self.findIndex(c => 
          c.id.includes('injected') || c.id.includes('metaMask')
        );
        return index === firstMetaMaskIndex;
      }
      
      return true;
    })
    .sort((a, b) => {
      // Custom order: Base Account, Coinbase Wallet, Farcaster, MetaMask
      const order = ['base', 'coinbase', 'farcaster', 'injected'];
      const getOrder = (id: string) => {
        for (let i = 0; i < order.length; i++) {
          if (id.includes(order[i])) return i;
        }
        return 999; // Put unknown connectors at the end
      };
      return getOrder(a.id) - getOrder(b.id);
    });

  const getConnectorIcon = (connectorId: string) => {
    if (connectorId.includes('metaMask') || connectorId.includes('injected')) return '🦊';
    if (connectorId.includes('coinbase')) return '/base-square.png';
    if (connectorId.includes('farcaster')) return '/farcaster.png';
    if (connectorId.includes('base')) return '/base-square.png';
    return '👛';
  };

  const getConnectorName = (name: string, id: string) => {
    if (id.includes('injected')) return 'MetaMask / Browser Wallet';
    return name;
  };

  const farcasterUser =
    frameContext?.context && "user" in frameContext.context
      ? {
          fid: (frameContext.context as any).user.fid?.toString(),
          username: (frameContext.context as any).user.username,
          displayName: (frameContext.context as any).user.displayName,
          pfpUrl: (frameContext.context as any).user.pfpUrl,
        }
      : undefined;

  // Auto-connect with Farcaster if user is logged in
  const handleConnect = async () => {
    if (farcasterUser) {
      // If user is logged into Farcaster, try to connect with Farcaster connector
      const farcasterConnector = connectors.find(c => c.id.includes('farcaster'));
      if (farcasterConnector) {
        try {
          await connect({ connector: farcasterConnector });
          return;
        } catch (error) {
          console.error('Farcaster connection failed:', error);
          // Fall back to showing wallet modal
        }
      }
    }
    // If not logged into Farcaster or Farcaster connection failed, show wallet modal
    setShowWalletModal(true);
  };

  // Handle disconnect with data cleanup
  const handleDisconnect = async () => {
    try {
      await disconnect();
      // Force page reload to clear all state
      window.location.reload();
    } catch (error) {
      console.error('Disconnect failed:', error);
    }
  };

  const contracts = useContracts(farcasterUser);

  const navItems = [
    { id: "dashboard", icon: "/icons/home.PNG", label: "Dashboard", isEmoji: false },
    { id: "mood", icon: "/emojis/calm.png", label: "Mood", isEmoji: false },
    { id: "journal", icon: "/icons/book.png", label: "Journal", isEmoji: false },
    { id: "meditation", icon: "/icons/meditation.png", label: "Meditate", isEmoji: false },
    { id: "chat", icon: "/icons/channel.png", label: "Community", isEmoji: false },
  ];

  const handleMintClick = (achievement: any) => {
    setSelectedAchievement(achievement);
    setShowMintModal(true);
  };

  // Show switching network screen
  if (isConnected && isSwitching) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-700 font-medium">Switching to Base...</p>
          <p className="text-sm text-gray-500 mt-2">Please confirm in your wallet</p>
        </div>
      </div>
    );
  }

  // Show error if chain switch failed
  if (isConnected && switchError && !isCorrectChain) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold mb-2">Wrong Network</h2>
          <p className="text-gray-600 mb-4">
            Please switch to Base network to use this app.
          </p>
          <p className="text-sm text-red-600 mb-4">{switchError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (contracts.loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your data...</p>
        </div>
      </div>
    );
  }

  // Show welcome screen when not connected
  if (!isConnected) {
    return (
      <>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            {/* Logo and Title */}
            <div className="text-center mb-8">
              <div className="w-28 h-28 mx-auto mb-4 flex items-center justify-center">
                <img 
                  src="/icons/IsYourDayOkfinal.png" 
                  alt="IsYourDayOk Logo" 
                  className="w-full h-full object-contain drop-shadow-2xl"
                />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">IsYourDayOk</h1>
              <p className="text-gray-600">Your Mental Health Companion on Base</p>
            </div>

            {/* Features */}
            <div className="bg-white rounded-3xl p-6 shadow-lg mb-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Start Your Wellness Journey</h2>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 flex items-center justify-center flex-shrink-0">
                    <img src="/emojis/happy.png" alt="Mood" className="w-full h-full object-contain drop-shadow-md" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">Track Your Mood</h3>
                    <p className="text-xs text-gray-600">Log daily moods and earn points</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 flex items-center justify-center flex-shrink-0">
                    <img src="/icons/journal.png" alt="Journal" className="w-full h-full object-contain drop-shadow-md" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">Journal Daily</h3>
                    <p className="text-xs text-gray-600">Build streaks and express yourself</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 flex items-center justify-center flex-shrink-0">
                    <img src="/icons/meditation.png" alt="Meditation" className="w-full h-full object-contain drop-shadow-md" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">Meditate</h3>
                    <p className="text-xs text-gray-600">Practice mindfulness with guided sessions</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-12 h-12 flex items-center justify-center flex-shrink-0">
                    <img src="/icons/trophy.png" alt="NFTs" className="w-full h-full object-contain drop-shadow-md" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 text-sm">Earn NFTs</h3>
                    <p className="text-xs text-gray-600">Collect achievement NFTs on Base blockchain</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Connect Button */}
            <button
              onClick={handleConnect}
              type="button"
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl font-bold text-lg shadow-lg hover:shadow-xl active:scale-95 transition-all"
            >
              {farcasterUser ? '🔗 Connect Your Account' : '🔗 Connect Wallet'}
            </button>

            {/* Info */}
            <p className="text-center text-xs text-gray-500 mt-4 px-4">
              {farcasterUser 
                ? `Welcome ${farcasterUser.displayName || farcasterUser.username}! Connect to get started.`
                : 'Connect your wallet to start tracking your mental health journey'
              }
            </p>
          </div>
        </div>

        {/* Wallet Selection Modal - Mobile Optimized */}
        {showWalletModal && (
          <div className="fixed inset-0 bg-black/60 flex items-end justify-center z-[100]">
            <div className="bg-white rounded-t-3xl w-full p-5 shadow-2xl max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-lg font-bold">Connect Wallet</h2>
                <button
                  onClick={() => setShowWalletModal(false)}
                  className="text-gray-400 active:text-gray-600 text-2xl leading-none w-8 h-8 flex items-center justify-center"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-2.5">
                {filteredConnectors.map((conn) => {
                  const icon = getConnectorIcon(conn.id);
                  const isImage = icon.startsWith('/');
                  
                  return (
                    <button
                      key={conn.uid}
                      onClick={async () => {
                        try {
                          await connect({ connector: conn });
                          setShowWalletModal(false);
                        } catch (error) {
                          console.error('Connection failed:', error);
                        }
                      }}
                      className="w-full flex items-center gap-3 px-4 py-3.5 bg-gray-50 active:bg-blue-50 active:border-blue-300 rounded-2xl transition-all border-2 border-gray-200"
                    >
                      {isImage ? (
                        <img src={icon} alt={conn.name} className="w-8 h-8 object-contain" />
                      ) : (
                        <span className="text-2xl">{icon}</span>
                      )}
                      <div className="flex-1 text-left">
                        <p className="font-semibold text-sm">{getConnectorName(conn.name, conn.id)}</p>
                      </div>
                      <span className="text-gray-400 text-lg">→</span>
                    </button>
                  );
                })}
              </div>

              <p className="text-xs text-gray-500 text-center mt-5 px-4">
                By connecting, you agree to use Base network
              </p>
            </div>
          </div>
        )}
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      {/* Onboarding Modal - Show on first visit */}
      <Suspense fallback={null}>
        {showOnboarding && (
          <OnboardingModal onComplete={handleOnboardingComplete} />
        )}
      </Suspense>

      <div className="max-w-md mx-auto px-3 pt-3 pb-20">
        {/* Mobile-Only Header - Compact */}
        <header className="mb-4 flex items-center justify-between bg-white rounded-3xl p-3 shadow-sm sticky top-3 z-10 backdrop-blur-lg bg-white/95">
          <div className="flex items-center gap-2">
            <img 
              src="/icons/IsYourDayOkfinal.png" 
              alt="IsYourDayOk Logo" 
              className="h-8 w-8 object-contain"
            />
            <div>
              <h1 className="text-base font-bold leading-tight">IsYourDayOk</h1>
              <p className="text-[10px] text-gray-500 leading-tight">
                Mental Health
              </p>
            </div>
          </div>

          {/* Right Side - Profile + Disconnect */}
          <div className="flex items-center gap-1.5">
            {/* Profile Button - Compact Pill */}
            {isConnected && address && (
              <button
                onClick={() => setCurrentView("profile")}
                className={`relative px-2.5 py-1.5 rounded-full transition-all text-[11px] font-semibold ${
                  currentView === "profile"
                    ? "bg-blue-500 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 active:scale-95"
                }`}
                aria-label="Profile"
              >
                {basename || truncateAddress(address, 5, 3)}
                {currentView !== "profile" && (
                  <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-blue-500 border border-white rounded-full"></div>
                )}
              </button>
            )}
            
            {isConnected && address ? (
              <button
                onClick={() => setShowDisconnectModal(true)}
                className="p-1.5 text-red-500 hover:bg-red-50 rounded-full active:bg-red-100 transition-colors"
                aria-label="Disconnect"
                title="Disconnect Wallet"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            ) : (
              <button
                onClick={handleConnect}
                className="px-3 py-1.5 text-xs font-medium bg-blue-500 text-white rounded-full active:bg-blue-600 transition-colors shadow-sm"
              >
                Connect
              </button>
            )}
          </div>
        </header>

        {/* Page Title - Mobile Only */}
        <div className="mb-3 px-1">
          <h2 className="text-xl font-bold text-gray-800">
            {navItems.find(item => item.id === currentView)?.label}
          </h2>
        </div>

        {/* Main Content */}
        <main>
          {currentView === "dashboard" && <Dashboard contracts={contracts} onMintClick={handleMintClick} />}
          {currentView === "mood" && <MoodLog contracts={contracts} />}
          <Suspense fallback={<div className="flex items-center justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div></div>}>
            {currentView === "journal" && <Journal contracts={contracts} />}
            {currentView === "meditation" && <Meditation contracts={contracts} />}
            {currentView === "chat" && <ChatRoom contracts={contracts} />}
            {currentView === "profile" && <Profile contracts={contracts} onMintClick={handleMintClick} />}
          </Suspense>
        </main>

        {/* Mint Modal */}
        <Suspense fallback={null}>
          {showMintModal && selectedAchievement && (
            <MintModal
              achievement={selectedAchievement}
              contracts={contracts}
              onClose={() => {
                setShowMintModal(false);
                setSelectedAchievement(null);
              }}
            />
          )}
        </Suspense>
      </div>

      {/* Mobile Bottom Navigation - Single Row: 5 Items */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 safe-area-inset">
        <div className="grid grid-cols-5 gap-0 bg-white">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentView(item.id as View)}
              aria-current={currentView === item.id ? 'page' : undefined}
              className={`flex flex-col items-center justify-center py-3 px-1 transition-all relative ${
                currentView === item.id 
                  ? "text-blue-600" 
                  : "text-gray-500 active:bg-gray-50"
              }`}
            >
              {currentView === item.id && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-blue-600 rounded-b-full" />
              )}
              <div className={`relative transition-all ${
                currentView === item.id ? "scale-110" : "scale-100"
              }`}>
                {item.isEmoji ? (
                  <span className="text-2xl">{item.icon}</span>
                ) : (
                  <div className={`w-7 h-7 flex items-center justify-center transition-all ${
                    currentView === item.id 
                      ? "opacity-100" 
                      : "opacity-60"
                  }`}>
                    <img 
                      src={item.icon} 
                      alt={item.label} 
                      className="w-full h-full object-contain"
                      style={{
                        filter: currentView === item.id 
                          ? 'brightness(1.1) saturate(1.2)' 
                          : 'grayscale(0.3)'
                      }}
                    />
                  </div>
                )}
              </div>
              <span className={`text-[10px] font-medium mt-1 transition-all ${
                currentView === item.id ? "opacity-100" : "opacity-60"
              }`}>
                {item.label === 'Dashboard' ? 'Home' : item.label}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Spacer for mobile bottom nav (2 rows) */}
      <div className="h-32"></div>

      {/* Wallet Selection Modal - Mobile Optimized */}
      {showWalletModal && (
        <div className="fixed inset-0 bg-black/60 flex items-end justify-center z-[100]">
          <div className="bg-white rounded-t-3xl w-full p-5 shadow-2xl max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">Connect Wallet</h2>
              <button
                onClick={() => setShowWalletModal(false)}
                className="text-gray-400 active:text-gray-600 text-2xl leading-none w-8 h-8 flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2.5">
              {filteredConnectors.map((conn) => {
                const icon = getConnectorIcon(conn.id);
                const isImage = icon.startsWith('/');
                
                return (
                  <button
                    key={conn.uid}
                    onClick={async () => {
                      try {
                        await connect({ connector: conn });
                        setShowWalletModal(false);
                      } catch (error) {
                        console.error('Connection failed:', error);
                      }
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3.5 bg-gray-50 active:bg-blue-50 active:border-blue-300 rounded-2xl transition-all border-2 border-gray-200"
                  >
                    {isImage ? (
                      <img src={icon} alt={conn.name} className="w-8 h-8 object-contain" />
                    ) : (
                      <span className="text-2xl">{icon}</span>
                    )}
                    <div className="flex-1 text-left">
                      <p className="font-semibold text-sm">{getConnectorName(conn.name, conn.id)}</p>
                    </div>
                    <span className="text-gray-400 text-lg">→</span>
                  </button>
                );
              })}
            </div>

            <p className="text-xs text-gray-500 text-center mt-5 px-4">
              By connecting, you agree to use Base network
            </p>
          </div>
        </div>
      )}

      {/* Disconnect Confirmation Modal */}
      {showDisconnectModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl">
            <div className="text-center mb-5">
              <h2 className="text-xl font-bold mb-2">Disconnect Wallet?</h2>
              <p className="text-sm text-gray-600">
                This will disconnect your wallet and clear all your session data. You'll need to reconnect to continue using the app.
              </p>
            </div>

            <div className="space-y-2">
              <button
                onClick={handleDisconnect}
                className="w-full px-4 py-3 bg-red-600 text-white rounded-xl font-medium hover:bg-red-700 active:bg-red-800 transition-colors"
              >
                Yes, Disconnect
              </button>
              <button
                onClick={() => setShowDisconnectModal(false)}
                className="w-full px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 active:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
