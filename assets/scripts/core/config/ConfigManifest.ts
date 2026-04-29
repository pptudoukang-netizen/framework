export type ConfigRecordId = string | number;

export interface ConfigReference {
  readonly field: string;
  readonly targetTable: string;
  readonly targetField?: string;
}

export interface ConfigManifest<TRecord extends Record<string, unknown>> {
  readonly name: string;
  readonly bundle: string;
  readonly path: string;
  readonly idField: keyof TRecord & string;
  readonly requiredFields: readonly (keyof TRecord & string)[];
  readonly references?: readonly ConfigReference[];
}