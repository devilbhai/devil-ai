import sharp from 'sharp';

async function run() {
  const img = sharp('icon-source.jpg');
  const { data, info } = await img.raw().toBuffer({ resolveWithObject: true });
  
  const out = Buffer.alloc(info.width * info.height * 4);
  for (let i = 0, j = 0; i < data.length; i += 3, j += 4) {
    const r = data[i];
    const g = data[i+1];
    const b = data[i+2];
    
    const lum = 0.299*r + 0.587*g + 0.114*b;
    
    // Smooth alpha transition: white becomes transparent
    let alpha = 255;
    if (lum > 240) {
      alpha = Math.max(0, 255 - (lum - 240) * 17);
    }
    
    out[j] = r;
    out[j+1] = g;
    out[j+2] = b;
    out[j+3] = alpha;
  }
  
  await sharp(out, { raw: { width: info.width, height: info.height, channels: 4 } })
    .png()
    .toFile('icon.png');
    
  // Copy to icon-macos.png
  await sharp('icon.png').toFile('icon-macos.png');
    
  console.log('done');
}
run();
