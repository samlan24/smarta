"use client";
import { CreditCard, Crown } from 'lucide-react';

interface BillingTabProps {
  user: any; // Replace with your User type
}

export function BillingTab({ user }: BillingTabProps) {
  // You'll need to fetch actual plan data from your backend
  const currentPlan = "Free"; // This should come from user data
  const monthlyRequests = 0; // This should come from usage stats
  const requestLimit = 100; // This should come from plan data

  const handleUpgrade = () => {
    // Implement your upgrade logic (redirect to Stripe, etc.)
    console.log("Upgrade clicked");
  };

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

        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Monthly Requests</span>
            <span className="font-medium">{monthlyRequests}/{requestLimit}</span>
          </div>

          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full"
              style={{ width: `${(monthlyRequests / requestLimit) * 100}%` }}
            ></div>
          </div>

          <p className="text-xs text-gray-500">
            Resets on the 1st of each month
          </p>
        </div>
      </div>

      {/* Upgrade Section */}
      {currentPlan === "Free" && (
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
              <button
                onClick={handleUpgrade}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Upgrade to Pro - $9/month
              </button>
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