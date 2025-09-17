export interface RepositoryHealthMetrics {
  repositoryName: string;
  healthScore: number; // 0-100
  averageCommitSize: number;
  commitFrequency: number; // commits per day
  fileChurnRate: number; // files changed per commit
  breakingChangeFrequency: number; // percentage of breaking changes
  codeStabilityScore: number; // 0-100
  lastCalculated: string;
  period: string; // e.g., "Last 30 days"
}

export interface HealthTrend {
  date: string;
  healthScore: number;
  commitCount: number;
  averageSize: number;
  churnRate: number;
}

export interface FileChurnData {
  fileName: string;
  changeFrequency: number;
  riskLevel: 'low' | 'medium' | 'high';
  lastChanged: string;
}

export interface CommitSizeDistribution {
  range: string; // e.g., "1-10 lines", "11-50 lines"
  count: number;
  percentage: number;
}

export class RepositoryHealthCalculator {
  static calculateHealthScore(metrics: {
    averageCommitSize: number;
    commitFrequency: number;
    fileChurnRate: number;
    breakingChangeFrequency: number;
  }): number {
    // Ideal ranges for scoring
    const idealCommitSize = 50; // lines
    const idealCommitFrequency = 2; // commits per day
    const idealChurnRate = 3; // files per commit
    const maxBreakingChangeRate = 10; // percentage

    // Calculate individual scores (0-100)
    const commitSizeScore = this.calculateCommitSizeScore(metrics.averageCommitSize, idealCommitSize);
    const frequencyScore = this.calculateFrequencyScore(metrics.commitFrequency, idealCommitFrequency);
    const churnScore = this.calculateChurnScore(metrics.fileChurnRate, idealChurnRate);
    const breakingChangeScore = this.calculateBreakingChangeScore(metrics.breakingChangeFrequency, maxBreakingChangeRate);

    // Weighted average (commit size and churn rate are most important)
    const weightedScore = (
      commitSizeScore * 0.3 +
      frequencyScore * 0.2 +
      churnScore * 0.3 +
      breakingChangeScore * 0.2
    );

    return Math.round(weightedScore);
  }

  private static calculateCommitSizeScore(actual: number, ideal: number): number {
    // Score based on how close to ideal commit size
    const ratio = Math.abs(actual - ideal) / ideal;
    if (ratio <= 0.2) return 100; // Within 20% of ideal
    if (ratio <= 0.5) return 80;  // Within 50% of ideal
    if (ratio <= 1.0) return 60;  // Within 100% of ideal
    if (ratio <= 2.0) return 40;  // Within 200% of ideal
    return 20; // Too far from ideal
  }

  private static calculateFrequencyScore(actual: number, ideal: number): number {
    // Higher frequency is generally better, but not too high
    if (actual >= ideal * 0.8 && actual <= ideal * 1.5) return 100;
    if (actual >= ideal * 0.5 && actual <= ideal * 2.0) return 80;
    if (actual >= ideal * 0.2 && actual <= ideal * 3.0) return 60;
    return 40;
  }

  private static calculateChurnScore(actual: number, ideal: number): number {
    // Lower churn rate is better (fewer files changed per commit)
    if (actual <= ideal) return 100;
    if (actual <= ideal * 1.5) return 80;
    if (actual <= ideal * 2.0) return 60;
    if (actual <= ideal * 3.0) return 40;
    return 20;
  }

  private static calculateBreakingChangeScore(actual: number, max: number): number {
    // Lower breaking change frequency is better
    if (actual <= max * 0.2) return 100; // Very low breaking changes
    if (actual <= max * 0.5) return 80;
    if (actual <= max) return 60;
    if (actual <= max * 1.5) return 40;
    return 20; // Too many breaking changes
  }

  static getHealthLevel(score: number): { level: string; color: string; description: string } {
    if (score >= 90) {
      return {
        level: 'Excellent',
        color: 'green',
        description: 'Repository follows best practices with optimal commit patterns'
      };
    } else if (score >= 75) {
      return {
        level: 'Good',
        color: 'blue',
        description: 'Repository is healthy with minor areas for improvement'
      };
    } else if (score >= 60) {
      return {
        level: 'Fair',
        color: 'yellow',
        description: 'Repository has some concerning patterns that should be addressed'
      };
    } else if (score >= 40) {
      return {
        level: 'Poor',
        color: 'orange',
        description: 'Repository has significant issues affecting code quality'
      };
    } else {
      return {
        level: 'Critical',
        color: 'red',
        description: 'Repository requires immediate attention to improve development practices'
      };
    }
  }

  static categorizeCommitSize(linesChanged: number): string {
    if (linesChanged <= 10) return 'Small (1-10 lines)';
    if (linesChanged <= 50) return 'Medium (11-50 lines)';
    if (linesChanged <= 200) return 'Large (51-200 lines)';
    return 'Extra Large (200+ lines)';
  }

  static calculateFileRiskLevel(changeFrequency: number, totalCommits: number): 'low' | 'medium' | 'high' {
    const changeRate = changeFrequency / totalCommits;
    if (changeRate >= 0.5) return 'high';   // Changed in 50%+ of commits
    if (changeRate >= 0.2) return 'medium'; // Changed in 20%+ of commits
    return 'low';
  }
}
