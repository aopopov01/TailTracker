const Jimp = require('jimp');
const path = require('path');

/**
 * Remove grid background from Logo.jpg while preserving exact pet artwork details.
 * This performs precise background removal without altering the original artwork.
 */
async function removeGridBackground() {
    try {
        const inputPath = '/home/he_reat/Desktop/Projects/TailTracker/Logo.jpg';
        const outputPath = '/home/he_reat/Desktop/Projects/TailTracker/mobile/assets/tailtracker-logo.png';
        
        console.log('Loading original image...');
        const image = await new Promise((resolve, reject) => {
            Jimp.read(inputPath, (err, img) => {
                if (err) reject(err);
                else resolve(img);
            });
        });
        
        const width = image.bitmap.width;
        const height = image.bitmap.height;
        
        console.log(`Image dimensions: ${width}x${height}`);
        
        // Sample corner pixels to determine background color
        const cornerColors = [
            Jimp.intToRGBA(image.getPixelColor(0, 0)),
            Jimp.intToRGBA(image.getPixelColor(width - 1, 0)),
            Jimp.intToRGBA(image.getPixelColor(0, height - 1)),
            Jimp.intToRGBA(image.getPixelColor(width - 1, height - 1))
        ];
        
        // Calculate average background color
        const avgBgColor = {
            r: Math.round(cornerColors.reduce((sum, c) => sum + c.r, 0) / 4),
            g: Math.round(cornerColors.reduce((sum, c) => sum + c.g, 0) / 4),
            b: Math.round(cornerColors.reduce((sum, c) => sum + c.b, 0) / 4)
        };
        
        console.log('Detected background color:', avgBgColor);
        
        // Create a copy for processing
        const result = image.clone();
        
        // Process each pixel
        console.log('Processing pixels for background removal...');
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const pixelColor = Jimp.intToRGBA(image.getPixelColor(x, y));
                
                // Calculate color distance from background
                const colorDistance = Math.sqrt(
                    Math.pow(pixelColor.r - avgBgColor.r, 2) +
                    Math.pow(pixelColor.g - avgBgColor.g, 2) +
                    Math.pow(pixelColor.b - avgBgColor.b, 2)
                );
                
                // Check if pixel is part of background
                const isBackground = 
                    colorDistance < 30 || // Close to background color
                    (pixelColor.r > 240 && pixelColor.g > 240 && pixelColor.b > 240) || // Very light/white
                    (Math.abs(pixelColor.r - pixelColor.g) < 10 && 
                     Math.abs(pixelColor.g - pixelColor.b) < 10 && 
                     pixelColor.r > 220); // Light gray
                
                if (isBackground) {
                    // Make pixel transparent
                    result.setPixelColor(Jimp.rgbaToInt(0, 0, 0, 0), x, y);
                } else {
                    // Keep original pixel exactly as is
                    result.setPixelColor(image.getPixelColor(x, y), x, y);
                }
            }
        }
        
        // Additional pass: Remove grid lines by detecting patterns
        console.log('Detecting and removing grid patterns...');
        
        // Check for horizontal grid lines
        for (let y = 0; y < height; y++) {
            let lightPixelCount = 0;
            const lightPixels = [];
            
            for (let x = 0; x < width; x++) {
                const pixel = Jimp.intToRGBA(result.getPixelColor(x, y));
                if (pixel.a > 0 && pixel.r > 220 && pixel.g > 220 && pixel.b > 220) {
                    lightPixelCount++;
                    lightPixels.push(x);
                }
            }
            
            // If more than 60% of the row is light colored, it's likely a grid line
            if (lightPixelCount > width * 0.6) {
                lightPixels.forEach(x => {
                    result.setPixelColor(Jimp.rgbaToInt(0, 0, 0, 0), x, y);
                });
            }
        }
        
        // Check for vertical grid lines
        for (let x = 0; x < width; x++) {
            let lightPixelCount = 0;
            const lightPixels = [];
            
            for (let y = 0; y < height; y++) {
                const pixel = Jimp.intToRGBA(result.getPixelColor(x, y));
                if (pixel.a > 0 && pixel.r > 220 && pixel.g > 220 && pixel.b > 220) {
                    lightPixelCount++;
                    lightPixels.push(y);
                }
            }
            
            // If more than 60% of the column is light colored, it's likely a grid line
            if (lightPixelCount > height * 0.6) {
                lightPixels.forEach(y => {
                    result.setPixelColor(Jimp.rgbaToInt(0, 0, 0, 0), x, y);
                });
            }
        }
        
        // Final pass: Preserve colored regions (the pets)
        console.log('Preserving pet artwork details...');
        
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                const originalPixel = Jimp.intToRGBA(image.getPixelColor(x, y));
                const resultPixel = Jimp.intToRGBA(result.getPixelColor(x, y));
                
                // If this pixel has significant blue content (pets are blue-tinted)
                const hasBlue = originalPixel.b > originalPixel.r + 5 && originalPixel.b > originalPixel.g + 5;
                
                // If this pixel has color saturation (not gray/white)
                const hasColor = Math.max(originalPixel.r, originalPixel.g, originalPixel.b) - 
                                Math.min(originalPixel.r, originalPixel.g, originalPixel.b) > 15;
                
                // If we accidentally made a colored pixel transparent, restore it
                if ((hasBlue || hasColor) && resultPixel.a === 0) {
                    result.setPixelColor(image.getPixelColor(x, y), x, y);
                }
            }
        }
        
        // Save the result
        console.log('Saving result...');
        await result.writeAsync(outputPath);
        
        console.log('✓ Background removal completed successfully!');
        console.log('✓ Original pet artwork preserved with transparent background');
        console.log('✓ Grid pattern removed while maintaining exact details');
        console.log(`✓ Saved to: ${outputPath}`);
        
        // Also save a copy with white background for comparison
        const whiteBackground = new Jimp(width, height, 0xFFFFFFFF);
        whiteBackground.composite(result, 0, 0);
        const whiteBgPath = outputPath.replace('.png', '-white-bg.png');
        await whiteBackground.writeAsync(whiteBgPath);
        console.log(`✓ White background version saved to: ${whiteBgPath}`);
        
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}

// Run the background removal
removeGridBackground().catch(console.error);