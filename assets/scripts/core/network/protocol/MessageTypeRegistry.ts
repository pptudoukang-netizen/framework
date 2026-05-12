import { FrameworkError } from '../../error/FrameworkError';

export interface Proto3PayloadCodec<TPayload = unknown> {
  readonly messageType: string;
  encode(payload: TPayload): Uint8Array | ArrayBuffer;
  decode(bytes: Uint8Array): TPayload;
}

export class EmptyProto3PayloadCodec implements Proto3PayloadCodec<undefined> {
  public readonly messageType: string;

  public constructor(messageType: string) {
    this.messageType = messageType;
  }

  public encode(payload: undefined): Uint8Array {
    if (payload !== undefined && payload !== null) {
      throw new FrameworkError({
        module: 'EmptyProto3PayloadCodec',
        code: 'PAYLOAD_NOT_EMPTY',
        message: `Message '${this.messageType}' expects an empty proto3 payload.`,
      });
    }

    return new Uint8Array(0);
  }

  public decode(bytes: Uint8Array): undefined {
    if (bytes.byteLength !== 0) {
      throw new FrameworkError({
        module: 'EmptyProto3PayloadCodec',
        code: 'PAYLOAD_NOT_EMPTY',
        message: `Message '${this.messageType}' received non-empty proto3 payload.`,
        details: {
          byteLength: bytes.byteLength,
        },
      });
    }

    return undefined;
  }
}

export class MessageTypeRegistry {
  private readonly payloadCodecs = new Map<string, Proto3PayloadCodec<unknown>>();

  public register<TPayload>(codec: Proto3PayloadCodec<TPayload>): void {
    this.assertMessageType(codec.messageType);

    if (this.payloadCodecs.has(codec.messageType)) {
      throw new FrameworkError({
        module: 'MessageTypeRegistry',
        code: 'DUPLICATE_MESSAGE_TYPE',
        message: `Proto3 payload codec already registered for messageType '${codec.messageType}'.`,
      });
    }

    this.payloadCodecs.set(codec.messageType, codec as Proto3PayloadCodec<unknown>);
  }

  public unregister(messageType: string): void {
    this.assertMessageType(messageType);
    this.payloadCodecs.delete(messageType);
  }

  public has(messageType: string): boolean {
    this.assertMessageType(messageType);
    return this.payloadCodecs.has(messageType);
  }

  public require<TPayload = unknown>(messageType: string): Proto3PayloadCodec<TPayload> {
    this.assertMessageType(messageType);

    const codec = this.payloadCodecs.get(messageType);
    if (!codec) {
      throw new FrameworkError({
        module: 'MessageTypeRegistry',
        code: 'MESSAGE_CODEC_MISSING',
        message: `Proto3 payload codec is not registered for messageType '${messageType}'.`,
      });
    }

    return codec as Proto3PayloadCodec<TPayload>;
  }

  private assertMessageType(messageType: string): void {
    if (!messageType || messageType.trim().length === 0) {
      throw new FrameworkError({
        module: 'MessageTypeRegistry',
        code: 'MESSAGE_TYPE_EMPTY',
        message: 'Proto3 messageType cannot be empty.',
      });
    }
  }
}
