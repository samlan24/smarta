"use client";
import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { FileText, Activity, Clock, Code2 } from 'lucide-react';

interface FileActivityData {
  fileActivity: Array<{
    fileName: string;
    changeCount: number;
    linesAdded: number;
    linesDeleted: number;
    netChange: number;
    lastChanged: string;
    fileExtension: string;
  }>;
  fileTypes: { [key: string]: number };
  summary: {
    totalFiles: number;
    totalChanges: number;
    avgChangesPerFile: number;
    period: string;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658'];

export function FileActivityChart() {
  const [data, setData] = useState<FileActivityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState(30);
  const [viewMode, setViewMode] = useState<'frequency' | 'changes'>('frequency');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/analytics/file-activity?days=${timeRange}&limit=15`);
        if (response.ok) {
          const result = await response.json();
          setData(result);
        }
      } catch (error) {
        console.error('Failed to fetch file activity data:', error);
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
        <p className="text-gray-500">Failed to load file activity data</p>
      </div>
    );
  }

  // Prepare file types data for pie chart
  const fileTypesData = Object.entries(data.fileTypes)
    .map(([type, count]) => ({
      name: type,
      value: count
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 8); // Top 8 file types

  // Prepare bar chart data
  const barChartData = data.fileActivity.map(file => ({
    fileName: file.fileName.length > 25 ? '...' + file.fileName.slice(-22) : file.fileName,
    fullFileName: file.fileName,
    changeCount: file.changeCount,
    netChange: file.netChange,
    linesAdded: file.linesAdded,
    linesDeleted: file.linesDeleted,
    lastChanged: file.lastChanged
  }));

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-3 sm:gap-0">
        <h3 className="text-lg font-semibold text-gray-800">File Activity Analysis</h3>
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            value={viewMode}
            onChange={(e) => setViewMode(e.target.value as 'frequency' | 'changes')}
            className="px-3 py-1 border border-gray-300 rounded-md text-gray-600 text-sm"
          >
            <option value="frequency">Change Frequency</option>
            <option value="changes">Net Changes</option>
          </select>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(parseInt(e.target.value))}
            className="px-3 py-1 border border-gray-300 rounded-md text-gray-600 text-sm"
          >
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <FileText className="text-blue-600" size={20} />
            <div>
              <p className="text-sm text-gray-600">Total Files</p>
              <p className="text-xl font-bold text-blue-600">{data.summary.totalFiles}</p>
            </div>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <Activity className="text-green-600" size={20} />
            <div>
              <p className="text-sm text-gray-600">Total Changes</p>
              <p className="text-xl font-bold text-green-600">{data.summary.totalChanges}</p>
            </div>
          </div>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <Code2 className="text-purple-600" size={20} />
            <div>
              <p className="text-sm text-gray-600">Avg Changes/File</p>
              <p className="text-xl font-bold text-purple-600">{data.summary.avgChangesPerFile}</p>
            </div>
          </div>
        </div>

        <div className="bg-orange-50 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <Clock className="text-orange-600" size={20} />
            <div>
              <p className="text-sm text-gray-600">Period</p>
              <p className="text-xl font-bold text-orange-600">{data.summary.period}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="xl:col-span-2">
          <h4 className="text-md font-medium text-gray-700 mb-3">
            Most {viewMode === 'frequency' ? 'Frequently Changed' : 'Modified'} Files
          </h4>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={barChartData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" fontSize={12} />
              <YAxis
                type="category"
                dataKey="fileName"
                fontSize={12}
                width={120}
                tick={{ fontSize: 12 }}
              />
              <Tooltip
                formatter={(value: number, name: string) => [
                  value.toLocaleString(),
                  name === 'changeCount' ? 'Changes' : 'Net Change'
                ]}
                labelFormatter={(label) => {
                  const item = barChartData.find(d => d.fileName === label);
                  return item ? item.fullFileName : label;
                }}
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
                        <p className="font-medium text-gray-800 mb-2">{data.fullFileName}</p>
                        <p className="text-sm text-gray-600">Changes: {data.changeCount}</p>
                        <p className="text-sm text-gray-600">Lines Added: +{data.linesAdded}</p>
                        <p className="text-sm text-gray-600">Lines Deleted: -{data.linesDeleted}</p>
                        <p className="text-sm text-gray-600">Net Change: {data.netChange >= 0 ? '+' : ''}{data.netChange}</p>
                        <p className="text-sm text-gray-600">Last Changed: {new Date(data.lastChanged).toLocaleDateString()}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar
                dataKey={viewMode === 'frequency' ? 'changeCount' : 'netChange'}
                fill={viewMode === 'frequency' ? '#3B82F6' : '#10B981'}
                radius={[0, 4, 4, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* File Types Pie Chart */}
        <div>
          <h4 className="text-md font-medium text-gray-700 mb-3">File Types Distribution</h4>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={fileTypesData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
                fontSize={12}
              >
                {fileTypesData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>

          {/* File Types List */}
          <div className="mt-4 space-y-2">
            {fileTypesData.slice(0, 5).map((type, index) => (
              <div key={type.name} className="flex items-center justify-between text-sm">
                <div className="flex items-center gap-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: COLORS[index % COLORS.length] }}
                  ></div>
                  <span className="text-gray-700">.{type.name}</span>
                </div>
                <span className="text-gray-600">{type.value} changes</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
