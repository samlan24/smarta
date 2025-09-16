"use client";
import { Settings } from 'lucide-react';

interface SettingsButtonProps {
  onClick: () => void;
}

export default function SettingsButton({ onClick }: SettingsButtonProps) {
  return (
    <button
      onClick={onClick}
      className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
      title="Settings"
    >
      <Settings size={20} />
    </button>
  );
}