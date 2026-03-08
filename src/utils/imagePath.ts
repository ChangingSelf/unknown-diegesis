import path from 'path';

export function toAbsolutePath(relativePath: string, workspacePath: string): string {
  return path.resolve(workspacePath, relativePath);
}
export function toRelativePath(absolutePath: string, workspacePath: string): string {
  return path.relative(workspacePath, absolutePath);
}

export function isRemoteUrl(p: string): boolean {
  return p.startsWith('http://') || p.startsWith('https://');
}
export function getImageCategory(p: string): 'character' | 'scene' | 'illustration' | null {
  const lower = p.toLowerCase();
  if (lower.includes('characters') || lower.includes('character')) {
    return 'character';
  }
  if (lower.includes('scenes') || lower.includes('scene')) {
    return 'scene';
  }
  if (lower.includes('illustrations') || lower.includes('illustration')) {
    return 'illustration';
  }
  return null;
}
export function getImageFileName(p: string): string {
  return path.basename(p);
}

export function normalizePath(p: string): string {
  let normalized = path.normalize(p);
  // Use forward slashes for consistency across platforms
  normalized = normalized.replace(/\\/g, '/');
  // Remove redundant current-dir references
  normalized = normalized.replace(/\/\.\//g, '/');
  // Collapse multiple slashes
  normalized = normalized.replace(/\/\/{2,}/g, '/');
  // Remove trailing '/.' if any
  normalized = normalized.replace(/\/\.$/, '/');
  return normalized;
}
