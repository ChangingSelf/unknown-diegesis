import { promises as fs } from 'fs';
import path from 'path';

/**
 * Atomic file writer.
 * Writes data to a temporary file in the same directory and then renames it into place.
 * Ensures data integrity even in the face of crashes or power failures.
 */
export class AtomicFileWriter {
  /**
   * Writes content to the specified path atomically.
   * @param targetPath - The final file path to write to.
   * @param data - Content to write (string or Buffer).
   */
  static async writeFileAtomic(targetPath: string, data: string | Buffer): Promise<void> {
    const dir = path.dirname(targetPath);
    // Create a temp file in the same directory with a .tmp extension and unique suffix
    const tmpPath = path.join(dir, `${Date.now()}-${Math.random().toString(16).slice(2)}.tmp`);

    // Ensure we always attempt cleanup of the temp file
    let cleanupNeeded = true;
    try {
      await fs.writeFile(tmpPath, data);
      await fs.rename(tmpPath, targetPath);
      // If rename succeeds, no cleanup necessary for tmpPath
      cleanupNeeded = false;
    } catch (err) {
      // Attempt to cleanup temp file on error
      try {
        await fs.access(tmpPath);
        // If exists, remove
        await fs.unlink(tmpPath);
      } catch {
        // ignore cleanup errors
      }
      throw err;
    } finally {
      // Final safeguard: remove any stray tmp file if still present
      if (cleanupNeeded) {
        try {
          await fs.access(tmpPath);
          await fs.unlink(tmpPath);
        } catch {
          // ignore
        }
      }
    }
  }
}
