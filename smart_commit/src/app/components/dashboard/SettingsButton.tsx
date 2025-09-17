"use client";
import { Settings } from 'lucide-react';

interface SettingsButtonProps {
  onClick: () => void;
  className?: string;
  children?: React.ReactNode;
}

export default function SettingsButton({ onClick, className, children }: SettingsButtonProps) {
  return (
    <button
      onClick={onClick}
      className={className || "p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"}
      title="Settings"
    >
      {children || <Settings size={20} />}
    </button>
  );
}