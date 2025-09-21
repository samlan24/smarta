"use client";
import { useState, useEffect } from 'react';
import { User, Mail, Calendar, Trash2, AlertTriangle } from 'lucide-react';
import { createBrowserClient } from "@supabase/ssr";

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

interface AccountTabProps {
  user: any;
  subscription: any; // Add subscription prop
}

interface UserProfile {
  id: string;
  user_id: string;
  full_name: string | null;
  company: string | null;
  job_title: string | null;
  preferred_commit_style: string;
  timezone: string;
  email_notifications: boolean;
  created_at: string;
  updated_at: string;
  email: string; // From auth.users
}

export function AccountTab({ user, subscription }: AccountTabProps) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await fetch('/api/user/profile');
        if (response.ok) {
          const data = await response.json();
          setProfile(data.profile);
        }
      } catch (error) {
        console.error('Failed to fetch profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const canDeleteAccount = () => {
    if (!subscription) return true;

    const now = new Date();
    const periodEnd = subscription.period_end ? new Date(subscription.period_end) : null;

    // Can delete if subscription is expired or not active
    return (
      subscription.status === "expired" ||
      (subscription.status === "cancelled" && periodEnd && now > periodEnd) ||
      subscription.plan === "free"
    );
  };

  const handleSubscriptionAction = async () => {
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

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== 'DELETE') {
      return;
    }

    setIsDeleting(true);

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session?.access_token) {
        alert("Please log in to delete your account");
        return;
      }

      const response = await fetch('/api/account/delete', {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (response.ok) {
        await supabase.auth.signOut();
        window.location.href = '/';
      } else {
        const data = await response.json();
        alert(`Error: ${data.error || "Failed to delete account"}`);
      }
    } catch (error) {
      console.error('Delete account error:', error);
      alert('Unable to delete account');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="bg-gray-50 rounded-lg p-4 animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-6">
        <div className="bg-red-50 rounded-lg p-4">
          <p className="text-red-600">Failed to load profile information</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Account Information */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <User size={20} />
          Account Information
        </h3>

        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Mail size={16} className="text-gray-400" />
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-medium text-gray-600">{user?.email || profile.email || 'Not available'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <User size={16} className="text-gray-400" />
            <div>
              <p className="text-sm text-gray-600">Full Name</p>
              <p className="font-medium text-gray-600">
                {profile.full_name || 'Not set'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Calendar size={16} className="text-gray-400" />
            <div>
              <p className="text-sm text-gray-600">Member Since</p>
              <p className="font-medium text-gray-600">
                {user?.created_at
                  ? new Date(user.created_at).toLocaleDateString()
                  : profile.created_at
                  ? new Date(profile.created_at).toLocaleDateString()
                  : 'Not available'
                }
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Account Actions */}
      <div className="space-y-4">
        <h3 className="font-semibold text-gray-900">Account Actions</h3>
      </div>

      {/* Danger Zone */}
      <div className="border border-red-200 rounded-lg p-4 bg-red-50">
        <h3 className="font-semibold text-red-900 mb-4 flex items-center gap-2">
          <AlertTriangle size={20} />
          Danger Zone
        </h3>

        {!canDeleteAccount() ? (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-red-900 mb-2">Delete Account</h4>
              <div className="bg-red-100 border border-red-300 rounded-lg p-4 mb-3">
                <p className="text-red-800 mb-3">
                  {subscription?.status === "cancelled"
                    ? `Your subscription is cancelled but you still have access until ${new Date(
                        subscription.period_end
                      ).toLocaleDateString()}. Account deletion will be available after your subscription period ends.`
                    : subscription?.status === "active"
                    ? "You must cancel your active subscription before deleting your account."
                    : "You must resolve your subscription status before deleting your account."}
                </p>
                <button
                  onClick={handleSubscriptionAction}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  {subscription?.status === "cancelled"
                    ? "View Subscription Details"
                    : "Manage Subscription"}
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-red-900 mb-2">Delete Account</h4>
              <p className="text-sm text-red-700 mb-3">
                Permanently delete your account and all associated data. This action cannot be undone.
              </p>

              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                >
                  <Trash2 size={16} />
                  Delete Account
                </button>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm font-medium text-red-900">
                    Type "DELETE" to confirm account deletion:
                  </p>
                  <input
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="Type DELETE here"
                    className="w-full p-2 border text-gray-900 border-red-300 rounded-md focus:ring-2 focus:ring-red-500 focus:border-transparent"
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleDeleteAccount}
                      disabled={deleteConfirmText !== 'DELETE' || isDeleting}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {isDeleting ? 'Deleting...' : 'Confirm Delete'}
                    </button>
                    <button
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setDeleteConfirmText('');
                      }}
                      className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}