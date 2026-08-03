---
name: image-processing
description: Image processing and manipulation. Covers resizing, cropping, format conversion, watermarking, compression, thumbnails.
---

# Image Processing

## When to Apply
Use this skill when processing images, resizing for web, converting formats, adding watermarks, or optimizing images for performance.

## Core Concepts
- Image Formats: JPEG, PNG, WebP, GIF, SVG, AVIF
- Resolution: DPI, pixel dimensions, aspect ratio
- Compression: Lossy vs lossless, quality settings
- Color Spaces: RGB, CMYK, sRGB
- Thumbnails: Aspect ratio preservation, cropping strategies
- Watermarks: Text and image overlays, positioning
- Metadata: EXIF data, copyright information
- Optimization: File size reduction for web

## Implementation
```bash
# ImageMagick commands
# Resize image
convert input.jpg -resize 800x600 output.jpg

# Resize maintaining aspect ratio
convert input.jpg -resize 800x output.jpg

# Crop image
convert input.jpg -crop 400x300+100+100 output.jpg

# Convert format
convert input.png output.webp

# Compress image
convert input.jpg -quality 85 output.jpg

# Create thumbnail
convert input.jpg -thumbnail 200x200^ -gravity center -extent 200x200 thumb.jpg

# Add watermark
composite -dissolve 30 -gravity southeast watermark.png input.jpg output.jpg

# Strip metadata
convert input.jpg -strip output.jpg

# Batch processing
for file in *.jpg; do
  convert "$file" -resize 1200x -quality 80 "processed/$file"
done

# WebP conversion
cwebp -q 80 input.jpg -o output.webp

# AVIF conversion
avifenc --min 0 --max 63 input.jpg output.avif
```

## Best Practices
- Use WebP or AVIF for better compression than JPEG
- Generate multiple sizes for responsive images
- Preserve aspect ratio when resizing
- Use appropriate quality settings (80-85 for web)
- Strip unnecessary metadata for privacy
- Add watermarks for copyrighted images
- Test image loading performance
- Use lazy loading for image-heavy pages
- Consider accessibility (alt text, captions)
- Batch process images for efficiency
- Use CDN for image delivery
- Optimize for both mobile and desktop