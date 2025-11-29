import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { config } from 'dotenv';

// Load environment variables from .env.local
config({ path: '.env.local' });

// Get Supabase credentials from environment
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// Create Supabase client with service role key for admin access
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const IMAGES_FOLDER = '/Users/rjmacbookpro/Desktop/Cymasphere v2 Images';
const BUCKET_NAME = 'feature-images';

async function uploadImages() {
  try {
    // Check if bucket exists, create if not
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();
    
    if (listError) {
      console.error('Error listing buckets:', listError);
      return;
    }

    const bucketExists = buckets?.some(b => b.name === BUCKET_NAME);
    
    if (!bucketExists) {
      console.log(`Creating bucket: ${BUCKET_NAME}`);
      const { error: createError } = await supabase.storage.createBucket(BUCKET_NAME, {
        public: true,
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/jpg'],
        fileSizeLimit: 10485760 // 10MB
      });

      if (createError) {
        console.error('Error creating bucket:', createError);
        return;
      }
      console.log(`Bucket ${BUCKET_NAME} created successfully`);
    } else {
      console.log(`Bucket ${BUCKET_NAME} already exists`);
    }

    // Read all files from the folder
    const files = fs.readdirSync(IMAGES_FOLDER);
    const imageFiles = files.filter(file => 
      /\.(png|jpg|jpeg|webp)$/i.test(file)
    );

    console.log(`Found ${imageFiles.length} image files to upload`);

    const uploadResults: Array<{
      fileName: string;
      success: boolean;
      publicUrl?: string;
      error?: string;
    }> = [];

    // Upload each image
    for (const file of imageFiles) {
      const filePath = path.join(IMAGES_FOLDER, file);
      const fileBuffer = fs.readFileSync(filePath);
      const fileStats = fs.statSync(filePath);
      
      // Determine content type
      const ext = path.extname(file).toLowerCase();
      const contentType = 
        ext === '.png' ? 'image/png' :
        ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' :
        ext === '.webp' ? 'image/webp' :
        'image/png';

      // Clean filename for storage (remove spaces, special chars)
      const cleanFileName = file
        .replace(/\s+/g, '-')
        .replace(/[^a-zA-Z0-9.-]/g, '')
        .toLowerCase();
      
      const storagePath = `screenshots/${cleanFileName}`;

      console.log(`Uploading ${file}...`);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(storagePath, fileBuffer, {
          contentType,
          upsert: true,
          cacheControl: '3600'
        });

      if (uploadError) {
        console.error(`Error uploading ${file}:`, uploadError.message);
        uploadResults.push({
          fileName: file,
          success: false,
          error: uploadError.message
        });
        continue;
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(storagePath);

      const publicUrl = publicUrlData?.publicUrl;

      if (!publicUrl) {
        console.error(`Failed to get public URL for ${file}`);
        uploadResults.push({
          fileName: file,
          success: false,
          error: 'Failed to get public URL'
        });
        continue;
      }

      console.log(`✓ Uploaded ${file} -> ${publicUrl}`);
      uploadResults.push({
        fileName: file,
        success: true,
        publicUrl
      });
    }

    // Print summary
    console.log('\n=== Upload Summary ===');
    const successful = uploadResults.filter(r => r.success);
    const failed = uploadResults.filter(r => !r.success);
    
    console.log(`Successfully uploaded: ${successful.length}`);
    console.log(`Failed: ${failed.length}`);
    
    if (successful.length > 0) {
      console.log('\nSuccessful uploads:');
      successful.forEach(r => {
        console.log(`  - ${r.fileName}: ${r.publicUrl}`);
      });
    }

    if (failed.length > 0) {
      console.log('\nFailed uploads:');
      failed.forEach(r => {
        console.log(`  - ${r.fileName}: ${r.error}`);
      });
    }

  } catch (error) {
    console.error('Error in upload script:', error);
  }
}

uploadImages();

