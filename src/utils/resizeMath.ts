export function normalizeNumber(value: number, min: number, max: number, fallback: number): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(min, Math.min(max, Math.round(value)));
}

export function scaleHeight(width: number, ratio: number, fallback: number): number {
  if (!Number.isFinite(width) || width <= 0 || !Number.isFinite(ratio) || ratio <= 0) return fallback;
  return Math.max(1, Math.round(width / ratio));
}

export function scaleWidth(height: number, ratio: number, fallback: number): number {
  if (!Number.isFinite(height) || height <= 0 || !Number.isFinite(ratio) || ratio <= 0) return fallback;
  return Math.max(1, Math.round(height * ratio));
}

export function readImageAspectRatio(file: File): Promise<number> {
  return createImageBitmap(file)
    .then((bitmap) => {
      const ratio = bitmap.width > 0 && bitmap.height > 0 ? bitmap.width / bitmap.height : 0;
      bitmap.close();
      return ratio;
    })
    .catch(() => 0);
}
