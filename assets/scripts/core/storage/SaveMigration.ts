import type { SaveData } from './SaveData';

export interface SaveMigration {
  readonly fromVersion: number;
  readonly toVersion: number;
  migrate(data: SaveData): SaveData;
}