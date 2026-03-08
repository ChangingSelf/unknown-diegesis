export type MigrationFn<T> = (data: T) => T;

interface MigrationEntry<T> {
  from: number;
  to: number;
  migrate: MigrationFn<T>;
}

export class MigrationRegistry<T> {
  private migrations: MigrationEntry<T>[] = [];

  register(from: number, to: number, migrateFn: MigrationFn<T>): void {
    if (from >= to) {
      throw new Error(`Invalid migration: from (${from}) must be less than to (${to})`);
    }

    const existing = this.migrations.find(m => m.from === from && m.to === to);
    if (existing) {
      console.warn(`Migration from ${from} to ${to} already registered, overwriting`);
      existing.migrate = migrateFn;
      return;
    }

    this.migrations.push({ from, to, migrate: migrateFn });
  }

  getMigration(from: number, to: number): MigrationFn<T> | null {
    const entry = this.migrations.find(m => m.from === from && m.to === to);
    return entry?.migrate ?? null;
  }

  getAvailableMigrations(): Array<{ from: number; to: number }> {
    return this.migrations.map(m => ({ from: m.from, to: m.to }));
  }
}

export class MigrationManager<T> {
  constructor(private registry: MigrationRegistry<T>) {}

  findMigrationPath(currentVersion: number, targetVersion: number): number[] | null {
    if (currentVersion === targetVersion) {
      return [currentVersion];
    }

    if (currentVersion > targetVersion) {
      return null;
    }

    const queue: Array<{ version: number; path: number[] }> = [
      { version: currentVersion, path: [currentVersion] },
    ];
    const visited = new Set<number>([currentVersion]);

    while (queue.length > 0) {
      const { version, path } = queue.shift()!;

      const availableMigrations = this.registry.getAvailableMigrations();
      for (const migration of availableMigrations) {
        if (migration.from === version && !visited.has(migration.to)) {
          const newPath = [...path, migration.to];

          if (migration.to === targetVersion) {
            return newPath;
          }

          visited.add(migration.to);
          queue.push({ version: migration.to, path: newPath });
        }
      }
    }

    return null;
  }

  migrate(data: T, currentVersion: number, targetVersion: number): T {
    if (currentVersion === targetVersion) {
      return data;
    }

    if (currentVersion > targetVersion) {
      throw new Error(
        `Cannot migrate from version ${currentVersion} to ${targetVersion}: downgrade not supported`
      );
    }

    const path = this.findMigrationPath(currentVersion, targetVersion);
    if (!path) {
      throw new Error(`No migration path found from version ${currentVersion} to ${targetVersion}`);
    }

    let result = data;
    for (let i = 0; i < path.length - 1; i++) {
      const from = path[i];
      const to = path[i + 1];
      const migrationFn = this.registry.getMigration(from, to);

      if (!migrationFn) {
        throw new Error(`Migration function not found for ${from} -> ${to}`);
      }

      result = migrationFn(result);
    }

    return result;
  }
}
