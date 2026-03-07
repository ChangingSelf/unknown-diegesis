/**
 * ChapterStatus
 */
export type ChapterStatus = 'draft' | 'revising' | 'final';

/**
 * ChapterMeta
 * Used for chapter list display
 */
export interface ChapterMeta {
  /** Unique chapter identifier */
  id: string;
  /** Chapter number */
  number: number;
  /** Chapter title */
  title: string;
  /** Relative path to chapter file */
  path: string;
  /** Chapter status */
  status: ChapterStatus;
  /** Word count */
  wordCount: number;
  /** Created time (ISO 8601) */
  created: string;
  /** Last modified time (ISO 8601) */
  modified: string;
}
