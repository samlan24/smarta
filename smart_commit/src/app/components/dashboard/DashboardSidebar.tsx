"use client";
import { 
  BarChart3, 
  FileText, 
  Settings, 
  LogOut, 
  Key, 
  Activity,
  Home,
  TrendingUp
} from 'lucide-react';
import SignOutButton from '../auth/SignOutButton';
import SettingsButton from './SettingsButton';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  onSettingsClick: () => void;
}

const navigationItems = [
  {
    id: 'overview',
    label: 'Overview',
    icon: Home,
    description: 'Usage stats and recent activity'
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: TrendingUp,
    description: 'Code changes and file activity'
  },
  {
    id: 'usage',
    label: 'Usage',
    icon: BarChart3,
    description: 'API usage and billing'
  },
  {
    id: 'templates',
    label: 'Templates',
    icon: FileText,
    description: 'Commit message templates'
  },
  {
    id: 'api-keys',
    label: 'API Keys',
    icon: Key,
    description: 'Manage your API keys'
  },
  {
    id: 'activity',
    label: 'Recent Activity',
    icon: Activity,
    description: 'Recent API calls and logs'
  }
];

export function DashboardSidebar({ activeTab, onTabChange, onSettingsClick }: SidebarProps) {
  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-screen">
      {/* Header */}
      <div className="p-6 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-sm text-gray-600 mt-1">Cmarta-commit</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
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
                  {item.label}
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
  );
}
