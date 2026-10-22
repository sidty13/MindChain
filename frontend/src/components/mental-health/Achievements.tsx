'use client';

import { useEffect, useState } from 'react';
import { nftAPI } from '~/lib/api';

interface AchievementsProps {
  contracts: any;
  onMintClick: (achievement: any) => void;
}

export function Achievements({ contracts, onMintClick }: AchievementsProps) {
  const { dbUser, userData } = contracts;
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchAchievements() {
      if (!dbUser) {
        setLoading(false);
        return;
      }

      try {
        const data = await nftAPI.getAchievements(dbUser.id);
        
        // Create a map of minted achievements
        const mintedAchievements = new Map(
          data.map((ach: any) => [ach.type, ach])
        );
        
        // Get current streaks
        const journalStreak = userData ? Number(userData.journalStreak) : (dbUser?.journalStreak || 0);
        const meditationStreak = userData ? Number(userData.meditationStreak) : (dbUser?.meditationStreak || 0);
        
        // Generate all possible achievements based on current streaks
        const allAchievements = achievementTypes.map((metadata) => {
          const mintedAch: any = mintedAchievements.get(metadata.id);
          
          // Determine current progress
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
          if (mintedAch?.minted) {
            status = 'minted';
          } else if (current >= metadata.days) {
            status = 'unlocked';
          } else if (current > 0) {
            status = 'in-progress';
          }
          
          return {
            id: mintedAch?.id || metadata.id,
            type: metadata.id,
            title: metadata.title,
            description: metadata.description,
            icon: metadata.emoji,
            target: metadata.days,
            current: displayCurrent,
            status,
            minted: mintedAch?.minted || false,
            tokenId: mintedAch?.tokenId,
            improvementRating: mintedAch?.improvementRating,
          };
        });
        
        setAchievements(allAchievements);
      } catch (error) {
        console.error('Error fetching achievements:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchAchievements();
  }, [dbUser, userData]);

  const canEarnAchievement = (type: string) => {
    if (!dbUser) return false;
    
    if (type === 'journal-7') {
      return dbUser.journalStreak >= 7 && !achievements.some((a) => a.type === 'journal-7' && a.minted);
    }
    if (type === 'journal-30') {
      return dbUser.journalStreak >= 30 && !achievements.some((a) => a.type === 'journal-30' && a.minted);
    }
    if (type === 'meditation-7') {
      return dbUser.meditationStreak >= 7 && !achievements.some((a) => a.type === 'meditation-7' && a.minted);
    }
    if (type === 'meditation-30') {
      return dbUser.meditationStreak >= 30 && !achievements.some((a) => a.type === 'meditation-30' && a.minted);
    }
    
    return false;
  };

  const achievementTypes = [
    {
      id: 'journal-7',
      title: '7-Day Journal Streak',
      description: 'Complete 7 consecutive days of journaling',
      emoji: '/icons/journal.png',
      days: 7,
      currentDb: dbUser?.journalStreak || 0,
      currentBlockchain: userData ? Number(userData.journalStreak) : 0,
    },
    {
      id: 'journal-30',
      title: '30-Day Journal Streak',
      description: 'Complete 30 consecutive days of journaling',
      emoji: '/icons/journal.png',
      days: 30,
      currentDb: dbUser?.journalStreak || 0,
      currentBlockchain: userData ? Number(userData.journalStreak) : 0,
    },
    {
      id: 'meditation-7',
      title: '7-Day Meditation Streak',
      description: 'Complete 7 consecutive days of meditation',
      emoji: '/icons/meditation.png',
      days: 7,
      currentDb: dbUser?.meditationStreak || 0,
      currentBlockchain: userData ? Number(userData.meditationStreak) : 0,
    },
    {
      id: 'meditation-30',
      title: '30-Day Meditation Streak',
      description: 'Complete 30 consecutive days of meditation',
      emoji: '/icons/trophy.png',
      days: 30,
      currentDb: dbUser?.meditationStreak || 0,
      currentBlockchain: userData ? Number(userData.meditationStreak) : 0,
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'unlocked': return 'bg-green-50 border-green-400';
      case 'in-progress': return 'bg-white border-purple-300';
      default: return 'bg-gray-50 border-gray-300';
    }
  };

  const getProgressColor = (status: string) => {
    switch (status) {
      case 'unlocked': return 'bg-green-600';
      case 'in-progress': return 'bg-purple-400';
      default: return 'bg-gray-300';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold mb-2">Achievements</h2>
        <p className="text-gray-500">
          Earn exclusive NFTs for maintaining your streaks
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {achievements.map((achievement, index) => (
          <div
            key={index}
            className={`${getStatusColor(achievement.status)} border-2 rounded-2xl p-6 shadow-sm transition-all duration-200 hover:shadow-lg hover:scale-[1.02]`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-4xl">{achievement.icon}</span>
                <div>
                  <h3 className="font-bold text-lg text-gray-800">{achievement.title}</h3>
                  <p className="text-sm text-gray-600">{achievement.description}</p>
                </div>
              </div>
              {achievement.status === 'unlocked' && (
                <span className="text-2xl">✨</span>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Progress</span>
                <span className="font-medium text-gray-800">
                  {achievement.current}/{achievement.target}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className={`${getProgressColor(achievement.status)} h-3 rounded-full transition-all duration-500`}
                  style={{ width: `${(achievement.current / achievement.target) * 100}%` }}
                />
              </div>
              {achievement.status === 'in-progress' && (
                <p className="text-xs text-gray-500 mt-2">
                  {achievement.target - achievement.current} more to unlock!
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Minted Achievements */}
      {achievements.filter((a) => a.minted).length > 0 && (
        <div className="mt-12">
          <h3 className="text-2xl font-bold mb-6 text-center flex items-center justify-center gap-3">
            <span>Your NFT Collection</span>
            <img src="/icons/trophy.png" alt="Trophy" className="w-8 h-8 object-contain" />
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {achievements
              .filter((a) => a.minted)
              .map((achievement) => {
                const type = achievementTypes.find((t) => t.id === achievement.type);
                return (
                  <div
                    key={achievement.id}
                    className="bg-green-50 border-2 border-green-400 rounded-2xl p-4 hover:scale-105 transition-transform"
                  >
                    <div className="text-center mb-3 flex items-center justify-center">
                      <div className="w-20 h-20">
                        <img src={type?.emoji} alt={type?.title} className="w-full h-full object-contain drop-shadow-md" />
                      </div>
                    </div>
                    <h4 className="font-bold text-center text-sm mb-2">{type?.title}</h4>
                    <div className="text-xs text-center space-y-1">
                      <p className="text-green-600 font-semibold">
                        {achievement.improvementRating}/100
                      </p>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
