/**
 * ProjectStatistics
 */
export interface ProjectStatistics {
  /** Total word count */
  wordCount: number;
  /** Number of chapters */
  chapterCount: number;
  /** Number of characters */
  characterCount: number;
}

/**
 * ProjectSettings
 */
export interface ProjectSettings {
  /** Auto save enabled */
  autoSave: boolean;
  /** Auto save interval in ms */
  autoSaveInterval: number;
  /** Default block type */
  defaultBlockType: string;
}

/**
 * Project metadata
 * Internal type for workspace configuration
 */
export interface Project {
  /** Schema version (integer incrementing) */
  schemaVersion: number;
  /** Title of the book */
  title: string;
  /** Author name */
  author: string;
  /** Description / synopsis */
  description?: string;
  /** Genre / type */
  genre?: string;
  /** Created time (ISO 8601) */
  created: string;
  /** Last modified time (ISO 8601) */
  modified: string;
  /** Statistics */
  statistics: ProjectStatistics;
  /** Settings */
  settings: ProjectSettings;
}
