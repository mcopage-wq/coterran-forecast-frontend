'use client';
import { useState, useEffect } from 'react';
import { Calendar, TrendingUp, Users, Plus, LogOut, Award, AlertCircle, BarChart3 } from 'lucide-react';

const API_URL = 'https://coterran-forecast-production.up.railway.app/api';

export default function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [view, setView] = useState('markets');
  const [markets, setMarkets] = useState([]);
  const [selectedMarket, setSelectedMarket] = useState(null);
  const [predictions, setPredictions] = useState([]);
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

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchCurrentUser(token);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchMarkets();
    }
  }, [user]);

  async function fetchCurrentUser(token) {
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

  function handleLogin(e) {
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

  async function fetchMarketDetail(marketId) {
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
      }
    } catch (err) {
      console.error('Failed to fetch market detail', err);
    }
    setLoading(false);
  }

  function handleCreateMarket(e) {
    e.preventDefault();
    setError('');
    fetch(`${API_URL}/markets`, {
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
      setView('markets');
    })
    .catch(err => {
      setError(err.message);
    });
  }

  function handleSubmitPrediction(e) {
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
      fetchMarketDetail(selectedMarket.id);
    })
    .catch(err => {
      setError(err.message);
    });
  }

  function handleResolveMarket(e) {
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

  if (!user) {
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
              
              {user.is_admin && (
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
                          {market.median_prediction ? `${market.median_prediction.toFixed(0)}%` : 'N/A'}
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
                {selectedMarket.median_prediction !== null && (
                  <>
                    <div>
                      <p className="text-sm text-gray-600 uppercase tracking-wide mb-1">Consensus (Median)</p>
                      <p className="text-3xl font-bold text-cyan-600">{selectedMarket.median_prediction.toFixed(1)}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 uppercase tracking-wide mb-1">Mean Prediction</p>
                      <p className="text-3xl font-bold text-gray-700">{selectedMarket.mean_prediction?.toFixed(1)}%</p>
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
                  <p className="text-3xl font-bold mb-2">Outcome: {selectedMarket.outcome}%</p>
                  {selectedMarket.resolution_source && (
                    <p className="text-sm text-cyan-100">Source: {selectedMarket.resolution_source}</p>
                  )}
                </div>
              )}
            </div>

            {selectedMarket.status === 'open' && (
              <div className="bg-white rounded-lg border border-cyan-200 p-6 mb-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4 uppercase tracking-wide">Submit Your Prediction</h3>
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

                  <button
                    onClick={handleSubmitPrediction}
                    className="w-full bg-cyan-500 text-white py-3 rounded hover:bg-cyan-600 font-bold uppercase tracking-wide transition-colors"
                  >
                    Submit Prediction
                  </button>
                </div>
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
                        <div>
                          <p className="font-bold text-gray-900">{pred.predictor_name}</p>
                          <p className="text-xs text-gray-500">{new Date(pred.created_at).toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-cyan-600">{pred.prediction}%</p>
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
                      <option>Temperature</option>
                      <option>Rainfall</option>
                      <option>Energy</option>
                      <option>Marine</option>
                      <option>Policy</option>
                      <option>Economics</option>
                    </select>
                  </div>

                  <div>
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