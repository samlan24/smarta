interface GitDiffAnalytics {
  filesChanged: string[];
  linesAdded: number;
  linesDeleted: number;
  commitType: string;
  repositoryName?: string;
}

export class AnalyticsParser {
  static parseGitDiff(diff: string): GitDiffAnalytics {
    const lines = diff.split('\n');
    const filesChanged = new Set<string>();
    let linesAdded = 0;
    let linesDeleted = 0;

    for (const line of lines) {
      // Parse file headers (e.g., "diff --git a/file.js b/file.js")
      if (line.startsWith('diff --git')) {
        const match = line.match(/diff --git a\/(.+?) b\/(.+)/);
        if (match) {
          filesChanged.add(match[2]); // Use the "b/" version (after changes)
        }
      }
      
      // Count added lines
      if (line.startsWith('+') && !line.startsWith('+++')) {
        linesAdded++;
      }
      
      // Count deletions (lines starting with - but not ---)
      else if (line.startsWith('-') && !line.startsWith('---')) {
        linesDeleted++;
      }
    }

    return {
      filesChanged: Array.from(filesChanged),
      linesAdded,
      linesDeleted,
      commitType: 'unknown' // Will be extracted from generated commit message
    };
  }

  static extractCommitType(commitMessage: string): string {
    // Extract type from conventional commit format: type(scope): description
    const match = commitMessage.match(/^([a-z]+)(\([^)]+\))?[!]?:/);
    return match ? match[1] : 'unknown';
  }

  static extractRepositoryName(diff: string): string | undefined {
    // Try to extract repository name from diff context
    // This might be enhanced later when CLI sends more context
    const lines = diff.split('\n');
    
    for (const line of lines) {
      // Look for common repository indicators in file paths
      if (line.startsWith('diff --git')) {
        const match = line.match(/diff --git a\/(.+?) b\/(.+)/);
        if (match) {
          const path = match[1];
          // Extract potential repo name from path structure
          const pathParts = path.split('/');
          if (pathParts.length > 0) {
            // Return first directory as potential repo indicator
            return pathParts[0];
          }
        }
      }
    }
    
    return undefined;
  }

  static extractRepositoryInfo(diff: string, cwd?: string): { name: string; branch: string; path: string } {
    // Try to extract repository name from diff or use current working directory
    let repositoryName = 'unknown';
    let repositoryPath = cwd || process.cwd();
    let branch = 'main'; // Default branch

    // Extract repository name from path
    if (repositoryPath) {
      const pathParts = repositoryPath.split('/');
      repositoryName = pathParts[pathParts.length - 1] || 'unknown';
    }

    // Try to extract branch info from diff (some git configs include it)
    const branchMatch = diff.match(/On branch (\w+)/);
    if (branchMatch) {
      branch = branchMatch[1];
    }

    return {
      name: repositoryName,
      branch,
      path: repositoryPath
    };
  }
}
