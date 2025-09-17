import { NextRequest, NextResponse } from "next/server";
import { createClient } from "../../../lib/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get the current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30');
    const limit = parseInt(searchParams.get('limit') || '20');
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // Fetch file activity data
    const { data: analytics, error } = await supabase
      .from('commit_analytics')
      .select('files_changed, timestamp, lines_added, lines_deleted')
      .eq('user_id', user.id)
      .gte('timestamp', startDate.toISOString())
      .order('timestamp', { ascending: false });

    if (error) {
      console.error('File activity fetch error:', error);
      return NextResponse.json(
        { error: "Failed to fetch file activity data" },
        { status: 500 }
      );
    }

    // Aggregate file change frequency
    const fileStats: { [key: string]: { 
      count: number; 
      linesAdded: number; 
      linesDeleted: number; 
      lastChanged: string;
    }} = {};

    analytics.forEach(item => {
      if (item.files_changed && Array.isArray(item.files_changed)) {
        item.files_changed.forEach((file: string) => {
          if (!fileStats[file]) {
            fileStats[file] = {
              count: 0,
              linesAdded: 0,
              linesDeleted: 0,
              lastChanged: item.timestamp
            };
          }
          fileStats[file].count += 1;
          fileStats[file].linesAdded += item.lines_added;
          fileStats[file].linesDeleted += item.lines_deleted;
          
          // Update last changed if this is more recent
          if (new Date(item.timestamp) > new Date(fileStats[file].lastChanged)) {
            fileStats[file].lastChanged = item.timestamp;
          }
        });
      }
    });

    // Convert to array and sort by frequency
    const fileActivity = Object.entries(fileStats)
      .map(([fileName, stats]) => ({
        fileName,
        changeCount: stats.count,
        linesAdded: stats.linesAdded,
        linesDeleted: stats.linesDeleted,
        netChange: stats.linesAdded - stats.linesDeleted,
        lastChanged: stats.lastChanged,
        fileExtension: fileName.split('.').pop() || 'unknown'
      }))
      .sort((a, b) => b.changeCount - a.changeCount)
      .slice(0, limit);

    // File type distribution
    const fileTypes = fileActivity.reduce((acc: any, item) => {
      const ext = item.fileExtension;
      acc[ext] = (acc[ext] || 0) + item.changeCount;
      return acc;
    }, {});

    // Calculate summary stats
    const totalFiles = Object.keys(fileStats).length;
    const totalChanges = Object.values(fileStats).reduce((sum, stats) => sum + stats.count, 0);
    const avgChangesPerFile = totalFiles > 0 ? Math.round(totalChanges / totalFiles * 100) / 100 : 0;

    return NextResponse.json({
      fileActivity,
      fileTypes,
      summary: {
        totalFiles,
        totalChanges,
        avgChangesPerFile,
        period: `${days} days`
      }
    });

  } catch (error) {
    console.error("File activity API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
