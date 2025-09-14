import { createClient } from "../lib/supabase/server";
import SignOutButton from "../components/auth/SignOutButton";
import { ApiKeyManager } from "../components/dashboard/ApiKeyManager";
import { UsageStats } from "../components/dashboard/UsageStats";
import { RecentCalls } from "../components/dashboard/RecentCalls";
import { UsageChart } from "../components/dashboard/UsageChart";

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
              <p className="text-gray-600 mt-1">Welcome back, {user?.user_metadata.full_name || "User"}</p>
            </div>
            <SignOutButton />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-8">
          {/* Usage Overview */}
          <UsageStats />

          {/* Chart and API Keys Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <UsageChart />
            </div>
            <div className="lg:col-span-1">
              <ApiKeyManager />
            </div>
          </div>

          {/* Recent Activity */}
          <RecentCalls />
        </div>
      </div>
    </div>
  );
}