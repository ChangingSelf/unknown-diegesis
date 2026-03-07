/**
 * MaterialType
 */
export type MaterialType = 'character' | 'location' | 'item' | 'timeline' | 'note';

/**
 * MaterialMeta
 */
export interface MaterialMeta {
  /** Unique material id */
  id: string;
  /** Material name */
  name: string;
  /** Material type */
  type: MaterialType;
  /** Relative path to material file */
  path: string;
  /** Created time (ISO 8601) */
  created: string;
  /** Last modified time (ISO 8601) */
  modified: string;
}
