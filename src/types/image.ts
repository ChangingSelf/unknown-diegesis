export type ImageSourceType = 'local' | 'remote';

export type ImageSource = {
  type: ImageSourceType;
  path: string;
};

export type ImageBlockContent = {
  source: ImageSource;
  caption?: string;
  alignment?: 'left' | 'center' | 'right';
  width?: number;
  originalWidth?: number;
  originalHeight?: number;
};

export interface Character {
  id: string;
  name: string;
  description?: string;
  created: string;
}

export interface Expression {
  id: string;
  characterId: string;
  name: string;
  source: ImageSource;
  thumbnail?: string;
}

export interface ImageHostConfig {
  id: string;
  name: string;
  type: string;
  config: Record<string, string>;
}

export interface ImageHostLink {
  localPath: string;
  remoteUrl: string;
  hostId: string;
  uploadedAt: string;
}

export interface CharacterLibrary {
  id: string;
  name: string;
  characters: Character[];
}
