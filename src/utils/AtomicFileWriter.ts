/* eslint-disable @typescript-eslint/no-explicit-any */
export class AtomicFileWriter {
  static async writeFileAtomic(
    filePath: string,
    content: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const api: any = typeof window !== 'undefined' ? (window as any).electronAPI : null;
      const workspaceWriteFile = api?.electronAPI as
        | ((path: string, content: string) => Promise<{ success: boolean; error?: string }>)
        | undefined;

      if (!workspaceWriteFile) {
        return { success: false, error: 'workspaceWriteFile API not available' };
      }
      const tmpPath = filePath + '.tmp';
      const resTmp = await workspaceWriteFile(tmpPath, content);
      if (!resTmp?.success) {
        return { success: false, error: resTmp?.error ?? 'Failed to write tmp file' };
      }

      const workspaceRename = api?.electronAPI?.workspaceRename as
        | ((src: string, dest: string) => Promise<{ success: boolean; error?: string }>)
        | undefined;
      const workspaceMove = api?.electronAPI?.workspaceMove as
        | ((src: string, dest: string) => Promise<{ success: boolean; error?: string }>)
        | undefined;
      const workspaceDelete = api?.electronAPI?.workspaceDelete as
        | ((path: string) => Promise<{ success: boolean; error?: string }>)
        | undefined;

      if (typeof workspaceRename === 'function') {
        const renameRes = await workspaceRename(tmpPath, filePath);
        if (renameRes?.success) {
          return { success: true };
        } else {
          await workspaceDelete?.(tmpPath);
          return { success: false, error: renameRes?.error ?? 'Rename failed' };
        }
      }
      if (typeof workspaceMove === 'function') {
        const moveRes = await workspaceMove(tmpPath, filePath);
        if (moveRes?.success) {
          return { success: true };
        } else {
          await workspaceDelete?.(tmpPath);
          return { success: false, error: moveRes?.error ?? 'Move failed' };
        }
      }

      try {
        await workspaceDelete?.(filePath);
      } catch {
        // Ignore delete errors
      }
      const finalWrite = await workspaceWriteFile(filePath, content);
      if (finalWrite?.success) return { success: true };
      return { success: false, error: finalWrite?.error ?? 'Final write failed' };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { success: false, error: message };
    }
  }
}
