'use client';

import { useState, useEffect } from 'react';
import { useAccount } from 'wagmi';
import { chatAPI } from '~/lib/api';

// Admin wallet addresses (add your admin addresses here)
const ADMIN_ADDRESSES = [
  '0x76967ce1457d65703445fbe024dd487a151ad993',
  '0xBa8E30787f6A9082F97b3D4E8F370b8084dB272f',
  // Add more admin addresses as needed
];

export default function AdminPage() {
  const { address, isConnected } = useAccount();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [messageType, setMessageType] = useState<'admin' | 'system' | 'milestone'>('admin');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'messages' | 'users'>('messages');
  const [searchQuery, setSearchQuery] = useState('');

  // Check if connected address is admin
  useEffect(() => {
    if (address && isConnected) {
      const isAdminAddress = ADMIN_ADDRESSES.some(
        (adminAddr) => adminAddr.toLowerCase() === address.toLowerCase()
      );
      setIsAdmin(isAdminAddress);
    } else {
      setIsAdmin(false);
    }
  }, [address, isConnected]);

  // Fetch recent messages
  useEffect(() => {
    async function fetchMessages() {
      if (!isAdmin) return;
      
      try {
        const data = await chatAPI.getMessages(50);
        setMessages(data);
      } catch (err) {
        console.error('Error fetching messages:', err);
      }
    }

    fetchMessages();

    // Poll for new messages every 10 seconds
    const interval = setInterval(fetchMessages, 10000);
    return () => clearInterval(interval);
  }, [isAdmin]);

  // Fetch users
  useEffect(() => {
    async function fetchUsers() {
      if (!isAdmin) return;
      
      try {
        const response = await fetch('/api/admin/users');
        const data = await response.json();
        setUsers(data);
      } catch (err) {
        console.error('Error fetching users:', err);
      }
    }

    fetchUsers();

    // Poll for new users every 30 seconds
    const interval = setInterval(fetchUsers, 30000);
    return () => clearInterval(interval);
  }, [isAdmin]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newMessage.trim()) {
      setError('Please enter a message');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await chatAPI.createMessage(messageType, newMessage.trim());
      setSuccess('Message sent successfully!');
      setNewMessage('');
      
      // Refresh messages
      const data = await chatAPI.getMessages(50);
      setMessages(data);
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;

    try {
      await chatAPI.deleteMessage(messageId);
      setSuccess('Message deleted successfully!');
      
      // Refresh messages
      const data = await chatAPI.getMessages(50);
      setMessages(data);
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to delete message');
    }
  };

  const formatTime = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateString));
  };

  const formatDate = (dateString: string) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(new Date(dateString));
  };

  const truncateAddress = (addr: string) => {
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const filteredUsers = users.filter(user => {
    const query = searchQuery.toLowerCase();
    return (
      user.walletAddress.toLowerCase().includes(query) ||
      (user.username?.toLowerCase() || '').includes(query) ||
      (user.farcasterFid?.toLowerCase() || '').includes(query)
    );
  });

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'mood': return '😊';
      case 'achievement': return '🏆';
      case 'milestone': return '🎉';
      case 'admin': return '👨‍💼';
      case 'system':
      default: return '🤖';
    }
  };

  const getMessageColor = (type: string) => {
    switch (type) {
      case 'mood': return 'bg-blue-50 border-blue-200';
      case 'achievement': return 'bg-green-50 border-green-200';
      case 'milestone': return 'bg-purple-50 border-purple-200';
      case 'admin': return 'bg-yellow-50 border-yellow-200';
      case 'system':
      default: return 'bg-gray-50 border-gray-200';
    }
  };

  // Not connected
  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 shadow-lg max-w-md w-full text-center">
          <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">🔐</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">Admin Access Required</h1>
          <p className="text-gray-600 mb-6">
            Please connect your wallet to access the admin interface
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  // Not admin
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 shadow-lg max-w-md w-full text-center">
          <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">⛔</span>
          </div>
          <h1 className="text-2xl font-bold mb-2">Access Denied</h1>
          <p className="text-gray-600 mb-2">
            Your wallet address is not authorized to access the admin interface.
          </p>
          <p className="text-sm text-gray-500 mb-6 font-mono break-all">
            {address}
          </p>
          <button
            onClick={() => window.location.href = '/'}
            className="px-6 py-3 bg-blue-600 text-white rounded-xl font-semibold hover:bg-blue-700 transition-colors"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  // Admin interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-3xl p-6 shadow-lg mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
              <p className="text-gray-600">Community Management & User Analytics</p>
            </div>
            <button
              onClick={() => window.location.href = '/'}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-colors"
            >
              ← Back to App
            </button>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 border-t pt-4">
            <button
              onClick={() => setActiveTab('messages')}
              className={`px-6 py-2.5 rounded-xl font-semibold transition-all ${
                activeTab === 'messages'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              💬 Messages
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-6 py-2.5 rounded-xl font-semibold transition-all ${
                activeTab === 'users'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              👥 Users ({users.length})
            </button>
          </div>
        </div>

        {/* Messages Tab */}
        {activeTab === 'messages' && (
          <>
          <div className="grid lg:grid-cols-2 gap-6">
            {/* Send Message Form */}
            <div className="bg-white rounded-3xl p-6 shadow-lg">
            <h2 className="text-xl font-bold mb-4">Send Message to Community</h2>
            
            <form onSubmit={handleSendMessage} className="space-y-4">
              {/* Message Type */}
              <div>
                <label className="block text-sm font-semibold mb-2 text-gray-700">
                  Message Type
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setMessageType('admin')}
                    className={`p-3 rounded-xl font-medium transition-all ${
                      messageType === 'admin'
                        ? 'bg-yellow-100 border-2 border-yellow-400 text-yellow-800'
                        : 'bg-gray-100 border-2 border-gray-200 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    👨‍💼 Admin
                  </button>
                  <button
                    type="button"
                    onClick={() => setMessageType('milestone')}
                    className={`p-3 rounded-xl font-medium transition-all ${
                      messageType === 'milestone'
                        ? 'bg-purple-100 border-2 border-purple-400 text-purple-800'
                        : 'bg-gray-100 border-2 border-gray-200 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    🎉 Milestone
                  </button>
                  <button
                    type="button"
                    onClick={() => setMessageType('system')}
                    className={`p-3 rounded-xl font-medium transition-all ${
                      messageType === 'system'
                        ? 'bg-gray-200 border-2 border-gray-400 text-gray-800'
                        : 'bg-gray-100 border-2 border-gray-200 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    🤖 System
                  </button>
                </div>
              </div>

              {/* Message Content */}
              <div>
                <label htmlFor="message" className="block text-sm font-semibold mb-2 text-gray-700">
                  Message Content
                </label>
                <textarea
                  id="message"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Enter your message to the community..."
                  rows={6}
                  className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl px-4 py-3 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                />
                <p className="text-xs text-gray-500 mt-2">
                  {newMessage.length} characters
                </p>
              </div>

              {/* Success Message */}
              {success && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-xl">
                  <p className="text-sm text-green-600 font-medium text-center">
                    ✓ {success}
                  </p>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-sm text-red-600 text-center">{error}</p>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading || !newMessage.trim()}
                className="w-full bg-blue-600 text-white rounded-xl px-6 py-4 font-semibold hover:bg-blue-700 active:bg-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Sending...</span>
                  </span>
                ) : (
                  '📤 Send Message'
                )}
              </button>
            </form>
          </div>

          {/* Recent Messages */}
          <div className="bg-white rounded-3xl p-6 shadow-lg">
            <h2 className="text-xl font-bold mb-4">Recent Messages ({messages.length})</h2>
            
            <div className="h-[500px] overflow-y-auto space-y-3 pr-2">
              {messages.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl">💬</span>
                  </div>
                  <p className="text-gray-500">No messages yet</p>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`border rounded-xl p-4 ${getMessageColor(message.type)}`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl flex-shrink-0">{getMessageIcon(message.type)}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="font-medium capitalize text-sm">
                            {message.type}
                          </span>
                          <span className="text-xs text-gray-500 flex-shrink-0">
                            {formatTime(message.createdAt)}
                          </span>
                        </div>
                        <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">
                          {message.content}
                        </p>
                        {/* Delete button for admin/system messages */}
                        {(message.type === 'admin' || message.type === 'system' || message.type === 'milestone') && (
                          <button
                            onClick={() => handleDeleteMessage(message.id)}
                            className="mt-2 text-xs text-red-600 hover:text-red-700 font-medium"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid sm:grid-cols-3 gap-4 mt-6">
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">👨‍💼</span>
              <span className="text-sm text-gray-600 font-medium">Admin Posts</span>
            </div>
            <p className="text-3xl font-bold text-blue-600">
              {messages.filter(m => m.type === 'admin').length}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">🎉</span>
              <span className="text-sm text-gray-600 font-medium">Milestones</span>
            </div>
            <p className="text-3xl font-bold text-purple-600">
              {messages.filter(m => m.type === 'milestone').length}
            </p>
          </div>
          <div className="bg-white rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-3 mb-2">
              <span className="text-2xl">💬</span>
              <span className="text-sm text-gray-600 font-medium">Total Messages</span>
            </div>
            <p className="text-3xl font-bold text-gray-800">
              {messages.length}
            </p>
          </div>
        </div>
        </>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-3xl p-6 shadow-lg mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">User Management</h2>
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  placeholder="Search by wallet, username, or FID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="px-4 py-2 border-2 border-gray-200 rounded-xl focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none w-80"
                />
              </div>
            </div>

            {/* User Stats Cards */}
            <div className="grid sm:grid-cols-4 gap-4 mb-6">
              <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4 border border-blue-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">👥</span>
                  <span className="text-sm text-gray-700 font-medium">Total Users</span>
                </div>
                <p className="text-3xl font-bold text-blue-600">{users.length}</p>
              </div>
              <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-4 border border-green-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">📝</span>
                  <span className="text-sm text-gray-700 font-medium">Total Journals</span>
                </div>
                <p className="text-3xl font-bold text-green-600">
                  {users.reduce((sum, u) => sum + (u._count?.journals || 0), 0)}
                </p>
              </div>
              <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-4 border border-purple-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">😊</span>
                  <span className="text-sm text-gray-700 font-medium">Total Moods</span>
                </div>
                <p className="text-3xl font-bold text-purple-600">
                  {users.reduce((sum, u) => sum + (u._count?.MoodLog || 0), 0)}
                </p>
              </div>
              <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-2xl p-4 border border-orange-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">🧘</span>
                  <span className="text-sm text-gray-700 font-medium">Total Meditations</span>
                </div>
                <p className="text-3xl font-bold text-orange-600">
                  {users.reduce((sum, u) => sum + (u._count?.meditations || 0), 0)}
                </p>
              </div>
            </div>

            {/* Users Table */}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-gray-200">
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">User</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Wallet</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Points</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Journals</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Moods</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Meditations</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">NFTs</th>
                    <th className="text-center py-3 px-4 font-semibold text-gray-700">Streaks</th>
                    <th className="text-left py-3 px-4 font-semibold text-gray-700">Joined</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="text-center py-12 text-gray-500">
                        {searchQuery ? 'No users found matching your search' : 'No users yet'}
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((user) => (
                      <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            {user.profileImage ? (
                              <img
                                src={user.profileImage}
                                alt={user.username || 'User'}
                                className="w-10 h-10 rounded-full"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                                {user.username?.[0]?.toUpperCase() || '?'}
                              </div>
                            )}
                            <div>
                              <p className="font-semibold text-gray-800">
                                {user.username || 'Anonymous'}
                              </p>
                              {user.farcasterFid && (
                                <p className="text-xs text-gray-500">FID: {user.farcasterFid}</p>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                            {truncateAddress(user.walletAddress)}
                          </code>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="inline-flex items-center gap-1 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-semibold">
                            ⭐ {user.points}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="text-gray-700 font-medium">{user._count?.journals || 0}</span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="text-gray-700 font-medium">{user._count?.MoodLog || 0}</span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="text-gray-700 font-medium">{user._count?.meditations || 0}</span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded-full text-sm font-medium">
                            🏆 {user._count?.NFTAchievement || 0}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-center">
                          <div className="flex flex-col gap-1">
                            <span className="text-xs text-gray-600">
                              📝 {user.journalStreak}d
                            </span>
                            <span className="text-xs text-gray-600">
                              🧘 {user.meditationStreak}d
                            </span>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-sm text-gray-600">
                          {formatDate(user.createdAt)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {searchQuery && (
              <p className="text-sm text-gray-500 mt-4 text-center">
                Showing {filteredUsers.length} of {users.length} users
              </p>
            )}
          </div>
        )}

        {/* Admin Info */}
        <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 mt-6">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="flex-1">
              <p className="text-sm text-blue-900 font-medium mb-1">Admin Information</p>
              <p className="text-xs text-blue-700 leading-relaxed">
                You are logged in as an admin. Messages you send will be visible to all users in the community chat room. 
                Use this interface responsibly to communicate important updates, milestones, and system announcements.
              </p>
              <p className="text-xs text-blue-600 mt-2 font-mono break-all">
                Connected: {address}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
