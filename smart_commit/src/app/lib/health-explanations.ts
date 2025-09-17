export interface HealthExplanation {
  reasons: string[];
  recommendations: string[];
  impact: string;
}

export class HealthExplainer {
  static explainHealthScore(metrics: {
    healthScore: number;
    averageCommitSize: number;
    commitFrequency: number;
    fileChurnRate: number;
    breakingChangeFrequency: number;
  }): HealthExplanation {
    const reasons: string[] = [];
    const recommendations: string[] = [];
    let impact = '';

    // Analyze commit size
    if (metrics.averageCommitSize > 200) {
      reasons.push(`Large commits averaging ${metrics.averageCommitSize} lines make code reviews difficult`);
      recommendations.push('Break large features into smaller, focused commits (aim for 20-100 lines)');
    } else if (metrics.averageCommitSize < 5) {
      reasons.push(`Very small commits averaging ${metrics.averageCommitSize} lines create excessive noise`);
      recommendations.push('Combine related small changes into meaningful commits');
    } else if (metrics.averageCommitSize >= 20 && metrics.averageCommitSize <= 100) {
      reasons.push(`Good commit size averaging ${metrics.averageCommitSize} lines - easy to review`);
    }

    // Analyze commit frequency
    if (metrics.commitFrequency < 0.5) {
      reasons.push(`Low commit frequency (${metrics.commitFrequency.toFixed(1)}/day) suggests infrequent development`);
      recommendations.push('Commit more frequently to maintain development momentum and reduce merge conflicts');
    } else if (metrics.commitFrequency > 5) {
      reasons.push(`Very high commit frequency (${metrics.commitFrequency.toFixed(1)}/day) may indicate rushed development`);
      recommendations.push('Consider batching related changes into fewer, more meaningful commits');
    } else if (metrics.commitFrequency >= 1 && metrics.commitFrequency <= 3) {
      reasons.push(`Healthy commit frequency (${metrics.commitFrequency.toFixed(1)}/day) shows consistent development`);
    }

    // Analyze file churn rate
    if (metrics.fileChurnRate > 8) {
      reasons.push(`High file churn (${metrics.fileChurnRate.toFixed(1)} files/commit) suggests architectural issues`);
      recommendations.push('Focus commits on specific areas - avoid changing many unrelated files together');
    } else if (metrics.fileChurnRate > 5) {
      reasons.push(`Moderate file churn (${metrics.fileChurnRate.toFixed(1)} files/commit) could be improved`);
      recommendations.push('Try to keep commits focused on 2-4 related files when possible');
    } else if (metrics.fileChurnRate <= 4) {
      reasons.push(`Good file focus (${metrics.fileChurnRate.toFixed(1)} files/commit) shows well-scoped changes`);
    }

    // Analyze breaking changes
    if (metrics.breakingChangeFrequency > 15) {
      reasons.push(`High breaking changes (${metrics.breakingChangeFrequency.toFixed(1)}%) indicate API instability`);
      recommendations.push('Plan API changes more carefully and batch breaking changes into major releases');
    } else if (metrics.breakingChangeFrequency > 5) {
      reasons.push(`Moderate breaking changes (${metrics.breakingChangeFrequency.toFixed(1)}%) should be monitored`);
      recommendations.push('Consider deprecation warnings before introducing breaking changes');
    } else if (metrics.breakingChangeFrequency <= 2) {
      reasons.push(`Low breaking changes (${metrics.breakingChangeFrequency.toFixed(1)}%) shows stable API development`);
    }

    // Determine overall impact
    if (metrics.healthScore >= 90) {
      impact = 'Your repository follows excellent development practices. Code reviews are efficient, development velocity is optimal, and the codebase remains stable and maintainable.';
    } else if (metrics.healthScore >= 75) {
      impact = 'Your repository is in good health with minor areas for improvement. Most development practices are solid, making collaboration and maintenance relatively smooth.';
    } else if (metrics.healthScore >= 60) {
      impact = 'Your repository has some concerning patterns that may slow down development velocity and make code reviews more challenging. Addressing these issues will improve team productivity.';
    } else if (metrics.healthScore >= 40) {
      impact = 'Your repository has significant issues that are likely impacting development efficiency, code review quality, and team collaboration. These patterns should be addressed promptly.';
    } else {
      impact = 'Your repository requires immediate attention. Current development patterns are severely impacting code quality, review efficiency, and team productivity. Consider implementing stricter development guidelines.';
    }

    return { reasons, recommendations, impact };
  }

  static getMetricExplanation(metric: string): { description: string; idealRange: string; why: string } {
    const explanations = {
      averageCommitSize: {
        description: 'Average number of lines changed per commit',
        idealRange: '20-100 lines per commit',
        why: 'Commits in this range are easy to review, understand, and debug. Too small creates noise, too large is hard to review.'
      },
      commitFrequency: {
        description: 'Average number of commits made per day',
        idealRange: '1-3 commits per day',
        why: 'Regular commits show consistent progress and reduce merge conflicts. Too few suggests infrequent development, too many may indicate rushed work.'
      },
      fileChurnRate: {
        description: 'Average number of files changed per commit',
        idealRange: '2-4 files per commit',
        why: 'Focused commits touching few related files are easier to review and less likely to introduce bugs across multiple areas.'
      },
      breakingChangeFrequency: {
        description: 'Percentage of commits that introduce breaking changes',
        idealRange: 'Less than 2% of commits',
        why: 'Breaking changes disrupt users and require careful coordination. High frequency indicates unstable APIs or poor planning.'
      }
    };

    return explanations[metric as keyof typeof explanations] || {
      description: 'Unknown metric',
      idealRange: 'N/A',
      why: 'No explanation available'
    };
  }

  static getPriorityRecommendations(metrics: {
    healthScore: number;
    averageCommitSize: number;
    commitFrequency: number;
    fileChurnRate: number;
    breakingChangeFrequency: number;
  }): { priority: 'high' | 'medium' | 'low'; action: string; benefit: string }[] {
    const recommendations: { priority: 'high' | 'medium' | 'low'; action: string; benefit: string }[] = [];

    // High priority issues
    if (metrics.averageCommitSize > 300) {
      recommendations.push({
        priority: 'high',
        action: 'Break down large commits into smaller, focused changes',
        benefit: 'Dramatically improve code review efficiency and reduce bug introduction risk'
      });
    }

    if (metrics.fileChurnRate > 10) {
      recommendations.push({
        priority: 'high',
        action: 'Focus commits on specific features or bug fixes, avoid changing many unrelated files',
        benefit: 'Reduce complexity and make changes easier to understand and review'
      });
    }

    if (metrics.breakingChangeFrequency > 20) {
      recommendations.push({
        priority: 'high',
        action: 'Plan breaking changes more carefully and batch them into major releases',
        benefit: 'Improve API stability and reduce disruption for users'
      });
    }

    // Medium priority issues
    if (metrics.commitFrequency < 0.3) {
      recommendations.push({
        priority: 'medium',
        action: 'Commit more frequently to maintain development momentum',
        benefit: 'Reduce merge conflicts and make progress more visible to team members'
      });
    }

    if (metrics.averageCommitSize > 150 && metrics.averageCommitSize <= 300) {
      recommendations.push({
        priority: 'medium',
        action: 'Try to keep commits smaller and more focused',
        benefit: 'Make code reviews faster and more thorough'
      });
    }

    // Low priority improvements
    if (metrics.fileChurnRate > 5 && metrics.fileChurnRate <= 10) {
      recommendations.push({
        priority: 'low',
        action: 'Consider grouping related file changes more thoughtfully',
        benefit: 'Slightly improve commit clarity and review focus'
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }
}
