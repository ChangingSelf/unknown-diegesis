export class SaveLock {
  private static locks: Set<string> = new Set();

  static async acquire(key: string): Promise<() => void> {
    while (SaveLock.locks.has(key)) {
      await new Promise(resolve => setTimeout(resolve, 5));
    }
    SaveLock.locks.add(key);
    const release = () => {
      SaveLock.locks.delete(key);
    };
    return release;
  }
}
