import { sys } from 'cc';
import { Assert } from '../error/Assert';

export class SaveRepository {
  private readonly storageKey: string;

  public constructor(storageKey: string) {
    this.storageKey = Assert.nonEmptyString(storageKey, 'Save storage key cannot be empty.');
  }

  public loadRaw(): string | null {
    return sys.localStorage.getItem(this.storageKey);
  }

  public saveRaw(content: string): void {
    sys.localStorage.setItem(this.storageKey, content);
  }

  public clear(): void {
    sys.localStorage.removeItem(this.storageKey);
  }
}