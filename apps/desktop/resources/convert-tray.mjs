import sharp from 'sharp';
import fs from 'fs';

async function processImage(inputPath) {
    try {
        const image = sharp(inputPath);
        
        // Extract the black shape by replacing white with transparent
        const { data, info } = await image
            .ensureAlpha()
            .raw()
            .toBuffer({ resolveWithObject: true });

        for (let i = 0; i < data.length; i += info.channels) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            // If it's bright/white, make it transparent
            if (r > 200 && g > 200 && b > 200) {
                data[i + 3] = 0;
            } else {
                // Force shape to pure black for template
                data[i] = 0;
                data[i + 1] = 0;
                data[i + 2] = 0;
                data[i + 3] = 255;
            }
        }

        const transparentImg = sharp(data, {
            raw: {
                width: info.width,
                height: info.height,
                channels: info.channels,
            },
        });

        // Resize to 44x44 (@2x)
        await transparentImg.clone().resize(44, 44).toFile('/Users/gunjan/Documents/devil-ai/apps/desktop/resources/iconTemplate@2x.png');
        
        // Resize to 22x22 (1x)
        await transparentImg.clone().resize(22, 22).toFile('/Users/gunjan/Documents/devil-ai/apps/desktop/resources/iconTemplate.png');
        
        // Also update iconTray.png
        await transparentImg.clone().resize(22, 22).toFile('/Users/gunjan/Documents/devil-ai/apps/desktop/resources/iconTray.png');

        console.log("Successfully created tray icons.");
    } catch (e) {
        console.error(e);
    }
}

const inputPath = process.argv[2];
if (inputPath) {
    processImage(inputPath);
} else {
    console.log("No input path provided");
}
