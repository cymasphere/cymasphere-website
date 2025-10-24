import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(request: NextRequest) {
  try {
    // This endpoint refreshes YouTube durations for videos that need updating
    // Can be called by a cron job or manually
    
    const { maxAgeHours = 24, limit = 50 } = await request.json().catch(() => ({}));
    
    console.log(`Starting duration refresh job: maxAge=${maxAgeHours}h, limit=${limit}`);
    
    // Get videos that need duration refresh
    const { data: videosNeedingRefresh, error } = await supabase
      .rpc('get_videos_needing_duration_cache', {
        max_age_hours: maxAgeHours,
        limit_count: limit
      });

    if (error) {
      console.error('Error fetching videos needing refresh:', error);
      return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 });
    }

    if (!videosNeedingRefresh || videosNeedingRefresh.length === 0) {
      return NextResponse.json({ 
        message: 'No videos need duration refresh',
        processed: 0,
        cached: 0,
        failed: 0
      });
    }

    console.log(`Found ${videosNeedingRefresh.length} videos needing duration refresh`);

    let processed = 0;
    let cached = 0;
    let failed = 0;

    // Process videos in batches to avoid overwhelming YouTube
    const batchSize = 5;
    for (let i = 0; i < videosNeedingRefresh.length; i += batchSize) {
      const batch = videosNeedingRefresh.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (video: any) => {
        try {
          processed++;
          
          // Fetch duration from YouTube
          const response = await fetch(`https://www.youtube.com/watch?v=${video.youtube_video_id}`, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
            }
          });

          if (!response.ok) {
            console.error(`Failed to fetch YouTube page for ${video.youtube_video_id}`);
            failed++;
            return;
          }

          const html = await response.text();
          
          // Extract duration
          const durationMatch = html.match(/"lengthSeconds":"(\d+)"/);
          if (durationMatch) {
            const duration = parseInt(durationMatch[1], 10);
            
            // Update cache in database
            const { error: updateError } = await supabase
              .rpc('update_youtube_duration_cache', {
                video_id: video.id,
                duration_seconds: duration
              });

            if (updateError) {
              console.error(`Failed to cache duration for ${video.id}:`, updateError);
              failed++;
            } else {
              console.log(`Cached duration for ${video.youtube_video_id}: ${duration}s`);
              cached++;
            }
          } else {
            // Try alternative pattern
            const altMatch = html.match(/"approxDurationMs":"(\d+)"/);
            if (altMatch) {
              const durationMs = parseInt(altMatch[1], 10);
              const duration = Math.floor(durationMs / 1000);
              
              const { error: updateError } = await supabase
                .rpc('update_youtube_duration_cache', {
                  video_id: video.id,
                  duration_seconds: duration
                });

              if (updateError) {
                console.error(`Failed to cache duration for ${video.id}:`, updateError);
                failed++;
              } else {
                console.log(`Cached duration for ${video.youtube_video_id}: ${duration}s`);
                cached++;
              }
            } else {
              console.error(`Could not extract duration for ${video.youtube_video_id}`);
              failed++;
            }
          }
        } catch (error) {
          console.error(`Error processing video ${video.id}:`, error);
          failed++;
        }
      }));
      
      // Small delay between batches to be respectful to YouTube
      if (i + batchSize < videosNeedingRefresh.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }

    console.log(`Duration refresh job completed: ${processed} processed, ${cached} cached, ${failed} failed`);

    return NextResponse.json({
      message: 'Duration refresh job completed',
      processed,
      cached,
      failed,
      videosProcessed: videosNeedingRefresh.map((v: any) => ({
        id: v.id,
        youtube_video_id: v.youtube_video_id
      }))
    });
  } catch (error) {
    console.error('Unexpected error in duration refresh job:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get status of duration caching
    const { data: stats, error } = await supabase
      .from('tutorial_videos')
      .select('youtube_duration_cached, youtube_duration_last_updated')
      .not('youtube_video_id', 'is', null);

    if (error) {
      console.error('Error fetching duration cache stats:', error);
      return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }

    const total = stats?.length || 0;
    const cached = stats?.filter(v => v.youtube_duration_cached).length || 0;
    const notCached = total - cached;
    
    const recentlyUpdated = stats?.filter(v => {
      if (!v.youtube_duration_last_updated) return false;
      const lastUpdated = new Date(v.youtube_duration_last_updated);
      const hoursSinceUpdate = (Date.now() - lastUpdated.getTime()) / (1000 * 60 * 60);
      return hoursSinceUpdate < 24;
    }).length || 0;

    return NextResponse.json({
      total,
      cached,
      notCached,
      recentlyUpdated,
      cacheHitRate: total > 0 ? Math.round((cached / total) * 100) : 0,
      freshCacheRate: total > 0 ? Math.round((recentlyUpdated / total) * 100) : 0
    });
  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
