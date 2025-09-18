import { createClient } from "@/app/lib/supabase/server";

export interface GitHubUser {
  id: number;
  login: string;
  name: string;
  email: string;
  avatar_url: string;
}

export interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  description: string;
  language: string;
  private: boolean;
  stargazers_count: number;
  forks_count: number;
  pushed_at: string;
}

export interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      email: string;
      date: string;
    };
  };
  stats?: {
    additions: number;
    deletions: number;
    total: number;
  };
  files?: Array<{
    filename: string;
    status: string;
    additions: number;
    deletions: number;
  }>;
}

export class GitHubService {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  private async makeRequest(url: string, options: RequestInit = {}) {
    const response = await fetch(`https://api.github.com${url}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        Accept: "application/vnd.github.v3+json",
        "User-Agent": "SmartCommit-App",
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(
        `GitHub API error: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }

  async getCurrentUser(): Promise<GitHubUser> {
    return this.makeRequest("/user");
  }

  async getUserRepositories(page = 1, perPage = 100): Promise<GitHubRepo[]> {
    return this.makeRequest(
      `/user/repos?page=${page}&per_page=${perPage}&sort=updated`
    );
  }

  async hasCommitsLast30Days(owner: string, repo: string): Promise<boolean> {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - 30);
    const since = sinceDate.toISOString();
    const commits = await this.getRepositoryCommits(owner, repo, since);
    return commits.length > 0;
  }

  async getRepositoryCommits(
    owner: string,
    repo: string,
    since?: string,
    page = 1,
    perPage = 100
  ): Promise<GitHubCommit[]> {
    let url = `/repos/${owner}/${repo}/commits?page=${page}&per_page=${perPage}`;
    if (since) {
      url += `&since=${since}`;
    }
    return this.makeRequest(url);
  }

  async getCommitDetails(
    owner: string,
    repo: string,
    sha: string
  ): Promise<GitHubCommit> {
    return this.makeRequest(`/repos/${owner}/${repo}/commits/${sha}`);
  }

  async syncUserRepositories(userId: string): Promise<void> {
    const supabase = await createClient();

    try {
      // Get user's GitHub integration
      const { data: integration } = await supabase
        .from("git_integrations")
        .select("*")
        .eq("user_id", userId)
        .eq("platform", "github")
        .eq("is_active", true)
        .single();

      if (!integration) {
        throw new Error("No active GitHub integration found");
      }

      const github = new GitHubService(integration.access_token);

      // Fetch repositories
      const repos = await github.getUserRepositories();

      // Store repositories
      for (const repo of repos) {
        await supabase.from("external_repositories").upsert(
          {
            user_id: userId,
            integration_id: integration.id,
            repo_name: repo.name,
            repo_full_name: repo.full_name,
            description: repo.description,
            language: repo.language,
            is_private: repo.private,
            stars: repo.stargazers_count,
            forks: repo.forks_count,
            last_commit_at: repo.pushed_at,
            updated_at: new Date().toISOString(),
          },
          {
            onConflict: "integration_id,repo_full_name",
          }
        );
      }

      // Update last sync time
      await supabase
        .from("git_integrations")
        .update({ last_sync_at: new Date().toISOString() })
        .eq("id", integration.id);
    } catch (error) {
      console.error("Error syncing repositories:", error);
      throw error;
    }
  }

  async syncRepositoryCommits(
    userId: string,
    repoFullName: string,
    since?: Date
  ): Promise<void> {
    const supabase = await createClient();

    try {
      const { data: integration } = await supabase
        .from("git_integrations")
        .select("*")
        .eq("user_id", userId)
        .eq("platform", "github")
        .eq("is_active", true)
        .single();

      if (!integration) {
        throw new Error("No active GitHub integration found");
      }

      const github = new GitHubService(integration.access_token);
      const [owner, repo] = repoFullName.split("/");

      // Check if there are commits in the last 30 days
      const hasRecentCommits = await github.hasCommitsLast30Days(owner, repo);
      if (!hasRecentCommits) {
        throw new Error(
          `Could not find any commits in the last 30 days for repository ${repoFullName}`
        );
      }

      const sinceParam = since ? since.toISOString() : undefined;
      const commits = await github.getRepositoryCommits(
        owner,
        repo,
        sinceParam
      );

      for (const commit of commits) {
        const detailedCommit = await github.getCommitDetails(
          owner,
          repo,
          commit.sha
        );
        const analysis = this.analyzeCommitMessage(commit.commit.message);

        await supabase.from("external_commits").upsert(
          {
            user_id: userId,
            integration_id: integration.id,
            repo_name: repo,
            repo_full_name: repoFullName,
            commit_sha: commit.sha,
            message: commit.commit.message,
            author_name: commit.commit.author.name,
            author_email: commit.commit.author.email,
            committed_at: commit.commit.author.date,
            additions: detailedCommit.stats?.additions || 0,
            deletions: detailedCommit.stats?.deletions || 0,
            files_changed: detailedCommit.files?.length || 0,
            is_ai_generated: analysis.isAI,
            ai_confidence: analysis.confidence,
            commit_source: analysis.source,
            quality_score: analysis.qualityScore,
          },
          {
            onConflict: "integration_id,commit_sha",
          }
        );
      }
    } catch (error) {
      console.error("Error syncing commits:", error);
      throw error;
    }
  }

  private analyzeCommitMessage(message: string): {
    isAI: boolean;
    confidence: number;
    source: string;
    qualityScore: number;
  } {
    // Smart-commit tool detection patterns
    const smartCommitPatterns = [
      /^(feat|fix|docs|style|refactor|test|chore)(\(.+\))?: .+/i, // Conventional commits
      /\b(implement|resolve|update|add|remove|improve)\b/i, // Common AI verbs
      /\b(functionality|component|feature|issue|bug)\b/i, // Technical terms
    ];

    // Manual commit patterns (typically shorter, less structured)
    const manualPatterns = [
      /^(wip|temp|tmp|quick|minor|small)/i,
      /^[a-z\s]{1,20}$/i, // Very short messages
      /^(fix|update|change)\s*$/i, // Single word + optional space
    ];

    let isSmartCommit = false;
    let isManual = false;
    let confidence = 0;

    // Check for smart-commit patterns
    for (const pattern of smartCommitPatterns) {
      if (pattern.test(message)) {
        isSmartCommit = true;
        confidence += 0.3;
      }
    }

    // Check for manual patterns
    for (const pattern of manualPatterns) {
      if (pattern.test(message)) {
        isManual = true;
        confidence += 0.4;
      }
    }

    // Quality scoring (0-100)
    let qualityScore = 50; // Base score

    // Length scoring
    if (message.length > 20 && message.length < 100) qualityScore += 20;
    if (message.length >= 100) qualityScore += 10;
    if (message.length < 10) qualityScore -= 20;

    // Structure scoring
    if (/^(feat|fix|docs|style|refactor|test|chore)(\(.+\))?:/.test(message)) {
      qualityScore += 25; // Conventional commits bonus
    }

    // Descriptiveness scoring
    if (message.split(" ").length >= 4) qualityScore += 10;
    if (/\b(add|remove|update|fix|implement|resolve)\b/i.test(message))
      qualityScore += 5;

    // Determine source
    let source = "unknown";
    if (isSmartCommit && confidence > 0.5) {
      source = "smart-commit";
    } else if (isManual) {
      source = "manual";
    } else if (confidence > 0.3) {
      source = "other-ai";
    }

    return {
      isAI: isSmartCommit,
      confidence: Math.min(confidence, 1),
      source,
      qualityScore: Math.max(0, Math.min(100, qualityScore)),
    };
  }
}
