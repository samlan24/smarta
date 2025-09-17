interface GitDiffAnalytics {
  filesChanged: string[];
  linesAdded: number;
  linesDeleted: number;
  commitType: string;
  repositoryName?: string;
}

export class AnalyticsParser {
  static parseGitDiff(diff: string): GitDiffAnalytics {
    const filesChanged: string[] = [];
    let linesAdded = 0;
    let linesDeleted = 0;

    // Split diff into lines
    const lines = diff.split('\n');

    for (const line of lines) {
      // Parse file headers: diff --git a/path/to/file b/path/to/file
      if (line.startsWith('diff --git')) {
        const match = line.match(/diff --git a\/(.+?) b\/(.+)/);
        if (match) {
          const fileName = match[2]; // Use the "b/" path (after changes)
          if (!filesChanged.includes(fileName)) {
            filesChanged.push(fileName);
          }
        }
      }
      
      // Alternative file header: +++ b/path/to/file
      else if (line.startsWith('+++ b/')) {
        const fileName = line.substring(6); // Remove "+++ b/"
        if (fileName !== '/dev/null' && !filesChanged.includes(fileName)) {
          filesChanged.push(fileName);
        }
      }
      
      // Count additions (lines starting with + but not +++)
      else if (line.startsWith('+') && !line.startsWith('+++')) {
        linesAdded++;
      }
      
      // Count deletions (lines starting with - but not ---)
      else if (line.startsWith('-') && !line.startsWith('---')) {
        linesDeleted++;
      }
    }

    return {
      filesChanged,
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
}
