import type { Slide, SlideObject } from './types';

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (c: number) => {
    const hex = Math.max(0, Math.min(255, Math.round(c))).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function hexToRgb(hex: string) {
  const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
  const fullHex = hex.replace(shorthandRegex, (_, r, g, b) => r + r + g + g + b + b);
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : { r: 255, g: 255, b: 255 };
}

/**
 * Programmatically refines slide background and object colors using a client-side offscreen canvas.
 * Samples exact pixels from the original uploaded screenshot at the coordinates returned by the VLM.
 */
export async function refineSlideColors(slide: Slide, imageFile: File): Promise<Slide> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.naturalWidth;
        canvas.height = img.naturalHeight;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          console.warn('Could not get 2D context from canvas');
          resolve(slide);
          return;
        }
        ctx.drawImage(img, 0, 0);

        const imgW = img.naturalWidth;
        const imgH = img.naturalHeight;

        // 1. Sample Slide Background Color
        // Sample 4 corners (10px inset to avoid any border artifacts)
        const corners = [
          ctx.getImageData(Math.min(10, imgW - 1), Math.min(10, imgH - 1), 1, 1).data,
          ctx.getImageData(Math.max(0, imgW - 10), Math.min(10, imgH - 1), 1, 1).data,
          ctx.getImageData(Math.min(10, imgW - 1), Math.max(0, imgH - 10), 1, 1).data,
          ctx.getImageData(Math.max(0, imgW - 10), Math.max(0, imgH - 10), 1, 1).data
        ];

        // Compute average corner color
        let totalR = 0, totalG = 0, totalB = 0;
        corners.forEach(c => {
          totalR += c[0];
          totalG += c[1];
          totalB += c[2];
        });
        const bgColor = rgbToHex(totalR / 4, totalG / 4, totalB / 4);
        const bgRgb = hexToRgb(bgColor);

        // 2. Refine each object color
        const refinedObjects = slide.objects.map(obj => {
          // Slide space is 1280x720. Map coordinates back to original image size.
          const x = Math.max(0, Math.min(imgW - 1, (obj.x / 1280) * imgW));
          const y = Math.max(0, Math.min(imgH - 1, (obj.y / 720) * imgH));
          const w = Math.max(1, Math.min(imgW - x, (obj.width / 1280) * imgW));
          const h = Math.max(1, Math.min(imgH - y, (obj.height / 720) * imgH));

          const newObj = { ...obj };

          try {
            // Read all pixels in the object bounding box
            const imgData = ctx.getImageData(x, y, w, h);
            const data = imgData.data;

            if (obj.type === 'shape') {
              // Sample a center window (middle 60%) to avoid picking up border colors
              const startX = Math.floor(w * 0.2);
              const endX = Math.floor(w * 0.8);
              const startY = Math.floor(h * 0.2);
              const endY = Math.floor(h * 0.8);

              let sumR = 0, sumG = 0, sumB = 0, count = 0;

              for (let sy = startY; sy < endY; sy++) {
                for (let sx = startX; sx < endX; sx++) {
                  const idx = (sy * Math.floor(w) + sx) * 4;
                  if (idx + 2 < data.length) {
                    sumR += data[idx];
                    sumG += data[idx + 1];
                    sumB += data[idx + 2];
                    count++;
                  }
                }
              }

              if (count > 0) {
                newObj.fill = rgbToHex(sumR / count, sumG / count, sumB / count);
              }
            } else if (obj.type === 'text') {
              // Detect local background of the text box (by averaging corners of the text box)
              const cornersIdx = [
                0, // top-left
                Math.max(0, Math.floor(w - 1)) * 4, // top-right
                Math.max(0, Math.floor(h - 1)) * Math.floor(w) * 4, // bottom-left
                Math.max(0, Math.floor(h - 1) * Math.floor(w) + Math.floor(w - 1)) * 4 // bottom-right
              ];

              let localBgR = 0, localBgG = 0, localBgB = 0, bgCount = 0;
              cornersIdx.forEach(idx => {
                if (idx + 2 < data.length) {
                  localBgR += data[idx];
                  localBgG += data[idx + 1];
                  localBgB += data[idx + 2];
                  bgCount++;
                }
              });

              const localBg = bgCount > 0
                ? { r: localBgR / bgCount, g: localBgG / bgCount, b: localBgB / bgCount }
                : bgRgb;

              // Find pixels in the text box that differ significantly from the local background color.
              // We'll compute the distance of each pixel.
              const pixels: { r: number, g: number, b: number, dist: number }[] = [];
              for (let i = 0; i < data.length; i += 4) {
                if (i + 2 < data.length) {
                  const r = data[i];
                  const g = data[i + 1];
                  const b = data[i + 2];
                  const dist = Math.sqrt(
                    Math.pow(r - localBg.r, 2) +
                    Math.pow(g - localBg.g, 2) +
                    Math.pow(b - localBg.b, 2)
                  );
                  pixels.push({ r, g, b, dist });
                }
              }

              // Sort by color difference from background (descending)
              pixels.sort((a, b) => b.dist - a.dist);

              // Take the top 10% furthest pixels (these represent the actual text stroke pixels)
              const topCount = Math.max(1, Math.floor(pixels.length * 0.1));
              let sumTextR = 0, sumTextG = 0, sumTextB = 0;
              for (let k = 0; k < topCount; k++) {
                sumTextR += pixels[k].r;
                sumTextG += pixels[k].g;
                sumTextB += pixels[k].b;
              }

              const avgDist = pixels.slice(0, topCount).reduce((sum, p) => sum + p.dist, 0) / topCount;

              // Only update fontColor if the contrast is significant (means we actually found text)
              if (avgDist > 30) {
                newObj.fontColor = rgbToHex(sumTextR / topCount, sumTextG / topCount, sumTextB / topCount);
              } else {
                newObj.fontColor = obj.fontColor || '#000000';
              }
            } else if (obj.type === 'icon') {
              // For icons, sample the center region or dominant non-background color
              const startX = Math.floor(w * 0.25);
              const endX = Math.floor(w * 0.75);
              const startY = Math.floor(h * 0.25);
              const endY = Math.floor(h * 0.75);

              let sumR = 0, sumG = 0, sumB = 0, count = 0;

              for (let sy = startY; sy < endY; sy++) {
                for (let sx = startX; sx < endX; sx++) {
                  const idx = (sy * Math.floor(w) + sx) * 4;
                  if (idx + 2 < data.length) {
                    sumR += data[idx];
                    sumG += data[idx + 1];
                    sumB += data[idx + 2];
                    count++;
                  }
                }
              }

              if (count > 0) {
                newObj.iconColor = rgbToHex(sumR / count, sumG / count, sumB / count);
                newObj.fill = rgbToHex(sumR / count, sumG / count, sumB / count);
              }
            }
          } catch (err) {
            console.error('Error sampling colors for object:', obj.id, err);
          }

          return newObj;
        });

        resolve({
          ...slide,
          backgroundColor: bgColor,
          objects: refinedObjects
        });
      };

      img.onerror = () => {
        console.error('Failed to load image for color refinement');
        resolve(slide);
      };

      img.src = e.target?.result as string;
    };

    reader.onerror = () => {
      console.error('FileReader error during color refinement');
      resolve(slide);
    };

    reader.readAsDataURL(imageFile);
  });
}
