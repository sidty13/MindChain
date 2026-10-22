'use client';

import { useEffect, useState } from 'react';
import { journalAPI } from '~/lib/api';

interface JournalViewProps {
  contracts: any;
}

export function JournalView({ contracts }: JournalViewProps) {
  const { dbUser } = contracts;
  const [journals, setJournals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJournal, setSelectedJournal] = useState<any>(null);

  useEffect(() => {
    async function fetchJournals() {
      if (!dbUser) return;

      try {
        const data = await journalAPI.getJournals(dbUser.id);
        setJournals(data);
      } catch (error) {
        console.error('Error fetching journals:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchJournals();
  }, [dbUser]);

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
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (journals.length === 0) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="border border-border rounded-lg p-12 bg-white text-center">
          <div className="flex items-center justify-center mb-4">
            <img src="/icons/journal.png" alt="Journal" className="w-20 h-20 object-contain opacity-50" />
          </div>
          <h3 className="text-xl font-bold mb-2">No journals yet</h3>
          <p className="text-muted-foreground mb-6">
            Start writing your first journal entry to track your journey!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold mb-2">Your Journal Entries</h2>
        <p className="text-muted-foreground">
          {journals.length} {journals.length === 1 ? 'entry' : 'entries'} recorded
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {journals.map((journal) => (
          <div
            key={journal.id}
            className="border border-border rounded-lg p-6 bg-white hover:bg-purple-50 hover:border-purple-200 transition-all cursor-pointer"
            onClick={() => setSelectedJournal(journal)}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <img src="/icons/journal.png" alt="Journal" className="w-7 h-7 object-contain drop-shadow-md" />
                <span className="text-sm text-muted-foreground">
                  {formatDate(journal.createdAt)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-primary">+{journal.points} pts</span>
              </div>
            </div>
            <p className="text-foreground line-clamp-3">
              {journal.content}
            </p>
            {journal.content.length > 200 && (
              <button className="text-sm text-primary font-medium mt-2 hover:underline">
                Read more →
              </button>
            )}
          </div>
        ))}
      </div>

      {/* Journal Detail Modal */}
      {selectedJournal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedJournal(null)}
        >
          <div
            className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <img src="/icons/journal.png" alt="Journal" className="w-8 h-8 object-contain drop-shadow-md" />
                  <span className="text-sm text-muted-foreground">
                    {formatDate(selectedJournal.createdAt)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-primary">
                    +{selectedJournal.points} points earned
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedJournal(null)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="prose max-w-none">
              <p className="whitespace-pre-wrap text-foreground">{selectedJournal.content}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
