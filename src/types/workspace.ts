import { Project } from './project';
import { ChapterMeta } from './chapter';
import { DocumentMeta } from './document';

/**
 * Workspace data structure
 * Represents a full novel project workspace
 */
export interface Workspace {
  /** Workspace root path */
  path: string;
  /** Workspace name */
  name: string;
  /** Project metadata */
  project: Project;
  /** Chapters list */
  chapters: ChapterMeta[];
  /** Materials list */
  materials: DocumentMeta[];
}
