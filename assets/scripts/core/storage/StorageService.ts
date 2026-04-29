import type { Logger } from '../logger/Logger';
import { FrameworkError } from '../error/FrameworkError';
import { createNewSaveData, type SaveData } from './SaveData';
import { SaveDataValidator } from './SaveDataValidator';
import { SaveMigrationPipeline } from './SaveMigrationPipeline';
import { SaveRepository } from './SaveRepository';

export class StorageService {
  private readonly logger: Logger;
  private readonly repository: SaveRepository;
  private readonly migrationPipeline: SaveMigrationPipeline;
  private readonly latestVersion: number;

  private currentData: SaveData | null = null;

  public constructor(
    logger: Logger,
    repository: SaveRepository,
    migrationPipeline: SaveMigrationPipeline,
    latestVersion: number,
  ) {
    this.logger = logger;
    this.repository = repository;
    this.migrationPipeline = migrationPipeline;
    this.latestVersion = latestVersion;
  }

  public async loadOrCreate(): Promise<SaveData> {
    const raw = this.repository.loadRaw();

    if (raw === null) {
      const created = createNewSaveData(this.latestVersion);
      this.save(created);
      this.currentData = created;
      return created;
    }

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      throw FrameworkError.fromUnknown(
        'StorageService',
        'SAVE_PARSE_FAILED',
        'Failed to parse local save data.',
        error,
      );
    }

    SaveDataValidator.validate(parsed);
    let data = parsed;

    if (data.version < this.latestVersion) {
      data = this.migrationPipeline.migrate(data, this.latestVersion);
      this.save(data);
    }

    if (data.version > this.latestVersion) {
      throw new FrameworkError({
        module: 'StorageService',
        code: 'SAVE_VERSION_UNSUPPORTED',
        message: `Save version ${data.version} is newer than supported version ${this.latestVersion}.`,
      });
    }

    this.currentData = data;
    this.logger.info('StorageService', 'Save data loaded.', {
      version: data.version,
    });

    return data;
  }

  public save(data: SaveData): void {
    SaveDataValidator.validate(data);
    this.repository.saveRaw(JSON.stringify(data));
    this.currentData = data;
  }

  public getCurrent(): SaveData {
    if (!this.currentData) {
      throw new FrameworkError({
        module: 'StorageService',
        code: 'SAVE_NOT_LOADED',
        message: 'Save data is not loaded yet.',
      });
    }

    return this.currentData;
  }

  public dispose(): void {
    this.currentData = null;
  }
}