import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  try {
    console.log('📤 Processing image upload for email campaign...');
    
    // Create Supabase client with service role for storage operations
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Parse the form data
    const formData = await request.formData();
    const file = formData.get('image') as File;

    if (!file) {
      console.error('❌ No image file provided');
      return NextResponse.json(
        { success: false, error: 'No image file provided' },
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      console.error('❌ Invalid file type:', file.type);
      return NextResponse.json(
        { success: false, error: 'File must be an image' },
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      console.error('❌ File too large:', file.size);
      return NextResponse.json(
        { success: false, error: 'File too large. Maximum size is 10MB' },
        { status: 400 }
      );
    }

    console.log('📋 File details:', {
      name: file.name,
      type: file.type,
      size: file.size
    });

    // Generate unique filename with timestamp and random string
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file.name.split('.').pop() || 'jpg';
    const fileName = `email-${timestamp}-${randomString}.${fileExtension}`;
    const filePath = `email-images/${fileName}`;

    console.log('📁 Uploading to path:', filePath);

    // Convert file to buffer
    const fileBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(fileBuffer);

    // Upload to Supabase storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('email-assets')
      .upload(filePath, buffer, {
        contentType: file.type,
        cacheControl: '3600',
        upsert: true
      });

    if (uploadError) {
      console.error('❌ Upload error:', uploadError);
      
      // If bucket doesn't exist, try to create it
      if (uploadError.message.includes('Bucket not found')) {
        console.log('🪣 Creating email-assets bucket...');
        
        const { error: bucketError } = await supabase.storage
          .createBucket('email-assets', {
            public: true,
            allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
            fileSizeLimit: maxSize
          });

        if (bucketError) {
          console.error('❌ Bucket creation error:', bucketError);
          return NextResponse.json(
            { success: false, error: 'Failed to create storage bucket' },
            { status: 500 }
          );
        }

        console.log('✅ Bucket created, retrying upload...');
        
        // Retry upload
        const { data: retryUploadData, error: retryUploadError } = await supabase.storage
          .from('email-assets')
          .upload(filePath, buffer, {
            contentType: file.type,
            cacheControl: '3600',
            upsert: true
          });

        if (retryUploadError) {
          console.error('❌ Retry upload error:', retryUploadError);
          return NextResponse.json(
            { success: false, error: 'Failed to upload image after bucket creation' },
            { status: 500 }
          );
        }

        console.log('✅ Image uploaded successfully after bucket creation:', retryUploadData);
      } else {
        return NextResponse.json(
          { success: false, error: `Upload failed: ${uploadError.message}` },
          { status: 500 }
        );
      }
    } else {
      console.log('✅ Image uploaded successfully:', uploadData);
    }

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from('email-assets')
      .getPublicUrl(filePath);

    if (!publicUrlData?.publicUrl) {
      console.error('❌ Failed to get public URL');
      return NextResponse.json(
        { success: false, error: 'Failed to get public URL for uploaded image' },
        { status: 500 }
      );
    }

    const publicUrl = publicUrlData.publicUrl;
    console.log('🌐 Public URL generated:', publicUrl);

    // Verify the image is accessible
    try {
      const testResponse = await fetch(publicUrl, { method: 'HEAD' });
      if (!testResponse.ok) {
        console.warn('⚠️ Public URL may not be immediately accessible:', testResponse.status);
      } else {
        console.log('✅ Public URL verified accessible');
      }
    } catch (error) {
      console.warn('⚠️ Could not verify public URL accessibility:', error);
    }

    return NextResponse.json({
      success: true,
      message: 'Image uploaded successfully',
      data: {
        fileName,
        filePath,
        publicUrl,
        fileSize: file.size,
        fileType: file.type
      }
    });

  } catch (error) {
    console.error('❌ Error in image upload API:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { success: false, error: `Server error: ${errorMessage}` },
      { status: 500 }
    );
  }
} 