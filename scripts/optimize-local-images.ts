import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import { config } from 'dotenv';
import sharp from 'sharp';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const BUCKET_NAME = 'feature-images';
const PUBLIC_IMAGES = '/Users/rjmacbookpro/Development/cymasphere-website/public/images';

// Images to optimize from public folder
const IMAGES_TO_OPTIMIZE = [
  'advanced_voicing.webp',
  'chord_scale.webp',
  'DAW.webp',
  'harmony_analysis.webp',
  'layermanager_view.webp',
  'matrix.webp',
  'palette_view.webp',
  'pattern_view.webp',
  'song_view.webp',
  'voicing_view.webp',
  'mainBG.webp'
];

const IMAGE_SIZES = {
  thumbnail: { width: 600, quality: 80, suffix: '-thumb' },
  medium: { width: 1200, quality: 85, suffix: '' },
  large: { width: 1920, quality: 90, suffix: '-large' },
};

async function optimizeLocalImages() {
  console.log('🚀 Optimizing Local WebP Images\n');

  await supabase.storage.listBuckets(); // Ensure bucket exists

  for (const fileName of IMAGES_TO_OPTIMIZE) {
    const filePath = path.join(PUBLIC_IMAGES, fileName);
    
    if (!fs.existsSync(filePath)) {
      console.log(`⚠️  Skipping ${fileName} (not found)`);
      continue;
    }

    const baseName = path.basename(fileName, path.extname(fileName));
    const metadata = await sharp(filePath).metadata();
    const originalSize = fs.statSync(filePath).size;
    
    console.log(`\n📸 ${fileName}`);
    console.log(`   Original: ${metadata.width}x${metadata.height}, ${(originalSize / 1024).toFixed(1)}KB`);

    for (const [sizeName, config] of Object.entries(IMAGE_SIZES)) {
      const optimizedBuffer = await sharp(filePath)
        .resize(config.width, null, { withoutEnlargement: true, fit: 'inside' })
        .webp({ quality: config.quality })
        .toBuffer();

      const optimizedMetadata = await sharp(optimizedBuffer).metadata();
      const storageFileName = `${baseName}${config.suffix}.webp`;
      const storagePath = `optimized/${storageFileName}`;

      await supabase.storage
        .from(BUCKET_NAME)
        .upload(storagePath, optimizedBuffer, {
          contentType: 'image/webp',
          upsert: true,
          cacheControl: '31536000'
        });

      const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(storagePath);
      console.log(`   ✓ ${sizeName}: ${optimizedMetadata.width}x${optimizedMetadata.height}, ${(optimizedBuffer.length / 1024).toFixed(1)}KB`);
    }
  }

  console.log('\n✅ All local images optimized and uploaded to Supabase!');
}

optimizeLocalImages();

