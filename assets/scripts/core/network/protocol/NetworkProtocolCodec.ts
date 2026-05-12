import { FrameworkError } from '../../error/FrameworkError';
import type { MessageEnvelope } from './MessageEnvelope';

export type NetworkProtocolTransportType = 'text' | 'binary';

export interface NetworkProtocolCodec {
  readonly transportType: NetworkProtocolTransportType;
  encode(message: MessageEnvelope): ArrayBuffer | string;
  decode(raw: ArrayBuffer | string): MessageEnvelope;
}

export class JsonNetworkProtocolCodec implements NetworkProtocolCodec {
  public readonly transportType: NetworkProtocolTransportType = 'text';

  public encode(message: MessageEnvelope): string {
    return JSON.stringify(message);
  }

  public decode(raw: ArrayBuffer | string): MessageEnvelope {
    if (typeof raw !== 'string') {
      throw new FrameworkError({
        module: 'JsonNetworkProtocolCodec',
        code: 'INVALID_RAW_TYPE',
        message: 'Expected string websocket payload for JSON codec.',
      });
    }

    try {
      return JSON.parse(raw) as MessageEnvelope;
    } catch (error) {
      throw FrameworkError.fromUnknown(
        'JsonNetworkProtocolCodec',
        'DECODE_FAILED',
        'Failed to decode JSON websocket payload.',
        error,
      );
    }
  }
}
