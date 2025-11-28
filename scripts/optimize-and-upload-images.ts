import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { config } from 'dotenv';
import sharp from 'sharp';

// Load environment variables from .env.local
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const BUCKET_NAME = 'feature-images';

// Define image sizes based on actual rendering needs
const IMAGE_SIZES = {
  // For feature card backgrounds (300-400px wide cards)
  thumbnail: { width: 600, quality: 80, suffix: '-thumb' },
  // For modal display (max ~1000px wide)
  medium: { width: 1200, quality: 85, suffix: '' },
  // Original size for high-res displays
  large: { width: 1920, quality: 90, suffix: '-large' },
};

interface UploadResult {
  originalName: string;
  sizes: {
    [key: string]: {
      path: string;
      url: string;
      size: number;
      dimensions: { width: number; height: number };
    };
  };
}

async function ensureBucket() {
  const { data: buckets } = await supabase.storage.listBuckets();
  const bucketExists = buckets?.some(b => b.name === BUCKET_NAME);
  
  if (!bucketExists) {
    console.log(`Creating bucket: ${BUCKET_NAME}`);
    await supabase.storage.createBucket(BUCKET_NAME, {
      public: true,
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp'],
      fileSizeLimit: 10485760 // 10MB
    });
  }
}

async function optimizeAndUploadImage(
  filePath: string,
  fileName: string
): Promise<UploadResult> {
  const result: UploadResult = {
    originalName: fileName,
    sizes: {}
  };

  // Clean filename for storage
  const baseName = path.basename(fileName, path.extname(fileName))
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9.-]/g, '')
    .toLowerCase();

  console.log(`\n📸 Processing: ${fileName}`);
  
  // Get original image metadata
  const metadata = await sharp(filePath).metadata();
  console.log(`   Original: ${metadata.width}x${metadata.height}, ${(fs.statSync(filePath).size / 1024 / 1024).toFixed(2)}MB`);

  // Process each size variant
  for (const [sizeName, config] of Object.entries(IMAGE_SIZES)) {
    try {
      // Resize and convert to WebP
      const optimizedBuffer = await sharp(filePath)
        .resize(config.width, null, { 
          withoutEnlargement: true, // Don't upscale if original is smaller
          fit: 'inside' 
        })
        .webp({ quality: config.quality })
        .toBuffer();

      // Get dimensions of optimized image
      const optimizedMetadata = await sharp(optimizedBuffer).metadata();

      const storageFileName = `${baseName}${config.suffix}.webp`;
      const storagePath = `optimized/${storageFileName}`;

      // Upload to Supabase
      const { error: uploadError } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(storagePath, optimizedBuffer, {
          contentType: 'image/webp',
          upsert: true,
          cacheControl: '31536000' // 1 year cache
        });

      if (uploadError) {
        console.error(`   ❌ ${sizeName}: ${uploadError.message}`);
        continue;
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(storagePath);

      const fileSizeKB = (optimizedBuffer.length / 1024).toFixed(1);
      console.log(`   ✓ ${sizeName}: ${optimizedMetadata.width}x${optimizedMetadata.height}, ${fileSizeKB}KB (${config.quality}% quality)`);

      result.sizes[sizeName] = {
        path: storagePath,
        url: publicUrlData.publicUrl,
        size: optimizedBuffer.length,
        dimensions: {
          width: optimizedMetadata.width || 0,
          height: optimizedMetadata.height || 0
        }
      };
    } catch (error) {
      console.error(`   ❌ ${sizeName}: ${error}`);
    }
  }

  return result;
}

async function main() {
  console.log('🚀 Image Optimization & Upload System\n');
  console.log('This will:');
  console.log('  • Convert images to WebP format');
  console.log('  • Generate 3 sizes: thumbnail (600px), medium (1200px), large (1920px)');
  console.log('  • Upload to Supabase Storage with 1-year cache');
  console.log('  • Reduce file sizes by 60-90%\n');

  await ensureBucket();

  const imagesFolder = '/Users/rjmacbookpro/Desktop/Cymasphere v2 Images';
  const files = fs.readdirSync(imagesFolder);
  const imageFiles = files.filter(file => /\.(png|jpg|jpeg)$/i.test(file));

  console.log(`Found ${imageFiles.length} images to process\n`);

  const results: UploadResult[] = [];
  let totalOriginalSize = 0;
  let totalOptimizedSize = 0;

  for (const file of imageFiles) {
    const filePath = path.join(imagesFolder, file);
    const originalSize = fs.statSync(filePath).size;
    totalOriginalSize += originalSize;

    const result = await optimizeAndUploadImage(filePath, file);
    results.push(result);

    // Sum up optimized sizes (use medium variant for comparison)
    if (result.sizes.medium) {
      totalOptimizedSize += result.sizes.medium.size;
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(70));
  console.log('📊 OPTIMIZATION SUMMARY');
  console.log('='.repeat(70));
  console.log(`Total images processed: ${imageFiles.length}`);
  console.log(`Original total size: ${(totalOriginalSize / 1024 / 1024).toFixed(2)}MB`);
  console.log(`Optimized total size (medium): ${(totalOptimizedSize / 1024 / 1024).toFixed(2)}MB`);
  console.log(`Space saved: ${((1 - totalOptimizedSize / totalOriginalSize) * 100).toFixed(1)}%`);
  
  console.log('\n📋 Image URLs for Code:');
  console.log('='.repeat(70));
  
  results.forEach(result => {
    if (result.sizes.thumbnail && result.sizes.medium) {
      console.log(`\n${result.originalName}:`);
      console.log(`  Card background: ${result.sizes.thumbnail.url}`);
      console.log(`  Modal view: ${result.sizes.medium.url}`);
    }
  });

  console.log('\n💡 Recommended Usage:');
  console.log('  - Feature cards (background): Use thumbnail URLs');
  console.log('  - Feature modal: Use medium URLs');
  console.log('  - High-res displays: Use large URLs (optional)');
}

main();

