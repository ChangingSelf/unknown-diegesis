// Image-related type definitions
export type ImageLayout = 'full' | 'left' | 'right' | 'center';

export interface ImageBlockData {
  id: string;
  src: string;
  alt?: string;
  caption?: string;
  layout?: ImageLayout;
}

export interface LayoutRow {
  kind: 'image-row';
  blocks: ImageBlockData[];
}

export type ImageBlockContent = ImageBlockData;
