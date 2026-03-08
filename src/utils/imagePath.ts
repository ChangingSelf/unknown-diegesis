export function isRemoteUrl(path: string): boolean {
  return /^(https?:|ftp:|blob:)/i.test(path);
}

export function resolveImagePath(src: string, basePath?: string): string {
  // If it's already an absolute URL or data URI, return as-is
  if (/^(https?:|data:)/.test(src)) return src;

  // If a basePath is provided, join it with the source
  const base = (basePath ?? '').trim().replace(/\\+$/, '').replace(/\/$/, '');
  const cleanSrc = src.replace(/^\/+/, '');
  return base ? `${base}/${cleanSrc}` : cleanSrc;
}
