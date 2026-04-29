export interface HttpRequest<TRequest> {
  readonly path: string;
  readonly method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  readonly body?: TRequest;
  readonly headers?: Record<string, string>;
}

export interface HttpResponse<TResponse> {
  readonly status: number;
  readonly headers: Record<string, string>;
  readonly data: TResponse;
}