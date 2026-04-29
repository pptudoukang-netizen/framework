import { Assert } from '../error/Assert';
import { FrameworkError } from '../error/FrameworkError';

export class ConfigTable<TRecord extends Record<string, unknown>, TId extends string | number> {
  private readonly name: string;
  private readonly rowsById = new Map<TId, TRecord>();
  private readonly rows: TRecord[];

  public constructor(name: string, rows: readonly TRecord[], idSelector: (row: TRecord) => TId) {
    this.name = Assert.nonEmptyString(name, 'ConfigTable name cannot be empty.');
    this.rows = [...rows];

    for (const row of rows) {
      const id = idSelector(row);
      if (this.rowsById.has(id)) {
        throw new FrameworkError({
          module: 'ConfigTable',
          code: 'DUPLICATE_ID',
          message: `Duplicate config id '${String(id)}' in table '${this.name}'.`,
        });
      }
      this.rowsById.set(id, row);
    }
  }

  public get(id: TId): TRecord {
    const row = this.rowsById.get(id);
    if (!row) {
      throw new FrameworkError({
        module: 'ConfigTable',
        code: 'ROW_NOT_FOUND',
        message: `Config row not found in table '${this.name}' for id '${String(id)}'.`,
      });
    }

    return row;
  }

  public has(id: TId): boolean {
    return this.rowsById.has(id);
  }

  public getAll(): readonly TRecord[] {
    return this.rows;
  }
}