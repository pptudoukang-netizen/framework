export interface AudioConfig {
  [key: string]: unknown;
  id: string;
  key: string;
  path: string;
  bundle: string;
  defaultVolume: number;
  isBgm: boolean;
}
