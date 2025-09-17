"use client";
import { UsageStats } from "./UsageStats";
import { UsageChart } from "./UsageChart";
import { ApiKeyManager } from "./ApiKeyManager";
import { TemplateManager } from "./TemplateManager";
import { RecentCalls } from "./RecentCalls";
import { CodeChangesChart } from "./CodeChangesChart";
import { FileActivityChart } from "./FileActivityChart";

interface DashboardContentProps {
  activeTab: string;
}

export function DashboardContent({ activeTab }: DashboardContentProps) {
  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Overview</h2>
              <UsageStats />
            </div>
            <div>
              <UsageChart />
            </div>
          </div>
        );

      case 'analytics':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Analytics</h2>
              <p className="text-gray-600 mb-6">Insights into your coding patterns and commit behavior</p>
            </div>
            <CodeChangesChart />
            <FileActivityChart />
          </div>
        );

      case 'usage':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Usage & Billing</h2>
              <p className="text-gray-600 mb-6">Monitor your API usage and subscription details</p>
            </div>
            <UsageStats />
            <UsageChart />
          </div>
        );

      case 'templates':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Templates</h2>
              <p className="text-gray-600 mb-6">Manage your commit message templates and styles</p>
            </div>
            <TemplateManager />
          </div>
        );

      case 'api-keys':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">API Keys</h2>
              <p className="text-gray-600 mb-6">Generate and manage your API keys for CLI access</p>
            </div>
            <ApiKeyManager />
          </div>
        );

      case 'activity':
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Recent Activity</h2>
              <p className="text-gray-600 mb-6">View your recent API calls and commit generations</p>
            </div>
            <RecentCalls />
          </div>
        );

      default:
        return (
          <div className="space-y-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Overview</h2>
              <UsageStats />
            </div>
            <div>
              <UsageChart />
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex-1 p-8 bg-gray-50 overflow-y-auto">
      <div className="max-w-6xl mx-auto">
        {renderContent()}
      </div>
    </div>
  );
}
