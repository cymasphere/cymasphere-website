# Quick Guide: Adding New Feature Images

## Simple 2-Step Process

### Step 1: Optimize & Upload
```bash
# Place images in a folder, then run:
bun run scripts/optimize-and-upload-images.ts
```

The script will:
- ✅ Convert to WebP (98% smaller)
- ✅ Create 3 sizes (thumb/medium/large)
- ✅ Upload to Supabase CDN
- ✅ Print URLs ready to copy

### Step 2: Update Feature Code

Copy the URLs from script output and paste into `components/sections/FeaturesSection.tsx`:

```typescript
{
  icon: <FaMusic />,
  title: t("features.yourFeature.title"),
  // ... other props
  image: {
    webp: "...optimized/name.webp",       // Medium (1200px) - for modal
    png: "...optimized/name-thumb.webp"   // Thumbnail (600px) - for cards
  },
}
```

## That's It!

The system handles:
- Format conversion
- Size optimization
- CDN delivery
- Caching (1 year)
- Public URLs

## Results

- **Original**: 5-7MB PNG per image
- **Optimized**: 20-100KB WebP per image
- **Savings**: ~98% smaller files
- **Speed**: 100x faster loading

## Before/After Example

```
Before:  Song View.png (2.84MB)
After:   song-view-thumb.webp (20.5KB) ← 99% smaller!
         song-view.webp (57.4KB)
         song-view-large.webp (142.9KB)
```

