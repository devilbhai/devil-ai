import sharp from 'sharp';
import fs from 'fs';
import path from 'path';

const size = 1024;
// macOS squircle radius is roughly 22.5% of the size
const r = Math.round(size * 0.225); 

const rect = Buffer.from(
  `<svg><rect x="0" y="0" width="${size}" height="${size}" rx="${r}" ry="${r}" /></svg>`
);

async function processAll() {
  const dir = '/Users/gunjan/Documents/devil-ai/apps/desktop/resources';
  const files = fs.readdirSync(dir).filter(f => f.startsWith('devil-') && f.endsWith('.jpg'));
  
  for (const file of files) {
    const inputPath = path.join(dir, file);
    const outputPath = path.join(dir, file.replace('.jpg', '.png'));
    
    try {
      await sharp(inputPath)
        .resize(size, size)
        .composite([{
          input: rect,
          blend: 'dest-in'
        }])
        .png()
        .toFile(outputPath);
      console.log(`Masked ${file} -> ${path.basename(outputPath)}`);
    } catch (e) {
      console.error(`Error with ${file}:`, e);
    }
  }
}

processAll();
