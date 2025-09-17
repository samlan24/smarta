'use client';

import { useState, useEffect } from 'react';
import { Github, CheckCircle, AlertCircle, Loader2, RefreshCw, GitBranch, Clock } from 'lucide-react';
import { createClient } from '@/app/lib/supabase/client';

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
}

interface SyncStats {
  repositories: number;
  commits: number;
  aiCommits: number;
  manualCommits: number;
  syncedRepositories?: number;
  syncedCommits?: number;
  syncPeriod?: string;
}

export default function GitHubIntegration() {
  const [integration, setIntegration] = useState<GitHubIntegration | null>(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncStats, setSyncStats] = useState<SyncStats | null>(null);
  const [repositories, setRepositories] = useState<GitHubRepo[]>([]);
  const [selectedRepos, setSelectedRepos] = useState<string[]>([]);
  const [showRepoSelector, setShowRepoSelector] = useState(false);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchIntegrationStatus();

    // Check if user just connected GitHub or if there was an error
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('connected') === 'github') {
      handlePostConnection();
    } else if (urlParams.get('error')) {
      const errorType = urlParams.get('error');
      const errorMessages: Record<string, string> = {
        'no_code': 'GitHub authorization was cancelled',
        'token_exchange_failed': 'Failed to exchange authorization code',
        'github_api_failed': 'Failed to fetch GitHub user information',
        'not_authenticated': 'Please sign in first before connecting GitHub',
        'update_failed': 'Failed to update GitHub integration',
        'create_failed': 'Failed to create GitHub integration',
        'callback_failed': 'GitHub connection failed'
      };
      setError(errorMessages[errorType || ''] || 'GitHub connection failed');
      // Clear error from URL
      window.history.replaceState({}, '', '/dashboard?tab=integrations');
    }
  }, []);

  const handlePostConnection = async () => {
    try {
      // Just refresh integration status - the OAuth callback already handled the connection
      await fetchIntegrationStatus();
      // Clear URL params
      window.history.replaceState({}, '', '/dashboard?tab=integrations');
    } catch (error) {
      console.error('Error handling post-connection:', error);
    }
  };

  const fetchIntegrationStatus = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/integrations/status');

      if (response.ok) {
        const data = await response.json();
        setIntegration(data.github || null);
      } else {
        console.error('Failed to fetch integration status');
      }
    } catch (error) {
      console.error('Error fetching integration status:', error);
      setError('Failed to load integration status');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    try {
      // Clear any previous errors
      setError(null);

      // Instead of OAuth, redirect to GitHub OAuth manually to get just the access token
      const clientId = process.env.NEXT_PUBLIC_GITHUB_CLIENT_ID;
      if (!clientId) {
        setError('GitHub integration not configured');
        return;
      }

      const scope = 'repo user:email';
      const redirectUri = `${window.location.origin}/api/integrations/github/oauth-callback`;
      const state = Math.random().toString(36).substring(7); // Simple state for CSRF protection

      // Store state in sessionStorage for verification
      sessionStorage.setItem('github_oauth_state', state);

      // Force GitHub to show authorization again (in case of cached denials)
      const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&scope=${scope}&redirect_uri=${redirectUri}&state=${state}&prompt=consent`;

      console.log('Redirecting to GitHub OAuth:', githubAuthUrl);
      window.location.href = githubAuthUrl;
    } catch (error) {
      setError('Failed to connect to GitHub');
      console.error('GitHub OAuth error:', error);
    }
  };

  const fetchRepositories = async () => {
    if (!integration) return;

    setLoadingRepos(true);
    try {
      const response = await fetch('/api/integrations/github/repositories');
      if (response.ok) {
        const data = await response.json();
        setRepositories(data.repositories);
        setShowRepoSelector(true);
      } else {
        setError('Failed to fetch repositories');
      }
    } catch (err) {
      setError('Network error fetching repositories');
    } finally {
      setLoadingRepos(false);
    }
  };

  const handleSync = async () => {
    if (!integration) return;

    // If no repos selected, show repository selector
    if (selectedRepos.length === 0) {
      await fetchRepositories();
      return;
    }

    setSyncing(true);
    setError(null);

    try {
      const response = await fetch('/api/integrations/github/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          repositories: selectedRepos,
          syncDays: 1
        }),
      });

      const result = await response.json();

      if (response.ok) {
        setSyncStats(result);
        await fetchIntegrationStatus();
        setShowRepoSelector(false);
      } else {
        if (result.requiresRepoSelection) {
          await fetchRepositories();
        } else {
          setError(result.error || 'Sync failed');
        }
      }
    } catch (err) {
      setError('Network error during sync');
      console.error('Sync error:', err);
    } finally {
      setSyncing(false);
    }
  };

  const handleRepoToggle = (repoFullName: string) => {
    setSelectedRepos(prev => {
      if (prev.includes(repoFullName)) {
        return prev.filter(r => r !== repoFullName);
      } else if (prev.length < 3) {
        return [...prev, repoFullName];
      }
      return prev; // Max 3 repos
    });
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect GitHub? This will remove all synced data.')) {
      return;
    }

    try {
      const response = await fetch('/api/integrations/github/disconnect', {
        method: 'POST',
      });

      if (response.ok) {
        setIntegration(null);
        setSyncStats(null);
      } else {
        setError('Failed to disconnect GitHub');
      }
    } catch (err) {
      setError('Network error during disconnect');
      console.error('Disconnect error:', err);
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
        <h3 className="text-lg font-semibold text-gray-800">GitHub Integration</h3>
      </div>

      {!integration ? (
        <div className="text-center py-8">
          <Github className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">Connect Your GitHub Account</h4>
          <p className="text-gray-600 mb-6">
            Analyze your commit patterns and see how AI-generated commits compare to manual ones.
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
                <p className="font-medium text-gray-900">@{integration.username}</p>
                <p className="text-sm text-gray-600">
                  Connected {new Date(integration.connected_at).toLocaleDateString()}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="text-green-600" size={20} />
              <span className="text-sm font-medium text-green-700">Connected</span>
            </div>
          </div>

          {/* Sync Section */}
          <div className="border-t border-gray-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-medium text-gray-900">Repository Sync</h4>
                <p className="text-sm text-gray-600">
                  {integration.last_sync_at
                    ? `Last synced: ${new Date(integration.last_sync_at).toLocaleString()}`
                    : 'Never synced'
                  }
                </p>
              </div>
              <button
                onClick={handleSync}
                disabled={syncing}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <RefreshCw className={syncing ? 'animate-spin' : ''} size={16} />
                {syncing ? 'Syncing...' : 'Sync Now'}
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg mb-4">
                <AlertCircle className="text-red-600" size={16} />
                <span className="text-sm text-red-700">{error}</span>
              </div>
            )}

            {/* Repository Selector */}
            {showRepoSelector && (
              <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <h4 className="font-medium text-gray-900 mb-3">Select repositories to sync (max 3):</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {loadingRepos ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="animate-spin" size={20} />
                      <span className="ml-2 text-sm text-gray-600">Loading repositories...</span>
                    </div>
                  ) : (
                    repositories.map(repo => (
                      <label key={repo.id} className="flex items-center space-x-3 p-2 hover:bg-white rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedRepos.includes(repo.full_name)}
                          onChange={() => handleRepoToggle(repo.full_name)}
                          disabled={!selectedRepos.includes(repo.full_name) && selectedRepos.length >= 3}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm text-gray-900">{repo.name}</span>
                            {repo.private && <span className="text-xs bg-gray-200 text-gray-700 px-1 rounded">Private</span>}
                            {repo.language && <span className="text-xs bg-blue-100 text-blue-700 px-1 rounded">{repo.language}</span>}
                          </div>
                          {repo.description && (
                            <p className="text-xs text-gray-500 truncate">{repo.description}</p>
                          )}
                        </div>
                        <div className="text-xs text-gray-400">
                          ⭐ {repo.stars}
                        </div>
                      </label>
                    ))
                  )}
                </div>
                <div className="flex justify-between items-center mt-4">
                  <span className="text-sm text-gray-600">
                    {selectedRepos.length}/3 repositories selected
                  </span>
                  <div className="space-x-2">
                    <button
                      onClick={() => setShowRepoSelector(false)}
                      className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSync}
                      disabled={selectedRepos.length === 0 || syncing}
                      className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {syncing ? 'Syncing...' : `Sync ${selectedRepos.length} Repo${selectedRepos.length !== 1 ? 's' : ''}`}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {syncStats && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
                <div className="bg-blue-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <GitBranch className="text-blue-600" size={16} />
                    <span className="text-sm text-gray-600">Repositories</span>
                  </div>
                  <p className="text-xl font-bold text-blue-600">{syncStats.repositories}</p>
                </div>
                <div className="bg-green-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="text-green-600" size={16} />
                    <span className="text-sm text-gray-600">Commits</span>
                  </div>
                  <p className="text-xl font-bold text-green-600">{syncStats.commits}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Clock className="text-gray-600" size={16} />
                    <span className="text-sm text-gray-600">Period</span>
                  </div>
                  <p className="text-xl font-bold text-gray-600">Last 30 days</p>
                </div>
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
