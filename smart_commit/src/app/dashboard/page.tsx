"use client";
import { createClient } from "../lib/supabase/client";
import { SettingsModal } from "../components/dashboard/SettingsModal";
import { DashboardSidebar } from "../components/dashboard/DashboardSidebar";
import { DashboardContent } from "../components/dashboard/DashboardContent";
import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";

export default function DashboardPage() {
  const [showSettings, setShowSettings] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [user, setUser] = useState<User | null>(null);

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

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <DashboardSidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
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
