import { FrameworkError } from '../error/FrameworkError';
import type { AppEventMap } from '../event/AppEventMap';
import type { EventBus } from '../event/EventBus';
import type { Logger } from '../logger/Logger';
import { TimerService } from '../timer/TimerService';
import type { PlatformLoginResult } from '../../platform/PlatformTypes';
import type { AuthTokenProvider } from './auth/AuthTokenProvider';
import type { NetworkSession } from './auth/NetworkSession';
import { HttpClient } from './http/HttpClient';
import type { HttpRequest, HttpResponse } from './http/HttpTypes';
import { validateNetworkConfig, type NetworkConfig } from './NetworkConfig';
import { JsonNetworkProtocolCodec } from './protocol/NetworkProtocolCodec';
import { NetworkMessageRouter, type NetworkPushHandler } from './router/NetworkMessageRouter';
import { HeartbeatService } from './websocket/HeartbeatService';
import { WebSocketClient } from './websocket/WebSocketClient';

export class NetworkService {
  private readonly logger: Logger;
  private readonly eventBus: EventBus<AppEventMap>;
  private readonly timerService: TimerService;

  private config: NetworkConfig | null = null;
  private session: NetworkSession | null = null;
  private tokenProvider: AuthTokenProvider | null = null;

  private httpClient: HttpClient | null = null;
  private wsClient: WebSocketClient | null = null;
  private router: NetworkMessageRouter | null = null;

  public constructor(logger: Logger, eventBus: EventBus<AppEventMap>, timerService: TimerService) {
    this.logger = logger;
    this.eventBus = eventBus;
    this.timerService = timerService;
  }

  public configure(config: NetworkConfig): void {
    validateNetworkConfig(config);
    this.config = config;

    this.httpClient = new HttpClient(this.logger, config.httpBaseUrl, config.requestTimeoutMs);

    const router = new NetworkMessageRouter();
    const heartbeat = new HeartbeatService(this.timerService, config.heartbeat);
    this.wsClient = new WebSocketClient(
      this.logger,
      new JsonNetworkProtocolCodec(),
      router,
      heartbeat,
      config.requestTimeoutMs,
    );
    this.router = router;
  }

  public setAuthTokenProvider(provider: AuthTokenProvider): void {
    this.tokenProvider = provider;
  }

  public async loginWithPlatform(loginResult: PlatformLoginResult): Promise<void> {
    this.session = {
      userId: loginResult.platformUserId,
      token: loginResult.accessToken,
      createdAt: Date.now(),
    };
  }

  public async connectIfNeeded(): Promise<void> {
    const wsClient = this.requireWsClient();
    if (wsClient.isConnected()) {
      return;
    }

    const token = await this.resolveToken();
    await wsClient.connect(this.requireConfig().wsUrl, token);

    this.eventBus.emit('NetworkStateChanged', { connected: true });
  }

  public async request<TRequest, TResponse>(req: HttpRequest<TRequest>): Promise<HttpResponse<TResponse>> {
    const client = this.requireHttpClient();
    return client.request<TRequest, TResponse>(req);
  }

  public async send<TRequest, TResponse>(messageType: string, payload: TRequest): Promise<TResponse> {
    const wsClient = this.requireWsClient();
    return wsClient.send<TRequest, TResponse>(messageType, payload);
  }

  public registerPushHandler(messageType: string, handler: NetworkPushHandler): void {
    const router = this.requireRouter();
    router.register(messageType, handler);
  }

  public unregisterPushHandler(messageType: string, handler: NetworkPushHandler): void {
    const router = this.requireRouter();
    router.unregister(messageType, handler);
  }

  public dispose(): void {
    this.wsClient?.close('network_service_dispose');
    this.httpClient?.dispose();
    this.wsClient = null;
    this.httpClient = null;
    this.router = null;
  }

  private requireConfig(): NetworkConfig {
    if (!this.config) {
      throw new FrameworkError({
        module: 'NetworkService',
        code: 'CONFIG_MISSING',
        message: 'Network config is not set.',
      });
    }

    return this.config;
  }

  private requireHttpClient(): HttpClient {
    if (!this.httpClient) {
      throw new FrameworkError({
        module: 'NetworkService',
        code: 'HTTP_NOT_READY',
        message: 'HttpClient is not initialized.',
      });
    }

    return this.httpClient;
  }

  private requireWsClient(): WebSocketClient {
    if (!this.wsClient) {
      throw new FrameworkError({
        module: 'NetworkService',
        code: 'WS_NOT_READY',
        message: 'WebSocketClient is not initialized.',
      });
    }

    return this.wsClient;
  }

  private requireRouter(): NetworkMessageRouter {
    if (!this.router) {
      throw new FrameworkError({
        module: 'NetworkService',
        code: 'ROUTER_NOT_READY',
        message: 'NetworkMessageRouter is not initialized.',
      });
    }

    return this.router;
  }

  private async resolveToken(): Promise<string> {
    if (this.tokenProvider) {
      const token = await this.tokenProvider.getAccessToken();
      if (!token || token.trim().length === 0) {
        throw new FrameworkError({
          module: 'NetworkService',
          code: 'TOKEN_EMPTY',
          message: 'AuthTokenProvider returned empty token.',
        });
      }
      return token;
    }

    if (this.session && this.session.token.trim().length > 0) {
      return this.session.token;
    }

    throw new FrameworkError({
      module: 'NetworkService',
      code: 'TOKEN_MISSING',
      message: 'Network token is missing. Call loginWithPlatform or setAuthTokenProvider first.',
    });
  }
}