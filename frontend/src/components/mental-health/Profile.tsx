'use client';

import { useAccount } from 'wagmi';
import { truncateAddress } from '~/lib/truncateAddress';
import { useEffect, useState } from 'react';
import { journalAPI, meditationAPI, moodAPI, nftAPI } from '~/lib/api';
import { getName } from '@coinbase/onchainkit/identity';
import { base } from 'viem/chains';

interface ProfileProps {
  contracts: any;
  onMintClick: (achievement: any) => void;
}

interface UserStats {
  totalPoints: number;
  journalStreak: number;
  meditationStreak: number;
  totalJournals: number;
  totalMeditations: number;
  totalMoods: number;
  nftCount: number;
}

export function Profile({ contracts, onMintClick }: ProfileProps) {
  const { address } = useAccount();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [journals, setJournals] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [selectedJournal, setSelectedJournal] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'stats' | 'history' | 'nfts'>('stats');
  const [basename, setBasename] = useState<string | null>(null);

  // Achievement type definitions with display metadata
  const achievementTypes = [
    {
      id: 'journal-7',
      title: '7-Day Journal Streak',
      description: 'Complete 7 consecutive days of journaling',
      icon: '/nft/seventh_day_journaling_streak.png',
      days: 7,
    },
    {
      id: 'journal-30',
      title: '30-Day Journal Streak',
      description: 'Complete 30 consecutive days of journaling',
      icon: '/nft/thirtieth_day_journaling_streak.png',
      days: 30,
    },
    {
      id: 'meditation-7',
      title: '7-Day Meditation Streak',
      description: 'Complete 7 consecutive days of meditation',
      icon: '/nft/seventh_day_meditation_streak.png',
      days: 7,
    },
    {
      id: 'meditation-30',
      title: '30-Day Meditation Streak',
      description: 'Complete 30 consecutive days of meditation',
      icon: '/nft/thirtieth_day_meditation_streak.png',
      days: 30,
    },
  ];

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

  useEffect(() => {
    async function loadStats() {
      if (!contracts.dbUser && !contracts.userData) {
        setLoading(false);
        return;
      }

      try {
        const points = contracts.userData?.totalPoints 
          ? Number(contracts.userData.totalPoints) 
          : (contracts.dbUser?.points || 0);
        
        const journalStreak = contracts.userData?.journalStreak 
          ? Number(contracts.userData.journalStreak) 
          : (contracts.dbUser?.journalStreak || 0);
        
        const meditationStreak = contracts.userData?.meditationStreak 
          ? Number(contracts.userData.meditationStreak) 
          : (contracts.dbUser?.meditationStreak || 0);

        let journalsCount = 0;
        let meditations = 0;
        let moods = 0;

        if (contracts.dbUser?.id) {
          try {
            const [journalsData, meditationsData, moodsData] = await Promise.all([
              journalAPI.getJournals(contracts.dbUser.id),
              meditationAPI.getMeditations(contracts.dbUser.id),
              moodAPI.getMoodLogs(contracts.dbUser.id),
            ]);

            journalsCount = journalsData?.length || 0;
            meditations = meditationsData?.length || 0;
            moods = moodsData?.length || 0;
            setJournals(journalsData || []);
          } catch (err) {
            console.error('Error fetching activity data:', err);
          }
        }
        console.log(contracts);
        
        if (contracts.dbUser?.id) {
          try {
            const achievementsData = await nftAPI.getAchievements(contracts.dbUser.id);
            
            // Create a map of minted achievements
            const mintedAchievements = new Map(
              achievementsData.map((ach: any) => [ach.type, ach])
            );
            
            // Generate all possible achievements based on current streaks
            const allAchievements = achievementTypes.map((metadata) => {
              const mintedAch: any = mintedAchievements.get(metadata.id);
              
              // Determine current progress based on achievement type
              let current = 0;
              if (metadata.id.includes('journal')) {
                current = journalStreak;
              } else if (metadata.id.includes('meditation')) {
                current = meditationStreak;
              }
              
              // Cap current at target (e.g., show 7/7 not 9/7)
              const displayCurrent = Math.min(current, metadata.days);
              
              // Determine status
              let status = 'locked';
              if (mintedAch?.minted === true) {
                status = 'minted';
              } else if (current >= metadata.days) {
                status = 'unlocked';
              } else if (current > 0) {
                status = 'in-progress';
              }
              console.log(mintedAch);
              
              return {
                id: mintedAch?.id || metadata.id,
                type: metadata.id,
                userId: contracts.dbUser.id,
                days: metadata.days,
                title: metadata.title,
                description: metadata.description,
                icon: metadata.icon,
                target: metadata.days,
                current: displayCurrent,
                status,
                minted: mintedAch?.minted === true,
                tokenId: mintedAch?.tokenId,
                contractAddress: mintedAch?.contractAddress,
                transactionHash: mintedAch?.transactionHash,
              };
            });
            console.log(allAchievements);
            console.log("Lee");
            
            
            setAchievements(allAchievements);
            
            // Count minted NFTs
            const nftCount = allAchievements.filter((a) => a.minted).length;
            
            setStats({
              totalPoints: points,
              journalStreak,
              meditationStreak,
              totalJournals: journalsCount,
              totalMeditations: meditations,
              totalMoods: moods,
              nftCount,
            });
          } catch (err) {
            console.error('Error fetching achievements:', err);
            
            // Set stats even if achievements fail
            setStats({
              totalPoints: points,
              journalStreak,
              meditationStreak,
              totalJournals: journalsCount,
              totalMeditations: meditations,
              totalMoods: moods,
              nftCount: 0,
            });
          }
        } else {
          // Set stats when no user
          setStats({
            totalPoints: points,
            journalStreak,
            meditationStreak,
            totalJournals: journalsCount,
            totalMeditations: meditations,
            totalMoods: moods,
            nftCount: 0,
          });
        }
      } catch (error) {
        console.error('Error loading stats:', error);
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, [contracts.userData, contracts.dbUser]); // Removed achievements.length dependency

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Profile Header - Compact */}
      <div className="bg-white rounded-2xl p-4 text-center">
        {contracts.farcasterUser?.pfpUrl ? (
          <img 
            src={contracts.farcasterUser.pfpUrl} 
            alt="Profile" 
            className="w-16 h-16 rounded-full mx-auto mb-2 border-2 border-gray-100" 
          />
        ) : (
          <div className="w-20 h-20 rounded-full mx-auto mb-2">
            <img src="/icons/profile.PNG" alt="Profile" className="w-full h-full object-cover drop-shadow-lg" />
          </div>
        )}
        <h1 className="text-lg font-bold text-gray-900">
          {contracts.farcasterUser?.displayName || contracts.farcasterUser?.username || basename || (address ? truncateAddress(address) : 'Anonymous')}
        </h1>
        {contracts.farcasterUser?.username && (
          <p className="text-xs text-gray-500">@{contracts.farcasterUser.username}</p>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-2xl p-1.5">
        <div className="grid grid-cols-3 gap-1">
          <button 
            onClick={() => setActiveTab('stats')} 
            className={`py-3 px-2 rounded-xl text-xs font-semibold transition-all min-h-[44px] ${
              activeTab === 'stats' 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Stats
          </button>
          <button 
            onClick={() => setActiveTab('history')} 
            className={`py-3 px-2 rounded-xl text-xs font-semibold transition-all min-h-[44px] ${
              activeTab === 'history' 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Journals
          </button>
          <button 
            onClick={() => setActiveTab('nfts')} 
            className={`py-3 px-2 rounded-xl text-xs font-semibold transition-all min-h-[44px] ${
              activeTab === 'nfts' 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            NFTs
          </button>
        </div>
      </div>

      {/* Stats Tab */}
      {activeTab === 'stats' && (
        <div className="space-y-3">
          {/* Points & Streaks - Combined Grid */}
          <div className="bg-white rounded-2xl p-4">
            <div className="text-center pb-3 mb-3 border-b border-gray-100">
              <div className="text-4xl font-bold text-blue-600 mb-1">{stats?.totalPoints || 0}</div>
              <p className="text-xs text-gray-500">Total Points</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 mb-0.5">{stats?.journalStreak || 0}</div>
                <p className="text-xs text-gray-500">Journal Streak</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 mb-0.5">{stats?.meditationStreak || 0}</div>
                <p className="text-xs text-gray-500">Meditation Streak</p>
              </div>
            </div>
          </div>

          {/* Activity Stats - Compact List */}
          <div className="bg-white rounded-2xl p-4">
            <h2 className="text-sm font-bold text-gray-900 mb-3">Activity</h2>
            <div className="space-y-2">
              <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                <span className="text-xs text-gray-600">Journals</span>
                <span className="text-sm font-semibold text-gray-900">{stats?.totalJournals || 0}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                <span className="text-xs text-gray-600">Meditations</span>
                <span className="text-sm font-semibold text-gray-900">{stats?.totalMeditations || 0}</span>
              </div>
              <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                <span className="text-xs text-gray-600">Mood Logs</span>
                <span className="text-sm font-semibold text-gray-900">{stats?.totalMoods || 0}</span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <span className="text-xs text-gray-600">NFTs Earned</span>
                <span className="text-sm font-semibold text-gray-900">{stats?.nftCount || 0}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {journals.length === 0 ? (
            <div className="bg-white rounded-3xl p-12 text-center">
              <div className="w-20 h-20 mx-auto mb-3 opacity-30">
                <img src="/icons/journal.png" alt="Journal" className="w-full h-full object-contain drop-shadow-md" />
              </div>
              <h3 className="text-lg font-bold mb-2 text-gray-900">No journals yet</h3>
              <p className="text-sm text-gray-500">Start writing to track your journey</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-500">{journals.length} entries</span>
              </div>
              <div className="space-y-3">
                {journals.map((journal) => (
                  <div 
                    key={journal.id} 
                    className="pb-3 border-b border-gray-100 last:border-0 last:pb-0 cursor-pointer hover:opacity-70 transition-opacity"
                    onClick={() => setSelectedJournal(journal)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-gray-500">{formatDate(journal.createdAt)}</span>
                      <span className="text-xs font-medium text-blue-600">+{journal.points}</span>
                    </div>
                    <p className="text-sm text-gray-700 line-clamp-2">{journal.content}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* NFTs Tab */}
      {activeTab === 'nfts' && (
        <div className="space-y-3">
          {(() => {
            const mintedAchievements = achievements.filter(a => a.minted === true);
            return mintedAchievements.length === 0 ? (
              <div className="bg-white rounded-2xl p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-3 opacity-20">
                  <img src="/icons/trophy.png" alt="Trophy" className="w-full h-full object-contain" />
                </div>
                <h3 className="text-sm font-bold mb-1 text-gray-900">No NFTs yet</h3>
                <p className="text-xs text-gray-500 mb-1">Mint achievements from Dashboard</p>
                <p className="text-[10px] text-gray-400">Complete streaks to unlock NFTs</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-white rounded-2xl p-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-gray-900">Your Collection</h3>
                    <span className="text-[10px] text-gray-500">{mintedAchievements.length} {mintedAchievements.length === 1 ? 'NFT' : 'NFTs'}</span>
                  </div>
                </div>
                
                {mintedAchievements.map((achievement, index) => (
                  <div key={index} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-200 hover:shadow-md transition-shadow">
                    {/* NFT Image Section */}
                    <div className="bg-gradient-to-br from-blue-50 via-purple-50 to-blue-100 aspect-video w-full flex items-center justify-center relative p-6">
                      <img 
                        src={achievement.icon} 
                        alt={achievement.title} 
                        className="w-2/3 h-2/3 object-contain drop-shadow-2xl"
                      />
                      <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1.5 shadow-lg">
                        <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                      </div>
                    </div>
                    
                    {/* NFT Info Section */}
                    <div className="p-3">
                      <h3 className="font-bold text-sm text-gray-900 mb-1">{achievement.title}</h3>
                      <p className="text-[10px] text-gray-600 mb-2">{achievement.description}</p>
                      
                      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-100">
                        <div className="flex-1">
                          <p className="text-[9px] text-gray-500">Status</p>
                          <p className="text-[10px] font-medium text-green-600">✓ Minted</p>
                        </div>
                        <div className="flex-1">
                          <p className="text-[9px] text-gray-500">Chain</p>
                          <p className="text-[10px] font-medium text-blue-600">Base</p>
                        </div>
                      </div>
                      
                      {/* View on BaseScan Button */}
                      {address && (
                        <a 
                          href={`https://basescan.org/address/${address}#nfttransfers`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-center gap-1.5 w-full py-1.5 px-3 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-medium rounded-lg transition-colors"
                        >
                          <span>View on BaseScan</span>
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            );
          })()}
        </div>
      )}

      {/* Journal Detail Modal */}
      {selectedJournal && (
        <div 
          className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" 
          onClick={() => setSelectedJournal(null)}
        >
          <div 
            className="bg-white rounded-2xl p-6 max-w-md w-full max-h-[70vh] overflow-y-auto" 
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4 pb-3 border-b border-gray-100">
              <div>
                <span className="text-sm text-gray-500">{formatDate(selectedJournal.createdAt)}</span>
                <p className="text-xs font-medium text-blue-600 mt-1">+{selectedJournal.points} points</p>
              </div>
              <button 
                onClick={() => setSelectedJournal(null)} 
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{selectedJournal.content}</p>
          </div>
        </div>
      )}
    </div>
  );
}
