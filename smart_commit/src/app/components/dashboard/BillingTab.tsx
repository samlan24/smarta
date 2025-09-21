"use client";
import { CreditCard, Crown } from 'lucide-react';
import { useState, useEffect } from 'react';
import Link from "next/link";

interface BillingTabProps {
  user: any; // Replace with your User type
}

interface UsageData {
  subscription: {
    plan: string;
    usageCount: number;
    usageLimit: number;
    resetDate: string;
  };
}

export function BillingTab({ user }: BillingTabProps) {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsageData = async () => {
      try {
        const response = await fetch('/api/usage');
        if (response.ok) {
          const data = await response.json();
          setUsage(data);
        }
      } catch (error) {
        console.error('Failed to fetch usage data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsageData();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-gray-50 rounded-lg p-4 animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-3"></div>
          <div className="h-4 bg-gray-200 rounded mb-2"></div>
          <div className="h-4 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (!usage) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 rounded-lg p-4">
          <p className="text-red-600">Failed to load billing information</p>
        </div>
      </div>
    );
  }

  const currentPlan = usage.subscription.plan;
  const monthlyRequests = usage.subscription.usageCount;
  const requestLimit = usage.subscription.usageLimit;
  const resetDate = new Date(usage.subscription.resetDate).toLocaleDateString();
  return (
    <div className="space-y-6">
      {/* Current Plan */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center gap-3 mb-3">
          <Crown className="text-yellow-500" size={24} />
          <div>
            <h3 className="font-semibold text-gray-900">Current Plan</h3>
            <p className="text-sm text-gray-600">{currentPlan} Plan</p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Monthly Requests</span>
            <span className="font-medium text-gray-600">{monthlyRequests}/{requestLimit}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Max Requests</span>
            <span className="font-medium text-gray-600">{requestLimit}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Resets</span>
            <span className="font-medium text-gray-600">{resetDate}</span>
          </div>
        </div>
      </div>

      {/* Upgrade Section */}
      {currentPlan === "free" && (
        <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
          <div className="flex items-start gap-3">
            <CreditCard className="text-blue-600 mt-1" size={20} />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-2">
                Upgrade to Pro
              </h3>
              <ul className="text-sm text-blue-800 space-y-1 mb-4">
                <li>• 1,000 requests per month</li>
                <li>• Priority support</li>
                <li>• Advanced templates</li>
                <li>• Custom commit styles</li>
              </ul>
              <Link href="/upgrade">
              <button

                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Upgrade to Pro - $9/month
              </button>
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Billing History */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Billing History</h3>
        <div className="text-center py-8 text-gray-500">
          <CreditCard size={48} className="mx-auto mb-3 text-gray-300" />
          <p>No billing history yet</p>
          <p className="text-sm">Invoices will appear here after your first payment</p>
        </div>
      </div>
    </div>
  );
}