// src/storage/migrations.ts

import { StorageData, DEFAULT_STORAGE_DATA } from '../types';

export interface Migration {
  version: string;
  description: string;
  migrate: (data: any) => Promise<any>;
}

export const MIGRATIONS: Migration[] = [
  {
    version: '1.0.0',
    description: 'Initial migration to structured storage format',
    migrate: async (data: any) => {
      // If no existing data, return defaults
      if (!data || !data.version) {
        return DEFAULT_STORAGE_DATA;
      }

      // If already at version 1.0.0, just return the data
      if (data.version === '1.0.0') {
        return data;
      }

      // Handle older versions (example)
      if (data.version === '0.1.0') {
        return {
          ...DEFAULT_STORAGE_DATA,
          prompts: data.prompts || {},
          settings: data.settings || DEFAULT_STORAGE_DATA.settings,
          version: '1.0.0'
        };
      }

      // Default fallback
      return DEFAULT_STORAGE_DATA;
    }
  }
  // Future migrations can be added here
  // {
  //   version: '1.1.0',
  //   description: 'Add new feature support',
  //   migrate: async (data: StorageData) => {
  //     // Migration logic
  //     return data;
  //   }
  // }
];

export class MigrationManager {
  private migrations: Migration[];

  constructor(migrations: Migration[]) {
    this.migrations = migrations.sort((a, b) => this.compareVersions(a.version, b.version));
  }

  /**
   * Apply all necessary migrations to bring data to current version
   */
  public async migrate(data: any): Promise<StorageData> {
    let currentData = data || {};
    const currentVersion = currentData.version || '0.0.0';

    // Find migrations that need to be applied
    const applicableMigrations = this.migrations.filter(
      migration => this.compareVersions(currentVersion, migration.version) < 0
    );

    if (applicableMigrations.length === 0) {
      return this.validateAndReturnData(currentData);
    }

    // Apply migrations sequentially
    for (const migration of applicableMigrations) {
      try {
        console.log(`Applying migration ${migration.version}: ${migration.description}`);
        currentData = await migration.migrate(currentData);
        currentData.version = migration.version;
      } catch (error) {
        console.error(`Failed to apply migration ${migration.version}:`, error);
        throw error;
      }
    }

    return this.validateAndReturnData(currentData);
  }

  /**
   * Validate migrated data and ensure it has required structure
   */
  private validateAndReturnData(data: any): StorageData {
    // Basic validation
    if (!data || typeof data !== 'object') {
      console.warn('Invalid data after migration, returning defaults');
      return DEFAULT_STORAGE_DATA;
    }

    // Ensure required fields exist
    const validatedData: StorageData = {
      version: data.version || '1.0.0',
      prompts: data.prompts || {},
      categories: data.categories || {},
      settings: {
        ...DEFAULT_STORAGE_DATA.settings,
        ...(data.settings || {})
      }
    };

    return validatedData;
  }

  /**
   * Compare two version strings (semver-like)
   */
  private compareVersions(v1: string, v2: string): number {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);

    for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
      const num1 = parts1[i] || 0;
      const num2 = parts2[i] || 0;

      if (num1 !== num2) {
        return num1 - num2;
      }
    }

    return 0;
  }

  /**
   * Get current target version (latest migration version)
   */
  public getTargetVersion(): string {
    if (this.migrations.length === 0) {
      return DEFAULT_STORAGE_DATA.version;
    }
    return this.migrations[this.migrations.length - 1].version;
  }
}

// Create singleton instance
export const migrationManager = new MigrationManager(MIGRATIONS);