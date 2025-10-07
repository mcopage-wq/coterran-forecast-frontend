'use client';
import { useState, useEffect } from 'react';
import { Calendar, Users, Plus, LogOut, Award, AlertCircle, BarChart3, Home } from 'lucide-react';

const API_URL = 'https://coterran-forecast-production.up.railway.app/api';

const MARKET_CATEGORIES = ['Temperature', 'Rainfall', 'Energy', 'Marine', 'Policy', 'Economics', 'Other'];

type User = {
  id: string;
  email: string;
  full_name: string;
  organization: string;
  is_admin: boolean;
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
};

type Prediction = {
  id: string;
  prediction: number | string;
  confidence: string;
  reasoning: string;
  created_at: string;
  predictor_name: string;
  is_mine: boolean;
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

type LeaderboardEntry = {
  user_id: string;
  user_name: string;
  prediction_count: number;
  brier_score: number;
  avg_confidence: string;
};


export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [view, setView] = useState<'landing' | 'markets' | 'create' | 'detail' | 'admin' | 'category'>('landing');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [showMarketsDropdown, setShowMarketsDropdown] = useState(false);
  const [markets, setMarkets] = useState<Market[]>([]);
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [pendingUsers, setPendingUsers] = useState<PendingUser[]>([]);
  const [showRegister, setShowRegister] = useState(false);
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
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [editingPrediction, setEditingPrediction] = useState<Prediction | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [newMarket, setNewMarket] = useState({
    question: '',
    description: '',
    category: 'Temperature',
    closeDate: '',
    dataSource: '',
    resolutionCriteria: '',
    resolutionType: 'quantitative',
    customCategory: ''
  });
  const [resolutionData, setResolutionData] = useState({
    outcome: '',
    resolutionSource: '',
    resolutionNotes: ''
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchCurrentUser(token);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchMarkets();
      fetchLeaderboard();
    }
  }, [user]);

  useEffect(() => {
    // Clear reasoning when switching markets
    if (view !== 'detail') {
      setReasoning('');
      setPredictionValue(50);
      setConfidence('medium');
      setIsAnonymous(false);
      setEditingPrediction(null);
    }
  }, [selectedMarket, view]);

  async function fetchCurrentUser(token: string) {
    try {
      const response = await fetch(`${API_URL}/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    } catch (err) {
      console.error('Failed to fetch user', err);
    }
  }

  async function fetchLeaderboard() {
    try {
      const response = await fetch(`${API_URL}/leaderboard`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        // Filter out anonymous entries
        const filteredLeaderboard = data.leaderboard?.filter((entry: LeaderboardEntry) => 
          !entry.user_name?.toLowerCase().includes('anonymous')
        ) || [];
        setLeaderboard(filteredLeaderboard);
      }
    } catch (err) {
      console.error('Failed to fetch leaderboard', err);
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
    setView('landing');
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
      setError('Registration successful! Your account is pending approval from an administrator.');
    })
    .catch(err => {
      setError(err.message);
    });
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

  async function approveUser(userId: string) {
    try {
      const response = await fetch(`${API_URL}/admin/users/${userId}/approve`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        fetchPendingUsers();
      }
    } catch (err) {
      console.error('Failed to approve user', err);
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
    // Clear previous prediction form data
    setPredictionValue(50);
    setConfidence('medium');
    setReasoning('');
    setIsAnonymous(false);
    setEditingPrediction(null);
    
    try {
      const response = await fetch(`${API_URL}/markets/${marketId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setSelectedMarket(data.market);
        setPredictions(data.predictions);
        setView('detail');
      }
    } catch (err) {
      console.error('Failed to fetch market detail', err);
    }
    setLoading(false);
  }

  function handleCreateMarket(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    
    const categoryToSend = newMarket.category === 'Other' ? newMarket.customCategory : newMarket.category;
    
    fetch(`${API_URL}/markets`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        question: newMarket.question,
        description: newMarket.description,
        category: categoryToSend,
        closeDate: newMarket.closeDate,
        dataSource: newMarket.dataSource,
        resolutionCriteria: newMarket.resolutionCriteria,
        isAnonymous: isAnonymous
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
        resolutionType: 'quantitative',
        customCategory: ''
      });
      setIsAnonymous(false);
      fetchMarkets();
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
    
    // Check if user already has a prediction (defensive check)
    const existingPrediction = predictions.find(p => p.is_mine);
    const predictionToEdit = editingPrediction || existingPrediction;
    
    const endpoint = predictionToEdit 
      ? `${API_URL}/predictions/${predictionToEdit.id}`
      : `${API_URL}/predictions`;
    const method = predictionToEdit ? 'PUT' : 'POST';
    
    fetch(endpoint, {
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({
        marketId: selectedMarket.id,
        prediction: predictionValue,
        confidence: confidence,
        reasoning: reasoning,
        isPublic: true,
        isAnonymous: isAnonymous
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
      setIsAnonymous(false);
      setEditingPrediction(null);
      fetchMarketDetail(selectedMarket.id);
    })
    .catch(err => {
      setError(err.message);
    });
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
      fetchMarketDetail(selectedMarket.id);
    })
    .catch(err => {
      setError(err.message);
    });
  }

  function handleEditPrediction(prediction: Prediction) {
    setEditingPrediction(prediction);
    setPredictionValue(Number(prediction.prediction));
    setConfidence(prediction.confidence);
    setReasoning(prediction.reasoning || '');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function handleCategoryView(category: string) {
    setSelectedCategory(category);
    setView('category');
    setShowMarketsDropdown(false);
  }

  if (!user) {
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
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name *</label>
                <input
                  type="text"
                  value={registerData.fullName}
                  onChange={(e) => setRegisterData({...registerData, fullName: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  placeholder="Dr. Jane Smith"
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
                onClick={handleRegister}
                className="w-full bg-cyan-500 text-white py-3 rounded hover:bg-cyan-600 transition-colors font-medium"
              >
                Submit Application
              </button>
              <button
                onClick={() => setShowRegister(false)}
                className="w-full border-2 border-gray-300 text-gray-700 py-3 rounded hover:bg-gray-50 transition-colors font-medium"
              >
                Back to Login
              </button>
            </div>
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
          
          <div className="space-y-4">
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
              onClick={handleLogin}
              className="w-full bg-cyan-500 text-white py-3 rounded hover:bg-cyan-600 transition-colors font-medium"
            >
              Login
            </button>
            <div className="text-center mt-4">
              <button
                onClick={() => setShowRegister(true)}
                className="text-cyan-600 hover:text-cyan-700 text-sm font-medium"
              >
                Don&apos;t have an account? Request Access →
              </button>
            </div>
          </div>
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
                onClick={() => setView('landing')}
                className={`px-4 py-2 rounded transition-colors text-sm font-medium ${
                  view === 'landing' 
                    ? 'bg-cyan-500 text-white' 
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                <Home className="w-4 h-4 inline mr-2" />
                Home
              </button>
              
              <div className="relative">
                <button
                  onMouseEnter={() => setShowMarketsDropdown(true)}
                  onMouseLeave={() => setShowMarketsDropdown(false)}
                  onClick={() => setView('markets')}
                  className={`px-4 py-2 rounded transition-colors text-sm font-medium ${
                    view === 'markets' || view === 'category'
                      ? 'bg-cyan-500 text-white' 
                      : 'text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  <BarChart3 className="w-4 h-4 inline mr-2" />
                  Markets
                </button>
                
                {showMarketsDropdown && (
                  <div 
                    className="absolute top-full left-0 mt-1 bg-gray-800 border border-gray-700 rounded shadow-lg min-w-[200px] z-50"
                    onMouseEnter={() => setShowMarketsDropdown(true)}
                    onMouseLeave={() => setShowMarketsDropdown(false)}
                  >
                    <div className="py-2">
                      <button
                        onClick={() => {
                          setView('markets');
                          setShowMarketsDropdown(false);
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                      >
                        All Markets
                      </button>
                      <div className="border-t border-gray-700 my-2"></div>
                      {MARKET_CATEGORIES.filter(cat => cat !== 'Other').map(category => (
                        <button
                          key={category}
                          onClick={() => handleCategoryView(category)}
                          className="w-full text-left px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 hover:text-white"
                        >
                          {category}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {user.is_admin && (
                <>
                  <button
                    onClick={() => setView('create')}
                    className={`px-4 py-2 rounded flex items-center gap-2 transition-colors text-sm font-medium ${
                      view === 'create' 
                        ? 'bg-cyan-500 text-white' 
                        : 'text-gray-300 hover:bg-gray-800'
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                    Create
                  </button>
                  
                  <button
                    onClick={() => {
                      setView('admin');
                      fetchPendingUsers();
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
                </>
              )}
              
              <div className="flex items-center gap-3 pl-4 ml-4 border-l border-gray-700">
                <div className="text-right">
                  <p className="text-sm font-medium text-white">{user.full_name}</p>
                  <p className="text-xs text-gray-400">{user.organization}</p>
                </div>
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

        {view === 'landing' && (
          <div>
            <div className="mb-8 text-center">
              <h2 className="text-3xl font-bold text-gray-900 mb-3">Welcome to COTERRAN Forecasting</h2>
              <p className="text-lg text-gray-600 max-w-3xl mx-auto">
                A collaborative platform for expert climate predictions. Submit forecasts on climate outcomes, 
                track consensus predictions, and contribute to cutting-edge climate and security research.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 uppercase tracking-wide">Active Markets</h3>
                {markets.filter(m => m.status === 'open').slice(0, 5).map(market => (
                  <div
                    key={market.id}
                    onClick={() => fetchMarketDetail(market.id)}
                    className="mb-3 p-3 border-l-4 border-cyan-500 bg-cyan-50 hover:bg-cyan-100 cursor-pointer rounded"
                  >
                    <p className="font-semibold text-gray-900 text-sm">{market.question}</p>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-xs text-gray-600">{market.prediction_count} predictions</span>
                      <span className="text-xs font-bold text-cyan-600">
                        {market.median_prediction ? `${Number(market.median_prediction).toFixed(0)}%` : 'N/A'}
                      </span>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() => setView('markets')}
                  className="mt-4 w-full px-4 py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600 transition-colors text-sm font-medium"
                >
                  View All Markets
                </button>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h3 className="text-xl font-bold text-gray-900 mb-4 uppercase tracking-wide flex items-center gap-2">
                  <Award className="w-5 h-5 text-cyan-500" />
                  Leaderboard
                </h3>
                {leaderboard.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">No leaderboard data yet</p>
                ) : (
                  <div className="space-y-3">
                    {leaderboard.slice(0, 10).map((entry, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div className="flex items-center gap-3">
                          <span className={`w-8 h-8 flex items-center justify-center rounded-full font-bold ${
                            index === 0 ? 'bg-yellow-400 text-yellow-900' :
                            index === 1 ? 'bg-gray-300 text-gray-700' :
                            index === 2 ? 'bg-orange-300 text-orange-900' :
                            'bg-gray-200 text-gray-600'
                          }`}>
                            {index + 1}
                          </span>
                          <span className="font-medium text-gray-900">{entry.user_name}</span>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-cyan-600">{entry.brier_score?.toFixed(3) || 'N/A'}</p>
                          <p className="text-xs text-gray-500">{entry.prediction_count} predictions</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                <p className="mt-4 text-xs text-gray-500 italic">
                  Note: Anonymous predictions do not count towards leaderboard scores
                </p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-cyan-500 to-cyan-600 rounded-lg p-8 text-white">
              <h3 className="text-2xl font-bold mb-4">About COTERRAN Forecasting</h3>
              <p className="text-cyan-50 leading-relaxed mb-4">
                CoTerran&apos;s forecasting platform is intended to build discussion about the probable consequences and impacts of our changing climate. In this initial phase it is focusing on engaging and aggregating views from climate experts. The cumulative accuracy of these forecasts may produce useful insights for policy analysis and adaptation planning. 
              </p>
            </div>
          </div>
        )}

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
                {user.is_admin && (
                  <button
                    onClick={() => setView('create')}
                    className="px-6 py-2 bg-cyan-500 text-white rounded hover:bg-cyan-600 transition-colors"
                  >
                    Create First Market
                  </button>
                )}
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
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{market.question}</h3>
                    <p className="text-gray-600 text-sm mb-4">{market.description}</p>
                    
                    <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
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

        {view === 'category' && (
          <div>
            <div className="mb-6">
              <button 
                onClick={() => setView('markets')} 
                className="mb-4 text-cyan-600 hover:text-cyan-700 font-medium flex items-center gap-1"
              >
                ← Back to All Markets
              </button>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">{selectedCategory} Markets</h2>
              <p className="text-gray-600">Prediction markets in the {selectedCategory} category</p>
            </div>

            <div className="mb-8">
              <h3 className="text-lg font-bold text-gray-900 mb-4 uppercase tracking-wide">Active Markets</h3>
              {markets.filter(m => m.category === selectedCategory && m.status === 'open').length === 0 ? (
                <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
                  <p className="text-gray-600">No active markets in this category</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {markets.filter(m => m.category === selectedCategory && m.status === 'open').map((market) => (
                    <div
                      key={market.id}
                      onClick={() => fetchMarketDetail(market.id)}
                      className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg hover:border-cyan-300 transition-all cursor-pointer"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-3 py-1 rounded text-xs font-bold uppercase tracking-wide bg-cyan-100 text-cyan-700">
                          {market.status}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">{market.question}</h3>
                      <p className="text-gray-600 text-sm mb-4">{market.description}</p>
                      
                      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Predictions</p>
                          <p className="font-bold text-gray-900">{market.prediction_count}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Consensus</p>
                          <p className="font-bold text-cyan-600">
                            {market.median_prediction ? `${Number(market.median_prediction).toFixed(0)}%` : 'N/A'}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Closes</p>
                          <p className="font-bold text-gray-900 text-sm">
                            {new Date(market.close_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4 uppercase tracking-wide">Closed Markets</h3>
              {markets.filter(m => m.category === selectedCategory && m.status !== 'open').length === 0 ? (
                <div className="text-center py-8 bg-white rounded-lg border border-gray-200">
                  <p className="text-gray-600">No closed markets in this category</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {markets.filter(m => m.category === selectedCategory && m.status !== 'open').map((market) => (
                    <div
                      key={market.id}
                      onClick={() => fetchMarketDetail(market.id)}
                      className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-lg hover:border-gray-300 transition-all cursor-pointer opacity-80"
                    >
                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-3 py-1 rounded text-xs font-bold uppercase tracking-wide bg-gray-100 text-gray-700">
                          {market.status}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">{market.question}</h3>
                      <p className="text-gray-600 text-sm mb-4">{market.description}</p>
                      
                      <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Predictions</p>
                          <p className="font-bold text-gray-900">{market.prediction_count}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Final Consensus</p>
                          <p className="font-bold text-gray-600">
                            {market.median_prediction ? `${Number(market.median_prediction).toFixed(0)}%` : 'N/A'}
                          </p>
                        </div>
                        {market.outcome !== null && market.outcome !== undefined && (
                          <div>
                            <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Outcome</p>
                            <p className="font-bold text-cyan-600">{Number(market.outcome).toFixed(1)}%</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
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

            {selectedMarket.status === 'open' && (
              <div className="bg-white rounded-lg border border-cyan-200 p-6 mb-6">
                {(() => {
                  const myExistingPrediction = predictions.find(p => p.is_mine);
                  
                  if (myExistingPrediction && !editingPrediction) {
                    return (
                      <div className="text-center py-8">
                        <div className="mb-6">
                          <div className="inline-block p-4 bg-cyan-50 rounded-full mb-4">
                            <AlertCircle className="w-8 h-8 text-cyan-600" />
                          </div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2">You&apos;ve Already Predicted</h3>
                          <p className="text-gray-600 mb-1">Your current prediction: <span className="font-bold text-cyan-600 text-2xl">{Number(myExistingPrediction.prediction).toFixed(0)}%</span></p>
                          <p className="text-sm text-gray-500">Confidence: {myExistingPrediction.confidence}</p>
                        </div>
                        <button
                          onClick={() => handleEditPrediction(myExistingPrediction)}
                          className="px-8 py-3 bg-cyan-500 text-white rounded hover:bg-cyan-600 font-bold uppercase tracking-wide transition-colors"
                        >
                          Update Your Prediction
                        </button>
                      </div>
                    );
                  }
                  
                  return (
                    <>
                      <h3 className="text-lg font-bold text-gray-900 mb-4 uppercase tracking-wide">
                        {editingPrediction ? 'Update Your Prediction' : 'Submit Your Prediction'}
                      </h3>
                      {editingPrediction && (
                        <div className="mb-4 p-3 bg-cyan-50 border-l-4 border-cyan-500 text-cyan-700 rounded flex items-start gap-2">
                          <AlertCircle className="w-5 h-5 flex-shrink-0" />
                          <div>
                            <p className="font-semibold">Editing your prediction</p>
                            <button
                              onClick={() => {
                                setEditingPrediction(null);
                                setPredictionValue(50);
                                setConfidence('medium');
                                setReasoning('');
                                setIsAnonymous(false);
                              }}
                              className="text-sm underline mt-1"
                            >
                              Cancel edit
                            </button>
                          </div>
                        </div>
                      )}
                      <div className="space-y-5">
                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-3 uppercase tracking-wide">
                            Probability Forecast: <span className="text-cyan-600">{predictionValue}%</span>
                          </label>
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={predictionValue}
                            onChange={(e) => setPredictionValue(parseInt(e.target.value))}
                            className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                          />
                          <div className="flex justify-between text-xs text-gray-500 mt-2 font-medium">
                            <span>0% (Very Unlikely)</span>
                            <span>50% (Uncertain)</span>
                            <span>100% (Very Likely)</span>
                          </div>
                        </div>

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

                        <div>
                          <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Reasoning (Optional)</label>
                          <textarea
                            value={reasoning}
                            onChange={(e) => setReasoning(e.target.value)}
                            placeholder="Explain your forecast and the factors you considered..."
                            rows={4}
                            className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500"
                          />
                        </div>

                        <div className="border-t border-gray-200 pt-4">
                          <label className="flex items-center gap-3 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isAnonymous}
                              onChange={(e) => setIsAnonymous(e.target.checked)}
                              className="w-5 h-5 text-cyan-500 border-gray-300 rounded focus:ring-cyan-500"
                            />
                            <span className="text-sm font-medium text-gray-700">Submit anonymously</span>
                          </label>
                          <p className="text-xs text-gray-500 mt-2 ml-8">
                            Anonymous predictions will not count towards your leaderboard score or public profile
                          </p>
                        </div>

                        <button
                          onClick={handleSubmitPrediction}
                          className="w-full bg-cyan-500 text-white py-3 rounded hover:bg-cyan-600 font-bold uppercase tracking-wide transition-colors"
                        >
                          {editingPrediction ? 'Update Prediction' : 'Submit Prediction'}
                        </button>
                      </div>
                    </>
                  );
                })()}
              </div>
            )}

            <div className="bg-white rounded-lg border border-gray-200 p-6">
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
                        <div className="flex-1">
                          <p className="font-bold text-gray-900">{pred.predictor_name}</p>
                          <p className="text-xs text-gray-500">{new Date(pred.created_at).toLocaleString()}</p>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="text-right">
                            <p className="text-2xl font-bold text-cyan-600">{Number(pred.prediction).toFixed(0)}%</p>
                            <p className="text-xs text-gray-600 uppercase tracking-wide">{pred.confidence}</p>
                          </div>
                          {pred.is_mine && selectedMarket.status === 'open' && (
                            <button
                              onClick={() => handleEditPrediction(pred)}
                              className="px-3 py-1 text-xs bg-cyan-500 text-white rounded hover:bg-cyan-600 transition-colors font-medium"
                            >
                              Edit
                            </button>
                          )}
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

            {user.is_admin && selectedMarket.status === 'open' && (
              <div className="mt-6 bg-gray-900 border border-gray-700 rounded-lg p-6">
                <h3 className="text-lg font-bold text-white mb-4 uppercase tracking-wide">Resolve Market (Admin Only)</h3>
                <div className="space-y-4">
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
                    onClick={handleResolveMarket}
                    className="w-full bg-cyan-500 text-white py-3 rounded hover:bg-cyan-600 font-bold uppercase tracking-wide transition-colors"
                  >
                    Resolve Market
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {view === 'create' && user.is_admin && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 uppercase tracking-wide">Create New Prediction Market</h2>
            
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Market Question *</label>
                  <input
                    type="text"
                    value={newMarket.question}
                    onChange={(e) => setNewMarket({...newMarket, question: e.target.value})}
                    placeholder="e.g., Will 2025 be in Australia's top 5 warmest years on record?"
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Description</label>
                  <textarea
                    value={newMarket.description}
                    onChange={(e) => setNewMarket({...newMarket, description: e.target.value})}
                    placeholder="Provide context and background for this prediction market..."
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500"
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
                      {MARKET_CATEGORIES.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {newMarket.category === 'Other' && (
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Custom Category *</label>
                      <input
                        type="text"
                        value={newMarket.customCategory}
                        onChange={(e) => setNewMarket({...newMarket, customCategory: e.target.value})}
                        placeholder="Enter custom category"
                        className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>
                  )}

                  <div className={newMarket.category === 'Other' ? 'col-span-2' : ''}>
                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Resolution Type *</label>
                    <select
                      value={newMarket.resolutionType}
                      onChange={(e) => setNewMarket({...newMarket, resolutionType: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    >
                      <option value="quantitative">Quantitative (Data-based)</option>
                      <option value="qualitative">Qualitative (Expert Consensus)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Close Date *</label>
                  <input
                    type="datetime-local"
                    value={newMarket.closeDate}
                    onChange={(e) => setNewMarket({...newMarket, closeDate: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                {newMarket.resolutionType === 'quantitative' && (
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Data Source</label>
                    <input
                      type="text"
                      value={newMarket.dataSource}
                      onChange={(e) => setNewMarket({...newMarket, dataSource: e.target.value})}
                      placeholder="e.g., Bureau of Meteorology, AEMO NEM Dashboard"
                      className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2 uppercase tracking-wide">Resolution Criteria *</label>
                  <textarea
                    value={newMarket.resolutionCriteria}
                    onChange={(e) => setNewMarket({...newMarket, resolutionCriteria: e.target.value})}
                    placeholder={
                      newMarket.resolutionType === 'quantitative' 
                        ? "Describe exactly how this market will be resolved using data..."
                        : "Describe how expert consensus will determine the outcome..."
                    }
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  />
                </div>

                <div className="border-t border-gray-200 pt-4">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                      className="w-5 h-5 text-cyan-500 border-gray-300 rounded focus:ring-cyan-500"
                    />
                    <span className="text-sm font-medium text-gray-700">Create anonymously</span>
                  </label>
                  <p className="text-xs text-gray-500 mt-2 ml-8">
                    Anonymous market creation will not count towards your leaderboard score or public profile
                  </p>
                </div>

                <div className="flex gap-4 pt-4">
                  <button
                    onClick={() => setView('markets')}
                    className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded hover:bg-gray-50 font-bold uppercase tracking-wide transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleCreateMarket}
                    className="flex-1 px-6 py-3 bg-cyan-500 text-white rounded hover:bg-cyan-600 font-bold uppercase tracking-wide transition-colors"
                  >
                    Create Market
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {view === 'admin' && user.is_admin && (
          <div>
            <h2 className="text-2xl font-bold text-gray-900 mb-6 uppercase tracking-wide">User Management</h2>
            
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4 uppercase tracking-wide">Pending Approval</h3>
              
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