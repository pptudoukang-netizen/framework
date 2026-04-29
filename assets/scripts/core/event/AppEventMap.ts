export interface AppEventMap {
  ConfigLoaded: { tableNames: string[] };
  ResourceLoaded: { path: string; type: string };
  StateChanged: { from: string | null; to: string };
  HotUpdateProgress: { progress: number };
  NetworkStateChanged: { connected: boolean };
}