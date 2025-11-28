import sharp from 'sharp';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function createOGImage() {
  console.log('🎨 Creating OpenGraph image (1200x630)...\n');

  // Create a simple branded OG image
  const ogImageBuffer = await sharp({
    create: {
      width: 1200,
      height: 630,
      channels: 4,
      background: { r: 18, g: 18, b: 18, alpha: 1 } // #121212
    }
  })
  .composite([
    {
      input: Buffer.from(
        '<svg width="1200" height="630"><text x="600" y="315" text-anchor="middle" font-family="Arial" font-size="80" font-weight="bold" fill="#6c63ff">Cymasphere</text><text x="600" y="380" text-anchor="middle" font-family="Arial" font-size="32" fill="#4ecdc4">Advanced Chord Generation</text></svg>'
      ),
      top: 0,
      left: 0
    }
  ])
  .webp({ quality: 90 })
  .toBuffer();

  // Upload to Supabase
  const { error } = await supabase.storage
    .from('feature-images')
    .upload('meta/og-image.webp', ogImageBuffer, {
      contentType: 'image/webp',
      upsert: true,
      cacheControl: '31536000'
    });

  if (error) {
    console.error('Error uploading OG image:', error);
    return;
  }

  const { data } = supabase.storage
    .from('feature-images')
    .getPublicUrl('meta/og-image.webp');

  console.log('✅ OpenGraph image created and uploaded!');
  console.log('   URL:', data.publicUrl);
  console.log('\n💡 Update NextSEO.tsx with this URL');
}

createOGImage();

