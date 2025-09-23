"use client";

import { useState, useEffect } from "react";
import {
  Github,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { createClient } from "@/app/lib/supabase/client";

interface GitHubIntegration {
  id: string;
  platform: string;
  username: string;
  avatar_url: string;
  connected_at: string;
  last_sync_at: string | null;
  is_active: boolean;
}

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string;
  private: boolean;
  updated_at: string;
  language: string;
  stars: number;
  forks: number;
  last_sync_at?: string | null;
  stats?: {
    commits: number;
    aiCommits: number;
    manualCommits: number;
    aiPercentage: number;
    qualityScore: number;
  };
}

export default function GitHubIntegration() {
  const [integration, setIntegration] = useState<GitHubIntegration | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncingRepo, setSyncingRepo] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [repositories, setRepositories] = useState<GitHubRepo[]>([]);
  const [syncedRepos, setSyncedRepos] = useState<GitHubRepo[]>([]);
  const [showRepoSelector, setShowRepoSelector] = useState(false);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [planInfo, setPlanInfo] = useState<{
    planName: string;
    githubSyncLimit: number;
  } | null>(null);

  const supabase = createClient();

  useEffect(() => {
    fetchIntegrationStatus();

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get("connected") === "github") {
      handlePostConnection();
    } else if (urlParams.get("error")) {
      const errorType = urlParams.get("error");
      const errorMessages: Record<string, string> = {
        no_code: "GitHub authorization was cancelled",
        token_exchange_failed: "Failed to exchange authorization code",
        github_api_failed: "Failed to fetch GitHub user information",
        not_authenticated: "Please sign in first before connecting GitHub",
        update_failed: "Failed to update GitHub integration",
        create_failed: "Failed to create GitHub integration",
        callback_failed: "GitHub connection failed",
      };
      setError(errorMessages[errorType || ""] || "GitHub connection failed");
      window.history.replaceState({}, "", "/dashboard?tab=integrations");
    }
  }, []);

  useEffect(() => {
    if (integration) {
      fetchSyncedRepositories();
    }
  }, [integration]);

  const handlePostConnection = async () => {
    try {
      await fetchIntegrationStatus();
      window.history.replaceState({}, "", "/dashboard?tab=integrations");
    } catch (error) {
      console.error("Error handling post-connection:", error);
    }
  };

  const fetchIntegrationStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/integrations/status");
      if (response.ok) {
        const data = await response.json();
        setIntegration(data.github || null);
      } else {
        console.error("Failed to fetch integration status");
      }
    } catch (error) {
      console.error("Error fetching integration status:", error);
      setError("Failed to load integration status");
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      setError(null);
      const connectResponse = await fetch("/api/integrations/github/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      if (connectResponse.ok) {
        const data = await connectResponse.json();
        if (data.requiresOAuth) {
          initiateOAuthFlow();
        } else if (data.success) {
          await fetchIntegrationStatus();
        }
        return;
      }
      initiateOAuthFlow();
    } catch (error) {
      console.error("GitHub connection error:", error);
      initiateOAuthFlow();
    }
  };

  const initiateOAuthFlow = () => {
    const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
    if (!clientId) {
      setError("GitHub integration not configured");
      return;
    }
    const scope = "repo user:email";
    const redirectUri = `${window.location.origin}/api/integrations/github/oauth-callback`;
    const state = Math.random().toString(36).substring(7);
    sessionStorage.setItem("github_oauth_state", state);
    const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=${scope}&redirect_uri=${redirectUri}&state=${state}&prompt=consent`;
    window.location.href = githubAuthUrl;
  };

  const fetchRepositories = async () => {
    if (!integration) return;

    if (showRepoSelector) {
      setShowRepoSelector(false);
      return;
    }

    setLoadingRepos(true);
    try {
      const response = await fetch("/api/integrations/github/repositories");
      if (response.ok) {
        const data = await response.json();

        // Store plan info from the API response
        setPlanInfo(data.planInfo);

        const filteredRepos = data.repositories.filter(
          (repo: GitHubRepo) =>
            !syncedRepos.some((sr) => sr.full_name === repo.full_name)
        );
        setRepositories(filteredRepos);
        setShowRepoSelector(true);
      } else {
        setError("Failed to fetch repositories");
      }
    } catch {
      setError("Network error fetching repositories");
    } finally {
      setLoadingRepos(false);
    }
  };

  const addAndSyncRepo = async (repo: GitHubRepo) => {
    setError(null);
    setShowRepoSelector(false);

    // Use plan-aware limit instead of hardcoded 3
    const maxRepos = planInfo?.githubSyncLimit || 1;

    if (syncedRepos.length >= maxRepos) {
      setError(
        `Repository sync limit reached (${maxRepos} ${
          maxRepos === 1 ? "repository" : "repositories"
        } for ${planInfo?.planName || "Free"} plan). ${
          planInfo?.planName === "Free"
            ? "Upgrade to Pro for more repositories."
            : ""
        }`
      );
      return;
    }

    if (syncedRepos.find((r) => r.full_name === repo.full_name)) {
      setError("Repository already synced");
      return;
    }

    setSyncedRepos((prev) => [...prev, { ...repo, last_sync_at: null }]);
    await syncSingleRepo(repo.full_name);
  };

  const syncSingleRepo = async (repoFullName: string) => {
    if (!integration) return;

    setSyncing(true);
    setSyncingRepo(repoFullName);
    setError(null);

    try {
      const response = await fetch("/api/integrations/github/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ repositories: [repoFullName], syncDays: 30 }),
      });
      const result = await response.json();

      if (response.ok) {
        await fetchSyncedRepositories();
      } else {
        setError(result.error || "Sync failed");
      }
    } catch (err) {
      setError("Network error during sync");
      console.error("Sync error:", err);
    } finally {
      setSyncing(false);
      setSyncingRepo(null);
    }
  };

  const handleDisconnect = async () => {
    if (
      !confirm(
        "Are you sure you want to disconnect GitHub? This will remove all synced data."
      )
    )
      return;

    try {
      const response = await fetch("/api/integrations/github/disconnect", {
        method: "POST",
      });
      if (response.ok) {
        setIntegration(null);
        setSyncedRepos([]);
        setError(null);
      } else {
        setError("Failed to disconnect GitHub");
      }
    } catch (err) {
      setError("Network error during disconnect");
      console.error("Disconnect error:", err);
    }
  };

  const fetchSyncedRepositories = async () => {
    try {
      const response = await fetch(
        "/api/integrations/github/synced-repositories"
      );
      if (response.ok) {
        const data = await response.json();
        setSyncedRepos(data.repositories || []);
      }
    } catch (error) {
      console.error("Error fetching synced repositories:", error);
    }
  };

  const getQualityExplanation = (score: number) => {
    if (score >= 80) {
      return {
        color: "text-green-700 bg-green-50 border-green-200",
        icon: "🎯",
        title: "Excellent Quality",
        message:
          "Your commits follow best practices with clear, structured messages using conventional commit formats.",
      };
    } else if (score >= 65) {
      return {
        color: "text-blue-700 bg-blue-50 border-blue-200",
        icon: "👍",
        title: "Good Quality",
        message:
          "Most of your commits are well-structured. Consider using conventional commit formats more consistently.",
      };
    } else if (score >= 50) {
      return {
        color: "text-yellow-700 bg-yellow-50 border-yellow-200",
        icon: "⚠️",
        title: "Room for Improvement",
        message:
          'Your commits could be more descriptive. Try using formats like "feat: add user authentication" or "fix: resolve login bug".',
      };
    } else {
      return {
        color: "text-red-700 bg-red-50 border-red-200",
        icon: "📝",
        title: "Needs Attention",
        message:
          'Consider writing more detailed commit messages. Avoid short messages like "fix" or "update". Be specific about what changed and why.',
      };
    }
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-full"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex items-center gap-3 mb-6">
        <Github className="text-gray-700" size={24} />
        <h3 className="text-lg font-semibold text-gray-800">
          GitHub Integration
        </h3>
      </div>

      {!integration ? (
        <div className="text-center py-8">
          <Github className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">
            Connect Your GitHub Account
          </h4>
          <p className="text-gray-600 mb-6 text-sm sm:text-base">
            Analyze your commit patterns and see how AI-generated commits
            compare to manual ones.
          </p>
          <button
            onClick={handleConnect}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors w-full sm:w-auto"
          >
            <Github size={20} />
            Connect GitHub
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Connected Status Card */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200 gap-3">
            <div className="flex items-center gap-3">
              <img
                src={integration.avatar_url}
                alt={integration.username}
                className="w-10 h-10 rounded-full flex-shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="font-medium text-gray-900 truncate">
                  @{integration.username}
                </p>
                <p className="text-sm text-gray-600">
                  Connected{" "}
                  {new Date(integration.connected_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <CheckCircle className="text-green-600" size={20} />
              <span className="text-sm font-medium text-green-700">
                Connected
              </span>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-6 space-y-6">
            {/* Header with Add Repository Button */}
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
              <h4 className="font-medium text-gray-900">Synced Repositories</h4>
              <button
                onClick={fetchRepositories}
                disabled={syncing}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors w-full sm:w-auto"
              >
                <Github size={16} />
                Add Repository
              </button>
            </div>

            {/* Plan Information */}
            {planInfo && (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      {planInfo.planName} Plan
                    </p>
                    <p className="text-xs text-gray-600">
                      {syncedRepos.length}/{planInfo.githubSyncLimit}{" "}
                      repositories synced
                    </p>
                  </div>
                  {planInfo.planName === "Free" &&
                    syncedRepos.length >= planInfo.githubSyncLimit && (
                      <div className="text-center sm:text-right">
                        <p className="text-xs text-orange-600 font-medium">
                          Limit reached
                        </p>
                        <button className="text-xs text-blue-600 hover:text-blue-800 underline">
                          Upgrade to Pro
                        </button>
                      </div>
                    )}
                </div>
              </div>
            )}

            {/* Repository Selector */}
            {showRepoSelector && (
              <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50 max-h-72 overflow-y-auto">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-3 gap-2">
                  <h5 className="font-medium text-gray-900">
                    Select a repository to sync:
                  </h5>
                  {planInfo && (
                    <p className="text-xs text-gray-600">
                      {syncedRepos.length}/{planInfo.githubSyncLimit} used
                    </p>
                  )}
                </div>

                {/* Warning for free users at limit */}
                {planInfo &&
                  planInfo.planName === "Free" &&
                  syncedRepos.length >= planInfo.githubSyncLimit && (
                    <div className="mb-3 p-2 bg-orange-50 border border-orange-200 rounded text-xs text-orange-700">
                      Repository limit reached. Upgrade to Pro to sync more
                      repositories.
                    </div>
                  )}

                {loadingRepos ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="animate-spin" size={20} />
                    <span className="ml-2 text-sm text-gray-600">
                      Loading repositories...
                    </span>
                  </div>
                ) : repositories.length === 0 ? (
                  <p className="text-sm text-gray-600">
                    No available repositories to add.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {repositories.map((repo) => (
                      <li
                        key={repo.id}
                        className="p-3 cursor-pointer hover:bg-white rounded border border-transparent hover:border-gray-200 transition-colors"
                        onClick={() => addAndSyncRepo(repo)}
                      >
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2">
                          <div className="min-w-0 flex-1">
                            <div className="font-medium text-gray-900 truncate">
                              {repo.name}
                            </div>
                            {repo.description && (
                              <div className="text-xs text-gray-500 line-clamp-2 sm:line-clamp-1 mt-1">
                                {repo.description}
                              </div>
                            )}
                            <div className="flex flex-wrap gap-2 mt-2">
                              {repo.private && (
                                <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs">
                                  Private
                                </span>
                              )}
                              {repo.language && (
                                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                                  {repo.language}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="text-xs text-gray-400 flex-shrink-0 self-start">
                            ⭐ {repo.stars}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
                <div className="flex justify-end mt-3">
                  <button
                    onClick={() => setShowRepoSelector(false)}
                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {/* Synced Repositories */}
            <div className="space-y-4">
              {syncedRepos.map((repo) => (
                <div
                  key={repo.full_name}
                  className="p-4 border border-gray-200 rounded-lg space-y-4"
                >
                  {/* Repository Header */}
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <h5 className="font-semibold text-gray-900 truncate">
                        {repo.name}
                      </h5>
                      {repo.description && (
                        <p className="text-sm text-gray-500 line-clamp-2 mt-1">
                          {repo.description}
                        </p>
                      )}

                      {/* Repository metadata */}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {repo.private && (
                          <span className="bg-gray-200 text-gray-700 px-2 py-1 rounded text-xs">
                            Private
                          </span>
                        )}
                        {repo.language && (
                          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs">
                            {repo.language}
                          </span>
                        )}
                        <span className="text-xs text-gray-500">
                          ⭐ {repo.stars}
                        </span>
                        <span className="text-xs text-gray-500">
                          🍴 {repo.forks}
                        </span>
                      </div>

                      <p className="mt-2 text-xs text-gray-500">
                        Last synced:{" "}
                        {repo.last_sync_at
                          ? new Date(repo.last_sync_at).toLocaleString()
                          : "Never"}
                      </p>
                    </div>

                    {/* Action Button */}
                    <div className="flex-shrink-0 w-full sm:w-auto">
                      <button
                        onClick={() => syncSingleRepo(repo.full_name)}
                        disabled={syncing}
                        className="inline-flex items-center justify-center gap-2 px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto text-sm"
                      >
                        {syncing && syncingRepo === repo.full_name ? (
                          <>
                            <RefreshCw className="animate-spin" size={16} />
                            Syncing...
                          </>
                        ) : (
                          <>
                            <RefreshCw size={16} />
                            Resync
                          </>
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Repository Stats */}
                  {repo.stats && (
                    <div className="space-y-4">
                      {/* Stats Grid - Responsive */}
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                        <div className="bg-blue-50 p-3 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <CheckCircle className="text-blue-600" size={14} />
                            <span className="text-xs text-gray-600">Total</span>
                          </div>
                          <p className="text-lg sm:text-xl font-bold text-blue-600">
                            {repo.stats.commits}
                          </p>
                        </div>

                        <div className="bg-purple-50 p-3 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <CheckCircle
                              className="text-purple-600"
                              size={14}
                            />
                            <span className="text-xs text-gray-600">
                              Manual
                            </span>
                          </div>
                          <p className="text-lg sm:text-xl font-bold text-purple-600">
                            {repo.stats.manualCommits}
                          </p>
                        </div>

                        <div className="bg-indigo-50 p-3 rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            <CheckCircle
                              className="text-indigo-600"
                              size={14}
                            />
                            <span className="text-xs text-gray-600">AI</span>
                          </div>
                          <p className="text-lg sm:text-xl font-bold text-indigo-600">
                            {repo.stats.aiCommits}
                          </p>
                        </div>

                        <div className="bg-emerald-50 p-3 rounded-lg col-span-2 lg:col-span-1">
                          <div className="flex items-center gap-2 mb-1">
                            <CheckCircle
                              className="text-emerald-600"
                              size={14}
                            />
                            <span className="text-xs text-gray-600">
                              Quality Score
                            </span>
                          </div>
                          <p className="text-lg sm:text-xl font-bold text-emerald-600">
                            {repo.stats.qualityScore}/100
                          </p>
                        </div>
                      </div>

                      {/* Quality Explanation */}
                      <div
                        className={`p-3 rounded-lg border ${
                          getQualityExplanation(repo.stats.qualityScore).color
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                          <span className="text-xl flex-shrink-0 self-center sm:self-start">
                            {
                              getQualityExplanation(repo.stats.qualityScore)
                                .icon
                            }
                          </span>
                          <div className="min-w-0 flex-1 text-center sm:text-left">
                            <h6 className="font-medium text-sm">
                              {
                                getQualityExplanation(repo.stats.qualityScore)
                                  .title
                              }
                            </h6>
                            <p className="text-sm mt-1 leading-relaxed">
                              {
                                getQualityExplanation(repo.stats.qualityScore)
                                  .message
                              }
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle
                  className="text-red-600 flex-shrink-0 mt-0.5"
                  size={16}
                />
                <span className="text-sm text-red-700 leading-relaxed">
                  {error}
                </span>
              </div>
            )}
          </div>

          {/* Disconnect Button */}
          <div className="border-t border-gray-200 pt-6">
            <button
              onClick={handleDisconnect}
              className="text-red-600 hover:text-red-700 text-sm font-medium w-full sm:w-auto text-center"
            >
              Disconnect GitHub
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
