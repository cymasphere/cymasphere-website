import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const desiredType = (formData.get('type') as string | null) || undefined; // 'image' | 'video'

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 });
    }

    const isImage = file.type.startsWith('image/');
    const isVideo = file.type.startsWith('video/');
    if (!isImage && !isVideo) {
      return NextResponse.json({ success: false, error: 'Unsupported file type' }, { status: 400 });
    }

    if (desiredType && desiredType !== 'image' && desiredType !== 'video') {
      return NextResponse.json({ success: false, error: 'Invalid type value' }, { status: 400 });
    }

    const maxImage = 10 * 1024 * 1024; // 10MB
    const maxVideo = 100 * 1024 * 1024; // 100MB
    if ((isImage && file.size > maxImage) || (isVideo && file.size > maxVideo)) {
      return NextResponse.json({ success: false, error: `File too large. Max ${(isImage ? '10MB' : '100MB')}` }, { status: 400 });
    }

    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 10);
    const ext = file.name.split('.').pop() || (isImage ? 'jpg' : 'mp4');
    const folder = isImage ? 'email-images' : 'email-videos';
    const fileName = `${folder}/email-${timestamp}-${randomString}.${ext}`;

    const buffer = new Uint8Array(await file.arrayBuffer());

    // Ensure bucket exists and is public with proper mime types
    const bucket = 'email-assets';
    const { data: listBuckets } = await supabase.storage.listBuckets();
    const exists = listBuckets?.some(b => b.name === bucket);
    if (!exists) {
      const { error: bucketError } = await supabase.storage.createBucket(bucket, {
        public: true,
        allowedMimeTypes: [
          'image/jpeg', 'image/png', 'image/gif', 'image/webp',
          'video/mp4', 'video/webm', 'video/ogg'
        ],
        fileSizeLimit: `${maxVideo}`
      });
      if (bucketError) {
        return NextResponse.json({ success: false, error: 'Failed creating bucket' }, { status: 500 });
      }
    }

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(fileName, buffer, { contentType: file.type, upsert: true, cacheControl: '3600' });
    if (uploadError) {
      return NextResponse.json({ success: false, error: `Upload failed: ${uploadError.message}` }, { status: 500 });
    }

    const { data: pub } = supabase.storage.from(bucket).getPublicUrl(fileName);
    const publicUrl = pub?.publicUrl;
    if (!publicUrl) {
      return NextResponse.json({ success: false, error: 'Failed to fetch public URL' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      data: {
        path: fileName,
        bucket,
        publicUrl,
        fileType: file.type,
        size: file.size
      }
    });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}


