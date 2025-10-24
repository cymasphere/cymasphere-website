import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('id');
    
    if (!videoId) {
      return NextResponse.json({ error: 'Missing video ID' }, { status: 400 });
    }

    // Fetch YouTube video page
    const response = await fetch(`https://www.youtube.com/watch?v=${videoId}`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });

    if (!response.ok) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 });
    }

    const html = await response.text();
    
    // Extract duration from the HTML
    const durationMatch = html.match(/"lengthSeconds":"(\d+)"/);
    if (durationMatch) {
      const duration = parseInt(durationMatch[1], 10);
      return NextResponse.json({ duration });
    }

    // Try alternative pattern
    const altMatch = html.match(/"approxDurationMs":"(\d+)"/);
    if (altMatch) {
      const durationMs = parseInt(altMatch[1], 10);
      const duration = Math.floor(durationMs / 1000);
      return NextResponse.json({ duration });
    }

    return NextResponse.json({ error: 'Duration not found' }, { status: 404 });
  } catch (error) {
    console.error('Error fetching YouTube duration:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
