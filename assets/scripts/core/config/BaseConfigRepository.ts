import { FrameworkError } from '../error/FrameworkError';
import type { ConfigService } from './ConfigService';
import type { ConfigTable } from './ConfigTable';

export abstract class BaseConfigRepository<TRecord extends Record<string, unknown>> {
  protected readonly configService: ConfigService;
  private readonly tableName: string;

  protected constructor(configService: ConfigService, tableName: string) {
    this.configService = configService;
    this.tableName = tableName;
  }

  protected getTable<TId extends string | number>(): ConfigTable<TRecord, TId> {
    const table = this.configService.getTable<TRecord, TId>(this.tableName);
    if (!table) {
      throw new FrameworkError({
        module: 'BaseConfigRepository',
        code: 'TABLE_NOT_FOUND',
        message: `Config table not found: '${this.tableName}'.`,
      });
    }

    return table;
  }
}