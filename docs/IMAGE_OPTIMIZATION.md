# Image Optimization System

## Overview

Automated image optimization system that converts images to WebP format and generates multiple sizes for responsive delivery.

## Results

- **98.8% file size reduction** (77.36MB → 0.92MB for 15 images)
- **WebP format** with quality presets
- **Three size variants** for different use cases
- **Supabase CDN delivery** with 1-year cache

## Image Sizes

| Variant | Width | Quality | Use Case | Avg Size |
|---------|-------|---------|----------|----------|
| Thumbnail | 600px | 80% | Feature card backgrounds | ~15-30KB |
| Medium | 1200px | 85% | Modal view, main display | ~40-100KB |
| Large | 1920px | 90% | High-res displays (optional) | ~130-280KB |

## Usage

### Adding New Images

When you need to add new feature images:

```bash
# 1. Place images in a folder (e.g., ~/Desktop/New Images)
# 2. Update the folder path in the script
# 3. Run the optimization script
bun run scripts/optimize-and-upload-images.ts
```

### Script Features

- **Auto-converts** PNG/JPG to WebP
- **Generates 3 sizes** automatically
- **Uploads to Supabase** Storage
- **Creates public URLs** ready for use
- **Shows summary** with file sizes and savings

### In Code

The system uses a dual-URL approach:

```typescript
image: {
  webp: "...optimized/name.webp",      // Medium size (1200px) for modal
  png: "...optimized/name-thumb.webp"   // Thumbnail (600px) for cards
}
```

**Note**: Despite the property name "png", it's actually a WebP thumbnail for backwards compatibility.

## Current Implementation

### Feature Cards
- Use **thumbnail** variant (`-thumb.webp`) at 15% opacity as background
- Size: 600px wide, ~15-30KB each
- Fast loading, minimal bandwidth

### Feature Modal  
- Use **medium** variant (`.webp`) for detailed view
- Size: 1200px wide, ~40-100KB each
- High quality for full-screen display

## Best Practices

### ✅ Do

1. **Always run optimization script** before uploading images
2. **Use WebP format** for all web images
3. **Choose appropriate size** based on rendering dimensions
4. **Set long cache headers** (1 year for static images)
5. **Test on slow connections** to verify performance

### ❌ Don't

1. Don't upload raw PNG/JPG files directly
2. Don't use images larger than needed
3. Don't skip the optimization step
4. Don't use base64 encoding for large images
5. Don't forget to update both webp and png properties

## Performance Impact

### Before Optimization
- Total size: 77.36MB
- Format: PNG
- Load time (3G): ~4-5 minutes

### After Optimization  
- Total size: 0.92MB (medium variant)
- Format: WebP
- Load time (3G): ~5-10 seconds
- **99% reduction** in load time

## Future Enhancements

### Automatic Format Detection
Use `<picture>` element with multiple sources:

```typescript
<picture>
  <source srcSet={image.webp} type="image/webp" />
  <source srcSet={image.png} type="image/png" />
  <img src={image.png} alt="..." />
</picture>
```

### Responsive Images
Add `srcset` for different screen sizes:

```html
<img 
  srcset="
    thumbnail.webp 600w,
    medium.webp 1200w,
    large.webp 1920w
  "
  sizes="(max-width: 768px) 600px, 1200px"
  src="medium.webp"
/>
```

### Lazy Loading
Already implemented via `loadImage()` callback in FeatureModal.

### CDN Caching
Supabase Storage includes CDN with:
- **1-year cache** (`Cache-Control: 31536000`)
- **Global distribution** for fast delivery
- **HTTPS by default** for security

## Monitoring

Check image performance in:
- Browser DevTools → Network tab
- Lighthouse → Performance audit
- WebPageTest.org for real-world speeds

## Scripts

### Main Optimization Script
`scripts/optimize-and-upload-images.ts`

- Processes all images in a folder
- Generates 3 size variants
- Uploads to Supabase Storage
- Prints summary with URLs

### Dependencies
- `sharp` - Fast image processing
- `@supabase/supabase-js` - Supabase client
- `dotenv` - Environment variables

## Example Output

```bash
📸 Processing: Song View.png
   Original: 2844x1990, 2.84MB
   ✓ thumbnail: 600x420, 20.5KB (80% quality)
   ✓ medium: 1200x840, 57.4KB (85% quality)
   ✓ large: 1920x1343, 142.9KB (90% quality)
```

## Troubleshooting

### Images not loading
- Check browser console for CORS errors
- Verify bucket is set to `public: true`
- Confirm URLs are accessible (try in new tab)

### Quality issues
- Adjust quality settings in `IMAGE_SIZES`
- Use `large` variant for high-res displays
- Increase width if images appear blurry

### Upload failures
- Check Supabase service role key
- Verify bucket permissions
- Check file size limits (10MB max)

