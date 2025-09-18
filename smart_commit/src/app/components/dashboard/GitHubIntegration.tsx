"use client";

import { useState, useEffect } from "react";
import {
  Github,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  GitBranch,
  Clock,
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
  };
}

interface RepoSyncStat {
  repoFullName: string;
  commits: number;
  aiCommits: number;
  manualCommits: number;
}
interface RepoStat {
  repoFullName: string;
  commits: number;
  aiCommits: number;
  manualCommits: number;
}

interface SyncStats {
  repositories: number;
  commits: number;
  aiCommits: number;
  manualCommits: number;
  syncedRepositories?: number;
  syncedCommits?: number;
  syncPeriod?: string;
  repoStats?: RepoStat[];
}

export default function GitHubIntegration() {
  const [integration, setIntegration] = useState<GitHubIntegration | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [syncingRepo, setSyncingRepo] = useState<string | null>(null); // which repo is currently syncing
  const [error, setError] = useState<string | null>(null);
  const [syncStats, setSyncStats] = useState<SyncStats | null>(null);
  const [repositories, setRepositories] = useState<GitHubRepo[]>([]);
  const [syncedRepos, setSyncedRepos] = useState<GitHubRepo[]>([]);
  const [showRepoSelector, setShowRepoSelector] = useState(false);
  const [loadingRepos, setLoadingRepos] = useState(false);

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
      fetchSyncStats();
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

  const fetchSyncStats = async () => {
    try {
      const response = await fetch("/api/integrations/sync-stats");
      if (response.ok) {
        const data = await response.json();
        setSyncStats(data);
      }
    } catch (error) {
      console.error("Error fetching sync stats:", error);
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
    setLoadingRepos(true);
    try {
      const response = await fetch("/api/integrations/github/repositories");
      if (response.ok) {
        const data = await response.json();

        console.log("All repos:", data.repositories.length);
        console.log("Synced repos:", syncedRepos.length);
        console.log(
          "Synced repo names:",
          syncedRepos.map((r) => r.full_name)
        );
        // Filter out repos already synced
        const filteredRepos = data.repositories.filter(
          (repo: GitHubRepo) =>
            !syncedRepos.some((sr) => sr.full_name === repo.full_name)
        );
        setRepositories(filteredRepos);
        setShowRepoSelector(true);
      } else {
        setError("Failed to fetch repositories");
      }
    } catch (err) {
      setError("Network error fetching repositories");
    } finally {
      setLoadingRepos(false);
    }
  };

  const addAndSyncRepo = async (repo: GitHubRepo) => {
    setError(null);
    setShowRepoSelector(false);
    if (syncedRepos.length >= 3) {
      setError("Maximum of 3 repositories can be synced");
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
        setSyncStats(null);
        setSyncedRepos([]);
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
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
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
          <p className="text-gray-600 mb-6">
            Analyze your commit patterns and see how AI-generated commits
            compare to manual ones.
          </p>
          <button
            onClick={handleConnect}
            className="inline-flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 transition-colors"
          >
            <Github size={20} />
            Connect GitHub
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Connected Account Info */}
          <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
            <div className="flex items-center gap-3">
              <img
                src={integration.avatar_url}
                alt={integration.username}
                className="w-10 h-10 rounded-full"
              />
              <div>
                <p className="font-medium text-gray-900">
                  @{integration.username}
                </p>
                <p className="text-sm text-gray-600">
                  Connected{" "}
                  {new Date(integration.connected_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="text-green-600" size={20} />
              <span className="text-sm font-medium text-green-700">
                Connected
              </span>
            </div>
          </div>

          {/* Sync Section */}
          <div className="border-t border-gray-200 pt-6 space-y-6">
            {/* Add Repository Button */}
            <div className="flex justify-between items-center">
              <h4 className="font-medium text-gray-900">Synced Repositories</h4>
              <button
                onClick={fetchRepositories}
                disabled={syncedRepos.length >= 3 || syncing}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <Github size={16} />
                Add Repository
              </button>
            </div>

            {/* Repo Selector Modal/Panel */}
            {showRepoSelector && (
              <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50 max-h-72 overflow-y-auto">
                <h5 className="font-medium text-gray-900 mb-3">
                  Select a repository to sync:
                </h5>
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
                  <ul>
                    {repositories.map((repo) => (
                      <li
                        key={repo.id}
                        className="p-2 cursor-pointer hover:bg-white rounded flex justify-between items-center"
                        onClick={() => addAndSyncRepo(repo)}
                      >
                        <div>
                          <div className="font-medium text-gray-900">
                            {repo.name}
                          </div>
                          <div className="text-xs text-gray-500 truncate max-w-xs">
                            {repo.description}
                          </div>
                          <div className="text-xs text-gray-400 flex gap-2 mt-1">
                            {repo.private && (
                              <span className="bg-gray-200 px-1 rounded">
                                Private
                              </span>
                            )}
                            {repo.language && (
                              <span className="bg-blue-100 text-blue-700 px-1 rounded">
                                {repo.language}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-xs text-gray-400">
                          ⭐ {repo.stars}
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

            {/* Synced Repositories Display */}
            {syncedRepos.map((repo) => (
              <div
                key={repo.full_name}
                className="p-4 border border-gray-200 rounded-lg flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3"
              >
                <div>
                  <h5 className="font-semibold text-gray-900">{repo.name}</h5>
                  <p className="text-xs text-gray-500 truncate max-w-md">
                    {repo.description}
                  </p>
                  {/* Existing repo detail badges */}
                  <div className="text-xs text-gray-400 flex gap-2 mt-1">
                    {repo.private && (
                      <span className="bg-gray-200 px-1 rounded">Private</span>
                    )}
                    {repo.language && (
                      <span className="bg-blue-100 text-blue-700 px-1 rounded">
                        {repo.language}
                      </span>
                    )}
                    <span>⭐ {repo.stars}</span>
                    <span>🍴 {repo.forks}</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    Last synced:{" "}
                    {repo.last_sync_at
                      ? new Date(repo.last_sync_at).toLocaleString()
                      : "Never"}
                  </p>
                  {repo.stats && (
                    <div className="grid grid-cols-3 gap-2 mt-3">
                      <div className="bg-green-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="text-green-600" size={16} />
                          <span className="text-sm text-gray-600">Total</span>
                        </div>
                        <p className="text-xl font-bold text-green-600">
                          {repo.stats.commits}
                        </p>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="text-green-600" size={16} />
                          <span className="text-sm text-gray-600">Manual</span>
                        </div>
                        <p className="text-xl font-bold text-green-600">
                          {repo.stats.manualCommits}
                        </p>
                      </div>
                      <div className="bg-green-50 p-3 rounded-lg">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="text-green-600" size={16} />
                          <span className="text-sm text-gray-600">AI</span>
                        </div>
                        <p className="text-xl font-bold text-green-600">
                          {repo.stats.aiCommits}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => syncSingleRepo(repo.full_name)}
                    disabled={syncing && syncingRepo === repo.full_name}
                    className="inline-flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
            ))}

            {/* Error message */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <AlertCircle className="text-red-600" size={16} />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            )}
          </div>

          {/* Disconnect Option */}
          <div className="border-t border-gray-200 pt-6">
            <button
              onClick={handleDisconnect}
              className="text-red-600 hover:text-red-700 text-sm font-medium"
            >
              Disconnect GitHub
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
