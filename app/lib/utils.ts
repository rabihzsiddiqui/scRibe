export function getStats(text: string) {
  const chars = text.length;
  const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
  const readTime = Math.max(1, Math.ceil(words / 200));
  return { words, chars, readTime };
}

export function getFilename(text: string, ext: string): string {
  const firstLine = text.split('\n')[0].trim().replace(/^#+\s*/, '');
  if (!firstLine) return `scribe-export-${Date.now()}.${ext}`;
  const slug = firstLine
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 30);
  return slug ? `${slug}.${ext}` : `scribe-export-${Date.now()}.${ext}`;
}
