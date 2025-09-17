'use client';

import { useState, useEffect } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';
import {
  Activity,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Clock,
  GitBranch,
  FileText,
  Zap,
  Info,
  Lightbulb,
  HelpCircle
} from 'lucide-react';
import { RepositoryHealthCalculator } from '@/app/lib/health-calculator';
import { HealthExplainer } from '@/app/lib/health-explanations';

interface RepositoryHealthData {
  repositories: string[];
  healthMetrics: any;
  trends: any[];
  fileChurn: any[];
  commitSizeDistribution: any[];
}

const HEALTH_COLORS = {
  green: '#10B981',
  blue: '#3B82F6',
  yellow: '#F59E0B',
  orange: '#F97316',
  red: '#EF4444'
};

const SIZE_COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444'];

export default function RepositoryHealthChart() {
  const [data, setData] = useState<RepositoryHealthData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState(30);
  const [selectedRepository, setSelectedRepository] = useState('all');

  useEffect(() => {
    fetchHealthData();
  }, [timeRange, selectedRepository]);

  const fetchHealthData = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        days: timeRange.toString(),
        repository: selectedRepository
      });

      const response = await fetch(`/api/analytics/repository-health?${params}`);
      if (!response.ok) throw new Error('Failed to fetch health data');

      const result = await response.json();
      console.log('Health API Response:', result); // Debug log
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="text-center py-8">
          <AlertTriangle className="mx-auto h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error Loading Health Data</h3>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={fetchHealthData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!data || !data.healthMetrics) {
    return (
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="text-center py-8">
          <Activity className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Health Data To See</h3>
          <p className="text-gray-600">Start making commits to see repository health metrics.</p>
        </div>
      </div>
    );
  }

  const healthInfo = RepositoryHealthCalculator.getHealthLevel(data.healthMetrics.healthScore);
  const explanation = HealthExplainer.explainHealthScore(data.healthMetrics);
  const recommendations = HealthExplainer.getPriorityRecommendations(data.healthMetrics);

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-3 sm:gap-0">
        <h3 className="text-lg font-semibold text-gray-800">Repository Health Metrics</h3>
        <div className="flex flex-col sm:flex-row gap-2">
          {data.repositories.length > 1 && (
            <select
              value={selectedRepository}
              onChange={(e) => setSelectedRepository(e.target.value)}
              className="px-3 py-1 border border-gray-300 rounded-md text-gray-600 text-sm"
            >
              <option value="all">All Repositories</option>
              {data.repositories.map(repo => (
                <option key={repo} value={repo}>{repo}</option>
              ))}
            </select>
          )}
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(parseInt(e.target.value))}
            className="px-3 py-1 border border-gray-300 text-gray-600 rounded-md text-sm"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Health Score Overview */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <div
                className={`w-4 h-4 rounded-full`}
                style={{ backgroundColor: HEALTH_COLORS[healthInfo.color as keyof typeof HEALTH_COLORS] }}
              ></div>
              <h4 className="text-lg font-medium text-gray-800">
                Health Score: {data.healthMetrics.healthScore}/100
              </h4>
              <span className={`px-2 py-1 rounded-full text-xs font-medium text-white`}
                style={{ backgroundColor: HEALTH_COLORS[healthInfo.color as keyof typeof HEALTH_COLORS] }}>
                {healthInfo.level}
              </span>
            </div>
            <p className="text-sm text-gray-600">{healthInfo.description}</p>
          </div>
        </div>

        {/* Health Progress Bar */}
        <div className="w-full bg-gray-200 rounded-full h-3 mb-4">
          <div
            className="h-3 rounded-full transition-all duration-300"
            style={{
              width: `${data.healthMetrics.healthScore}%`,
              backgroundColor: HEALTH_COLORS[healthInfo.color as keyof typeof HEALTH_COLORS]
            }}
          ></div>
        </div>
      </div>

      {/* Health Explanation Section */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
        <div className="flex items-start gap-3 mb-4">
          <Info className="text-blue-600 mt-0.5" size={20} />
          <div className="flex-1">
            <h4 className="text-md font-medium text-gray-800 mb-2">Why is your health score {data.healthMetrics.healthScore}/100?</h4>
            <p className="text-sm text-gray-600 mb-3">{explanation.impact}</p>

            {explanation.reasons.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-medium text-gray-700">Key factors affecting your score:</p>
                <ul className="space-y-1">
                  {explanation.reasons.map((reason, index) => (
                    <li key={index} className="text-sm text-gray-600 flex items-start gap-2">
                      <span className="text-gray-400 mt-1">•</span>
                      <span>{reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>

        {/* Recommendations */}
        {recommendations.length > 0 && (
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-start gap-3">
              <Lightbulb className="text-yellow-600 mt-0.5" size={20} />
              <div className="flex-1">
                <h4 className="text-md font-medium text-gray-800 mb-3">Recommended actions to improve:</h4>
                <div className="space-y-3">
                  {recommendations.slice(0, 3).map((rec, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-white rounded-lg border border-gray-100">
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        rec.priority === 'high' ? 'bg-red-100 text-red-700' :
                        rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {rec.priority.toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">{rec.action}</p>
                        <p className="text-xs text-gray-600 mt-1">{rec.benefit}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg relative group">
          <div className="flex items-center gap-2">
            <TrendingUp className="text-blue-600" size={20} />
            <div className="flex-1">
              <div className="flex items-center gap-1">
                <p className="text-sm text-gray-600">Avg Commit Size</p>
                <HelpCircle className="text-gray-400 cursor-help" size={14} />
              </div>
              <p className="text-xl font-bold text-blue-600">{data.healthMetrics.averageCommitSize} lines</p>
              <p className="text-xs text-gray-500 mt-1">
                Ideal: 20-100 lines
              </p>
            </div>
          </div>

          {/* Tooltip */}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 w-64">
            <p className="font-medium mb-1">Average Commit Size</p>
            <p>Commits in the 20-100 line range are easy to review and understand. Too small creates noise, too large is hard to review.</p>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg relative group">
          <div className="flex items-center gap-2">
            <Activity className="text-green-600" size={20} />
            <div className="flex-1">
              <div className="flex items-center gap-1">
                <p className="text-sm text-gray-600">Commit Frequency</p>
                <HelpCircle className="text-gray-400 cursor-help" size={14} />
              </div>
              <p className="text-xl font-bold text-green-600">{data.healthMetrics.commitFrequency}/day</p>
              <p className="text-xs text-gray-500 mt-1">
                Ideal: 1-3 commits/day
              </p>
            </div>
          </div>

          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 w-64">
            <p className="font-medium mb-1">Commit Frequency</p>
            <p>Regular commits show consistent progress and reduce merge conflicts. Too few suggests infrequent development, too many may indicate rushed work.</p>
          </div>
        </div>

        <div className="bg-yellow-50 p-4 rounded-lg relative group">
          <div className="flex items-center gap-2">
            <FileText className="text-yellow-600" size={20} />
            <div className="flex-1">
              <div className="flex items-center gap-1">
                <p className="text-sm text-gray-600">File Churn Rate</p>
                <HelpCircle className="text-gray-400 cursor-help" size={14} />
              </div>
              <p className="text-xl font-bold text-yellow-600">{data.healthMetrics.fileChurnRate} files/commit</p>
              <p className="text-xs text-gray-500 mt-1">
                Ideal: 2-4 files/commit
              </p>
            </div>
          </div>

          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 w-64">
            <p className="font-medium mb-1">File Churn Rate</p>
            <p>Focused commits touching few related files are easier to review and less likely to introduce bugs across multiple areas.</p>
          </div>
        </div>

        <div className="bg-red-50 p-4 rounded-lg relative group">
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-red-600" size={20} />
            <div className="flex-1">
              <div className="flex items-center gap-1">
                <p className="text-sm text-gray-600">Breaking Changes</p>
                <HelpCircle className="text-gray-400 cursor-help" size={14} />
              </div>
              <p className="text-xl font-bold text-red-600">{data.healthMetrics.breakingChangeFrequency}%</p>
              <p className="text-xs text-gray-500 mt-1">
                Ideal: &lt;2% of commits
              </p>
            </div>
          </div>

          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 w-64">
            <p className="font-medium mb-1">Breaking Changes</p>
            <p>Breaking changes disrupt users and require careful coordination. High frequency indicates unstable APIs or poor planning.</p>
          </div>
        </div>
      </div>

      {/* Charts */}
      {selectedRepository !== 'all' && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Health Trends */}
          {data.trends && data.trends.length > 0 && (
            <div className="xl:col-span-2">
              <h4 className="text-md font-medium text-gray-700 mb-3">Health Score Trends</h4>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.trends}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    fontSize={12}
                  />
                  <YAxis fontSize={12} />
                  <Tooltip
                    labelFormatter={(value) => new Date(value).toLocaleDateString()}
                    formatter={(value: number, name: string) => [value, name === 'healthScore' ? 'Health Score' : name]}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="healthScore"
                    stroke="#3B82F6"
                    strokeWidth={2}
                    name="Health Score"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Commit Size Distribution */}
          {data.commitSizeDistribution && data.commitSizeDistribution.length > 0 && (
            <div>
              <h4 className="text-md font-medium text-gray-700 mb-3">Commit Size Distribution</h4>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={data.commitSizeDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ range, percentage }) => `${percentage}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                    fontSize={12}
                  >
                    {data.commitSizeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={SIZE_COLORS[index % SIZE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number, name: string, props: any) => [
                      `${value} commits (${props.payload.percentage}%)`,
                      props.payload.range
                    ]}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* Size Distribution Legend */}
              <div className="mt-4 space-y-2">
                {data.commitSizeDistribution.map((item, index) => (
                  <div key={item.range} className="flex items-center gap-2 text-sm">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: SIZE_COLORS[index % SIZE_COLORS.length] }}
                    ></div>
                    <span className="text-gray-600">{item.range}: {item.count} commits</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Repository Overview for Multiple Repos */}
      {selectedRepository === 'all' && data.repositories.length > 1 && (
        <div>
          <h4 className="text-md font-medium text-gray-700 mb-3">Repository Overview</h4>
          <div className="space-y-3">
            {data.repositories.map(repo => {
              const repoHealth = data.healthMetrics[repo];
              if (!repoHealth) return null;

              const repoHealthInfo = RepositoryHealthCalculator.getHealthLevel(repoHealth.healthScore);

              return (
                <div key={repo} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <GitBranch className="text-gray-500" size={16} />
                    <div>
                      <p className="font-medium text-gray-800">{repo}</p>
                      <p className="text-sm text-gray-600">{repoHealthInfo.description}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium text-white`}
                      style={{ backgroundColor: HEALTH_COLORS[repoHealthInfo.color as keyof typeof HEALTH_COLORS] }}>
                      {repoHealth.healthScore}/100
                    </span>
                    <button
                      onClick={() => setSelectedRepository(repo)}
                      className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
