import type { JsonAsset } from 'cc';
import { FrameworkError } from '../error/FrameworkError';
import type { AppEventMap } from '../event/AppEventMap';
import type { EventBus } from '../event/EventBus';
import type { Logger } from '../logger/Logger';
import type { ResourceHandle } from '../resource/ResourceHandle';
import { ResourceManager } from '../resource/ResourceManager';
import { ConfigManifest } from './ConfigManifest';
import { ConfigReferenceValidator } from './ConfigReferenceValidator';
import { ConfigTable } from './ConfigTable';
import { ConfigValidator } from './ConfigValidator';

export class ConfigService {
  private readonly resourceManager: ResourceManager;
  private readonly logger: Logger;
  private readonly eventBus: EventBus<AppEventMap>;

  private readonly manifests = new Map<string, ConfigManifest<Record<string, unknown>>>();
  private readonly tables = new Map<string, ConfigTable<Record<string, unknown>, string | number>>();

  public constructor(resourceManager: ResourceManager, logger: Logger, eventBus: EventBus<AppEventMap>) {
    this.resourceManager = resourceManager;
    this.logger = logger;
    this.eventBus = eventBus;
  }

  public registerManifest<TRecord extends Record<string, unknown>>(manifest: ConfigManifest<TRecord>): void {
    if (this.manifests.has(manifest.name)) {
      throw new FrameworkError({
        module: 'ConfigService',
        code: 'DUPLICATE_MANIFEST',
        message: `Duplicate config manifest: '${manifest.name}'.`,
      });
    }

    this.manifests.set(manifest.name, manifest as ConfigManifest<Record<string, unknown>>);
  }

  public async loadAll(): Promise<void> {
    this.tables.clear();

    const loadedTables: string[] = [];
    for (const manifest of this.manifests.values()) {
      const rows = await this.loadRows(manifest);
      ConfigValidator.validateRows(manifest, rows);

      const table = new ConfigTable<Record<string, unknown>, string | number>(
        manifest.name,
        rows,
        (row) => row[manifest.idField] as string | number,
      );

      this.tables.set(manifest.name, table);
      loadedTables.push(manifest.name);
    }

    for (const manifest of this.manifests.values()) {
      const table = this.getTable<Record<string, unknown>, string | number>(manifest.name);
      ConfigReferenceValidator.validate(manifest, table, (name) =>
        this.getTable<Record<string, unknown>, string | number>(name),
      );
    }

    this.eventBus.emit('ConfigLoaded', {
      tableNames: loadedTables,
    });

    this.logger.info('ConfigService', 'All config tables loaded.', {
      tableNames: loadedTables,
    });
  }

  public getTable<TRecord extends Record<string, unknown>, TId extends string | number>(
    name: string,
  ): ConfigTable<TRecord, TId> {
    const table = this.tables.get(name);
    if (!table) {
      throw new FrameworkError({
        module: 'ConfigService',
        code: 'TABLE_NOT_LOADED',
        message: `Config table '${name}' is not loaded.`,
      });
    }

    return table as unknown as ConfigTable<TRecord, TId>;
  }

  public dispose(): void {
    this.tables.clear();
    this.manifests.clear();
  }

  private async loadRows(
    manifest: ConfigManifest<Record<string, unknown>>,
  ): Promise<readonly Record<string, unknown>[]> {
    const handle: ResourceHandle<JsonAsset> = await this.resourceManager.loadJson(manifest.bundle, manifest.path);

    try {
      const raw = handle.asset.json;
      if (!Array.isArray(raw)) {
        throw new FrameworkError({
          module: 'ConfigService',
          code: 'CONFIG_SHAPE_INVALID',
          message: `Config '${manifest.name}' json root must be an array.`,
          details: {
            path: manifest.path,
          },
        });
      }

      return raw as Record<string, unknown>[];
    } finally {
      handle.dispose();
    }
  }
}