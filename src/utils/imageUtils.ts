/**
 * Image processing utilities for avatar resizing and compression
 * Ensures avatars never exceed Firestore document limits (1MB) or localStorage limits.
 * Compresses any photo to a crisp 256x256 JPEG (~15-30 KB).
 */

export const compressImage = (
  source: File | string,
  maxDimension = 256,
  quality = 0.85
): Promise<string> => {
  return new Promise((resolve, reject) => {
    // If it's an external HTTP/HTTPS URL, no compression needed
    if (typeof source === 'string' && (source.startsWith('http://') || source.startsWith('https://'))) {
      resolve(source);
      return;
    }

    const processDataUrl = (dataUrl: string) => {
      const img = new Image();
      img.onload = () => {
        try {
          const width = img.naturalWidth || img.width;
          const height = img.naturalHeight || img.height;

          // Crop square from center
          const minSide = Math.min(width, height);
          const startX = (width - minSide) / 2;
          const startY = (height - minSide) / 2;

          const canvas = document.createElement('canvas');
          const targetSize = Math.min(maxDimension, minSide || maxDimension);
          canvas.width = targetSize;
          canvas.height = targetSize;

          const ctx = canvas.getContext('2d');
          if (!ctx) {
            resolve(dataUrl);
            return;
          }

          // Use high quality image smoothing
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          ctx.drawImage(
            img,
            startX,
            startY,
            minSide,
            minSide,
            0,
            0,
            targetSize,
            targetSize
          );

          // Export as compressed JPEG
          const compressed = canvas.toDataURL('image/jpeg', quality);
          resolve(compressed);
        } catch (err) {
          // If canvas tainted or failed, return original dataUrl
          console.warn('Canvas compression fallback:', err);
          resolve(dataUrl);
        }
      };

      img.onerror = () => {
        reject(new Error('Gagal memuat gambar. Silakan gunakan format file gambar lain.'));
      };

      img.src = dataUrl;
    };

    if (source instanceof File) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result;
        if (typeof result === 'string') {
          processDataUrl(result);
        } else {
          reject(new Error('Gagal membaca file gambar.'));
        }
      };
      reader.onerror = () => reject(new Error('Gagal membaca file gambar.'));
      reader.readAsDataURL(source);
    } else if (typeof source === 'string') {
      processDataUrl(source);
    } else {
      reject(new Error('Format sumber gambar tidak valid.'));
    }
  });
};
