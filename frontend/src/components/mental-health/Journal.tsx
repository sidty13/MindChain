'use client';

import { useState, useEffect } from 'react';
import { useAccount, useSwitchChain } from 'wagmi';
import { base } from 'wagmi/chains';
import { dailyActivityAPI } from '~/lib/api';

interface JournalProps {
  contracts: any;
}

const getTodayDate = () => {
  const today = new Date();
  return today.toISOString().split('T')[0];
};

export function Journal({ contracts }: JournalProps) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [alreadyJournaled, setAlreadyJournaled] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const { chain } = useAccount();
  const { switchChainAsync } = useSwitchChain();

  // Check if journal was already submitted today
  useEffect(() => {
    async function checkDailyActivity() {
      if (!contracts.dbUser?.id) {
        setCheckingStatus(false);
        return;
      }

      try {
        const activity = await dailyActivityAPI.getDailyActivity(
          contracts.dbUser.id,
          getTodayDate()
        );
        
        setAlreadyJournaled(activity?.journalDone || false);
      } catch (err) {
        console.error('Error checking daily activity:', err);
        setAlreadyJournaled(false);
      } finally {
        setCheckingStatus(false);
      }
    }

    checkDailyActivity();
  }, [contracts.dbUser?.id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!content.trim()) {
      setError('Please write something in your journal');
      return;
    }

    if (content.length < 10) {
      setError('Journal entry must be at least 10 characters');
      return;
    }

    if (alreadyJournaled) {
      setError("You've already journaled today. Come back tomorrow!");
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      // Check if on correct chain, switch if needed
      if (chain?.id !== base.id) {
        setError('Switching to Base...');
        await switchChainAsync({ chainId: base.id });
        setError(''); // Clear the switching message
      }

      await contracts.submitJournal(content);
      setSuccess(true);
      setAlreadyJournaled(true); // Update state to prevent multiple submissions
      setContent('');
      
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      if (err.message?.includes('chain')) {
        setError('Please switch to Base network in your wallet');
      } else {
        setError(err.message || 'Failed to submit journal');
      }
    } finally {
      setLoading(false);
    }
  };

  const wordCount = content.trim().split(/\s+/).filter(Boolean).length;
  const charCount = content.length;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-sm">
        {/* Header - Optimized for mobile */}
        <div className="text-center mb-4 sm:mb-6 lg:mb-8">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-1 sm:mb-2">
            Daily Journal
          </h2>
          <p className="text-sm sm:text-base text-gray-500">
            Express yourself and earn{' '}
            <span className="font-semibold text-blue-600">20 points</span>
          </p>
        </div>

        {/* Loading State */}
        {checkingStatus && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-sm text-gray-500">Checking today's status...</p>
          </div>
        )}

        {/* Already Completed State */}
        {!checkingStatus && alreadyJournaled && (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Journal Entry Submitted!</h3>
            <p className="text-gray-600 mb-4">
              You've already written your journal entry for today.
            </p>
            <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-600 px-4 py-2 rounded-full text-sm font-medium">
              <span>Come back tomorrow to continue your streak</span>
            </div>
          </div>
        )}

        {/* Journal Form */}
        {!checkingStatus && !alreadyJournaled && (
        <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 lg:space-y-6">
          {/* Journal Textarea - Mobile optimized */}
          <div>
            <textarea
              id="journal-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="How was your day? What are you grateful for?"
              rows={10}
              className="w-full bg-gray-50 border-0 rounded-xl sm:rounded-2xl px-4 py-3 sm:px-6 sm:py-4 focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none resize-none text-base sm:text-lg leading-relaxed touch-manipulation"
              style={{ minHeight: '200px' }}
            />
            <div className="flex justify-between mt-2 px-2 text-xs sm:text-sm text-gray-400">
              <span>{wordCount} {wordCount === 1 ? 'word' : 'words'}</span>
              <span>{charCount} {charCount === 1 ? 'character' : 'characters'}</span>
            </div>
          </div>

          {/* Error Message - Mobile optimized */}
          {error && (
            <div className="p-3 sm:p-4 bg-red-50 border border-red-200 rounded-xl sm:rounded-2xl">
              <p className="text-xs sm:text-sm text-red-600 text-center leading-relaxed">
                {error}
              </p>
            </div>
          )}

          {/* Success Message - Mobile optimized */}
          {success && (
            <div className="p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-xl sm:rounded-2xl">
              <p className="text-xs sm:text-sm text-blue-600 font-medium text-center leading-relaxed">
                ✓ Journal saved! +20 points & streak extended
              </p>
            </div>
          )}

          {/* Submit Button - Mobile optimized with larger touch target */}
          <button
            type="submit"
            disabled={loading || !content.trim()}
            className="w-full bg-blue-600 text-white rounded-xl sm:rounded-2xl px-6 py-4 sm:py-5 font-semibold text-base sm:text-lg hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl touch-manipulation min-h-[48px] sm:min-h-[56px]"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Saving...</span>
              </span>
            ) : (
              'Save Journal Entry'
            )}
          </button>
        </form>
        )}

        {/* Writing Prompts - Mobile optimized */}
        {!checkingStatus && !alreadyJournaled && (
        <details className="mt-4 sm:mt-5 lg:mt-6 group">
          <summary className="cursor-pointer text-sm sm:text-base font-medium text-gray-600 hover:text-gray-900 active:text-gray-900 flex items-center gap-2 p-2 -mx-2 rounded-lg hover:bg-gray-50 touch-manipulation min-h-[44px]">
            <span className="text-lg">💡</span>
            <span className="flex-1">Need inspiration? Tap for writing prompts</span>
            <span className="ml-auto group-open:rotate-180 transition-transform text-xs sm:text-sm">
              ▼
            </span>
          </summary>
          <ul className="mt-3 text-sm sm:text-base text-gray-600 space-y-2.5 sm:space-y-3 pl-4 sm:pl-6">
            <li className="leading-relaxed">• What made you smile today?</li>
            <li className="leading-relaxed">• What challenge did you overcome?</li>
            <li className="leading-relaxed">• What are you grateful for right now?</li>
            <li className="leading-relaxed">• How did you take care of yourself today?</li>
            <li className="leading-relaxed">• What's one thing you learned about yourself?</li>
          </ul>
        </details>
        )}
      </div>
    </div>
  );
}
