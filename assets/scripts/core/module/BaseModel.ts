export abstract class BaseModel {
  protected version = 0;

  public getVersion(): number {
    return this.version;
  }

  protected markChanged(): void {
    this.version += 1;
  }
}