import { FrameworkError } from '../../error/FrameworkError';
import type { MessageEnvelope } from './MessageEnvelope';

export interface NetworkProtocolCodec {
  encode(message: MessageEnvelope): ArrayBuffer | string;
  decode(raw: ArrayBuffer | string): MessageEnvelope;
}

export class JsonNetworkProtocolCodec implements NetworkProtocolCodec {
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

    return JSON.parse(raw) as MessageEnvelope;
  }
}