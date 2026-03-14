/**
 * Migration framework for schema version upgrades.
 *
 * This module defines:
 * - Migration interface: a single upgrade step with optional downgrade.
 * - MigrationRegistry: central place to register and enumerate migrations.
 * - MigrationManager: orchestrates applying migrations in the correct order.
 *
 * NOTE: This is a framework. No concrete migrations are implemented here.
 */

// Migration framework does not hard-dewire to a specific version here.
// Version constants should be consumed by concrete migrations via the registry.

/**
 * Migration definition. Each migration upgrades from one version to the next.
 * - version: the target schema version after applying this migration step
 * - up: async function that performs the upgrade; returns true on success
 * - down: optional async function that performs the downgrade; returns true on success
 */
export interface Migration {
  /** Target version after applying this migration */
  version: number;
  /** Upgrade step to move from previous version to this version */
  up: () => Promise<boolean>;
  /** Optional downgrade step to move back from this version to previous */
  down?: () => Promise<boolean>;
}

/**
 * Migration registry: stores all available migrations keyed by their version.
 * This supports upgrade and downgrade paths across the schema versions.
 */
export class MigrationRegistry {
  private static migrations: Map<number, Migration> = new Map();

  /** Register a new migration. Overwrites if same version already registered. */
  static register(migration: Migration): void {
    MigrationRegistry.migrations.set(migration.version, migration);
  }

  /** Retrieve a registered migration by its target version. */
  static getMigration(version: number): Migration | undefined {
    return MigrationRegistry.migrations.get(version);
  }

  /** Get all registered migrations ordered by version. */
  static getAll(): Migration[] {
    return Array.from(MigrationRegistry.migrations.values()).sort((a, b) => a.version - b.version);
  }
}

/**
 * Migration manager responsible for applying migrations in sequence.
 */
export class MigrationManager {
  // Convenience alias to the global registry
  private registry = MigrationRegistry;

  /**
   * Migrate the schema from version `from` to version `to`.
   * - If from < to: apply migrations with versions (from+1) .. to in ascending order using `up()`.
   * - If from > to: apply downgrades for versions from down to (to+1) in descending order using `down()`.
   * Returns true if all required migrations succeed, otherwise false (or throws on missing hooks).
   */
  async migrate(from: number, to: number): Promise<boolean> {
    if (from === to) {
      return true;
    }

    if (from < to) {
      for (let v = from + 1; v <= to; v++) {
        const mig = this.registry.getMigration(v);
        if (!mig) {
          throw new Error(`Missing migration for version ${v}`);
        }
        const ok = await mig.up();
        if (!ok) return false;
      }
      return true;
    } else {
      // Downgrade path: versions from 'from' down to 'to'+1
      for (let v = from; v > to; v--) {
        const mig = this.registry.getMigration(v);
        if (!mig || !mig.down) {
          throw new Error(`Missing downgrade for version ${v}`);
        }
        const ok = await mig.down!();
        if (!ok) return false;
      }
      return true;
    }
  }

  /** Register a new migration via the registry. */
  registerMigration(migration: Migration): void {
    MigrationRegistry.register(migration);
  }

  /** Return all registered migrations (for inspection). */
  getMigrations(): Migration[] {
    return MigrationRegistry.getAll();
  }
}

// Re-export current schema version for convenience in migrations setup
// Expose no hard version constants here to keep this file framework-only.

/**
 * NOTE: Concrete migrations can be defined in src/utils/migration/migrations/ and registered
 * against the MigrationRegistry. This file intentionally avoids pulling in any specific migrations
 * to stay framework-only as required.
 */
