"use client";
import { useState, useEffect } from "react";

interface ApiCall {
  id: string;
  created_at: string;
  tokens_used?: number;
  success: boolean;
  request_size?: number;
}

export function RecentCalls() {
  const [calls, setCalls] = useState<ApiCall[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCount, setShowCount] = useState(5);

  useEffect(() => {
    fetchRecentCalls();
  }, []);

  const fetchRecentCalls = async () => {
    try {
      const response = await fetch("/api/usage");
      const data = await response.json();
      setCalls(data.recentCalls || []);
    } catch (error) {
      console.error("Failed to fetch recent calls:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return <div className="animate-pulse bg-gray-200 h-48 rounded"></div>;

  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <h3 className="text-lg text-gray-900 font-semibold mb-4">Recent API Calls</h3>
      {calls.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No API calls yet</p>
          <p className="text-sm text-gray-400 mt-2">
            Generate your first commit message using the CLI tool
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 font-medium text-gray-600">
                  Status
                </th>

                <th className="text-left py-3 font-medium text-gray-600">
                  Tokens
                </th>
                <th className="text-left py-3 font-medium text-gray-600">
                  Size
                </th>
                <th className="text-left py-3 font-medium text-gray-600">
                  Time
                </th>
              </tr>
            </thead>
            <tbody>
              {calls.slice(0, showCount).map((call) => (
                <tr
                  key={call.id}
                  className="border-b border-gray-100 hover:bg-gray-50"
                >
                  <td className="py-3">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        call.success
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {call.success ? "✓" : "✗"}
                    </span>
                  </td>

                  <td className="py-3 text-gray-500">{call.tokens_used || 0}</td>
                  <td className="py-3 text-gray-500">
                    {call.request_size
                      ? `${Math.round(call.request_size / 1024)}KB`
                      : "-"}
                  </td>
                  <td className="py-3 text-gray-500">
                    {new Date(call.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {calls.length > showCount && (
            <div className="mt-4 text-center">
              <button
                onClick={() =>
                  setShowCount((prev) => Math.min(prev + 5, calls.length))
                }
                className="text-sm text-blue-600 hover:text-blue-800 font-medium"
              >
                Show More ({Math.min(5, calls.length - showCount)} more)
              </button>
            </div>
          )}

          {showCount > 5 && (
            <div className="mt-2 text-center">
              <button
                onClick={() => setShowCount(5)}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Show Less
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
