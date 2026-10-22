// API client for database operations

export const userAPI = {
  async getOrCreateUser(walletAddress: string, farcasterFid?: string, username?: string, profileImage?: string) {
    const response = await fetch('/api/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ walletAddress, farcasterFid, username, profileImage }),
    });
    if (!response.ok) throw new Error('Failed to create user');
    return response.json();
  },

  async getUser(userId: string) {
    const response = await fetch(`/api/users?userId=${userId}`);
    if (!response.ok) throw new Error('Failed to fetch user');
    return response.json();
  },

  async getUserByWallet(walletAddress: string) {
    const response = await fetch(`/api/users?walletAddress=${walletAddress}`);
    if (!response.ok) throw new Error('Failed to fetch user');
    return response.json();
  },

  async updateUser(userId: string, data: { username?: string; profileImage?: string; points?: number; journalStreak?: number; meditationStreak?: number }) {
    const response = await fetch('/api/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, ...data }),
    });
    if (!response.ok) throw new Error('Failed to update user');
    return response.json();
  },
};

export const journalAPI = {
  async getJournals(userId: string) {
    const response = await fetch(`/api/journals?userId=${userId}`);
    return response.json();
  },

  async createJournal(userId: string, content: string) {
    const response = await fetch('/api/journals', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, content }),
    });
    return response.json();
  },
};

export const moodAPI = {
  async getMoodLogs(userId: string) {
    const response = await fetch(`/api/moods?userId=${userId}`);
    return response.json();
  },

  async createMoodLog(userId: string, mood: string, rating: number) {
    const response = await fetch('/api/moods', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, mood, rating }),
    });
    return response.json();
  },
};

export const meditationAPI = {
  async getMeditations(userId: string) {
    const response = await fetch(`/api/meditations?userId=${userId}`);
    return response.json();
  },

  async createMeditation(userId: string, duration: number, completed: boolean = true) {
    const response = await fetch('/api/meditations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, duration, completed }),
    });
    return response.json();
  },

  async updateMeditation(id: string, completed: boolean) {
    const response = await fetch('/api/meditations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, completed }),
    });
    return response.json();
  },
};

export const chatAPI = {
  async getMessages(limit: number = 50) {
    const response = await fetch(`/api/chat?limit=${limit}`);
    return response.json();
  },

  async createMessage(type: 'admin' | 'system' | 'milestone', content: string, userId?: string) {
    const response = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type, content, userId }),
    });
    return response.json();
  },

  async deleteMessage(messageId: string) {
    const response = await fetch('/api/chat', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageId }),
    });
    if (!response.ok) throw new Error('Failed to delete message');
    return response.json();
  },
};

export const dailyActivityAPI = {
  async getDailyActivity(userId: string, date: string) {
    const response = await fetch(`/api/daily-activity?userId=${userId}&date=${date}`);
    return response.json();
  },

  async updateDailyActivity(userId: string, date: string, updates: { meditationDone?: boolean; journalDone?: boolean; moodLogDone?: boolean }) {
    const response = await fetch('/api/daily-activity', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, date, ...updates }),
    });
    return response.json();
  },
};

export const nftAPI = {
  async getAchievements(userId: string) {
    const response = await fetch(`/api/achievements?userId=${userId}`);
    return response.json();
  },

  async createAchievement(userId: string, type: string, days: number, improvementRating: number) {
    const response = await fetch('/api/achievements', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, type, days, improvementRating }),
    });
    return response.json();
  },

  async updateAchievement(id: string, tokenId: string, contractAddress: string, transactionHash: string) {
    const response = await fetch('/api/achievements', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, tokenId, contractAddress, transactionHash, minted: true }),
    });
    return response.json();
  },
};
