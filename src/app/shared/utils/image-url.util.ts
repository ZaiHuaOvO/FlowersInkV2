export function inferOriginalImageUrl(previewUrl: string): string {
  return previewUrl.includes('compressed-')
    ? previewUrl.replace('compressed-', '')
    : previewUrl;
}
