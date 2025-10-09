// ============================================
// COTERRAN FORECASTING PLATFORM
// Odds Display & Analytics Components
// ============================================
// Create this file as: src/OddsComponents.tsx
// (or OddsComponents.jsx if not using TypeScript)

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, BarChart3 } from 'lucide-react';

// ============================================
// TYPE DEFINITIONS
// ============================================

interface OddsData {
  marketId: string;
  question: string;
  predictionCount: number;
  statistics: {
    median: number | null;
    mean: number | null;
    stdDeviation: number | null;
  };
  odds: {
    probability: number | null;
    decimal: number | null;
    fractional: string | null;
    impliedProbability: number | null;
  };
  confidence: {
    high: number;
    medium: number;
    low: number;
  };
}

interface OddsDisplayProps {
  marketId: string;
  compact?: boolean;
}

interface SnapshotData {
  date: string;
  predictionCount: number;
  median: number;
  mean: number;
  stdDeviation: number;
  odds: {
    probability: number;
    decimal: number;
    fractional: string | null;
  };
  confidence: {
    high: number;
    medium: number;
    low: number;
  };
  distribution: {
    range_0_25: number;
    range_25_50: number;
    range_50_75: number;
    range_75_100: number;
  };
}

interface OddsChange {
  timestamp: string;
  triggerType: string;
  predictionCount: number;
  probability: number;
  decimalOdds: number;
  change: number;
}

interface MarketInfo {
  question: string;
  category: string;
  status: string;
  created_at: string;
  close_date: string;
}

interface AnalyticsData {
  market: MarketInfo;
  period: string;
  snapshots: SnapshotData[];
  recentChanges: OddsChange[];
}

interface AnalyticsChartProps {
  marketId: string;
}

interface PeriodOption {
  value: string;
  label: string;
}

interface PeriodSelectorProps {
  period: string;
  onChange: (period: string) => void;
}

// ============================================
// ODDS DISPLAY COMPONENT
// ============================================

export function OddsDisplay({ marketId, compact = false }: OddsDisplayProps) {
  const [odds, setOdds] = useState<OddsData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchOdds();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marketId]);

  async function fetchOdds() {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`https://coterran-forecast-production.up.railway.app/api/markets/${marketId}/odds`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data: OddsData = await response.json();
        setOdds(data);
      }
    } catch (err) {
      console.error('Failed to fetch odds', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading || !odds) {
    return <div className="text-gray-400 text-sm">Loading odds...</div>;
  }

  if (odds.predictionCount === 0) {
    return <div className="text-gray-400 text-sm italic">No predictions yet</div>;
  }

  if (compact) {
    return (
      <div className="flex items-center gap-3">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Probability</p>
          <p className="text-2xl font-bold text-cyan-600">{odds.odds.probability?.toFixed(0)}%</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide">Decimal Odds</p>
          <p className="text-lg font-bold text-gray-700">{odds.odds.decimal?.toFixed(2)}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-br from-cyan-50 to-white rounded-lg p-4 border border-cyan-100">
      <h4 className="font-bold text-gray-900 mb-3 uppercase tracking-wide text-sm">Current Market Odds</h4>
      <div className="grid grid-cols-3 gap-4">
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Probability</p>
          <p className="text-3xl font-bold text-cyan-600">{odds.odds.probability?.toFixed(1)}%</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Decimal Odds</p>
          <p className="text-2xl font-bold text-gray-700">{odds.odds.decimal?.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Fractional</p>
          <p className="text-2xl font-bold text-gray-700">{odds.odds.fractional || 'N/A'}</p>
        </div>
      </div>
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">Confidence Distribution</p>
        <div className="flex gap-2">
          <div className="flex-1 bg-green-100 rounded px-2 py-1">
            <p className="text-xs text-green-700 font-medium">High: {odds.confidence.high}</p>
          </div>
          <div className="flex-1 bg-yellow-100 rounded px-2 py-1">
            <p className="text-xs text-yellow-700 font-medium">Med: {odds.confidence.medium}</p>
          </div>
          <div className="flex-1 bg-red-100 rounded px-2 py-1">
            <p className="text-xs text-red-700 font-medium">Low: {odds.confidence.low}</p>
          </div>
        </div>
      </div>

      <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
        <span>Based on {odds.predictionCount} prediction{odds.predictionCount !== 1 ? 's' : ''}</span>
        <span>Median: {odds.statistics.median?.toFixed(1)}% | Mean: {odds.statistics.mean?.toFixed(1)}%</span>
      </div>
    </div>
  );
}

// ============================================
// ANALYTICS CHART COMPONENT
// ============================================

export function AnalyticsChart({ marketId }: AnalyticsChartProps) {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [period, setPeriod] = useState<string>('daily');
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [marketId, period]);

  async function fetchAnalytics() {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `https://coterran-forecast-production.up.railway.app/api/markets/${marketId}/analytics?period=${period}`,
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      if (response.ok) {
        const data: AnalyticsData = await response.json();
        setAnalytics(data);
      }
    } catch (err) {
      console.error('Failed to fetch analytics', err);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!analytics || analytics.snapshots.length === 0) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide">Market Analytics</h3>
          <PeriodSelector period={period} onChange={setPeriod} />
        </div>
        <div className="text-center py-8 text-gray-500">
          <BarChart3 className="w-12 h-12 mx-auto mb-2 text-gray-400" />
          <p>No historical data available yet</p>
          <p className="text-sm mt-1">Analytics will appear as predictions are made</p>
        </div>
      </div>
    );
  }

  // Calculate chart dimensions and data - safely handle empty arrays
  const probabilities = analytics.snapshots.map(s => s.odds.probability || 50);
  const maxProbability = probabilities.length > 0 ? Math.max(...probabilities) : 100;
  const minProbability = probabilities.length > 0 ? Math.min(...probabilities) : 0;

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-gray-900 uppercase tracking-wide flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-cyan-500" />
          Market Analytics
        </h3>
        <PeriodSelector period={period} onChange={setPeriod} />
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-50 rounded p-3">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Current Probability</p>
          <p className="text-xl font-bold text-cyan-600">
            {analytics.snapshots[0]?.odds.probability?.toFixed(1)}%
          </p>
        </div>
        <div className="bg-gray-50 rounded p-3">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Trend</p>
          <div className="flex items-center gap-1">
            {analytics.snapshots.length > 1 && (() => {
              const change = analytics.snapshots[0].odds.probability - analytics.snapshots[1].odds.probability;
              if (change > 0.5) {
                return <><TrendingUp className="w-5 h-5 text-green-600" /><span className="text-lg font-bold text-green-600">+{change.toFixed(1)}%</span></>;
              } else if (change < -0.5) {
                return <><TrendingDown className="w-5 h-5 text-red-600" /><span className="text-lg font-bold text-red-600">{change.toFixed(1)}%</span></>;
              } else {
                return <><Minus className="w-5 h-5 text-gray-600" /><span className="text-lg font-bold text-gray-600">Stable</span></>;
              }
            })()}
          </div>
        </div>
        <div className="bg-gray-50 rounded p-3">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Predictions</p>
          <p className="text-xl font-bold text-gray-700">
            {analytics.snapshots[0]?.predictionCount || 0}
          </p>
        </div>
        <div className="bg-gray-50 rounded p-3">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-1">Volatility</p>
          <p className="text-xl font-bold text-gray-700">
            {analytics.snapshots[0]?.stdDeviation?.toFixed(1) || 'N/A'}
          </p>
        </div>
      </div>

      {/* Chart */}
      <div className="relative h-64 mb-4">
        <div className="absolute inset-0 flex flex-col justify-between text-xs text-gray-500 pr-2">
          <span>100%</span>
          <span>75%</span>
          <span>50%</span>
          <span>25%</span>
          <span>0%</span>
        </div>
        
        <div className="ml-12 h-full border-l-2 border-b-2 border-gray-300 relative">
          {/* Grid lines */}
          <div className="absolute inset-0">
            {[0, 25, 50, 75, 100].map(val => (
              <div 
                key={val}
                className="absolute w-full border-t border-gray-200"
                style={{ bottom: `${val}%` }}
              />
            ))}
          </div>
          
          {/* Data line */}
          <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
            <polyline
              points={analytics.snapshots
                .reverse()
                .map((s, i) => {
                  const x = (i / Math.max(analytics.snapshots.length - 1, 1)) * 100;
                  const y = 100 - (s.odds.probability || 50);
                  return `${x},${y}`;
                })
                .join(' ')}
              fill="none"
              stroke="#06b6d4"
              strokeWidth="2"
              vectorEffect="non-scaling-stroke"
            />
            {/* Data points */}
            {analytics.snapshots.map((s, i) => {
              const x = (i / Math.max(analytics.snapshots.length - 1, 1)) * 100;
              const y = 100 - (s.odds.probability || 50);
              return (
                <circle
                  key={i}
                  cx={`${x}%`}
                  cy={`${y}%`}
                  r="4"
                  fill="#06b6d4"
                  stroke="white"
                  strokeWidth="2"
                />
              );
            })}
          </svg>
        </div>
        
        {/* X-axis labels */}
        <div className="ml-12 flex justify-between text-xs text-gray-500 mt-2">
          {analytics.snapshots.length > 0 && (
            <>
              <span>{new Date(analytics.snapshots[analytics.snapshots.length - 1].date).toLocaleDateString()}</span>
              {analytics.snapshots.length > 1 && (
                <span>{new Date(analytics.snapshots[0].date).toLocaleDateString()}</span>
              )}
            </>
          )}
        </div>
      </div>

      {/* Recent Changes */}
      {analytics.recentChanges && analytics.recentChanges.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="font-bold text-gray-900 mb-3 uppercase tracking-wide text-sm">Recent Changes</h4>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {analytics.recentChanges.slice(0, 5).map((change, idx) => (
              <div key={idx} className="flex items-center justify-between text-sm py-2 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-2">
                  {change.change > 0 ? (
                    <TrendingUp className="w-4 h-4 text-green-600" />
                  ) : change.change < 0 ? (
                    <TrendingDown className="w-4 h-4 text-red-600" />
                  ) : (
                    <Minus className="w-4 h-4 text-gray-400" />
                  )}
                  <span className="text-gray-600">{new Date(change.timestamp).toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-gray-500">{change.predictionCount} predictions</span>
                  <span className={`font-bold ${
                    change.change > 0 ? 'text-green-600' : change.change < 0 ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {change.probability.toFixed(1)}%
                    {change.change !== 0 && ` (${change.change > 0 ? '+' : ''}${change.change.toFixed(1)}%)`}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================
// PERIOD SELECTOR COMPONENT
// ============================================

function PeriodSelector({ period, onChange }: PeriodSelectorProps) {
  const periods: PeriodOption[] = [
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
    { value: '3-monthly', label: 'Quarterly' },
    { value: 'annual', label: 'Annual' }
  ];
  
  // Note: Monthly snapshots support future multi-year and decadal analysis
  // Additional periods (5-year, decadal) can be added as the platform matures

  return (
    <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
      {periods.map(p => (
        <button
          key={p.value}
          onClick={() => onChange(p.value)}
          className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
            period === p.value
              ? 'bg-cyan-500 text-white'
              : 'text-gray-600 hover:bg-gray-200'
          }`}
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}