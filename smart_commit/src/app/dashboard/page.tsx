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
    <div className="space-y-6">
      <div className="rounded-xl bg-white shadow p-6">
        <h2 className="text-2xl font-bold mb-2 text-gray-800">
          Welcome, {user?.user_metadata.full_name || "User"} 👋
        </h2>
        <p className="text-gray-600">{user?.email}</p>
      </div>

      <UsageStats />
      <UsageChart />
      <ApiKeyManager />
      <RecentCalls />

      <div className="flex justify-end">
        <SignOutButton />
      </div>
    </div>
  );
}