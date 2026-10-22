'use client';

import { useEffect, useState, useRef, useCallback, memo } from 'react';
import { dailyActivityAPI, moodAPI, nftAPI } from '~/lib/api';

interface DashboardProps {
  contracts: any;
  onMintClick?: (achievement: any) => void;
}

export const Dashboard = memo(function Dashboard({ contracts, onMintClick }: DashboardProps) {
  const { dbUser, userData, loading } = contracts;
  const [dailyActivity, setDailyActivity] = useState<any>(null);
  const [recentMoods, setRecentMoods] = useState<any[]>([]);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [loadingActivity, setLoadingActivity] = useState(true);
  const [loadingMoreMoods, setLoadingMoreMoods] = useState(false);
  const [hasMoreMoods, setHasMoreMoods] = useState(true);
  const [moodPage, setMoodPage] = useState(0);
  const observerTarget = useRef<HTMLDivElement>(null);
  const allMoods = useRef<any[]>([]);
  const MOODS_PER_PAGE = 10;
  const [stats, setStats] = useState({
    totalPoints: 0,
    currentStreak: 0,
    activitiesCompleted: 0,
  });

  // Achievement type definitions
  const achievementTypes = [
    {
      id: 'journal-7',
      title: '7-Day Journal Streak',
      description: 'Complete 7 consecutive days of journaling',
      icon: '/icons/journal.png',
      days: 7,
    },
    {
      id: 'journal-30',
      title: '30-Day Journal Streak',
      description: 'Complete 30 consecutive days of journaling',
      icon: '/icons/journal.png',
      days: 30,
    },
    {
      id: 'meditation-7',
      title: '7-Day Meditation Streak',
      description: 'Complete 7 consecutive days of meditation',
      icon: '/icons/meditation.png',
      days: 7,
    },
    {
      id: 'meditation-30',
      title: '30-Day Meditation Streak',
      description: 'Complete 30 consecutive days of meditation',
      icon: '/icons/trophy.png',
      days: 30,
    },
  ];

  const getTodayDate = () => new Date().toISOString().split('T')[0];

  // Load more moods function
  const loadMoreMoods = useCallback(async () => {
    if (loadingMoreMoods || !hasMoreMoods || !dbUser) return;

    setLoadingMoreMoods(true);
    try {
      const startIndex = moodPage * MOODS_PER_PAGE;
      const endIndex = startIndex + MOODS_PER_PAGE;
      const newMoods = allMoods.current.slice(startIndex, endIndex);
      
      if (newMoods.length === 0) {
        setHasMoreMoods(false);
      } else {
        setRecentMoods(prev => [...prev, ...newMoods]);
        setMoodPage(prev => prev + 1);
        
        // Check if there are more moods to load
        if (endIndex >= allMoods.current.length) {
          setHasMoreMoods(false);
        }
      }
    } catch (error) {
      console.error('Error loading more moods:', error);
    } finally {
      setLoadingMoreMoods(false);
    }
  }, [loadingMoreMoods, hasMoreMoods, moodPage, dbUser]);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMoreMoods && !loadingMoreMoods) {
          loadMoreMoods();
        }
      },
      { threshold: 0.1 }
    );

    const currentTarget = observerTarget.current;
    if (currentTarget) {
      observer.observe(currentTarget);
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMoreMoods, loadingMoreMoods, loadMoreMoods]);

  useEffect(() => {
    async function fetchData() {
      if (!dbUser) return;
      
      try {
        const [activity, moods] = await Promise.all([
          dailyActivityAPI.getDailyActivity(dbUser.id, getTodayDate()),
          moodAPI.getMoodLogs(dbUser.id)
        ]);
        setDailyActivity(activity);
        
        // Store all moods and display first page
        allMoods.current = moods;
        const firstPageMoods = moods.slice(0, MOODS_PER_PAGE);
        setRecentMoods(firstPageMoods);
        setMoodPage(1);
        setHasMoreMoods(moods.length > MOODS_PER_PAGE);

        // Calculate stats - prioritize blockchain data
        const points = userData?.totalPoints 
          ? Number(userData.totalPoints) 
          : (dbUser?.points || 0);

        const journalStreak = userData?.journalStreak 
          ? Number(userData.journalStreak) 
          : (dbUser?.journalStreak || 0);

        const meditationStreak = userData?.meditationStreak 
          ? Number(userData.meditationStreak) 
          : (dbUser?.meditationStreak || 0);

        // Current streak is the max of journal and meditation streaks
        const currentStreak = Math.max(journalStreak, meditationStreak);

        // Count today's completed activities
        let activitiesCompleted = 0;
        if (activity?.moodLogDone) activitiesCompleted++;
        if (activity?.journalDone) activitiesCompleted++;
        if (activity?.meditationDone) activitiesCompleted++;

        setStats({
          totalPoints: points,
          currentStreak,
          activitiesCompleted,
        });

        // Fetch and process achievements
        try {
          const achievementsData = await nftAPI.getAchievements(dbUser.id);
          
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
            
            return {
              id: mintedAch?.id || metadata.id,
              type: metadata.id,
              userId: dbUser.id,
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
          
          // Filter to show only unlocked (not minted) and in-progress achievements
          const activeAchievements = allAchievements.filter(
            (a) => a.status === 'unlocked' || a.status === 'in-progress'
          );
          
          setAchievements(activeAchievements);
        } catch (err) {
          console.error('Error fetching achievements:', err);
          setAchievements([]);
        }
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoadingActivity(false);
      }
    }

    fetchData();
  }, [dbUser, userData]);

  if (loading || loadingActivity) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-3 px-1">
      {/* NFT Achievements Section - Minimalist */}
      {achievements.length > 0 && (
        <div className="bg-white rounded-xl p-3 shadow-sm border border-gray-200">
          <h3 className="text-sm font-bold text-gray-900 mb-2">
            {achievements.some(a => a.status === 'unlocked') ? '🎉 Ready to Mint' : '💪 In Progress'}
          </h3>
          <div className="space-y-2">
            {achievements.map((achievement, index) => (
              <div 
                key={index} 
                className={`rounded-lg overflow-hidden ${
                  achievement.status === 'unlocked' 
                    ? 'bg-blue-50 border border-blue-200' 
                    : 'bg-gray-50 border border-gray-200'
                }`}
              >
                {/* Achievement Info Section */}
                <div className="p-2.5">
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="flex-shrink-0 w-8 h-8">
                      <img 
                        src={achievement.icon} 
                        alt={achievement.title} 
                        className="w-full h-full object-contain" 
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-semibold text-xs text-gray-900 truncate">
                        {achievement.title}
                      </h4>
                      <p className="text-[10px] text-gray-500">
                        {achievement.current}/{achievement.target} days
                      </p>
                    </div>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-1">
                    <div 
                      className={`h-1 rounded-full transition-all ${
                        achievement.status === 'unlocked' ? 'bg-blue-600' : 'bg-blue-400'
                      }`}
                      style={{ width: `${(achievement.current / achievement.target) * 100}%` }} 
                    />
                  </div>
                </div>

                {/* Mint Button Section */}
                {achievement.status === 'unlocked' && onMintClick && (
                  <div className="border-t border-blue-200 bg-white px-2.5 py-2">
                    <button 
                      onClick={() => onMintClick(achievement)} 
                      className="w-full py-1.5 bg-blue-600 text-white rounded-md text-xs font-medium hover:bg-blue-700 active:scale-[0.98] transition-all"
                    >
                      Mint NFT
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Stats Grid - Compact */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white rounded-lg p-3 shadow-sm">
          <div className="text-xl font-bold text-blue-600">{stats.totalPoints}</div>
          <div className="text-[10px] text-gray-500 mt-0.5">Points</div>
        </div>

        <div className="bg-white rounded-lg p-3 shadow-sm">
          <div className="text-xl font-bold text-blue-600">{stats.currentStreak}</div>
          <div className="text-[10px] text-gray-500 mt-0.5">Streak</div>
        </div>

        <div className="bg-white rounded-lg p-3 shadow-sm">
          <div className="text-xl font-bold text-blue-600">{stats.activitiesCompleted}/3</div>
          <div className="text-[10px] text-gray-500 mt-0.5">Today</div>
        </div>
      </div>

      {/* Today's Activities - Compact */}
      <div className="bg-white rounded-xl p-3 shadow-sm">
        <h3 className="text-sm font-bold mb-2">Today</h3>
        <div className="space-y-1.5">
          {/* Mood Log */}
          <div className={`flex items-center justify-between p-2 rounded-lg ${
            dailyActivity?.moodLogDone ? 'bg-blue-50' : 'bg-gray-50'
          }`}>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                <img src="/emojis/calm.png" alt="Mood" className="w-full h-full object-contain" />
              </div>
              <p className="font-medium text-xs truncate">Mood</p>
            </div>
            {dailyActivity?.moodLogDone && (
              <span className="text-blue-600 text-sm">✓</span>
            )}
          </div>

          {/* Journal */}
          <div className={`flex items-center justify-between p-2 rounded-lg ${
            dailyActivity?.journalDone ? 'bg-blue-50' : 'bg-gray-50'
          }`}>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                <img src="/icons/journal.png" alt="Journal" className="w-full h-full object-contain" />
              </div>
              <p className="font-medium text-xs truncate">Journal</p>
            </div>
            {dailyActivity?.journalDone && (
              <span className="text-blue-600 text-sm">✓</span>
            )}
          </div>

          {/* Meditation */}
          <div className={`flex items-center justify-between p-2 rounded-lg ${
            dailyActivity?.meditationDone ? 'bg-blue-50' : 'bg-gray-50'
          }`}>
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div className="w-6 h-6 flex items-center justify-center flex-shrink-0">
                <img src="/icons/meditation.png" alt="Meditation" className="w-full h-full object-contain" />
              </div>
              <p className="font-medium text-xs truncate">Meditation</p>
            </div>
            {dailyActivity?.meditationDone && (
              <span className="text-blue-600 text-sm">✓</span>
            )}
          </div>
        </div>
      </div>

      {/* Recent Moods - Compact */}
      {recentMoods.length > 0 && (
        <div className="bg-white rounded-xl p-3 shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-bold">Recent</h3>
            <span className="text-[10px] text-gray-500">{recentMoods.length}</span>
          </div>
          <div className="space-y-1.5 max-h-[200px] overflow-y-auto">
            {recentMoods.map((mood) => (
              <div
                key={mood.id}
                className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 active:scale-[0.98] transition-all"
              >
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
                    {mood.mood === 'happy' && <img src="/emojis/happy.png" alt="Happy" className="w-full h-full object-contain" />}
                    {mood.mood === 'calm' && <img src="/emojis/calm.png" alt="Calm" className="w-full h-full object-contain" />}
                    {mood.mood === 'neutral' && <img src="/emojis/neutral.png" alt="Neutral" className="w-full h-full object-contain" />}
                    {mood.mood === 'not-great' && <img src="/emojis/down.png" alt="Not Great" className="w-full h-full object-contain" />}
                    {mood.mood === 'sad' && <img src="/emojis/sad.png" alt="Sad" className="w-full h-full object-contain" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium capitalize text-xs truncate">
                      {mood.mood.replace('-', ' ')}
                    </p>
                    <p className="text-[10px] text-gray-500">
                      {new Date(mood.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="text-right flex-shrink-0 ml-2">
                  <p className="text-[10px] text-gray-500">{mood.rating}/10</p>
                </div>
              </div>
            ))}
            
            {/* Loading indicator */}
            {loadingMoreMoods && (
              <div className="flex items-center justify-center py-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              </div>
            )}
            
            {/* Intersection observer target */}
            {hasMoreMoods && !loadingMoreMoods && (
              <div ref={observerTarget} className="h-2" />
            )}
            
            {/* End message */}
            {!hasMoreMoods && recentMoods.length > MOODS_PER_PAGE && (
              <div className="text-center py-2 text-[10px] text-gray-500">
                End of history
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
});
