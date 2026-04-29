import { FrameworkError } from '../../error/FrameworkError';
import type { Logger } from '../../logger/Logger';
import type { MessageEnvelope } from '../protocol/MessageEnvelope';
import type { NetworkProtocolCodec } from '../protocol/NetworkProtocolCodec';
import { NetworkMessageRouter } from '../router/NetworkMessageRouter';
import { HeartbeatService } from './HeartbeatService';

interface PendingRequest {
  readonly resolve: (value: unknown) => void;
  readonly reject: (reason?: unknown) => void;
  readonly timeoutId: number;
}

export class WebSocketClient {
  private readonly logger: Logger;
  private readonly codec: NetworkProtocolCodec;
  private readonly router: NetworkMessageRouter;
  private readonly heartbeat: HeartbeatService;
  private readonly requestTimeoutMs: number;

  private socket: WebSocket | null = null;
  private requestSeq = 1;
  private readonly pending = new Map<string, PendingRequest>();

  public constructor(
    logger: Logger,
    codec: NetworkProtocolCodec,
    router: NetworkMessageRouter,
    heartbeat: HeartbeatService,
    requestTimeoutMs: number,
  ) {
    this.logger = logger;
    this.codec = codec;
    this.router = router;
    this.heartbeat = heartbeat;
    this.requestTimeoutMs = requestTimeoutMs;
  }

  public async connect(url: string, token: string): Promise<void> {
    if (this.socket && this.socket.readyState === WebSocket.OPEN) {
      return;
    }

    if (!url || url.trim().length === 0) {
      throw new FrameworkError({
        module: 'WebSocketClient',
        code: 'URL_EMPTY',
        message: 'WebSocket url cannot be empty.',
      });
    }

    await new Promise<void>((resolve, reject) => {
      const socket = new WebSocket(`${url}?token=${encodeURIComponent(token)}`);
      this.socket = socket;

      socket.onopen = () => {
        this.heartbeat.start(() => {
          void this.send<undefined, unknown>('heartbeat', undefined).catch(() => {
            this.close('heartbeat_failed');
          });
        });

        resolve();
      };

      socket.onerror = (event) => {
        reject(
          new FrameworkError({
            module: 'WebSocketClient',
            code: 'CONNECT_ERROR',
            message: 'WebSocket connection error.',
            details: {
              event,
            },
          }),
        );
      };

      socket.onmessage = (event) => {
        this.handleMessage(event.data as string);
      };

      socket.onclose = () => {
        this.heartbeat.stop();
        this.rejectAllPending('WEBSOCKET_CLOSED', 'WebSocket closed.');
      };
    });
  }

  public async send<TRequest, TResponse>(messageType: string, payload: TRequest): Promise<TResponse> {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      throw new FrameworkError({
        module: 'WebSocketClient',
        code: 'NOT_CONNECTED',
        message: 'Cannot send WebSocket message before connection is open.',
      });
    }

    if (!messageType || messageType.trim().length === 0) {
      throw new FrameworkError({
        module: 'WebSocketClient',
        code: 'MESSAGE_TYPE_EMPTY',
        message: 'WebSocket messageType cannot be empty.',
      });
    }

    const requestId = `${Date.now()}-${this.requestSeq++}`;
    const envelope: MessageEnvelope<TRequest> = {
      messageType,
      requestId,
      timestamp: Date.now(),
      payload,
    };

    this.socket.send(this.codec.encode(envelope));

    return new Promise<TResponse>((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        this.pending.delete(requestId);
        reject(
          new FrameworkError({
            module: 'WebSocketClient',
            code: 'REQUEST_TIMEOUT',
            message: `WebSocket request timeout for messageType '${messageType}'.`,
            details: {
              requestId,
            },
          }),
        );
      }, this.requestTimeoutMs) as unknown as number;

      this.pending.set(requestId, {
        resolve,
        reject,
        timeoutId,
      });
    });
  }

  public close(reason: string): void {
    if (!this.socket) {
      return;
    }

    this.heartbeat.stop();
    this.socket.close(1000, reason);
    this.socket = null;
  }

  public isConnected(): boolean {
    return this.socket !== null && this.socket.readyState === WebSocket.OPEN;
  }

  private handleMessage(raw: ArrayBuffer | string): void {
    const envelope = this.codec.decode(raw);

    if (envelope.requestId && this.pending.has(envelope.requestId)) {
      const pending = this.pending.get(envelope.requestId);
      if (!pending) {
        return;
      }

      clearTimeout(pending.timeoutId);
      this.pending.delete(envelope.requestId);
      pending.resolve(envelope.payload);
      return;
    }

    this.router.route(envelope);
  }

  private rejectAllPending(code: string, message: string): void {
    for (const [requestId, pending] of this.pending.entries()) {
      clearTimeout(pending.timeoutId);
      pending.reject(
        new FrameworkError({
          module: 'WebSocketClient',
          code,
          message,
          details: {
            requestId,
          },
        }),
      );
    }

    this.pending.clear();
  }
}