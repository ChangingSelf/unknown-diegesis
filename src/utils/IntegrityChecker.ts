import * as path from 'path';
import { promises as fs } from 'fs';

export interface WorkspaceStructureReport {
  ok: boolean;
  missingDirectories: string[];
  presentDirectories: string[];
  notes?: string[];
}

export interface IndexConsistencyReport {
  ok: boolean;
  manifestPath: string;
  added?: string[];
  removed?: string[];
  modified?: string[];
  missingManifest?: boolean;
  details?: string[];
}

export default class IntegrityChecker {
  private baseDir: string;
  private manifestFile: string;

  constructor(baseDir?: string) {
    this.baseDir = baseDir ?? process.cwd();
    this.manifestFile = path.resolve(this.baseDir, 'src/index.manifest.json');
  }

  async checkWorkspaceStructure(): Promise<WorkspaceStructureReport> {
    const requiredRoot = ['electron', 'src', 'docs', 'dist'];
    const requiredSrcSubdirs = ['components', 'hooks', 'services', 'utils', 'types', 'extensions'];

    const presentDirectories: string[] = [];
    const missingDirectories: string[] = [];

    for (const d of requiredRoot) {
      const dir = path.resolve(this.baseDir, d);
      try {
        const stat = await fs.stat(dir);
        if (stat.isDirectory()) presentDirectories.push(d);
        else missingDirectories.push(d);
      } catch {
        missingDirectories.push(d);
      }
    }

    const srcDir = path.resolve(this.baseDir, 'src');
    try {
      const stat = await fs.stat(srcDir);
      if (stat.isDirectory()) {
        for (const sub of requiredSrcSubdirs) {
          const subDir = path.resolve(srcDir, sub);
          try {
            const s = await fs.stat(subDir);
            if (s.isDirectory()) presentDirectories.push(`src/${sub}`);
            else missingDirectories.push(`src/${sub}`);
          } catch {
            missingDirectories.push(`src/${sub}`);
          }
        }
      }
    } catch {
      // src missing; reported above
    }

    const ok = missingDirectories.length === 0;
    return {
      ok,
      missingDirectories,
      presentDirectories,
      notes: ok
        ? ['Workspace structure looks good.']
        : ['Some directories are missing or misconfigured.'],
    };
  }

  private async buildManifest(rootDir: string): Promise<Record<string, number>> {
    const manifest: Record<string, number> = {};
    await this.scanDir(rootDir, rootDir, manifest);
    return manifest;
  }

  private async scanDir(current: string, root: string, acc: Record<string, number>) {
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(current, e.name);
      const rel = path.relative(root, full);
      if (e.isDirectory()) {
        await this.scanDir(full, root, acc);
      } else {
        try {
          const stat = await fs.stat(full);
          acc[rel] = stat.mtimeMs;
        } catch {
          // ignore unreadable files
        }
      }
    }
  }

  async checkIndexConsistency(): Promise<IndexConsistencyReport> {
    const manifestExists = await fs
      .stat(this.manifestFile)
      .then(() => true)
      .catch(() => false);

    if (!manifestExists) {
      return {
        ok: false,
        manifestPath: this.manifestFile,
        missingManifest: true,
        details: ['Manifest file not found.'],
      };
    }

    try {
      const current = await this.buildManifest(path.resolve(this.baseDir, 'src'));
      const manifestContent = await fs.readFile(this.manifestFile, 'utf8');
      let manifestObj: Record<string, number> = {};
      try {
        manifestObj = JSON.parse(manifestContent);
      } catch {
        return {
          ok: false,
          manifestPath: this.manifestFile,
          details: ['Manifest JSON parse error'],
        };
      }

      const added: string[] = [];
      const removed: string[] = [];
      const modified: string[] = [];

      for (const key of Object.keys(current)) {
        if (!(key in manifestObj)) added.push(key);
        else if (manifestObj[key] !== current[key]) modified.push(key);
      }
      for (const key of Object.keys(manifestObj)) {
        if (!(key in current)) removed.push(key);
      }

      const ok = added.length === 0 && removed.length === 0 && modified.length === 0;
      const details: string[] = [];
      if (added.length) details.push(`Added in state but missing in manifest: ${added.join(', ')}`);
      if (removed.length)
        details.push(`Present in manifest but missing on disk: ${removed.join(', ')}`);
      if (modified.length) details.push(`Modified timestamps: ${modified.join(', ')}`);
      if (details.length === 0)
        details.push('Index manifest is up-to-date with the current src state.');

      return { ok, manifestPath: this.manifestFile, added, removed, modified, details };
    } catch (err) {
      return { ok: false, manifestPath: this.manifestFile, details: [String(err)] };
    }
  }

  async rebuildIndexManifest(): Promise<void> {
    const manifest: Record<string, number> = {};
    await this.scanDir(
      path.resolve(this.baseDir, 'src'),
      path.resolve(this.baseDir, 'src'),
      manifest
    );
    await fs.writeFile(this.manifestFile, JSON.stringify(manifest, null, 2), 'utf8');
  }

  async repairOrRebuild(options?: {
    rebuildIndex?: boolean;
  }): Promise<{ repaired: boolean; messages: string[]; manifestPath?: string }> {
    const messages: string[] = [];
    let repaired = false;
    try {
      if (options?.rebuildIndex) {
        await this.rebuildIndexManifest();
        messages.push('Rebuilt index manifest.');
        repaired = true;
      } else {
        const check = await this.checkIndexConsistency();
        if (!check.ok) {
          await this.rebuildIndexManifest();
          messages.push(
            `Rebuilt index due to inconsistencies: added=${check.added?.length ?? 0} removed=${check.removed?.length ?? 0} modified=${check.modified?.length ?? 0}`
          );
          repaired = true;
        } else {
          messages.push('Index consistency OK; no repair needed.');
        }
      }
    } catch (e) {
      messages.push(`Repair error: ${String(e)}`);
    }
    return { repaired, messages, manifestPath: this.manifestFile };
  }

  static async runAllFromRoot(baseDir?: string) {
    const checker = new IntegrityChecker(baseDir);
    const structure = await checker.checkWorkspaceStructure();
    const index = await checker.checkIndexConsistency();
    return { structure, index };
  }
}
