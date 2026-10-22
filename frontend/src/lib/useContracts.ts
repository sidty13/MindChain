/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef } from 'react';
import { useAccount } from 'wagmi';
import { writeContract, readContract, waitForTransactionReceipt } from '@wagmi/core';
import { config } from '~/components/providers/WagmiProvider';
import { userAPI, journalAPI, moodAPI, meditationAPI, dailyActivityAPI, nftAPI } from './api';
import { IsYourDayOkPointsABI } from './abis/IsYourDayOkPoints';
import { IsYourDayOkNFTABI } from './abis/IsYourDayOkNFT';
import { base } from 'wagmi/chains';
import type { Address, Hex } from 'viem';
import { checkPaymasterSupport, sendSponsoredContractCall, getChainId } from './baseAccount';

// Contract addresses from deployments
const POINTS_CONTRACT_ADDRESS = '0x364784cb19047B68066eEa63286AAd5EA49453C2' as Address;
const NFT_CONTRACT_ADDRESS = '0xD7498664f74cF7437994C4E523C542761BA7d4a0' as Address;

interface FarcasterUser {
  fid?: string;
  username?: string;
  displayName?: string;
  pfpUrl?: string;
}

interface UserData {
  totalPoints: bigint;
  journalStreak: bigint;
  meditationStreak: bigint;
  lastJournalDate: bigint;
  lastMeditationDate: bigint;
}

interface DbUser {
  id: string;
  walletAddress: string;
  farcasterFid?: string;
  username?: string;
  profileImage?: string;
  points: number;
  journalStreak: number;
  meditationStreak: number;
  createdAt: Date;
  updatedAt: Date;
}

export function useContracts(farcasterUser?: FarcasterUser) {
  const { address, isConnected } = useAccount();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [dbUser, setDbUser] = useState<DbUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Track if initial fetch has been done for this address
  const initializedAddress = useRef<string | null>(null);
  const isFetching = useRef(false);

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => new Date().toISOString().split('T')[0];

  // Fetch user data from both contract and database
  useEffect(() => {
    async function fetchData() {
      if (!address || !isConnected) {
        setLoading(false);
        return;
      }

      // Skip if already initialized for this address or currently fetching
      if (initializedAddress.current === address || isFetching.current) {
        return;
      }

      try {
        isFetching.current = true;
        setLoading(true);

        // Fetch from database (create if doesn't exist)
        const user = await userAPI.getOrCreateUser(
          address,
          farcasterUser?.fid,
          farcasterUser?.username,
          farcasterUser?.pfpUrl
        );
        setDbUser(user);

        // Fetch from contract
        const data = await readContract(config, {
          address: POINTS_CONTRACT_ADDRESS,
          abi: IsYourDayOkPointsABI,
          functionName: 'getUserData',
          args: [address],
          chainId: base.id,
        });

        if (Array.isArray(data) && data.length === 5) {
          setUserData({
            totalPoints: data[0] as bigint,
            journalStreak: data[1] as bigint,
            meditationStreak: data[2] as bigint,
            lastJournalDate: data[3] as bigint,
            lastMeditationDate: data[4] as bigint,
          });
        }

        setError(null);
        initializedAddress.current = address; // Mark as initialized
      } catch (err: any) {
        console.error('Error fetching user data:', err);
        setError(err.message);
      } finally {
        setLoading(false);
        isFetching.current = false;
      }
    }

    fetchData();
  }, [address, isConnected]); // Removed farcasterUser from dependencies

  // Reset state when address changes
  useEffect(() => {
    if (!address) {
      setUserData(null);
      setDbUser(null);
      setError(null);
      initializedAddress.current = null;
    }
  }, [address]);

  // Refresh contract data helper
  const refreshContractData = async () => {
    if (!address) return;

    try {
      const data = await readContract(config, {
        address: POINTS_CONTRACT_ADDRESS,
        abi: IsYourDayOkPointsABI,
        functionName: 'getUserData',
        args: [address],
        chainId: base.id,
      });

      if (Array.isArray(data) && data.length === 5) {
        setUserData({
          totalPoints: data[0] as bigint,
          journalStreak: data[1] as bigint,
          meditationStreak: data[2] as bigint,
          lastJournalDate: data[3] as bigint,
          lastMeditationDate: data[4] as bigint,
        });
      }
    } catch (err) {
      console.error('Error refreshing contract data:', err);
    }
  };

  // Refresh database user data
  const refreshDbUser = async () => {
    if (!address || !dbUser?.id) return;

    try {
      // Use getUser with existing userId instead of getOrCreateUser
      const user = await userAPI.getUser(dbUser.id);
      setDbUser(user);
    } catch (err) {
      console.error('Error refreshing database user:', err);
    }
  };

  // Log mood (Contract FIRST, then Database + Daily Activity)
  const logMood = async (mood: string, rating: number) => {
    if (!dbUser) throw new Error('User not initialized');
    if (!address) throw new Error('Wallet not connected');

    try {
      let hash: Hex;
      const chainId = getChainId();
      
      // Try gasless transaction first
      const gaslessAvailable = await checkPaymasterSupport(chainId);
      
      if (gaslessAvailable) {
        console.log('⚡ Using gasless transaction for mood logging');
        try {
          const result = await sendSponsoredContractCall(
            POINTS_CONTRACT_ADDRESS,
            IsYourDayOkPointsABI,
            'logMood',
            [],
            '0x0' as Hex,
            chainId
          );
          hash = result as Hex;
        } catch (gaslessError) {
          console.warn('Gasless transaction failed, falling back to regular transaction:', gaslessError);
          // Fallback to regular transaction
          hash = await writeContract(config, {
            address: POINTS_CONTRACT_ADDRESS,
            abi: IsYourDayOkPointsABI,
            functionName: 'logMood',
            args: [],
            chainId: base.id,
          });
        }
      } else {
        console.log('⛽ Using regular transaction for mood logging');
        // Use regular transaction
        hash = await writeContract(config, {
          address: POINTS_CONTRACT_ADDRESS,
          abi: IsYourDayOkPointsABI,
          functionName: 'logMood',
          args: [],
          chainId: base.id,
        });
      }

      // 2. Wait for transaction confirmation
      await waitForTransactionReceipt(config, { hash });
      
      // 3. Only after successful on-chain transaction, save to database
      await moodAPI.createMoodLog(dbUser.id, mood, rating);
      
      // 4. Update daily activity
      await dailyActivityAPI.updateDailyActivity(dbUser.id, getTodayDate(), { moodLogDone: true });
      
      // 5. Update database user points (MOOD_LOG_POINTS = 10)
      await userAPI.updateUser(dbUser.id, { points: dbUser.points + 10 });
      
      // 6. Refresh both data sources
      await Promise.all([refreshContractData(), refreshDbUser()]);
    } catch (err: any) {
      console.error('Error logging mood:', err);
      throw err;
    }
  };

  // Submit journal (Contract FIRST, then Database + Daily Activity)
  const submitJournal = async (content: string) => {
    if (!dbUser) throw new Error('User not initialized');
    if (!address) throw new Error('Wallet not connected');

    try {
      let hash: Hex;
      const chainId = getChainId();
      
      // Try gasless transaction first
      const gaslessAvailable = await checkPaymasterSupport(chainId);
      
      if (gaslessAvailable) {
        console.log('⚡ Using gasless transaction for journal submission');
        try {
          const result = await sendSponsoredContractCall(
            POINTS_CONTRACT_ADDRESS,
            IsYourDayOkPointsABI,
            'submitJournal',
            [],
            '0x0' as Hex,
            chainId
          );
          hash = result as Hex;
        } catch (gaslessError) {
          console.warn('Gasless transaction failed, falling back to regular transaction:', gaslessError);
          // Fallback to regular transaction
          hash = await writeContract(config, {
            address: POINTS_CONTRACT_ADDRESS,
            abi: IsYourDayOkPointsABI,
            functionName: 'submitJournal',
            args: [],
            chainId: base.id,
          });
        }
      } else {
        console.log('⛽ Using regular transaction for journal submission');
        // Use regular transaction
        hash = await writeContract(config, {
          address: POINTS_CONTRACT_ADDRESS,
          abi: IsYourDayOkPointsABI,
          functionName: 'submitJournal',
          args: [],
          chainId: base.id,
        });
      }

      // 2. Wait for transaction confirmation
      await waitForTransactionReceipt(config, { hash });

      // 3. Only after successful on-chain transaction, save to database
      await journalAPI.createJournal(dbUser.id, content);
      
      // 4. Update daily activity
      await dailyActivityAPI.updateDailyActivity(dbUser.id, getTodayDate(), { journalDone: true });

      // 5. Update database user points and streak
      await userAPI.updateUser(dbUser.id, { 
        points: dbUser.points + 20,
        journalStreak: dbUser.journalStreak + 1
      });

      // 6. Refresh both data sources
      await Promise.all([refreshContractData(), refreshDbUser()]);
    } catch (err: any) {
      console.error('Error submitting journal:', err);
      throw err;
    }
  };

  // Complete meditation (Contract FIRST, then Database + Daily Activity)
  const completeMeditation = async (duration: number) => {
    if (!dbUser) throw new Error('User not initialized');
    if (!address) throw new Error('Wallet not connected');

    try {
      let hash: Hex;
      const chainId = getChainId();
      
      // Try gasless transaction first
      const gaslessAvailable = await checkPaymasterSupport(chainId);
      
      if (gaslessAvailable) {
        console.log('⚡ Using gasless transaction for meditation completion');
        try {
          const result = await sendSponsoredContractCall(
            POINTS_CONTRACT_ADDRESS,
            IsYourDayOkPointsABI,
            'completeMeditation',
            [],
            '0x0' as Hex,
            chainId
          );
          hash = result as Hex;
        } catch (gaslessError) {
          console.warn('Gasless transaction failed, falling back to regular transaction:', gaslessError);
          // Fallback to regular transaction
          hash = await writeContract(config, {
            address: POINTS_CONTRACT_ADDRESS,
            abi: IsYourDayOkPointsABI,
            functionName: 'completeMeditation',
            args: [],
            chainId: base.id,
          });
        }
      } else {
        console.log('⛽ Using regular transaction for meditation completion');
        // Use regular transaction
        hash = await writeContract(config, {
          address: POINTS_CONTRACT_ADDRESS,
          abi: IsYourDayOkPointsABI,
          functionName: 'completeMeditation',
          args: [],
          chainId: base.id,
        });
      }

      // 2. Wait for transaction confirmation
      await waitForTransactionReceipt(config, { hash });

      // 3. Only after successful on-chain transaction, save to database
      await meditationAPI.createMeditation(dbUser.id, duration, true);
      
      // 4. Update daily activity
      await dailyActivityAPI.updateDailyActivity(dbUser.id, getTodayDate(), { meditationDone: true });

      // 5. Update database user points and streak
      await userAPI.updateUser(dbUser.id, { 
        points: dbUser.points + 30,
        meditationStreak: dbUser.meditationStreak + 1
      });

      // 6. Refresh both data sources
      await Promise.all([refreshContractData(), refreshDbUser()]);
    } catch (err: any) {
      console.error('Error completing meditation:', err);
      throw err;
    }
  };

  // Check if user can meditate today
  const canMeditateToday = async (): Promise<boolean> => {
    if (!address) return false;

    try {
      const canMeditate = await readContract(config, {
        address: POINTS_CONTRACT_ADDRESS,
        abi: IsYourDayOkPointsABI,
        functionName: 'canMeditateToday',
        args: [address],
        chainId: base.id,
      });

      return canMeditate as boolean;
    } catch (err) {
      console.error('Error checking meditation status:', err);
      return false;
    }
  };

  // Create NFT achievement
  const createAchievement = async (type: string, days: number, improvementRating: number) => {
    if (!dbUser) throw new Error('User not initialized');

    try {
      const achievement = await nftAPI.createAchievement(dbUser.id, type, days, improvementRating);
      return achievement;
    } catch (err: any) {
      console.error('Error creating achievement:', err);
      throw err;
    }
  };

  // Update achievement with mint info - now handled by mint API
  const updateAchievementMint = async (
    achievementId: string,
    tokenId: string,
    contractAddress: string,
    transactionHash: string
  ) => {
    try {
      await nftAPI.updateAchievement(achievementId, tokenId, contractAddress, transactionHash);
    } catch (err: any) {
      console.error('Error updating achievement:', err);
      throw err;
    }
  };

  return {
    address,
    isConnected,
    userData,
    dbUser,
    farcasterUser,
    loading,
    error,
    logMood,
    submitJournal,
    completeMeditation,
    canMeditateToday,
    createAchievement,
    updateAchievementMint,
    refreshContractData,
    refreshDbUser,
  };
}
