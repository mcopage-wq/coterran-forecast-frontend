'use client';
import { useState, useEffect } from 'react';
import { Calendar, Users, Plus, LogOut, Award, AlertCircle, BarChart3, User, Settings, Trophy, HelpCircle, MessageSquare, Edit, Clock } from 'lucide-react';

const API_URL = 'https://coterran-forecast-production.up.railway.app/api';

type User = {
  id: string;
  email: string;
  full_name: string;
  organization: string;
  is_admin: boolean;
  use_anonymous: boolean;
  display_name?: string;
};

type Market = {
  id: string;
  question: string;
  description: string;
  category: string;
  close_date: string;
  status: string;
  outcome?: number | string;
  resolution_source?: string;
  resolution_criteria: string;
  data_source?: string;
  prediction_count: number;
  median_prediction?: number | string;
  mean_prediction?: number | string;
  created_by?: string;
  creator_name?: string;
  comment_count?: number;
};

type Prediction = {
  id: string;
  prediction: number | string;
  confidence: string;
  reasoning: string;
  created_at: string;
  updated_at?: string;
  predictor_name: string;
  is_mine: boolean;
  update_history?: PredictionUpdate[];
};

type PredictionUpdate = {
  id: string;
  old_prediction: number;
  new_prediction: number;
  reasoning: string;
  sources?: string;
  updated_at: string;
};

type Comment = {
  id: string;
  market_id: string;
  user_id: string;
  author_name: string;
  content: string;
  created_at: string;
  parent_id?: string;
  replies?: Comment[];
};

type LeaderboardEntry = {
  user_id: string;
  display_name: string;
  total_predictions: number;
  resolved_predictions: number;
  average_accuracy: number;
  brier_score: number;
  rank: number;
};

type PendingUser = {
  id: string;
  email: string;
  full_name: string;
  organization: string;
  expertise_area?: string;
  bio?: string;
  created_at: string;
};

type PendingMarket = {
  id: string;
  question: string;
  description: string;
  category: string;
  close_date: string;
  data_source?: string;
  resolution_criteria: string;
  created_by: string;
  creator_name: string;
  created_at: string;
};

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [view, setView] = useState<'markets' | 'create' | 'detail' | 'admin' | 'profile' | 'leaderboard' | 'support'>('markets');
  const [markets, setMarkets] = useState<Market[]>([]);
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [pendingMarkets, setPendingMarkets] = useState<PendingMarket[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [showRegister, setShowRegister] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [registerData, setRegisterData] = useState({
    email: '',
    password: '',
    fullName: '',
    organization: '',
    expertiseArea: '',
    bio: ''
  });
  const [loading, setLoading] = useState(false);
  const [predictionValue, setPredictionValue] = useState(50);
  const [confidence, setConfidence] = useState('medium');
  const [reasoning, setReasoning] = useState('');
  const [newMarket, setNewMarket] = useState({
    question: '',
    description: '',
    category: 'Temperature',
    closeDate: '',
    dataSource: '',
    resolutionCriteria: '',
    resolutionType: 'quantitative'
  });
  const [resolutionData, setResolutionData] = useState({
    outcome: '',
    resolutionSource: '',
    resolutionNotes: ''
  });
  const [profileSettings, setProfileSettings] = useState({
    useAnonymous: false,
    displayName: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordResetEmail, setPasswordResetEmail] = useState('');
  const [commentText, setCommentText] = useState('');
  const [replyToCommentId, setReplyToCommentId] = useState<string | null>(null);
  const [updatePrediction, setUpdatePrediction] = useState({
    show: false,
    newValue: 50,
    reasoning: '',
    sources: ''
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchCurrentUser(token);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (user) {
      fetchMarkets();
      if (view === 'leaderboard') {
        fetchLeaderboard();
      }
    }
  }, [user, view]);

  async function fetchCurrentUser(token: string) {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setProfileSettings({
          ...profileSettings,
          useAnonymous: data.user.use_anonymous || false,
          displayName: data.user.display_name || ''
        });
      }
    } catch (err) {
      console.error('Failed to fetch user', err);
    }
  }

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })
    .then(response => {
      if (!response.ok) {
        return response.json().then(data => {
          throw new Error(data.error || 'Login failed');
        });
      }
      return response.json();
    })
    .then(data => {
      localStorage.setItem('token', data.token);
      setUser(data.user);
    })
    .catch(err => {
      setError(err.message);
    });
  }

  function handleLogout() {
    localStorage.removeItem('token');
    setUser(null);
    setView('markets');
  }

  function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    fetch(`${API_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registerData)
    })
    .then(response => {
      if (!response.ok) {
        return response.json().then(data => {
          throw new Error(data.error || 'Registration failed');
        });
      }
      return response.json();
    })
    .then(() => {
      setRegisterData({
        email: '',
        password: '',
        fullName: '',
        organization: '',
        expertiseArea: '',
        bio: ''
      });
      setShowRegister(false);
      setSuccessMessage('Registration successful! Your account is pending approval from an administrator.');
    })
    .catch(err => {
      setError(err.message);
    });
  }

  async function handlePasswordReset(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const response = await fetch(`${API_URL}/auth/reset-password-request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: passwordResetEmail })
      });
      if (response.ok) {
        setSuccessMessage('Password reset link sent to your email!');
        setPasswordResetEmail('');
        setShowPasswordReset(false);
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to send reset email');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send reset email');
    }
  }

  async function handleUpdateProfile(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    try {
      const response = await fetch(`${API_URL}/users/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          useAnonymous: profileSettings.useAnonymous,
          displayName: profileSettings.displayName
        })
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setSuccessMessage('Profile updated successfully!');
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (profileSettings.newPassword !== profileSettings.confirmPassword) {
      setError('New passwords do not match');
      return;
    }
    try {
      const response = await fetch(`${API_URL}/users/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          currentPassword: profileSettings.currentPassword,
          newPassword: profileSettings.newPassword
        })
      });
      if (response.ok) {
        setSuccessMessage('Password changed successfully!');
        setProfileSettings({
          ...profileSettings,
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } else {
        const data = await response.json();
        throw new Error(data.error || 'Failed to change password');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
    }
  }

  async function fetchPendingUsers() {
    try {
      const response = await fetch(`${API_URL}/admin/users/pending`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setPendingUsers(data.users);
      }
    } catch (err) {
      console.error('Failed to fetch pending users', err);
    }
  }

  async function fetchPendingMarkets() {
    try {
      const response = await fetch(`${API_URL}/admin/markets/pending`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setPendingMarkets(data.markets);
      }
    } catch (err) {
      console.error('Failed to fetch pending markets', err);
    }
  }

  async function approveUser(userId: string) {
    try {
      const response = await fetch(`${API_URL}/admin/users/${userId}/approve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        fetchPendingUsers();
        setSuccessMessage('User approved successfully!');
      }
    } catch (err) {
      console.error('Failed to approve user', err);
    }
  }

  async function approveMarket(marketId: string, updatedData?: any) {
    try {
      const response = await fetch(`${API_URL}/admin/markets/${marketId}/approve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(updatedData || {})
      });
      if (response.ok) {
        fetchPendingMarkets();
        fetchMarkets();
        setSuccessMessage('Market approved successfully!');
      }
    } catch (err) {
      console.error('Failed to approve market', err);
    }
  }

  async function rejectMarket(marketId: string, reason?: string) {
    try {
      const response = await fetch(`${API_URL}/admin/markets/${marketId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ reason })
      });
      if (response.ok) {
        fetchPendingMarkets();
        setSuccessMessage('Market rejected');
      }
    } catch (err) {
      console.error('Failed to reject market', err);
    }
  }

  async function fetchMarkets() {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/markets`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setMarkets(data.markets);
      }
    } catch (err) {
      console.error('Failed to fetch markets', err);
    }
    setLoading(false);
  }

  async function fetchMarketDetail(marketId: string) {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/markets/${marketId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSelectedMarket(data.market);
        setPredictions(data.predictions);
        setView('detail');
        fetchComments(marketId);
      }
    } catch (err) {
      console.error('Failed to fetch market detail', err);
    }
    setLoading(false);
  }

  async function fetchComments(marketId: string) {
    try {
      const response = await fetch(`${API_URL}/markets/${marketId}/comments`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setComments(data.comments);
      }
    } catch (err) {
      console.error('Failed to fetch comments', err);
    }
  }

  async function handlePostComment(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedMarket || !commentText.trim()) return;
    
    try {
      const response = await fetch(`${API_URL}/markets/${selectedMarket.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          content: commentText,
          parentId: replyToCommentId
        })
      });
      if (response.ok) {
        setCommentText('');
        setReplyToCommentId(null);
        fetchComments(selectedMarket.id);
      }
    } catch (err) {
      console.error('Failed to post comment', err);
    }
  }

  async function fetchLeaderboard() {
    try {
      const response = await fetch(`${API_URL}/leaderboard`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data.leaderboard);
      }
    } catch (err) {
      console.error('Failed to fetch leaderboard', err);
    }
  }

  function handleCreateMarket(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    const endpoint = user?.is_admin ? `${API_URL}/markets` : `${API_URL}/markets/propose`;
    
    fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        question: newMarket.question,
        description: newMarket.description,
        category: newMarket.category,
        closeDate: newMarket.closeDate,
        dataSource: newMarket.dataSource,
        resolutionCriteria: newMarket.resolutionCriteria
      })
    })
    .then(response => {
      if (!response.ok) {
        return response.json().then(data => {
          throw new Error(data.error || 'Failed to create market');
        });
      }
      return response.json();
    })
    .then(() => {
      setNewMarket({
        question: '',
        description: '',
        category: 'Temperature',
        closeDate: '',
        dataSource: '',
        resolutionCriteria: '',
        resolutionType: 'quantitative'
      });
      fetchMarkets();
      if (user?.is_admin) {
        setSuccessMessage('Market created successfully!');
      } else {
        setSuccessMessage('Market proposal submitted! Waiting for admin approval.');
      }
      setView('markets');
    })
    .catch(err => {
      setError(err.message);
    });
  }

  function handleSubmitPrediction(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedMarket) return;
    
    setError('');
    fetch(`${API_URL}/predictions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        marketId: selectedMarket.id,
        prediction: predictionValue,
        confidence: confidence,
        reasoning: reasoning,
        isPublic: true
      })
    })
    .then(response => {
      if (!response.ok) {
        return response.json().then(data => {
          throw new Error(data.error || 'Failed to submit prediction');
        });
      }
      return response.json();
    })
    .then(() => {
      setPredictionValue(50);
      setConfidence('medium');
      setReasoning('');
      setSuccessMessage('Prediction submitted successfully!');
      fetchMarketDetail(selectedMarket.id);
    })
    .catch(err => {
      setError(err.message);
    });
  }

  async function handleUpdatePrediction(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedMarket) return;

    try {
      const response = await fetch(`${API_URL}/predictions/update`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          marketId: selectedMarket.id,
          newPrediction: updatePrediction.newValue,
          reasoning: updatePrediction.reasoning,
          sources: updatePrediction.sources
        })
      });
      if (response.ok) {
        setUpdatePrediction({ show: false, newValue: 50, reasoning: '', sources: '' });
        setSuccessMessage('Prediction updated successfully!');
        fetchMarketDetail(selectedMarket.id);
      }
    } catch (err) {
      console.error('Failed to update prediction', err);
    }
  }

  function handleResolveMarket(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedMarket) return;

    setError('');
    fetch(`${API_URL}/markets/${selectedMarket.id}/resolve`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        outcome: parseFloat(resolutionData.outcome),
        resolutionSource: resolutionData.resolutionSource,
        resolutionNotes: resolutionData.resolutionNotes
      })
    })
    .then(response => {
      if (!response.ok) {
        return response.json().then(data => {
          throw new Error(data.error || 'Failed to resolve market');
        });
      }
      return response.json();
    })
    .then(() => {
      setResolutionData({ outcome: '', resolutionSource: '', resolutionNotes: '' });
      setSuccessMessage('Market resolved successfully!');
      fetchMarketDetail(selectedMarket.id);
    })
    .catch(err => {
      setError(err.message);
    });
  }

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error || successMessage) {
      const timer = setTimeout(() => {
        setError('');
        setSuccessMessage('');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, successMessage]);

  if (!user) {
    if (showPasswordReset) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
            <div className="text-center mb-8">
              <div className="mb-4">
                <h1 className="text-3xl font-bold text-gray-900 tracking-wide">COTERRAN</h1>
                <p className="text-xs text-gray-600 uppercase tracking-wider mt-1">Climate and Security Advisory</p>
              </div>
              <div className="h-1 w-20 bg-cyan-500 mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold text-gray-800">Reset Password</h2>
              <p className="text-gray-600 text-sm mt-2">Enter your email to receive a reset link</p>
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded flex items-start gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}
            
            <form onSubmit={handlePasswordReset} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                <input
                  type="email"
                  value={passwordResetEmail}
                  onChange={(e) => setPasswordResetEmail(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="your.email@example.com"
                  required
                />
              </div>
              <button
                type="submit"
                className="w-full bg-cyan-500 text-white py-3 rounded hover:bg-cyan-600 transition-colors font-medium"
              >
                Send Reset Link
              </button>
              <button
                type="button"
                onClick={() => setShowPasswordReset(false)}
                className="w-full border-2 border-gray-300 text-gray-700 py-3 rounded hover:bg-gray-50 transition-colors font-medium"
              >
                Back to Login
              </button>
            </form>
          </div>
        </div>
      );
    }

    if (showRegister) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
            <div className="text-center mb-8">
              <div className="mb-4">
                <h1 className="text-3xl font-bold text-gray-900 tracking-wide">COTERRAN</h1>
                <p className="text-xs text-gray-600 uppercase tracking-wider mt-1">Climate and Security Advisory</p>
              </div>
              <div className="h-1 w-20 bg-cyan-500 mx-auto mb-4"></div>
              <h2 className="text-xl font-semibold text-gray-800">Expert Registration</h2>
              <p className="text-gray-600 text-sm mt-2">Apply for platform access</p>
            </div>
            
            {error && (
              <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded flex items-start gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}
            
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                <input
                  type="text"
                  value={registerData.fullName}
                  onChange={(e) => setRegisterData({...registerData, fullName: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="Dr. Jane Smith"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                <input
                  type="email"
                  value={registerData.email}
                  onChange={(e) => setRegisterData({...registerData, email: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="jane.smith@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Password *</label>
                <input
                  type="password"
                  value={registerData.password}
                  onChange={(e) => setRegisterData({...registerData, password: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="Min. 8 characters"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Organization *</label>
                <input
                  type="text"
                  value={registerData.organization}
                  onChange={(e) => setRegisterData({...registerData, organization: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="University of Melbourne"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Expertise Area</label>
                <input
                  type="text"
                  value={registerData.expertiseArea}
                  onChange={(e) => setRegisterData({...registerData, expertiseArea: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="Climate Science, Marine Biology, etc."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bio</label>
                <textarea
                  value={registerData.bio}
                  onChange={(e) => setRegisterData({...registerData, bio: e.target.value})}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="Brief description of your expertise..."
                />
              </div>
              <button
                type="submit"
                className="w-full bg-cyan-500 text-white py-3 rounded hover:bg-cyan-600 transition-colors font-medium"
              >
                Submit Application
              </button>
              <button
                type="button"
                onClick={() => setShowRegister(false)}
                className="w-full border-2 border-gray-300 text-gray-700 py-3 rounded hover:bg-gray-50 transition-colors font-medium"
              >
                Back to Login
              </button>
            </form>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-cyan-400 to-cyan-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-2xl p-8 w-full max-w-md">
          <div className="text-center mb-8">
            <div className="mb-4">
              <h1 className="text-3xl font-bold text-gray-900 tracking-wide">COTERRAN</h1>
              <p className="text-xs text-gray-600 uppercase tracking-wider mt-1">Climate and Security Advisory</p>
            </div>
            <div className="h-1 w-20 bg-cyan-500 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-800">Climate Forecasting Platform</h2>
            <p className="text-gray-600 text-sm mt-2">Expert prediction markets for climate outcomes</p>
          </div>
          
          {error && (
            <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 rounded flex items-start gap-2">
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 border-l-4 border-green-500 text-green-700 rounded flex items-start gap-2">
              <Award className="w-5 h-5 flex-shrink-0" />
              <span className="text-sm">{successMessage}</span>
            </div>
          )}
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder="your.email@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-cyan-500 text-white py-3 rounded hover:bg-cyan-600 transition-colors font-medium"
            >
              Login
            </button>
            <div className="text-center space-y-2">
              <button
                type="button"
                onClick={() => setShowPasswordReset(true)}
                className="text-cyan-600 hover:text-cyan-700 text-sm font-medium block w-full"
              >
                Forgot password?
              </button>
              <button
                type="button"
                onClick={() => setShowRegister(true)}
                className="text-cyan-600 hover:text-cyan-700 text-sm font-medium"
              >
                Don&apos;t have an account? Request Access →
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-black border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-xl font-bold text-white tracking-wide">COTERRAN</h1>
                <p className="text-xs text-gray-400 uppercase tracking-wider">Forecasting Platform</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={() => setView('markets')}
                className={`px-4 py-2 rounded transition-colors text-sm font-medium ${
                  view === 'markets' 
                    ? 'bg-cyan-500 text-white' 
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                <BarChart3 className="w-4 h-4 inline mr-2" />
                Markets
              </button>

              <button
                onClick={() => setView('leaderboard')}
                className={`px-4 py-2 rounded transition-colors text-sm font-medium ${
                  view === 'leaderboard' 
                    ? 'bg-cyan-500 text-white' 
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                <Trophy className="w-4 h-4 inline mr-2" />
                Leaderboard
              </button>

              <button
                onClick={() => setView('create')}
                className={`px-4 py-2 rounded flex items-center gap-2 transition-colors text-sm font-medium ${
                  view === 'create' 
                    ? 'bg-cyan-500 text-white' 
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                <Plus className="w-4 h-4" />
                {user.is_admin ? 'Create' : 'Propose'}
              </button>
              
              {user.is_admin && (
                <button
                  onClick={() => {
                    setView('admin');
                    fetchPendingUsers();
                    fetchPendingMarkets();
                  }}
                  className={`px-4 py-2 rounded flex items-center gap-2 transition-colors text-sm font-medium ${
                    view === 'admin' 
                      ? 'bg-cyan-500 text-white' 
                      : 'text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  Admin
                </button>
              )}

              <button
                onClick={() => setView('support')}
                className={`px-4 py-2 rounded flex items-center gap-2 transition-colors text-sm font-medium ${
                  view === 'support' 
                    ? 'bg-cyan-500 text-white' 
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                <HelpCircle className="w-4 h-4" />
                Support
              </button>
              
              <div className="flex items-center gap-3 pl-4 ml-4 border-l border-gray-700">
                <button
                  onClick={() => setView('profile')}
                  className={`flex items-center gap-2 px-3 py-2 rounded transition-colors ${
                    view === 'profile'
                      ? 'bg-cyan-500 text-white'
                      : 'text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  <User className="w-4 h-4" />
                  <div className="text-left">
                    <p className="text-sm font-medium">{user.full_name}</p>
                    <p className="text-xs">{user.organization}</p>
                  </div>
                </button>
                <button
                  onClick={handleLogout}
                  className="p-2 text-gray-400 hover:bg-gray-800 rounded transition-colors"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 py-6">
        {error && (
          <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded flex items-start gap-2">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 border-l-4 border-green-500 text-green-700 rounded flex items-start gap-2">
            <Award className="w-5 h-5 flex-shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {view === 'profile' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 uppercase tracking-wide">Profile & Settings</h2>
            
            <div className="grid gap-6">
              {/* Profile Info */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Profile Information
                </h3>
                <form onSubmit={handleUpdateProfile} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Display Name</label>
                    <input
                      type="text"
                      value={profileSettings.displayName}
                      onChange={(e) => setProfileSettings({...profileSettings, displayName: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      placeholder="How you appear to others (optional)"
                    />
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      id="useAnonymous"
                      checked={profileSettings.useAnonymous}
                      onChange={(e) => setProfileSettings({...profileSettings, useAnonymous: e.target.checked})}
                      className="w-4 h-4 text-cyan-500 focus:ring-cyan-500"
                    />
                    <label htmlFor="useAnonymous" className="text-sm text-gray-700">
                      Use anonymous username for predictions (hides your name)
                    </label>
                  </div>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600 transition-colors"
                  >
                    Update Profile
                  </button>
                </form>
              </div>

              {/* Security Settings */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Security Settings
                </h3>
                <form onSubmit={handleChangePassword} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                    <input
                      type="password"
                      value={profileSettings.currentPassword}
                      onChange={(e) => setProfileSettings({...profileSettings, currentPassword: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                    <input
                      type="password"
                      value={profileSettings.newPassword}
                      onChange={(e) => setProfileSettings({...profileSettings, newPassword: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                    <input
                      type="password"
                      value={profileSettings.confirmPassword}
                      onChange={(e) => setProfileSettings({...profileSettings, confirmPassword: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600 transition-colors"
                  >
                    Change Password
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        {view === 'leaderboard' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 uppercase tracking-wide flex items-center gap-2">
              <Trophy className="w-7 h-7 text-yellow-500" />
              Forecaster Leaderboard
            </h2>
            <p className="text-gray-600 mb-6">Rankings based on prediction accuracy on resolved markets</p>

            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Rank</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Forecaster</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Predictions</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Resolved</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Accuracy</th>
                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Brier Score</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {leaderboard.map((entry, index) => (
                    <tr key={entry.user_id} className={entry.user_id === user.id ? 'bg-cyan-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {index < 3 && (
                            <Trophy className={`w-5 h-5 mr-2 ${
                              index === 0 ? 'text-yellow-500' : 
                              index === 1 ? 'text-gray-400' : 
                              'text-orange-600'
                            }`} />
                          )}
                          <span className="text-sm font-bold text-gray-900">{entry.rank}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm font-medium text-gray-900">{entry.display_name}</span>
                        {entry.user_id === user.id && (
                          <span className="ml-2 text-xs text-cyan-600">(You)</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{entry.total_predictions}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{entry.resolved_predictions}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-cyan-600">
                        {entry.average_accuracy ? `${(entry.average_accuracy * 100).toFixed(1)}%` : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {entry.brier_score ? entry.brier_score.toFixed(3) : 'N/A'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {leaderboard.length === 0 && (
                <div className="text-center py-12">
                  <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No leaderboard data yet. Start making predictions!</p>
                </div>
              )}
            </div>

            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-bold text-gray-900 mb-2 text-sm">How Rankings Work</h4>
              <ul className="text-sm text-gray-700 space-y-1">
                <li>• <strong>Brier Score</strong>: Lower is better (0 = perfect, 1 = worst). Measures forecast accuracy.</li>
                <li>• <strong>Accuracy</strong>: How close your predictions are to actual outcomes.</li>
                <li>• Only resolved markets count towards rankings.</li>
              </ul>
            </div>
          </div>
        )}

        {view === 'support' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 uppercase tracking-wide flex items-center gap-2">
              <HelpCircle className="w-7 h-7" />
              Support & Help
            </h2>

            <div className="grid gap-6">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Need Assistance?</h3>
                <p className="text-gray-600 mb-4">
                  If you have questions, issues, or feedback about the Climate Forecasting Platform, please reach out to our support team.
                </p>
                
                <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4 mb-4">
                  <p className="text-sm font-medium text-gray-900 mb-2">Contact Support:</p>
                  <a 
                    href="mailto:admin@coterran.co" 
                    className="text-cyan-600 hover:text-cyan-700 font-medium"
                  >
                    admin@coterran.co
                  </a>
                </div>

                <h4 className="font-bold text-gray-900 mb-2 text-sm">Common Questions</h4>
                <div className="space-y-3">
                  <div className="border-l-4 border-gray-300 pl-4">
                    <p className="font-medium text-gray-900 text-sm">How do I submit a prediction?</p>
                    <p className="text-sm text-gray-600">Navigate to any open market and use the prediction slider to set your forecast, then click Submit Prediction.</p>
                  </div>
                  <div className="border-l-4 border-gray-300 pl-4">
                    <p className="font-medium text-gray-900 text-sm">Can I update my predictions?</p>
                    <p className="text-sm text-gray-600">Yes! On any market where you&apos;ve made a prediction, click &quot;Update Prediction&quot; to revise your forecast with new reasoning.</p>
                  </div>
                  <div className="border-l-4 border-gray-300 pl-4">
                    <p className="font-medium text-gray-900 text-sm">How are markets resolved?</p>
                    <p className="text-sm text-gray-600">Admins resolve markets using the specified data sources and resolution criteria. You&apos;ll see the outcome once resolved.</p>
                  </div>
                  <div className="border-l-4 border-gray-300 pl-4">
                    <p className="font-medium text-gray-900 text-sm">What is the leaderboard based on?</p>
                    <p className="text-sm text-gray-600">Rankings are calculated using Brier scores on resolved markets, measuring how accurate your predictions were.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Markets, Create, Detail, and Admin views remain largely the same but with updates for new features */}
        {/* I'll include the key updated sections */}

        {view === 'markets' && (
          <div>
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Climate Prediction Markets</h2>
              <p className="text-gray-600">Submit expert forecasts on climate outcomes and track consensus predictions</p>
            </div>

            {loading ? (
              <div className="text-center py-12">
                <div className="inline-block w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
              </div>
            ) : markets.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-600 mb-4">No markets available yet.</p>
                <button
                  onClick={() => setView('create')}
                  className="px-6 py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600 transition-colors"
                >
                  {user.is_admin ? 'Create First Market' : 'Propose First Market'}
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {markets.map((market) => (
                  <div
                    key={market.id}
                    onClick={() => fetchMarketDetail(market.id)}
                    className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg hover:border-cyan-300 transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <span className={`px-3 py-1 rounded text-xs font-bold uppercase tracking-wide ${
                        market.status === 'open' 
                          ? 'bg-cyan-100 text-cyan-700' 
                          : market.status === 'resolved'
                          ? 'bg-gray-100 text-gray-700'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {market.status}
                      </span>
                      <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                        {market.category}
                      </span>
                      {market.creator_name && (
                        <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded text-xs">
                          Created by {market.creator_name}
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{market.question}</h3>
                    <p className="text-gray-600 text-sm mb-4">{market.description}</p>
                    
                    <div className="grid grid-cols-4 gap-4 pt-4 border-t border-gray-100">
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Predictions</p>
                        <p className="font-bold text-gray-900 flex items-center gap-1">
                          <Users className="w-4 h-4 text-cyan-500" />
                          {market.prediction_count}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Consensus</p>
                        <p className="font-bold text-cyan-600">
                          {market.median_prediction ? `${Number(market.median_prediction).toFixed(0)}%` : 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Comments</p>
                        <p className="font-bold text-gray-900 flex items-center gap-1">
                          <MessageSquare className="w-4 h-4 text-cyan-500" />
                          {market.comment_count || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Closes</p>
                        <p className="font-bold text-gray-900 flex items-center gap-1 text-sm">
                          <Calendar className="w-4 h-4 text-cyan-500" />
                          {new Date(market.close_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {view === 'detail' && selectedMarket && (
          <div>
            <button 
              onClick={() => setView('markets')} 
              className="mb-4 text-cyan-600 hover:text-cyan-700 font-medium flex items-center gap-1"
            >
              ← Back to Markets
            </button>

            {/* Market details - existing code mostly stays the same */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <span className={`px-3 py-1 rounded text-sm font-bold uppercase tracking-wide ${
                  selectedMarket.status === 'open' 
                    ? 'bg-cyan-100 text-cyan-700' 
                    : 'bg-gray-100 text-gray-700'
                }`}>
                  {selectedMarket.status}
                </span>
                <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-sm font-medium">
                  {selectedMarket.category}
                </span>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">{selectedMarket.question}</h2>
              <p className="text-gray-600 mb-6">{selectedMarket.description}</p>

              {/* Stats grid */}
              <div className="grid grid-cols-2 gap-6 mb-6 p-5 bg-gradient-to-br from-cyan-50 to-white rounded-lg border border-cyan-100">
                <div>
                  <p className="text-sm text-gray-600 uppercase tracking-wide mb-1">Market Closes</p>
                  <p className="font-bold text-gray-900">{new Date(selectedMarket.close_date).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 uppercase tracking-wide mb-1">Total Predictions</p>
                  <p className="font-bold text-gray-900">{selectedMarket.prediction_count}</p>
                </div>
                {selectedMarket.median_prediction !== null && selectedMarket.median_prediction !== undefined && (
                  <>
                    <div>
                      <p className="text-sm text-gray-600 uppercase tracking-wide mb-1">Consensus (Median)</p>
                      <p className="text-3xl font-bold text-cyan-600">{Number(selectedMarket.median_prediction).toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 uppercase tracking-wide mb-1">Mean Prediction</p>
                      <p className="text-3xl font-bold text-gray-700">{Number(selectedMarket.mean_prediction).toFixed(1)}%</p>
                    </div>
                  </>
                )}
              </div>

              <div className="border-t border-gray-200 pt-4">
                <h3 className="font-bold text-gray-900 mb-2 uppercase tracking-wide text-sm">Resolution Criteria</h3>
                <p className="text-gray-600 text-sm mb-3 leading-relaxed">{selectedMarket.resolution_criteria}</p>
                {selectedMarket.data_source && (
                  <div className="mt-3 p-3 bg-gray-50 rounded">
                    <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Data Source</p>
                    <p className="text-sm text-cyan-600 font-medium">{selectedMarket.data_source}</p>
                  </div>
                )}
              </div>

              {selectedMarket.status === 'resolved' && selectedMarket.outcome !== null && (
                <div className="mt-6 p-5 bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg text-white">
                  <div className="flex items-center gap-2 mb-2">
                    <Award className="w-6 h-6" />
                    <h3 className="font-bold text-lg uppercase tracking-wide">Market Resolved</h3>
                  </div>
                  <p className="text-3xl font-bold mb-2">Outcome: {Number(selectedMarket.outcome).toFixed(1)}%</p>
                  {selectedMarket.resolution_source && (
                    <p className="text-sm text-cyan-100">Source: {selectedMarket.resolution_source}</p>
                  )}
                </div>
              )}
            </div>

            {/* Prediction section with update option */}
            {selectedMarket.status === 'open' && (
              <div className="bg-white rounded-lg border border-cyan-200 p-6 mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 uppercase tracking-wide">
                  {predictions.find(p => p.is_mine) ? 'Update Your Prediction' : 'Submit Your Prediction'}
                </h3>
                
                {predictions.find(p => p.is_mine) && !updatePrediction.show && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-blue-600" />
                      <span className="text-sm text-blue-900">You&apos;ve already submitted a prediction for this market</span>
                    </div>
                    <button
                      onClick={() => setUpdatePrediction({ ...updatePrediction, show: true })}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors text-sm flex items-center gap-2"
                    >
                      <Edit className="w-4 h-4" />
                      Update Prediction
                    </button>
                  </div>
                )}

                {(!predictions.find(p => p.is_mine) || updatePrediction.show) && (
                  <form onSubmit={updatePrediction.show ? handleUpdatePrediction : handleSubmitPrediction} className="space-y-5">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                        Probability Forecast: <span className="text-cyan-600">
                          {updatePrediction.show ? updatePrediction.newValue : predictionValue}%
                        </span>
                      </label>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={updatePrediction.show ? updatePrediction.newValue : predictionValue}
                        onChange={(e) => updatePrediction.show 
                          ? setUpdatePrediction({...updatePrediction, newValue: parseInt(e.target.value)})
                          : setPredictionValue(parseInt(e.target.value))
                        }
                        className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                      />
                      <div className="flex justify-between text-xs text-gray-500 mt-2 font-medium">
                        <span>0% (Very Unlikely)</span>
                        <span>50% (Uncertain)</span>
                        <span>100% (Very Likely)</span>
                      </div>
                    </div>

                    {!updatePrediction.show && (
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Confidence Level</label>
                        <select
                          value={confidence}
                          onChange={(e) => setConfidence(e.target.value)}
                          className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        >
                          <option value="low">Low</option>
                          <option value="medium">Medium</option>
                          <option value="high">High</option>
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                        Reasoning {updatePrediction.show && '*'}
                      </label>
                      <textarea
                        value={updatePrediction.show ? updatePrediction.reasoning : reasoning}
                        onChange={(e) => updatePrediction.show 
                          ? setUpdatePrediction({...updatePrediction, reasoning: e.target.value})
                          : setReasoning(e.target.value)
                        }
                        placeholder="Explain your forecast and the factors you considered..."
                        rows={4}
                        className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        required={updatePrediction.show}
                      />
                    </div>

                    {updatePrediction.show && (
                      <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">
                          Sources (Optional)
                        </label>
                        <textarea
                          value={updatePrediction.sources}
                          onChange={(e) => setUpdatePrediction({...updatePrediction, sources: e.target.value})}
                          placeholder="List any sources or data that justify your updated prediction..."
                          rows={2}
                          className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                      </div>
                    )}

                    <div className="flex gap-3">
                      {updatePrediction.show && (
                        <button
                          type="button"
                          onClick={() => setUpdatePrediction({ show: false, newValue: 50, reasoning: '', sources: '' })}
                          className="flex-1 border-2 border-gray-300 text-gray-700 py-3 rounded hover:bg-gray-50 font-bold uppercase tracking-wide transition-colors"
                        >
                          Cancel
                        </button>
                      )}
                      <button
                        type="submit"
                        className="flex-1 bg-cyan-500 text-white py-3 rounded hover:bg-cyan-600 font-bold uppercase tracking-wide transition-colors"
                      >
                        {updatePrediction.show ? 'Update Prediction' : 'Submit Prediction'}
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {/* Predictions list */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 uppercase tracking-wide">Expert Predictions</h3>
              {predictions.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No predictions yet. Be the first to forecast!</p>
              ) : (
                <div className="space-y-3">
                  {predictions.map((pred) => (
                    <div 
                      key={pred.id} 
                      className={`p-4 rounded-lg border-l-4 ${
                        pred.is_mine 
                          ? 'bg-cyan-50 border-cyan-500' 
                          : 'bg-gray-50 border-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="font-bold text-gray-900">{pred.predictor_name}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(pred.created_at).toLocaleString()}
                            {pred.updated_at && pred.updated_at !== pred.created_at && (
                              <span className="ml-2 text-blue-600">(Updated)</span>
                            )}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-cyan-600">{Number(pred.prediction).toFixed(0)}%</p>
                          <p className="text-xs text-gray-600 uppercase tracking-wide">{pred.confidence}</p>
                        </div>
                      </div>
                      {pred.reasoning && (
                        <p className="text-sm text-gray-700 mt-3 leading-relaxed">{pred.reasoning}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Comments section */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 uppercase tracking-wide flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Discussion ({comments.length})
              </h3>
              
              <form onSubmit={handlePostComment} className="mb-6">
                <textarea
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder={replyToCommentId ? "Write a reply..." : "Share your thoughts on this market..."}
                  rows={3}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500 mb-2"
                />
                <div className="flex gap-2">
                  {replyToCommentId && (
                    <button
                      type="button"
                      onClick={() => setReplyToCommentId(null)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
                    >
                      Cancel Reply
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-4 py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600 transition-colors"
                  >
                    {replyToCommentId ? 'Post Reply' : 'Post Comment'}
                  </button>
                </div>
              </form>

              <div className="space-y-4">
                {comments.filter(c => !c.parent_id).map((comment) => (
                  <div key={comment.id} className="border-l-2 border-gray-200 pl-4">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium text-gray-900">{comment.author_name}</p>
                        <p className="text-xs text-gray-500">{new Date(comment.created_at).toLocaleString()}</p>
                      </div>
                      <button
                        onClick={() => setReplyToCommentId(comment.id)}
                        className="text-xs text-cyan-600 hover:text-cyan-700"
                      >
                        Reply
                      </button>
                    </div>
                    <p className="text-sm text-gray-700">{comment.content}</p>
                    
                    {/* Replies */}
                    {comment.replies && comment.replies.length > 0 && (
                      <div className="mt-3 space-y-3 ml-4">
                        {comment.replies.map((reply) => (
                          <div key={reply.id} className="border-l-2 border-cyan-200 pl-3">
                            <div className="flex items-start justify-between mb-1">
                              <div>
                                <p className="font-medium text-gray-900 text-sm">{reply.author_name}</p>
                                <p className="text-xs text-gray-500">{new Date(reply.created_at).toLocaleString()}</p>
                              </div>
                            </div>
                            <p className="text-sm text-gray-700">{reply.content}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {comments.length === 0 && (
                  <p className="text-gray-500 text-center py-8">No comments yet. Start the discussion!</p>
                )}
              </div>
            </div>

            {/* Admin resolution panel */}
            {user.is_admin && selectedMarket.status === 'open' && (
              <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-bold text-white mb-4 uppercase tracking-wide">Resolve Market (Admin Only)</h3>
                <form onSubmit={handleResolveMarket} className="space-y-4">
                  <input
                    type="number"
                    min="0"
                    max="100"
                    step="0.01"
                    value={resolutionData.outcome}
                    onChange={(e) => setResolutionData({...resolutionData, outcome: e.target.value})}
                    placeholder="Outcome (0-100)"
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  <input
                    type="text"
                    value={resolutionData.resolutionSource}
                    onChange={(e) => setResolutionData({...resolutionData, resolutionSource: e.target.value})}
                    placeholder="Resolution source (e.g., BOM Annual Climate Statement)"
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  <textarea
                    value={resolutionData.resolutionNotes}
                    onChange={(e) => setResolutionData({...resolutionData, resolutionNotes: e.target.value})}
                    placeholder="Resolution notes"
                    rows={3}
                    className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                  <button
                    type="submit"
                    className="w-full bg-cyan-500 text-white py-3 rounded hover:bg-cyan-600 font-bold uppercase tracking-wide transition-colors"
                  >
                    Resolve Market
                  </button>
                </form>
              </div>
            )}
          </div>
        )}

        {view === 'create' && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2 uppercase tracking-wide">
              {user.is_admin ? 'Create New Prediction Market' : 'Propose New Market'}
            </h2>
            {!user.is_admin && (
              <p className="text-gray-600 mb-6">Submit a market proposal for admin review and approval</p>
            )}
            
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <form onSubmit={handleCreateMarket} className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Market Question *</label>
                  <input
                    type="text"
                    value={newMarket.question}
                    onChange={(e) => setNewMarket({...newMarket, question: e.target.value})}
                    placeholder="e.g., Will 2025 be in Australia's top 5 warmest years on record?"
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Description *</label>
                  <textarea
                    value={newMarket.description}
                    onChange={(e) => setNewMarket({...newMarket, description: e.target.value})}
                    placeholder="Provide context and background for this prediction market..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Category *</label>
                    <select
                      value={newMarket.category}
                      onChange={(e) => setNewMarket({...newMarket, category: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      <option>Temperature</option>
                      <option>Rainfall</option>
                      <option>Energy</option>
                      <option>Marine</option>
                      <option>Policy</option>
                      <option>Economics</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Close Date *</label>
                    <input
                      type="datetime-local"
                      value={newMarket.closeDate}
                      onChange={(e) => setNewMarket({...newMarket, closeDate: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Data Source for Resolution *</label>
                  <input
                    type="text"
                    value={newMarket.dataSource}
                    onChange={(e) => setNewMarket({...newMarket, dataSource: e.target.value})}
                    placeholder="e.g., Bureau of Meteorology Annual Climate Statement"
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Specify the authoritative source that will be used to resolve this market</p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Resolution Criteria *</label>
                  <textarea
                    value={newMarket.resolutionCriteria}
                    onChange={(e) => setNewMarket({...newMarket, resolutionCriteria: e.target.value})}
                    placeholder="Describe exactly how this market will be resolved..."
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    required
                  />
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => setView('markets')}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded hover:bg-gray-50 font-bold uppercase tracking-wide transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-cyan-500 text-white rounded hover:bg-cyan-600 font-bold uppercase tracking-wide transition-colors"
                  >
                    {user.is_admin ? 'Create Market' : 'Submit Proposal'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {view === 'admin' && user.is_admin && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 uppercase tracking-wide">Administration</h2>
            
            {/* Pending Users */}
            <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 uppercase tracking-wide">Pending User Approvals</h3>
              
              {pendingUsers.length === 0 ? (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No pending user applications</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingUsers.map((pendingUser) => (
                    <div key={pendingUser.id} className="border border-gray-200 rounded-lg p-4 hover:border-cyan-300 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-bold text-gray-900 mb-1">{pendingUser.full_name}</h4>
                          <p className="text-sm text-gray-600 mb-1">{pendingUser.email}</p>
                          <p className="text-sm text-gray-700 font-medium mb-2">{pendingUser.organization}</p>
                          {pendingUser.expertise_area && (
                            <p className="text-xs text-cyan-600 mb-2">
                              <span className="font-semibold">Expertise:</span> {pendingUser.expertise_area}
                            </p>
                          )}
                          {pendingUser.bio && (
                            <p className="text-sm text-gray-600 mt-2 leading-relaxed">{pendingUser.bio}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-2">
                            Applied: {new Date(pendingUser.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <button
                          onClick={() => approveUser(pendingUser.id)}
                          className="ml-4 px-4 py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600 transition-colors font-medium text-sm"
                        >
                          Approve
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Pending Markets */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 uppercase tracking-wide">Pending Market Proposals</h3>
              
              {pendingMarkets.length === 0 ? (
                <div className="text-center py-8">
                  <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600">No pending market proposals</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingMarkets.map((market) => (
                    <div key={market.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="mb-3">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-bold uppercase">
                            Pending Approval
                          </span>
                          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded text-xs font-medium">
                            {market.category}
                          </span>
                        </div>
                        <h4 className="font-bold text-gray-900 text-lg">{market.question}</h4>
                        <p className="text-sm text-gray-600 mt-2">{market.description}</p>
                      </div>

                      <div className="grid grid-cols-2 gap-4 mb-4 p-3 bg-gray-50 rounded">
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Proposed by</p>
                          <p className="text-sm font-medium text-gray-900">{market.creator_name}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Close Date</p>
                          <p className="text-sm font-medium text-gray-900">{new Date(market.close_date).toLocaleDateString()}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Data Source</p>
                          <p className="text-sm font-medium text-gray-900">{market.data_source}</p>
                        </div>
                        <div className="col-span-2">
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Resolution Criteria</p>
                          <p className="text-sm text-gray-700">{market.resolution_criteria}</p>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <button
                          onClick={() => approveMarket(market.id)}
                          className="flex-1 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors font-medium text-sm"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => {
                            const reason = prompt('Reason for rejection (will be sent to creator):');
                            if (reason) rejectMarket(market.id, reason);
                          }}
                          className="flex-1 px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition-colors font-medium text-sm"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      <footer className="bg-black border-t border-gray-800 mt-12">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">
                <span className="font-bold text-white">COTERRAN</span> Climate and Security Advisory
              </p>
              <p className="text-xs text-gray-500 mt-1">Collaborative research and solutions at the nexus of climate change and security</p>
            </div>
            <a 
              href="https://www.coterran.co" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-cyan-500 hover:text-cyan-400 text-sm font-medium"
            >
              Visit CoTerran.co →
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}