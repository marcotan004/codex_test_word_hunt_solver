const toBool = (value: string | undefined, fallback: boolean) => {
  if (value == null) return fallback;
  return value === '1' || value.toLowerCase() === 'true';
};

export const featureFlags = {
  ocr: toBool(import.meta.env.VITE_FEATURE_OCR, false),
};
