"use client";
import { createClient } from "../lib/supabase/client";
import { SettingsModal } from "../components/dashboard/SettingsModal";
import { DashboardSidebar } from "../components/dashboard/DashboardSidebar";
import { DashboardContent } from "../components/dashboard/DashboardContent";
import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { useRouter, useSearchParams } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    if (tabFromUrl) {
      setActiveTab(tabFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    async function getUser() {
      const supabase = await createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();
      setUser(user);
    }
    getUser();
  }, []);

  // Function to change tabs and update URL
  const handleTabChange = (newTab: string) => {
    setActiveTab(newTab);
    router.push(`/dashboard?tab=${newTab}`, { scroll: false });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col lg:flex-row">
      {/* Sidebar */}
      <DashboardSidebar
        activeTab={activeTab}
        onTabChange={handleTabChange}
        onSettingsClick={() => setShowSettings(true)}
      />

      {/* Main Content */}
      <DashboardContent activeTab={activeTab} />

      {/* Settings Modal */}
      {showSettings && (
        <SettingsModal user={user} onClose={() => setShowSettings(false)} />
      )}
    </div>
  );
}