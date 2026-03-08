// Simple registry for image host URLs
export class ImageHostManager {
  private registry: Map<string, string> = new Map();

  registerImageHost(id: string, url: string): void {
    this.registry.set(id, url);
  }

  getHost(id: string): string | undefined {
    return this.registry.get(id);
  }
}
