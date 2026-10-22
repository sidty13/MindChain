'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useAccount, useSwitchChain } from 'wagmi';
import { base } from 'wagmi/chains';

interface MeditationProps {
  contracts: any;
}

export function Meditation({ contracts }: MeditationProps) {
  const [isActive, setIsActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60); // 60 seconds = 1 minute
  const [preparationTime, setPreparationTime] = useState(0); // 5 second prep countdown
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [canStart, setCanStart] = useState(true);
  const [checkingEligibility, setCheckingEligibility] = useState(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { chain } = useAccount();
  const { switchChainAsync } = useSwitchChain();

  useEffect(() => {
    async function checkMeditationEligibility() {
      try {
        const eligible = await contracts.canMeditateToday();
        setCanStart(eligible);
      } catch (err) {
        console.error('Error checking meditation eligibility:', err);
      } finally {
        setCheckingEligibility(false);
      }
    }

    checkMeditationEligibility();
  }, [contracts]);

  // Handle preparation countdown (5 seconds)
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (preparationTime > 0) {
      interval = setInterval(() => {
        setPreparationTime((prev) => {
          const newTime = prev - 1;
          
          // Only count down last 3 seconds
          if (newTime === 3 || newTime === 2 || newTime === 1) {
            speak(newTime.toString(), true);
          } else if (newTime === 0) {
            speak('Begin', true);
            setIsActive(true); // Start the actual meditation
          }
          
          return newTime;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [preparationTime]);

  const handleComplete = useCallback(async () => {
    setIsActive(false);
    setLoading(true);

    try {
      // Check if on correct chain, switch if needed
      if (chain?.id !== base.id) {
        setError('Switching to Base...');
        await switchChainAsync({ chainId: base.id });
        setError('');
      }

      await contracts.completeMeditation(60); // 60 seconds
      setSuccess(true);
      setCanStart(false);
      
      setTimeout(() => setSuccess(false), 5000);
    } catch (err: any) {
      if (err.message?.includes('chain')) {
        setError('Please switch to Base network in your wallet');
      } else {
        setError(err.message || 'Failed to complete meditation');
      }
    } finally {
      setLoading(false);
    }
  }, [contracts, chain, switchChainAsync]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          const newTime = prev - 1;
          
          // Minimal voice announcements - only at critical moments
          if (newTime === 30) speak('Halfway there', false);
          if (newTime === 10) speak('10 seconds', false);
          if (newTime === 0) {
            speak('Complete', true);
          }
          
          return newTime;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  // Handle completion when timer reaches 0
  useEffect(() => {
    if (timeLeft === 0 && isActive) {
      handleComplete();
    }
  }, [timeLeft, isActive, handleComplete]);

  const speak = (text: string, priority: boolean = false) => {
    if ('speechSynthesis' in window) {
      // Cancel any ongoing speech for priority messages or to prevent queue buildup
      if (priority || window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
      
      // Small delay to ensure cancel completes
      setTimeout(() => {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.9;
        utterance.pitch = 1;
        utterance.volume = 1;
        window.speechSynthesis.speak(utterance);
      }, priority ? 100 : 50);
    }
  };

  const handleStart = () => {
    if (!canStart) {
      setError('You have already completed your meditation for today!');
      return;
    }

    // Cancel any ongoing speech first
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }

    setPreparationTime(5); // Start 5-second preparation countdown
    setTimeLeft(60);
    setError('');
    
    // Brief start message
    setTimeout(() => {
      speak('Get ready', true);
    }, 200);
  };

  const handleStop = () => {
    setIsActive(false);
    setPreparationTime(0); // Also stop preparation if paused during prep
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  };

  const handleReset = () => {
    handleStop();
    setTimeLeft(60);
    setPreparationTime(0);
    setError('Meditation session cancelled. You can start again.');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((60 - timeLeft) / 60) * 100;

  if (checkingEligibility) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6">
      <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-8 shadow-sm">
        {/* Header - Mobile optimized */}
        <div className="text-center mb-4 sm:mb-6">
          <h2 className="text-2xl sm:text-3xl font-bold mb-1 sm:mb-2">Meditation</h2>
          <p className="text-sm sm:text-base text-gray-500">
            1 minute • Earn <span className="font-semibold text-blue-600">30 points</span>
          </p>
          {!canStart && (
            <p className="text-xs sm:text-sm text-green-600 mt-2">✓ Completed today</p>
          )}
        </div>

        {/* Quick Tips - Mobile optimized */}
        <div className="mb-5 sm:mb-6 bg-amber-50 rounded-xl p-3 border border-amber-100">
          <div className="flex items-start gap-2 text-xs sm:text-sm text-gray-700">
            <span className="text-base sm:text-lg flex-shrink-0">💡</span>
            <div className="flex-1 leading-relaxed">
              <span className="font-medium text-gray-900">Quick tips: </span>
              Find a quiet place, relax your body, focus on your breathing
            </div>
          </div>
        </div>

        {/* Timer Display - Mobile responsive */}
        <div className="text-center mb-6 sm:mb-8">
          <div className="relative inline-block">
            {/* Progress Circle - Responsive size */}
            <svg className="w-56 h-56 sm:w-64 sm:h-64 transform -rotate-90">
              <circle
                cx="112"
                cy="112"
                r="104"
                stroke="#f0f0f0"
                strokeWidth="10"
                fill="none"
                className="sm:hidden"
              />
              <circle
                cx="112"
                cy="112"
                r="104"
                stroke="#3b82f6"
                strokeWidth="10"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 104}`}
                strokeDashoffset={`${2 * Math.PI * 104 * (1 - progress / 100)}`}
                strokeLinecap="round"
                className="transition-all duration-1000 sm:hidden"
              />
              <circle
                cx="128"
                cy="128"
                r="120"
                stroke="#f0f0f0"
                strokeWidth="12"
                fill="none"
                className="hidden sm:block"
              />
              <circle
                cx="128"
                cy="128"
                r="120"
                stroke="#3b82f6"
                strokeWidth="12"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 120}`}
                strokeDashoffset={`${2 * Math.PI * 120 * (1 - progress / 100)}`}
                strokeLinecap="round"
                className="transition-all duration-1000 hidden sm:block"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              {preparationTime > 0 ? (
                <>
                  <span className="text-5xl sm:text-7xl font-bold text-blue-600 animate-pulse">{preparationTime}</span>
                  <span className="text-xs sm:text-sm text-gray-500 mt-2 sm:mt-3">Get ready...</span>
                </>
              ) : (
                <>
                  <span className="text-5xl sm:text-7xl font-bold text-blue-600">{formatTime(timeLeft)}</span>
                  {isActive && (
                    <span className="text-xs sm:text-sm text-gray-500 mt-2 sm:mt-3 animate-pulse">Breathe...</span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Controls - Mobile optimized */}
        <div className="space-y-2.5 sm:space-y-3">
          {!isActive && !preparationTime && timeLeft === 60 && (
            <button
              onClick={handleStart}
              disabled={!canStart || loading}
              className="w-full bg-white text-blue-600 rounded-xl sm:rounded-2xl px-6 py-4 sm:py-5 font-semibold text-base sm:text-lg hover:bg-blue-600 hover:text-white active:bg-blue-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl touch-manipulation min-h-[52px] sm:min-h-[60px] flex items-center justify-center gap-2"
              style={{ border: '2px solid #3b82f6' }}
            >
              {!canStart ? (
                <>✓ Completed Today</>
              ) : (
                <>
                  <div className="w-12 h-12 sm:w-12 sm:h-12 flex items-center justify-center">
                    <img src="/icons/meditation.png" alt="Meditation" className="w-full h-full object-contain drop-shadow-lg" />
                  </div>
                  <span>Start Meditation</span>
                </>
              )}
            </button>
          )}

          {preparationTime > 0 && (
            <button
              onClick={handleReset}
              className="w-full bg-gray-600 text-white rounded-xl sm:rounded-2xl px-6 py-4 sm:py-5 font-semibold text-base sm:text-lg hover:bg-gray-700 active:bg-gray-800 transition-all shadow-lg touch-manipulation min-h-[52px] sm:min-h-[60px]"
            >
              ✕ Cancel Preparation
            </button>
          )}

          {isActive && (
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <button
                onClick={handleStop}
                className="w-full bg-gray-400 text-white rounded-xl px-4 sm:px-6 py-3.5 sm:py-4 font-semibold text-sm sm:text-base hover:bg-gray-500 active:bg-gray-600 transition-colors touch-manipulation min-h-[50px]"
              >
                ⏸ Pause
              </button>
              <button
                onClick={handleReset}
                className="w-full bg-gray-600 text-white rounded-xl px-4 sm:px-6 py-3.5 sm:py-4 font-semibold text-sm sm:text-base hover:bg-gray-700 active:bg-gray-800 transition-colors touch-manipulation min-h-[50px]"
              >
                ✕ Cancel
              </button>
            </div>
          )}

          {!isActive && timeLeft < 60 && timeLeft > 0 && (
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              <button
                onClick={() => setIsActive(true)}
                className="w-full bg-blue-600 text-white rounded-xl px-4 sm:px-6 py-3.5 sm:py-4 font-semibold text-sm sm:text-base hover:bg-blue-700 active:bg-blue-800 transition-colors touch-manipulation min-h-[50px]"
              >
                ▶ Resume
              </button>
              <button
                onClick={handleReset}
                className="w-full bg-gray-400 text-white rounded-xl px-4 sm:px-6 py-3.5 sm:py-4 font-semibold text-sm sm:text-base hover:bg-gray-500 active:bg-gray-600 transition-colors touch-manipulation min-h-[50px]"
              >
                ↺ Restart
              </button>
            </div>
          )}

          {timeLeft === 0 && loading && (
            <div className="w-full bg-blue-600 text-white rounded-xl px-6 py-4 font-semibold text-center min-h-[52px] flex items-center justify-center">
              <span className="flex items-center gap-2">
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Saving...</span>
              </span>
            </div>
          )}
        </div>

        {/* Error Message - Mobile optimized */}
        {error && (
          <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-xl sm:rounded-2xl">
            <p className="text-xs sm:text-sm text-red-600 text-center leading-relaxed">{error}</p>
          </div>
        )}

        {/* Success Message - Mobile optimized */}
        {success && (
          <div className="mt-3 sm:mt-4 p-3 sm:p-4 bg-green-50 border border-green-200 rounded-xl sm:rounded-2xl">
            <p className="text-xs sm:text-sm text-green-600 font-medium text-center leading-relaxed">
              ✓ Meditation complete! +30 points & streak extended
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
