import { FrameworkError } from '../../error/FrameworkError';
import type { Logger } from '../../logger/Logger';
import type { HttpRequest, HttpResponse } from './HttpTypes';

export class HttpClient {
  private readonly logger: Logger;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  public constructor(logger: Logger, baseUrl: string, timeoutMs: number) {
    if (!baseUrl || baseUrl.trim().length === 0) {
      throw new FrameworkError({
        module: 'HttpClient',
        code: 'BASE_URL_EMPTY',
        message: 'HttpClient baseUrl cannot be empty.',
      });
    }

    if (timeoutMs <= 0) {
      throw new FrameworkError({
        module: 'HttpClient',
        code: 'TIMEOUT_INVALID',
        message: 'HttpClient timeoutMs must be > 0.',
      });
    }

    this.logger = logger;
    this.baseUrl = baseUrl;
    this.timeoutMs = timeoutMs;
  }

  public async request<TRequest, TResponse>(request: HttpRequest<TRequest>): Promise<HttpResponse<TResponse>> {
    if (!request.path || request.path.trim().length === 0) {
      throw new FrameworkError({
        module: 'HttpClient',
        code: 'PATH_EMPTY',
        message: 'Http request path cannot be empty.',
      });
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(`${this.baseUrl}${request.path}`, {
        method: request.method,
        headers: {
          'Content-Type': 'application/json',
          ...(request.headers ?? {}),
        },
        body: request.body !== undefined ? JSON.stringify(request.body) : undefined,
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new FrameworkError({
          module: 'HttpClient',
          code: 'HTTP_STATUS_ERROR',
          message: `HTTP status error: ${response.status}`,
          details: {
            path: request.path,
            method: request.method,
          },
        });
      }

      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });

      const data = (await response.json()) as TResponse;

      return {
        status: response.status,
        headers,
        data,
      };
    } catch (error) {
      throw FrameworkError.fromUnknown('HttpClient', 'REQUEST_FAILED', 'HTTP request failed.', error, {
        path: request.path,
        method: request.method,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }

  public dispose(): void {
    this.logger.info('HttpClient', 'Http client disposed.');
  }
}