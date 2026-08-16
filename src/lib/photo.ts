const MAX_SIDE = 1024;

/** Reads a camera/gallery file and returns a downscaled JPEG data URL. */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read that photo."));
    reader.onload = () => {
      const raw = String(reader.result);
      const img = new Image();
      img.onerror = () => resolve(raw);
      img.onload = () => {
        const scale = Math.min(1, MAX_SIDE / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(raw);
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.src = raw;
    };
    reader.readAsDataURL(file);
  });
}

export type PhotoAdjust = {
  /** Crop rect in 0..1 fractions of the source image. */
  crop: { x: number; y: number; w: number; h: number };
  /** 0.5 – 1.8 */
  brightness: number;
  /** 0.5 – 2 */
  contrast: number;
  /** Draw a closed black rectangle around the photo so line art has sealed edges. */
  border?: boolean;
};

export const DEFAULT_ADJUST: PhotoAdjust = {
  crop: { x: 0, y: 0, w: 1, h: 1 },
  brightness: 1.1,
  contrast: 1.2,
  border: true,
};

/** Applies crop + brightness/contrast and returns a downscaled JPEG data URL. */
export function adjustPhoto(src: string, adjust: PhotoAdjust): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onerror = () => resolve(src);
    img.onload = () => {
      const sx = Math.max(0, Math.min(1, adjust.crop.x)) * img.width;
      const sy = Math.max(0, Math.min(1, adjust.crop.y)) * img.height;
      const sw = Math.max(0.05, Math.min(1, adjust.crop.w)) * img.width;
      const sh = Math.max(0.05, Math.min(1, adjust.crop.h)) * img.height;
      const scale = Math.min(1, MAX_SIDE / Math.max(sw, sh));
      const canvas = document.createElement("canvas");
      canvas.width = Math.max(1, Math.round(sw * scale));
      canvas.height = Math.max(1, Math.round(sh * scale));
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        resolve(src);
        return;
      }
      ctx.filter = `brightness(${adjust.brightness}) contrast(${adjust.contrast})`;
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.9));
    };
    img.src = src;
  });
}
