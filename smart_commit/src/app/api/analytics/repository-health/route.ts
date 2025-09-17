import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/app/lib/supabase/server';
import { RepositoryHealthCalculator, RepositoryHealthMetrics, HealthTrend, FileChurnData, CommitSizeDistribution } from '@/app/lib/health-calculator';

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const repository = searchParams.get('repository') || 'all';

    // Calculate date range
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Build query
    let query = supabase
      .from('commit_analytics')
      .select('*')
      .eq('user_id', user.id)
      .gte('timestamp', startDate.toISOString())
      .lte('timestamp', endDate.toISOString())
      .order('timestamp', { ascending: true });

    // Filter by repository if specified
    if (repository !== 'all') {
      query = query.eq('repository_name', repository);
    }

    const { data: commits, error } = await query;

    if (error) {
      console.error('Error fetching commit analytics:', error);
      return NextResponse.json({ error: 'Failed to fetch analytics data' }, { status: 500 });
    }


    if (!commits || commits.length === 0) {
      
      return NextResponse.json({
        repositories: [],
        healthMetrics: null,
        trends: [],
        fileChurn: [],
        commitSizeDistribution: []
      });
    }


    // Group commits by repository
    const repositoryGroups = commits.reduce((acc, commit) => {
      const repo = commit.repository_name || 'unknown';
      if (!acc[repo]) acc[repo] = [];
      acc[repo].push(commit);
      return acc;
    }, {} as Record<string, any[]>);


    // Calculate health metrics for each repository
    const repositories = Object.keys(repositoryGroups);
    const healthMetrics: Record<string, RepositoryHealthMetrics> = {};
    
    for (const repo of repositories) {
      const repoCommits = repositoryGroups[repo];
      healthMetrics[repo] = calculateRepositoryHealth(repoCommits, days);
    }

    // If specific repository requested, return detailed data
    if (repository !== 'all' && healthMetrics[repository]) {
      const repoCommits = repositoryGroups[repository];
      const trends = calculateHealthTrends(repoCommits, days);
      const fileChurn = calculateFileChurnData(repoCommits);
      const commitSizeDistribution = calculateCommitSizeDistribution(repoCommits);

      return NextResponse.json({
        repositories,
        healthMetrics: healthMetrics[repository],
        trends,
        fileChurn,
        commitSizeDistribution
      });
    }

    // Return overview of all repositories
    // For "all" repositories, return the first repository's metrics directly
    // For specific repository, return that repository's metrics
    let selectedHealthMetrics = null;
    
    if (repository !== 'all' && healthMetrics[repository]) {
      selectedHealthMetrics = healthMetrics[repository];
    } else {
      // Default to first repository for "all" case
      const primaryRepo = repositories[0];
      selectedHealthMetrics = primaryRepo ? healthMetrics[primaryRepo] : null;
    }
    
    return NextResponse.json({
      repositories,
      healthMetrics: selectedHealthMetrics,
      trends: [],
      fileChurn: [],
      commitSizeDistribution: []
    });

  } catch (error) {
    console.error('Error in repository health API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function calculateRepositoryHealth(commits: any[], days: number): RepositoryHealthMetrics {
  if (commits.length === 0) {
    return {
      repositoryName: 'unknown',
      healthScore: 0,
      averageCommitSize: 0,
      commitFrequency: 0,
      fileChurnRate: 0,
      breakingChangeFrequency: 0,
      codeStabilityScore: 0,
      lastCalculated: new Date().toISOString(),
      period: `Last ${days} days`
    };
  }

  const repositoryName = commits[0].repository_name || 'unknown';
  
  // Calculate metrics
  const totalCommits = commits.length;
  const totalLinesChanged = commits.reduce((sum: number, c: any) => sum + c.lines_added + c.lines_deleted, 0);
  const averageCommitSize = totalLinesChanged / totalCommits;
  const commitFrequency = totalCommits / days;
  
  const totalFilesChanged = commits.reduce((sum: number, c: any) => sum + (c.files_changed?.length || 0), 0);
  const fileChurnRate = totalFilesChanged / totalCommits;
  
  // Calculate breaking change frequency
  const breakingChanges = commits.filter(c => 
    c.commit_type === 'feat!' || 
    c.commit_type === 'fix!' || 
    c.commit_type?.includes('!')
  ).length;
  const breakingChangeFrequency = (breakingChanges / totalCommits) * 100;

  // Calculate health score
  const healthScore = RepositoryHealthCalculator.calculateHealthScore({
    averageCommitSize,
    commitFrequency,
    fileChurnRate,
    breakingChangeFrequency
  });

  // Code stability score (inverse of churn rate and breaking changes)
  const codeStabilityScore = Math.max(0, 100 - (fileChurnRate * 10) - breakingChangeFrequency);

  return {
    repositoryName,
    healthScore,
    averageCommitSize: Math.round(averageCommitSize),
    commitFrequency: Math.round(commitFrequency * 100) / 100,
    fileChurnRate: Math.round(fileChurnRate * 100) / 100,
    breakingChangeFrequency: Math.round(breakingChangeFrequency * 100) / 100,
    codeStabilityScore: Math.round(codeStabilityScore),
    lastCalculated: new Date().toISOString(),
    period: `Last ${days} days`
  };
}

function calculateHealthTrends(commits: any[], days: number): HealthTrend[] {
  // Group commits by day
  const dailyCommits = commits.reduce((acc, commit) => {
    const date = new Date(commit.timestamp).toISOString().split('T')[0];
    if (!acc[date]) acc[date] = [];
    acc[date].push(commit);
    return acc;
  }, {} as Record<string, any[]>);

  // Calculate daily health scores
  const trends: HealthTrend[] = [];
  
  for (let i = 0; i < days; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const dayCommits = dailyCommits[dateStr] || [];
    
    if (dayCommits.length > 0) {
      const totalLines = dayCommits.reduce((sum: number, c: any) => sum + c.lines_added + c.lines_deleted, 0);
      const avgSize = totalLines / dayCommits.length;
      const totalFiles = dayCommits.reduce((sum: number, c: any) => sum + (c.files_changed?.length || 0), 0);
      const churnRate = totalFiles / dayCommits.length;
      
      const healthScore = RepositoryHealthCalculator.calculateHealthScore({
        averageCommitSize: avgSize,
        commitFrequency: dayCommits.length,
        fileChurnRate: churnRate,
        breakingChangeFrequency: 0 // Not calculated daily
      });

      trends.unshift({
        date: dateStr,
        healthScore,
        commitCount: dayCommits.length,
        averageSize: Math.round(avgSize),
        churnRate: Math.round(churnRate * 100) / 100
      });
    }
  }

  return trends;
}

function calculateFileChurnData(commits: any[]): FileChurnData[] {
  // This would require parsing file names from commit data
  // For now, return mock data structure
  const fileChanges: Record<string, { count: number; lastChanged: string }> = {};
  
  // In a real implementation, we'd need to store individual file changes
  // For now, return empty array as this requires additional data structure
  return [];
}

function calculateCommitSizeDistribution(commits: any[]): CommitSizeDistribution[] {
  const distribution: Record<string, number> = {
    'Small (1-10 lines)': 0,
    'Medium (11-50 lines)': 0,
    'Large (51-200 lines)': 0,
    'Extra Large (200+ lines)': 0
  };

  commits.forEach(commit => {
    const totalLines = commit.lines_added + commit.lines_deleted;
    const category = RepositoryHealthCalculator.categorizeCommitSize(totalLines);
    if (distribution[category] !== undefined) {
      distribution[category]++;
    }
  });

  const total = commits.length;
  
  return Object.entries(distribution).map(([range, count]) => ({
    range,
    count,
    percentage: total > 0 ? Math.round((count / total) * 100) : 0
  }));
}
