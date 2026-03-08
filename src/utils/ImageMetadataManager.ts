export interface ImageMetadata {
  id: string;
  width?: number;
  height?: number;
  alt?: string;
  caption?: string;
  alignment?: 'left' | 'center' | 'right';
}

export class ImageMetadataManager {
  private store: Map<string, ImageMetadata> = new Map();

  add(id: string, meta: Partial<ImageMetadata>): void {
    const existing = this.store.get(id) ?? ({ id } as ImageMetadata);
    this.store.set(id, { ...existing, ...meta } as ImageMetadata);
  }

  get(id: string): ImageMetadata | undefined {
    return this.store.get(id);
  }
}
