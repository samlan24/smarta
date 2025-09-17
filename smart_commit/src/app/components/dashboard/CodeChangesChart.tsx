"use client";
import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { TrendingUp, TrendingDown, GitCommit, Code } from 'lucide-react';

interface CodeChangesData {
  chartData: Array<{
    date: string;
    linesAdded: number;
    linesDeleted: number;
    commits: number;
  }>;
  summary: {
    totalLinesAdded: number;
    totalLinesDeleted: number;
    totalCommits: number;
    netChange: number;
  };
  commitTypes: { [key: string]: number };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export function CodeChangesChart() {
  const [data, setData] = useState<CodeChangesData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(30);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/analytics/code-changes?days=${timeRange}`);
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (error) {
        console.error('Failed to fetch code changes data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [timeRange]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white rounded-xl shadow-sm p-6">
        <p className="text-gray-500">Failed to load code changes data</p>
      </div>
    );
  }

  // Prepare commit types data for pie chart
  const commitTypesData = Object.entries(data.commitTypes).map(([type, count]) => ({
    name: type,
    value: count
  }));

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-3 sm:gap-0">
        <h3 className="text-lg font-semibold text-gray-800">Code Change Patterns</h3>
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

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <TrendingUp className="text-green-600" size={20} />
            <div>
              <p className="text-sm text-gray-600">Lines Added</p>
              <p className="text-xl font-bold text-green-600">{data.summary.totalLinesAdded.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-red-50 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <TrendingDown className="text-red-600" size={20} />
            <div>
              <p className="text-sm text-gray-600">Lines Deleted</p>
              <p className="text-xl font-bold text-red-600">{data.summary.totalLinesDeleted.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <GitCommit className="text-blue-600" size={20} />
            <div>
              <p className="text-sm text-gray-600">Total Commits</p>
              <p className="text-xl font-bold text-blue-600">{data.summary.totalCommits}</p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <Code className="text-purple-600" size={20} />
            <div>
              <p className="text-sm text-gray-600">Net Change</p>
              <p className={`text-xl font-bold ${data.summary.netChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {data.summary.netChange >= 0 ? '+' : ''}{data.summary.netChange.toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Line Chart */}
        <div className="xl:col-span-2">
          <h4 className="text-md font-medium text-gray-700 mb-3">Daily Code Changes</h4>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                fontSize={12}
              />
              <YAxis fontSize={12} />
              <Tooltip
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
                formatter={(value: number, name: string) => [value.toLocaleString(), name]}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="linesAdded"
                stroke="#10B981"
                strokeWidth={2}
                name="Lines Added"
              />
              <Line
                type="monotone"
                dataKey="linesDeleted"
                stroke="#EF4444"
                strokeWidth={2}
                name="Lines Deleted"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart */}
        <div>
          <h4 className="text-md font-medium text-gray-700 mb-3">Commit Types</h4>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie
                data={commitTypesData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                fontSize={12}
              >
                {commitTypesData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
