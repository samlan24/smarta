"use client";
import { CreditCard, Crown } from "lucide-react";
import { useState, useEffect } from "react";
import Link from "next/link";
import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface BillingTabProps {
  user: any;
  subscription: any;
  loading?: boolean;
}

interface UsageData {
  subscription: {
    plan: string;
    usageCount: number;
    usageLimit: number;
    resetDate: string;
  };
}

export function BillingTab({ user, subscription, loading: propLoading }: BillingTabProps) {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUsageData = async () => {
      try {
        const response = await fetch("/api/usage");
        if (response.ok) {
          const data = await response.json();
          setUsage(data);
        }
      } catch (error) {
        console.error("Failed to fetch usage data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsageData();
  }, []);

  const handleSubscriptionAction = async (actionType: string) => {
    try {
      // Get fresh session client-side
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        alert("Please log in to manage your subscription");
        return;
      }

      const response = await fetch("/api/customer-portal", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (data.url) {
        window.open(data.url, "_blank");
      } else {
        alert(`API Error: ${data.error || "Unknown error"}`);
      }
    } catch (error) {
      console.error("Portal error:", error);
      alert("Unable to open subscription portal");
    }
  };

  if (loading || propLoading) {
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

  // Helper functions for subscription status
  const getStatusDisplay = () => {
    if (!subscription) return { text: "No subscription", color: "text-gray-400" };

    switch (subscription.status) {
      case "active":
        return { text: "Active", color: "text-green-600" };
      case "cancelled":
        return {
          text: "Cancelled (Active until period end)",
          color: "text-yellow-600",
        };
      case "past_due":
        return {
          text: "Payment Failed - Please Update",
          color: "text-red-600",
        };
      case "expired":
        return { text: "Expired", color: "text-red-600" };
      default:
        return { text: subscription.status ?? "Unknown", color: "text-gray-400" };
    }
  };

  const statusDisplay = getStatusDisplay();
  const periodEndDate = subscription?.period_end ? new Date(subscription.period_end) : null;
  const now = new Date();
  const hasActiveAccess = subscription && (
    subscription.status === "active" ||
    (subscription.status === "cancelled" && periodEndDate && now <= periodEndDate) ||
    subscription.status === "past_due"
  );

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
            <span className="font-medium text-gray-600">
              {monthlyRequests}/{requestLimit}
            </span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Max Requests</span>
            <span className="font-medium text-gray-600">{requestLimit}</span>
          </div>

          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Resets</span>
            <span className="font-medium text-gray-600">{resetDate}</span>
          </div>

          {subscription && (
            <>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Status</span>
                <span className={`font-medium ${statusDisplay.color}`}>
                  {statusDisplay.text}
                </span>
              </div>

              {subscription.period_end && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Period Ends</span>
                  <span className="font-medium text-gray-600">
                    {periodEndDate?.toLocaleDateString()}
                  </span>
                </div>
              )}

              {/* Days remaining indicator */}
              {hasActiveAccess && periodEndDate && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Days Remaining</span>
                  <span className="font-medium text-gray-600">
                    {Math.max(
                      0,
                      Math.ceil(
                        (periodEndDate.getTime() - now.getTime()) /
                          (1000 * 60 * 60 * 24)
                      )
                    )}{" "}
                    days
                  </span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Dynamic Action Section based on subscription status */}
      {!subscription ? (
        <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
          <div className="flex items-start gap-3">
            <CreditCard className="text-blue-600 mt-1" size={20} />
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-2">No active subscription</h3>
              <Link href="/upgrade">
                <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                  Upgrade to Pro
                </button>
              </Link>
            </div>
          </div>
        </div>
      ) : (
        <div>
          {/* Cancelled subscription */}
          {subscription.status === "cancelled" && (
            <div className="space-y-3">
              <div className="bg-yellow-50 border border-yellow-300 text-yellow-800 px-4 py-2 rounded text-sm">
                Your subscription is cancelled but remains active until{" "}
                {periodEndDate?.toLocaleDateString()}
              </div>
              <button
                onClick={() => handleSubscriptionAction("resume")}
                className="w-full bg-green-600 hover:bg-green-700 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Resume Subscription
              </button>
            </div>
          )}

          {/* Payment failed */}
          {subscription.status === "past_due" && (
            <button
              onClick={() => handleSubscriptionAction("update-payment")}
              className="w-full bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded-lg transition-colors"
            >
              Update Payment Method
            </button>
          )}

          {/* Expired or inactive */}
          {(subscription.status === "expired" || !hasActiveAccess) && (
            <Link href="/upgrade">
              <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors">
                Reactivate Subscription
              </button>
            </Link>
          )}

          {/* Free plan active */}
          {subscription.plan === "free" && subscription.status === "active" && (
            <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
              <div className="flex items-start gap-3">
                <CreditCard className="text-blue-600 mt-1" size={20} />
                <div className="flex-1">
                  <h3 className="font-semibold text-blue-900 mb-2">Upgrade to Pro</h3>
                  <ul className="text-sm text-blue-800 space-y-1 mb-4">
                    <li>• 200 requests per month</li>
                    <li>• Priority support</li>
                    <li>• Advanced templates</li>
                    <li>• Custom commit styles</li>
                  </ul>
                  <Link href="/upgrade">
                    <button className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors">
                      Upgrade to Pro - $29/month
                    </button>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Pro plan active */}
          {subscription.plan === "pro" && subscription.status === "active" && (
            <div className="space-y-3">
              <div className="bg-green-50 border border-green-300 text-green-800 px-4 py-2 rounded text-sm">
                You're on the Pro plan - enjoy unlimited features!
              </div>
              <button
                onClick={() => handleSubscriptionAction("manage")}
                className="w-full bg-gray-600 hover:bg-gray-700 text-white py-2 px-4 rounded-lg transition-colors"
              >
                Manage Subscription
              </button>
            </div>
          )}
        </div>
      )}

      {/* Billing History */}
      <div>
        <h3 className="font-semibold text-gray-900 mb-3">Billing History</h3>
        <div className="text-center py-8 text-gray-500">
          <CreditCard size={48} className="mx-auto mb-3 text-gray-300" />
          <p>No billing history yet</p>
          <p className="text-sm">
            Invoices will appear here after your first payment
          </p>
        </div>
      </div>
    </div>
  );
}