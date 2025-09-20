"use client";
import { useState, useEffect } from "react";

interface UsageData {
  subscription: {
    plan: string;
    usageCount: number; // or usage_count depending on your API
    usageLimit: number; // or usage_limit
    resetDate: string; // or reset_date
    status: string;
  };
  planInfo?: {
    // Add the new planInfo
    planName: string;
    features: {
      commitGenerations: number;
      templates: number;
      analyticsDays: number;
      githubRepos: number;
    };
  };
  stats: {
    totalRequests: number;
    monthlyRequests: number;
    totalTokens: number;
    successRate: number;
    remainingQuota: number;
  };
  chartData?: any[];
  recentCalls?: any[];
}

export function UsageStats() {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsage();
  }, []);

  const fetchUsage = async () => {
    try {
      const response = await fetch("/api/usage");
      const data = await response.json();
      setUsage(data);
    } catch (error) {
      console.error("Failed to fetch usage:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading)
    return <div className="animate-pulse bg-gray-200 h-32 rounded"></div>;
  if (!usage) return <div>Failed to load usage stats</div>;

  const usagePercentage =
    (usage.subscription.usageCount / usage.subscription.usageLimit) * 100;
  const resetDate = new Date(usage.subscription.resetDate).toLocaleDateString();


  return (
    <div className="bg-white rounded-xl shadow-sm p-6 mb-0">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">
        Usage Overview
      </h3>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-gray-600">Monthly Usage</h4>
          <p className="text-2xl font-bold text-blue-600">
            {usage.subscription.usageCount} / {usage.subscription.usageLimit}
          </p>
          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all"
              style={{ width: `${Math.min(usagePercentage, 100)}%` }}
            ></div>
          </div>
        </div>

        <div className="bg-green-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-gray-600">Total Requests</h4>
          <p className="text-2xl font-bold text-green-600">
            {usage.stats.totalRequests}
          </p>
          <p className="text-xs text-gray-500 mt-1">All time</p>
        </div>

        <div className="bg-purple-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-gray-600">Success Rate</h4>
          <p className="text-2xl font-bold text-purple-600">
            {usage.stats.successRate}%
          </p>
          <p className="text-xs text-gray-500 mt-1">API calls</p>
        </div>

        <div className="bg-orange-50 p-4 rounded-lg">
          <h4 className="text-sm font-medium text-gray-600">Current Plan</h4>
          <p className="text-2xl font-bold text-orange-600 capitalize">
            {usage.subscription.plan}
          </p>
          <p className="text-xs text-gray-500 mt-1">Resets {resetDate}</p>
        </div>
      </div>

      {usagePercentage > 80 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-sm text-yellow-800">
            ⚠️ You've used {Math.round(usagePercentage)}% of your monthly quota.
            {usagePercentage > 95 && " Consider upgrading your plan."}
          </p>
        </div>
      )}
    </div>
  );
}
