import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const BUCKET = 'email-assets';
const IMAGE_FOLDER = 'email-images';
const VIDEO_FOLDER = 'email-videos';

function inferTypeFromName(name: string): 'image' | 'video' | 'unknown' {
  const lower = name.toLowerCase();
  if (/(\.jpg|\.jpeg|\.png|\.gif|\.webp|\.svg)$/.test(lower)) return 'image';
  if (/(\.mp4|\.webm|\.ogg)$/.test(lower)) return 'video';
  return 'unknown';
}

export async function GET(_request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Ensure bucket exists
    const { data: buckets, error: listBucketsError } = await supabase.storage.listBuckets();
    if (listBucketsError) {
      return NextResponse.json({ success: false, error: listBucketsError.message }, { status: 500 });
    }
    const exists = buckets?.some(b => b.name === BUCKET);
    if (!exists) {
      // Create it if missing (public)
      const { error: bucketError } = await supabase.storage.createBucket(BUCKET, {
        public: true,
      });
      if (bucketError) {
        return NextResponse.json({ success: false, error: bucketError.message }, { status: 500 });
      }
    }

    // List images and videos
    const [{ data: images, error: imgErr }, { data: videos, error: vidErr }] = await Promise.all([
      supabase.storage.from(BUCKET).list(IMAGE_FOLDER, { limit: 100, offset: 0 }),
      supabase.storage.from(BUCKET).list(VIDEO_FOLDER, { limit: 100, offset: 0 })
    ]);

    if (imgErr || vidErr) {
      return NextResponse.json({ success: false, error: (imgErr || vidErr)!.message }, { status: 500 });
    }

    const makeItem = (folder: string) => (obj: any) => {
      const path = `${folder}/${obj.name}`;
      const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
      const publicUrl = data?.publicUrl || '';
      const type = inferTypeFromName(obj.name);
      return {
        name: obj.name,
        path,
        publicUrl,
        type,
        size: obj.metadata?.size ?? null,
        updatedAt: obj.updated_at || null
      };
    };

    const imageItems = (images || []).filter(Boolean).map(makeItem(IMAGE_FOLDER));
    const videoItems = (videos || []).filter(Boolean).map(makeItem(VIDEO_FOLDER));

    const items = [...imageItems, ...videoItems].sort((a, b) => {
      const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return bTime - aTime;
    });

    return NextResponse.json({ success: true, items });
  } catch (e: any) {
    return NextResponse.json({ success: false, error: e?.message || 'Server error' }, { status: 500 });
  }
}


