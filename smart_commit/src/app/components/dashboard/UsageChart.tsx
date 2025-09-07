"use client";
import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface ChartDataPoint {
  date: string;
  requests: number;
  tokens: number;
}

interface UsageChartProps {
  className?: string;
}

export function UsageChart({ className = "" }: UsageChartProps) {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewType, setViewType] = useState<'requests' | 'tokens'>('requests');

  useEffect(() => {
    fetchChartData();
  }, []);

  const fetchChartData = async () => {
    try {
      const response = await fetch('/api/usage');
      const data = await response.json();

      // Format the chart data and ensure we have data for the last 14 days
      const formattedData = formatChartData(data.chartData || []);
      setChartData(formattedData);
    } catch (error) {
      console.error('Failed to fetch chart data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatChartData = (data: ChartDataPoint[]) => {
    // Create array for last 14 days
    const last14Days = [];
    for (let i = 13; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];

      // Find existing data for this date or create empty entry
      const existingData = data.find(d => d.date === dateStr);
      last14Days.push({
        date: dateStr,
        requests: existingData?.requests || 0,
        tokens: existingData?.tokens || 0,
        displayDate: date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        })
      });
    }

    return last14Days;
  };

  if (loading) {
    return (
      <div className={`bg-white rounded-xl shadow p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const maxValue = Math.max(
    ...chartData.map(d => viewType === 'requests' ? d.requests : d.tokens)
  );

  return (
    <div className={`bg-white rounded-xl shadow p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Usage Trends (Last 14 Days)</h3>

        <div className="flex bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewType('requests')}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
              viewType === 'requests'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Requests
          </button>
          <button
            onClick={() => setViewType('tokens')}
            className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
              viewType === 'tokens'
                ? 'bg-white text-blue-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            Tokens
          </button>
        </div>
      </div>

      {maxValue === 0 ? (
        <div className="h-64 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <div className="text-4xl mb-2">📊</div>
            <p>No usage data yet</p>
            <p className="text-sm mt-1">Start using the CLI tool to see your usage trends</p>
          </div>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart
            data={chartData}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5,
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="displayDate"
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#6b7280"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
              formatter={(value: number, name: string) => [
                value,
                name === 'requests' ? 'API Requests' : 'Tokens Used'
              ]}
              labelFormatter={(label) => `Date: ${label}`}
            />
            <Line
              type="monotone"
              dataKey={viewType}
              stroke="#3b82f6"
              strokeWidth={3}
              dot={{
                fill: '#3b82f6',
                strokeWidth: 2,
                r: 4
              }}
              activeDot={{
                r: 6,
                stroke: '#3b82f6',
                strokeWidth: 2,
                fill: 'white'
              }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}

      <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
        <div className="text-sm text-gray-600">
          Total in last 14 days: {' '}
          <span className="font-semibold">
            {chartData.reduce((sum, d) => sum + (viewType === 'requests' ? d.requests : d.tokens), 0)}
            {viewType === 'requests' ? ' requests' : ' tokens'}
          </span>
        </div>

        <div className="text-sm text-gray-600">
          Daily average: {' '}
          <span className="font-semibold">
            {Math.round(
              chartData.reduce((sum, d) => sum + (viewType === 'requests' ? d.requests : d.tokens), 0) / 14
            )}
            {viewType === 'requests' ? ' requests' : ' tokens'}
          </span>
        </div>
      </div>
    </div>
  );
}