"use client";
import {
  BarChart3,
  TrendingUp,
  Activity,
  FileText,
  Key,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
  Clock,
  Github
} from 'lucide-react';
import SignOutButton from '../auth/SignOutButton';
import SettingsButton from './SettingsButton';
import { useState } from 'react';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onSettingsClick: () => void;
}

const tabs = [
  {
    id: 'overview',
    name: 'Overview',
    icon: BarChart3,
    description: 'Dashboard summary and key metrics'
  },
  {
    id: 'analytics',
    name: 'Analytics',
    icon: TrendingUp,
    description: 'Code changes and file activity analysis'
  },
  {
    id: 'health',
    name: 'Repository Health',
    icon: Shield,
    description: 'Repository health metrics and code quality'
  },
  {
    id: 'usage',
    name: 'Usage',
    icon: Activity,
    description: 'API usage and billing information'
  },
  {
    id: 'templates',
    name: 'Templates',
    icon: FileText,
    description: 'Commit message templates and preferences'
  },
  {
    id: 'integrations',
    name: 'Git Integrations',
    icon: Github,
    description: 'Connect GitHub and analyze commit patterns'
  },
  {
    id: 'api-keys',
    name: 'API Keys',
    icon: Key,
    description: 'Manage your API keys and authentication'
  },
  {
    id: 'activity',
    name: 'Recent Activity',
    icon: Clock,
    description: 'Recent commits and system activity'
  }
];

export function DashboardSidebar({ activeTab, onTabChange, onSettingsClick }: SidebarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleTabChange = (tab: string) => {
    onTabChange(tab);
    setIsMobileMenuOpen(false); // Close mobile menu after selection
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="p-2 bg-white border border-gray-200 rounded-lg shadow-sm"
        >
          {isMobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50 w-64 bg-white border-r border-gray-200 flex flex-col h-screen
        transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-600 mt-1">Cmarta-commit</p>
        </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {tabs.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => handleTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                isActive
                  ? 'bg-blue-50 text-blue-700 border border-blue-200'
                  : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon
                size={20}
                className={isActive ? 'text-blue-600' : 'text-gray-500'}
              />
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium ${isActive ? 'text-blue-700' : 'text-gray-900'}`}>
                  {item.name}
                </p>
                <p className={`text-xs ${isActive ? 'text-blue-600' : 'text-gray-500'} truncate`}>
                  {item.description}
                </p>
              </div>
            </button>
          );
        })}
      </nav>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-gray-200 space-y-2">
        <SettingsButton
          onClick={onSettingsClick}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors"
        >
          <Settings size={20} className="text-gray-500" />
          <span className="text-sm font-medium">Settings</span>
        </SettingsButton>

        <div className="w-full">
          <SignOutButton className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-red-700 hover:bg-red-50 hover:text-red-800 transition-colors">
            <LogOut size={20} className="text-red-500" />
            <span className="text-sm font-medium">Sign Out</span>
          </SignOutButton>
        </div>
      </div>
    </div>
    </>
  );
}
