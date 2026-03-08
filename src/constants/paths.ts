export const STORY_DIR = 'story';
export const MATERIALS_DIR = 'materials';
export const ASSETS_DIR = 'assets';
export const INDEX_DIR = '.index';

export const MATERIAL_SUBDIRS = {
  character: 'characters',
  location: 'locations',
  item: 'items',
  worldview: 'worldviews',
  outline: 'outlines',
  note: 'notes',
} as const;

export const ASSET_SUBDIRS = {
  image: 'images',
  document: 'documents',
  audio: 'audio',
  video: 'video',
} as const;

export const IMAGE_SUBDIRS = {
  characters: 'characters',
  scenes: 'scenes',
  illustrations: 'illustrations',
} as const;

export const INDEX_FILES = {
  story: 'story.json',
  materials: 'materials.json',
  assets: 'assets.json',
} as const;

export const WORKSPACE_META_FILE = 'workspace.json';

export const WORKSPACE_VERSION = '2.0';

export type MaterialSubdir = (typeof MATERIAL_SUBDIRS)[keyof typeof MATERIAL_SUBDIRS];
export type AssetSubdir = (typeof ASSET_SUBDIRS)[keyof typeof ASSET_SUBDIRS];
