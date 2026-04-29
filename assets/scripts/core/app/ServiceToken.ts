import { Assert } from '../error/Assert';

export interface ServiceToken<T> {
  readonly name: string;
  readonly key: symbol;
}

export function createServiceToken<T>(name: string): ServiceToken<T> {
  const tokenName = Assert.nonEmptyString(name, 'Service token name cannot be empty.');
  return {
    name: tokenName,
    key: Symbol(tokenName),
  };
}