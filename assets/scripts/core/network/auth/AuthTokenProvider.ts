export interface AuthTokenProvider {
  getAccessToken(): Promise<string> | string;
}