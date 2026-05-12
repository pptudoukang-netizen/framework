import { FrameworkError } from '../error/FrameworkError';

export type NetworkProtocol = 'json' | 'proto3';

export interface ReconnectConfig {
  initialDelayMs: number;
  maxDelayMs: number;
  backoffFactor: number;
  maxAttempts: number;
}

export interface HeartbeatConfig {
  intervalMs: number;
  timeoutMs: number;
}

export interface NetworkConfig {
  env: 'dev' | 'staging' | 'release';
  httpBaseUrl: string;
  wsUrl: string;
  requestTimeoutMs: number;
  protocol: NetworkProtocol;
  reconnect: ReconnectConfig;
  heartbeat: HeartbeatConfig;
}

export function validateNetworkConfig(config: NetworkConfig): void {
  if (!config.httpBaseUrl || !config.wsUrl) {
    throw new FrameworkError({
      module: 'NetworkConfig',
      code: 'ENDPOINT_MISSING',
      message: 'Network endpoints cannot be empty.',
    });
  }

  if (config.protocol !== 'json' && config.protocol !== 'proto3') {
    throw new FrameworkError({
      module: 'NetworkConfig',
      code: 'INVALID_PROTOCOL',
      message: "Network protocol must be 'json' or 'proto3'.",
      details: {
        protocol: config.protocol,
      },
    });
  }

  if (config.requestTimeoutMs <= 0) {
    throw new FrameworkError({
      module: 'NetworkConfig',
      code: 'INVALID_TIMEOUT',
      message: 'Network requestTimeoutMs must be > 0.',
    });
  }

  if (config.heartbeat.intervalMs <= 0 || config.heartbeat.timeoutMs <= 0) {
    throw new FrameworkError({
      module: 'NetworkConfig',
      code: 'INVALID_HEARTBEAT',
      message: 'Heartbeat config must be > 0.',
    });
  }

  if (config.reconnect.maxAttempts <= 0) {
    throw new FrameworkError({
      module: 'NetworkConfig',
      code: 'INVALID_RECONNECT',
      message: 'Reconnect maxAttempts must be > 0.',
    });
  }

  if (config.env === 'release') {
    if (!config.httpBaseUrl.startsWith('https://')) {
      throw new FrameworkError({
        module: 'NetworkConfig',
        code: 'HTTPS_REQUIRED',
        message: 'Release env httpBaseUrl must use HTTPS.',
      });
    }
    if (!config.wsUrl.startsWith('wss://')) {
      throw new FrameworkError({
        module: 'NetworkConfig',
        code: 'WSS_REQUIRED',
        message: 'Release env wsUrl must use WSS.',
      });
    }
  }
}
