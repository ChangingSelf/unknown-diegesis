import { Project } from './project';
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
  /** Story documents list */
  chapters: DocumentMeta[];
  /** Materials list */
  materials: DocumentMeta[];
}
