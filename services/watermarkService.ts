
/**
 * Removes a specific background color from an image and makes it transparent.
 * @param ctx Canvas context
 * @param width Canvas width
 * @param height Canvas height
 * @param targetColor The [r, g, b] color to remove
 * @param tolerance How close the color needs to be to the target color (0-255)
 */
const makeTransparent = (ctx: CanvasRenderingContext2D, width: number, height: number, targetColor: [number, number, number], tolerance: number = 50) => {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Check if the current pixel is close to the target color
        const dist = Math.sqrt(
            Math.pow(r - targetColor[0], 2) +
            Math.pow(g - targetColor[1], 2) +
            Math.pow(b - targetColor[2], 2)
        );

        if (dist < tolerance) {
            data[i + 3] = 0; // Make transparent
        }
    }

    ctx.putImageData(imageData, 0, 0);
};

/**
 * Adds a watermark (text or image) to the given image URL.
 * @param imageUrl The URL of the image to watermark.
 * @param watermarkText Optional text to use if no logo image is provided.
 * @returns A promise that resolves to the data URL of the watermarked image.
 */
export const addWatermark = (imageUrl: string, watermarkText: string = 'Saket'): Promise<string> => {
    return new Promise((resolve, reject) => {
        const mainImg = new Image();
        mainImg.crossOrigin = 'anonymous';

        mainImg.onload = () => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Could not get canvas context'));
                return;
            }

            canvas.width = mainImg.width;
            canvas.height = mainImg.height;
            ctx.drawImage(mainImg, 0, 0);

            // Load logo image
            const logoImg = new Image();
            logoImg.crossOrigin = 'anonymous';

            logoImg.onload = () => {
                // Create a temporary canvas to process the logo (remove yellow background)
                const logoCanvas = document.createElement('canvas');
                const logoCtx = logoCanvas.getContext('2d');
                if (!logoCtx) return;

                logoCanvas.width = logoImg.width;
                logoCanvas.height = logoImg.height;
                logoCtx.drawImage(logoImg, 0, 0);

                // Remove the yellow background (approximately #f0e64a or similar from user image)
                // Adjust these values based on the actual logo image
                makeTransparent(logoCtx, logoCanvas.width, logoCanvas.height, [240, 230, 74], 100);

                // Calculate size: logo should be small (e.g., 15% of the main image width)
                const scale = (mainImg.width * 0.15) / logoImg.width;
                const logoW = logoImg.width * scale;
                const logoH = logoImg.height * scale;

                // Position: Bottom right
                const padding = mainImg.width * 0.03;
                const x = canvas.width - logoW - padding;
                const y = canvas.height - logoH - padding;

                // Draw the processed logo onto the main canvas
                ctx.globalAlpha = 0.8; // Make it slightly transparent
                ctx.drawImage(logoCanvas, x, y, logoW, logoH);
                ctx.globalAlpha = 1.0;

                resolve(canvas.toDataURL('image/png'));
            };

            logoImg.onerror = () => {
                // Fallback to text watermark if logo fails to load
                console.warn('Logo failed to load, falling back to text watermark.');
                const fontSize = Math.max(16, Math.floor(mainImg.width * 0.05));
                ctx.font = `italic ${fontSize}px "Playfair Display", serif`;
                ctx.fillStyle = 'rgba(255, 69, 0, 0.7)';
                ctx.textAlign = 'right';
                ctx.textBaseline = 'bottom';
                const padding = fontSize;
                ctx.fillText(watermarkText, canvas.width - padding, canvas.height - padding);
                resolve(canvas.toDataURL('image/png'));
            };

            // Path to the logo image
            logoImg.src = '/logo.png';
        };

        mainImg.onerror = (err) => {
            console.error('Error loading main image:', err);
            reject(new Error('Failed to load image for watermarking'));
        };

        mainImg.src = imageUrl;
    });
};
