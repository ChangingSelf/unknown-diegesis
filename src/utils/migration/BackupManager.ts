export const BACKUP_DIR = '.backup';
export const DEFAULT_KEEP_COUNT = 3;

export interface BackupInfo {
  name: string;
  path: string;
  createdAt: string;
  version: number;
}

export class BackupManager {
  private api = window.electronAPI;

  async createBackup(workspacePath: string, oldVersion: number): Promise<string | null> {
    if (!this.api?.workspaceMkdir || !this.api?.workspaceReadDir || !this.api?.workspaceCopyFile) {
      console.warn(
        'BackupManager requires workspaceMkdir, workspaceReadDir, and workspaceCopyFile'
      );
      return null;
    }

    try {
      const backupDir = `${workspacePath}/${BACKUP_DIR}`;
      await this.api.workspaceMkdir(backupDir);

      const timestamp = Date.now();
      const backupName = `backup-${timestamp}-v${oldVersion}`;
      const backupPath = `${backupDir}/${backupName}`;

      await this.api.workspaceMkdir(backupPath);

      const filesToBackup = ['workspace.json', 'story', 'materials', 'assets', '.index'];

      for (const file of filesToBackup) {
        const sourcePath = `${workspacePath}/${file}`;
        const destPath = `${backupPath}/${file}`;

        try {
          if (file === 'workspace.json') {
            const result = await this.api.workspaceCopyFile(sourcePath, destPath);
            if (!result?.success) {
              console.warn(`Failed to backup ${file}`);
            }
          } else {
            const dirResult = await this.api.workspaceReadDir(sourcePath);
            if (dirResult?.success && dirResult.files && dirResult.files.length > 0) {
              await this.api.workspaceMkdir(destPath);
              for (const subFile of dirResult.files) {
                await this.api.workspaceCopyFile(
                  `${sourcePath}/${subFile}`,
                  `${destPath}/${subFile}`
                );
              }
            }
          }
        } catch {
          console.warn(`Failed to backup ${file}, continuing...`);
        }
      }

      await this.cleanOldBackups(workspacePath);

      return backupPath;
    } catch (error) {
      console.error('Failed to create backup:', error);
      return null;
    }
  }

  async cleanOldBackups(workspacePath: string, keepCount = DEFAULT_KEEP_COUNT): Promise<boolean> {
    if (!this.api?.workspaceReadDir || !this.api?.workspaceDelete) {
      return false;
    }

    try {
      const backupDir = `${workspacePath}/${BACKUP_DIR}`;
      const result = await this.api.workspaceReadDir(backupDir);

      if (!result?.success || !result?.files) {
        return true;
      }

      const backups = result.files
        .filter((name: string) => name.startsWith('backup-'))
        .sort()
        .reverse();

      if (backups.length <= keepCount) {
        return true;
      }

      const toDelete = backups.slice(keepCount);
      for (const backup of toDelete) {
        await this.api.workspaceDelete(`${backupDir}/${backup}`);
      }

      return true;
    } catch (error) {
      console.error('Failed to clean old backups:', error);
      return false;
    }
  }

  async listBackups(workspacePath: string): Promise<BackupInfo[]> {
    if (!this.api?.workspaceReadDir) {
      return [];
    }

    try {
      const backupDir = `${workspacePath}/${BACKUP_DIR}`;
      const result = await this.api.workspaceReadDir(backupDir);

      if (!result?.success || !result?.files) {
        return [];
      }

      const backups: BackupInfo[] = [];
      const backupRegex = /^backup-(\d+)-v(\d+)$/;

      for (const name of result.files) {
        const match = name.match(backupRegex);
        if (match) {
          backups.push({
            name,
            path: `${backupDir}/${name}`,
            createdAt: new Date(parseInt(match[1], 10)).toISOString(),
            version: parseInt(match[2], 10),
          });
        }
      }

      return backups.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    } catch (error) {
      console.error('Failed to list backups:', error);
      return [];
    }
  }
}
