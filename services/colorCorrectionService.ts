/**
 * Shades of Gray Color Correction Algorithm
 * 
 * This algorithm estimates the scene illuminant and corrects color cast
 * caused by different lighting conditions.
 * 
 * Based on the paper: "Shades of Gray and Colour Constancy" by Finlayson & Trezzi
 * Uses Minkowski p-norm with p=6 for best empirical results.
 */

const SHADES_OF_GRAY_NORM = 6; // p=6 gives best results empirically

/**
 * Apply Shades of Gray color correction to an image
 */
export async function correctImageColors(file: File): Promise<File> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            reject(new Error('Could not get canvas context'));
            return;
        }

        img.onload = () => {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const correctedData = applyShadesOfGray(imageData);
            ctx.putImageData(correctedData, 0, 0);

            canvas.toBlob((blob) => {
                if (blob) {
                    const correctedFile = new File([blob], file.name, { type: file.type || 'image/jpeg' });
                    resolve(correctedFile);
                } else {
                    reject(new Error('Failed to create corrected image'));
                }
            }, file.type || 'image/jpeg', 0.95);
        };

        img.onerror = () => reject(new Error('Failed to load image'));

        const reader = new FileReader();
        reader.onload = (e) => {
            img.src = e.target?.result as string;
        };
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
    });
}

/**
 * Apply Shades of Gray algorithm to ImageData
 */
function applyShadesOfGray(imageData: ImageData): ImageData {
    const data = imageData.data;
    const pixels = data.length / 4;

    // Calculate Minkowski p-norm for each channel
    let sumR = 0, sumG = 0, sumB = 0;
    const p = SHADES_OF_GRAY_NORM;

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i] / 255;
        const g = data[i + 1] / 255;
        const b = data[i + 2] / 255;

        sumR += Math.pow(r, p);
        sumG += Math.pow(g, p);
        sumB += Math.pow(b, p);
    }

    // Calculate p-norm average (illuminant estimate)
    const avgR = Math.pow(sumR / pixels, 1 / p);
    const avgG = Math.pow(sumG / pixels, 1 / p);
    const avgB = Math.pow(sumB / pixels, 1 / p);

    // Calculate normalization factor (target is neutral gray)
    const grayTarget = (avgR + avgG + avgB) / 3;

    // Avoid division by zero
    const scaleR = avgR > 0.01 ? grayTarget / avgR : 1;
    const scaleG = avgG > 0.01 ? grayTarget / avgG : 1;
    const scaleB = avgB > 0.01 ? grayTarget / avgB : 1;

    // Limit correction strength to avoid over-correction
    const maxCorrection = 1.5;
    const minCorrection = 0.6;

    const clampedScaleR = Math.max(minCorrection, Math.min(maxCorrection, scaleR));
    const clampedScaleG = Math.max(minCorrection, Math.min(maxCorrection, scaleG));
    const clampedScaleB = Math.max(minCorrection, Math.min(maxCorrection, scaleB));

    // Apply correction to each pixel
    for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.min(255, Math.max(0, Math.round(data[i] * clampedScaleR)));
        data[i + 1] = Math.min(255, Math.max(0, Math.round(data[i + 1] * clampedScaleG)));
        data[i + 2] = Math.min(255, Math.max(0, Math.round(data[i + 2] * clampedScaleB)));
        // Alpha channel (data[i + 3]) remains unchanged
    }

    return imageData;
}

/**
 * Check if color correction is needed based on image analysis
 * Returns true if the image appears to have a strong color cast
 */
export function needsColorCorrection(file: File): Promise<boolean> {
    return new Promise((resolve) => {
        const img = new Image();
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            resolve(false);
            return;
        }

        img.onload = () => {
            // Use a smaller sample for quick analysis
            const sampleSize = 100;
            canvas.width = sampleSize;
            canvas.height = sampleSize;
            ctx.drawImage(img, 0, 0, sampleSize, sampleSize);

            const imageData = ctx.getImageData(0, 0, sampleSize, sampleSize);
            const data = imageData.data;

            let avgR = 0, avgG = 0, avgB = 0;
            const pixels = data.length / 4;

            for (let i = 0; i < data.length; i += 4) {
                avgR += data[i];
                avgG += data[i + 1];
                avgB += data[i + 2];
            }

            avgR /= pixels;
            avgG /= pixels;
            avgB /= pixels;

            // Check if there's a noticeable color cast
            // If any channel differs by more than 15% from average, correction is needed
            const overallAvg = (avgR + avgG + avgB) / 3;
            const threshold = overallAvg * 0.15;

            const hasColorCast =
                Math.abs(avgR - overallAvg) > threshold ||
                Math.abs(avgG - overallAvg) > threshold ||
                Math.abs(avgB - overallAvg) > threshold;

            resolve(hasColorCast);
        };

        img.onerror = () => resolve(false);

        const reader = new FileReader();
        reader.onload = (e) => {
            img.src = e.target?.result as string;
        };
        reader.onerror = () => resolve(false);
        reader.readAsDataURL(file);
    });
}
