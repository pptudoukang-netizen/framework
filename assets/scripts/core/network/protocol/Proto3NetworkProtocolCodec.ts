import { FrameworkError } from '../../error/FrameworkError';
import type { MessageEnvelope } from './MessageEnvelope';
import type { NetworkProtocolCodec, NetworkProtocolTransportType } from './NetworkProtocolCodec';
import { MessageTypeRegistry } from './MessageTypeRegistry';

interface DecodedEnvelopeBytes {
  readonly messageType: string;
  readonly requestId?: string;
  readonly sequenceId?: number;
  readonly timestamp: number;
  readonly payloadBytes: Uint8Array;
}

interface VarintReadResult {
  readonly value: number;
  readonly nextOffset: number;
}

interface BytesReadResult {
  readonly value: Uint8Array;
  readonly nextOffset: number;
}

const WIRE_TYPE_VARINT = 0;
const WIRE_TYPE_FIXED64 = 1;
const WIRE_TYPE_LENGTH_DELIMITED = 2;
const WIRE_TYPE_FIXED32 = 5;

const FIELD_MESSAGE_TYPE = 1;
const FIELD_REQUEST_ID = 2;
const FIELD_SEQUENCE_ID = 3;
const FIELD_TIMESTAMP = 4;
const FIELD_PAYLOAD = 5;

export class Proto3NetworkProtocolCodec implements NetworkProtocolCodec {
  public readonly transportType: NetworkProtocolTransportType = 'binary';

  private readonly registry: MessageTypeRegistry;

  public constructor(registry: MessageTypeRegistry) {
    this.registry = registry;
  }

  public encode(message: MessageEnvelope): ArrayBuffer {
    this.assertEnvelope(message);

    const payloadCodec = this.registry.require(message.messageType);
    const payloadBytes = toExactUint8Array(payloadCodec.encode(message.payload));
    const envelopeBytes = encodeProto3Envelope({
      messageType: message.messageType,
      requestId: message.requestId,
      sequenceId: message.sequenceId,
      timestamp: message.timestamp,
      payloadBytes,
    });

    return toExactArrayBuffer(envelopeBytes);
  }

  public decode(raw: ArrayBuffer | string): MessageEnvelope {
    if (typeof raw === 'string') {
      throw new FrameworkError({
        module: 'Proto3NetworkProtocolCodec',
        code: 'INVALID_RAW_TYPE',
        message: 'Expected binary websocket payload for proto3 codec.',
      });
    }

    const envelopeBytes = decodeProto3Envelope(new Uint8Array(raw));
    const payloadCodec = this.registry.require(envelopeBytes.messageType);

    return {
      messageType: envelopeBytes.messageType,
      requestId: envelopeBytes.requestId,
      sequenceId: envelopeBytes.sequenceId,
      timestamp: envelopeBytes.timestamp,
      payload: payloadCodec.decode(envelopeBytes.payloadBytes),
    };
  }

  private assertEnvelope(message: MessageEnvelope): void {
    if (!message.messageType || message.messageType.trim().length === 0) {
      throw new FrameworkError({
        module: 'Proto3NetworkProtocolCodec',
        code: 'MESSAGE_TYPE_EMPTY',
        message: 'Proto3 envelope messageType cannot be empty.',
      });
    }

    assertNonNegativeSafeInteger(message.timestamp, 'timestamp');

    if (message.sequenceId !== undefined) {
      assertNonNegativeSafeInteger(message.sequenceId, 'sequenceId');
    }
  }
}

function encodeProto3Envelope(envelope: DecodedEnvelopeBytes): Uint8Array {
  const bytes: number[] = [];

  writeLengthDelimitedField(bytes, FIELD_MESSAGE_TYPE, encodeUtf8(envelope.messageType));

  if (envelope.requestId !== undefined) {
    writeLengthDelimitedField(bytes, FIELD_REQUEST_ID, encodeUtf8(envelope.requestId));
  }

  if (envelope.sequenceId !== undefined) {
    writeVarintField(bytes, FIELD_SEQUENCE_ID, envelope.sequenceId);
  }

  writeVarintField(bytes, FIELD_TIMESTAMP, envelope.timestamp);
  writeLengthDelimitedField(bytes, FIELD_PAYLOAD, envelope.payloadBytes);

  return new Uint8Array(bytes);
}

function decodeProto3Envelope(bytes: Uint8Array): DecodedEnvelopeBytes {
  let offset = 0;
  let messageType = '';
  let requestId: string | undefined;
  let sequenceId: number | undefined;
  let timestamp = 0;
  let payloadBytes = new Uint8Array(0);

  while (offset < bytes.byteLength) {
    const tag = readVarint(bytes, offset);
    offset = tag.nextOffset;

    if (tag.value === 0) {
      throw new FrameworkError({
        module: 'Proto3NetworkProtocolCodec',
        code: 'INVALID_TAG',
        message: 'Proto3 envelope tag cannot be zero.',
      });
    }

    const fieldNumber = Math.floor(tag.value / 8);
    const wireType = tag.value % 8;

    switch (fieldNumber) {
      case FIELD_MESSAGE_TYPE: {
        assertWireType(fieldNumber, wireType, WIRE_TYPE_LENGTH_DELIMITED);
        const field = readLengthDelimited(bytes, offset);
        messageType = decodeUtf8(field.value);
        offset = field.nextOffset;
        break;
      }
      case FIELD_REQUEST_ID: {
        assertWireType(fieldNumber, wireType, WIRE_TYPE_LENGTH_DELIMITED);
        const field = readLengthDelimited(bytes, offset);
        requestId = decodeUtf8(field.value);
        offset = field.nextOffset;
        break;
      }
      case FIELD_SEQUENCE_ID: {
        assertWireType(fieldNumber, wireType, WIRE_TYPE_VARINT);
        const field = readVarint(bytes, offset);
        sequenceId = field.value;
        offset = field.nextOffset;
        break;
      }
      case FIELD_TIMESTAMP: {
        assertWireType(fieldNumber, wireType, WIRE_TYPE_VARINT);
        const field = readVarint(bytes, offset);
        timestamp = field.value;
        offset = field.nextOffset;
        break;
      }
      case FIELD_PAYLOAD: {
        assertWireType(fieldNumber, wireType, WIRE_TYPE_LENGTH_DELIMITED);
        const field = readLengthDelimited(bytes, offset);
        payloadBytes = field.value;
        offset = field.nextOffset;
        break;
      }
      default:
        offset = skipUnknownField(bytes, offset, fieldNumber, wireType);
        break;
    }
  }

  if (!messageType || messageType.trim().length === 0) {
    throw new FrameworkError({
      module: 'Proto3NetworkProtocolCodec',
      code: 'MESSAGE_TYPE_EMPTY',
      message: 'Decoded proto3 envelope messageType is empty.',
    });
  }

  if (timestamp <= 0) {
    throw new FrameworkError({
      module: 'Proto3NetworkProtocolCodec',
      code: 'TIMESTAMP_MISSING',
      message: 'Decoded proto3 envelope timestamp is missing or invalid.',
    });
  }

  return {
    messageType,
    requestId,
    sequenceId,
    timestamp,
    payloadBytes,
  };
}

function writeVarintField(bytes: number[], fieldNumber: number, value: number): void {
  writeVarint(bytes, fieldNumber * 8 + WIRE_TYPE_VARINT);
  writeVarint(bytes, value);
}

function writeLengthDelimitedField(bytes: number[], fieldNumber: number, value: Uint8Array): void {
  writeVarint(bytes, fieldNumber * 8 + WIRE_TYPE_LENGTH_DELIMITED);
  writeVarint(bytes, value.byteLength);

  for (let i = 0; i < value.byteLength; i++) {
    bytes.push(value[i]);
  }
}

function writeVarint(bytes: number[], value: number): void {
  assertNonNegativeSafeInteger(value, 'varint');

  let remaining = value;
  while (remaining > 127) {
    bytes.push((remaining % 128) | 0x80);
    remaining = Math.floor(remaining / 128);
  }

  bytes.push(remaining);
}

function readVarint(bytes: Uint8Array, offset: number): VarintReadResult {
  let result = 0;
  let multiplier = 1;
  let currentOffset = offset;

  while (currentOffset < bytes.byteLength) {
    const current = bytes[currentOffset++];
    result += (current & 0x7f) * multiplier;

    if (result > Number.MAX_SAFE_INTEGER) {
      throw new FrameworkError({
        module: 'Proto3NetworkProtocolCodec',
        code: 'VARINT_TOO_LARGE',
        message: 'Proto3 varint exceeds JavaScript safe integer range.',
      });
    }

    if ((current & 0x80) === 0) {
      return {
        value: result,
        nextOffset: currentOffset,
      };
    }

    multiplier *= 128;
  }

  throw new FrameworkError({
    module: 'Proto3NetworkProtocolCodec',
    code: 'VARINT_TRUNCATED',
    message: 'Proto3 varint ended unexpectedly.',
  });
}

function readLengthDelimited(bytes: Uint8Array, offset: number): BytesReadResult {
  const length = readVarint(bytes, offset);
  const endOffset = length.nextOffset + length.value;

  if (endOffset > bytes.byteLength) {
    throw new FrameworkError({
      module: 'Proto3NetworkProtocolCodec',
      code: 'LENGTH_DELIMITED_TRUNCATED',
      message: 'Proto3 length-delimited field exceeds packet length.',
      details: {
        requestedLength: length.value,
        remainingLength: bytes.byteLength - length.nextOffset,
      },
    });
  }

  return {
    value: bytes.subarray(length.nextOffset, endOffset),
    nextOffset: endOffset,
  };
}

function skipUnknownField(
  bytes: Uint8Array,
  offset: number,
  fieldNumber: number,
  wireType: number,
): number {
  switch (wireType) {
    case WIRE_TYPE_VARINT:
      return readVarint(bytes, offset).nextOffset;
    case WIRE_TYPE_FIXED64:
      return assertSkipLength(bytes, offset, 8, fieldNumber, wireType);
    case WIRE_TYPE_LENGTH_DELIMITED:
      return readLengthDelimited(bytes, offset).nextOffset;
    case WIRE_TYPE_FIXED32:
      return assertSkipLength(bytes, offset, 4, fieldNumber, wireType);
    default:
      throw new FrameworkError({
        module: 'Proto3NetworkProtocolCodec',
        code: 'UNSUPPORTED_WIRE_TYPE',
        message: `Unsupported proto3 wireType '${wireType}' for field '${fieldNumber}'.`,
      });
  }
}

function assertSkipLength(
  bytes: Uint8Array,
  offset: number,
  length: number,
  fieldNumber: number,
  wireType: number,
): number {
  const nextOffset = offset + length;
  if (nextOffset > bytes.byteLength) {
    throw new FrameworkError({
      module: 'Proto3NetworkProtocolCodec',
      code: 'UNKNOWN_FIELD_TRUNCATED',
      message: `Unknown proto3 field '${fieldNumber}' with wireType '${wireType}' exceeds packet length.`,
    });
  }

  return nextOffset;
}

function assertWireType(fieldNumber: number, actual: number, expected: number): void {
  if (actual !== expected) {
    throw new FrameworkError({
      module: 'Proto3NetworkProtocolCodec',
      code: 'WIRE_TYPE_MISMATCH',
      message: `Proto3 envelope field '${fieldNumber}' expected wireType '${expected}' but got '${actual}'.`,
    });
  }
}

function assertNonNegativeSafeInteger(value: number, fieldName: string): void {
  if (!Number.isSafeInteger(value) || value < 0) {
    throw new FrameworkError({
      module: 'Proto3NetworkProtocolCodec',
      code: 'INVALID_NUMBER',
      message: `Proto3 ${fieldName} must be a non-negative safe integer.`,
      details: {
        value,
      },
    });
  }
}

function toExactUint8Array(value: Uint8Array | ArrayBuffer): Uint8Array {
  if (value instanceof Uint8Array) {
    const copy = new Uint8Array(value.byteLength);
    copy.set(value);
    return copy;
  }

  return new Uint8Array(value.slice(0));
}

function toExactArrayBuffer(value: Uint8Array): ArrayBuffer {
  const copy = new Uint8Array(value.byteLength);
  copy.set(value);
  return copy.buffer;
}

function encodeUtf8(value: string): Uint8Array {
  const bytes: number[] = [];

  for (let i = 0; i < value.length; i++) {
    let codePoint = value.charCodeAt(i);

    if (codePoint >= 0xd800 && codePoint <= 0xdbff) {
      if (i + 1 >= value.length) {
        throw new FrameworkError({
          module: 'Proto3NetworkProtocolCodec',
          code: 'UTF8_INVALID_SURROGATE',
          message: 'String contains an unpaired high surrogate.',
        });
      }

      const next = value.charCodeAt(++i);
      if (next < 0xdc00 || next > 0xdfff) {
        throw new FrameworkError({
          module: 'Proto3NetworkProtocolCodec',
          code: 'UTF8_INVALID_SURROGATE',
          message: 'String contains an invalid surrogate pair.',
        });
      }

      codePoint = 0x10000 + ((codePoint - 0xd800) << 10) + (next - 0xdc00);
    }

    if (codePoint <= 0x7f) {
      bytes.push(codePoint);
    } else if (codePoint <= 0x7ff) {
      bytes.push(0xc0 | (codePoint >> 6), 0x80 | (codePoint & 0x3f));
    } else if (codePoint <= 0xffff) {
      bytes.push(0xe0 | (codePoint >> 12), 0x80 | ((codePoint >> 6) & 0x3f), 0x80 | (codePoint & 0x3f));
    } else {
      bytes.push(
        0xf0 | (codePoint >> 18),
        0x80 | ((codePoint >> 12) & 0x3f),
        0x80 | ((codePoint >> 6) & 0x3f),
        0x80 | (codePoint & 0x3f),
      );
    }
  }

  return new Uint8Array(bytes);
}

function decodeUtf8(bytes: Uint8Array): string {
  const codeUnits: number[] = [];
  let offset = 0;

  while (offset < bytes.byteLength) {
    const first = bytes[offset++];

    if (first <= 0x7f) {
      codeUnits.push(first);
      continue;
    }

    if (first >= 0xc2 && first <= 0xdf) {
      const second = readContinuationByte(bytes, offset++);
      codeUnits.push(((first & 0x1f) << 6) | second);
      continue;
    }

    if (first >= 0xe0 && first <= 0xef) {
      const second = readContinuationByte(bytes, offset++);
      const third = readContinuationByte(bytes, offset++);
      codeUnits.push(((first & 0x0f) << 12) | (second << 6) | third);
      continue;
    }

    if (first >= 0xf0 && first <= 0xf4) {
      const second = readContinuationByte(bytes, offset++);
      const third = readContinuationByte(bytes, offset++);
      const fourth = readContinuationByte(bytes, offset++);
      const codePoint = ((first & 0x07) << 18) | (second << 12) | (third << 6) | fourth;
      const adjusted = codePoint - 0x10000;
      codeUnits.push(0xd800 + (adjusted >> 10), 0xdc00 + (adjusted & 0x3ff));
      continue;
    }

    throw new FrameworkError({
      module: 'Proto3NetworkProtocolCodec',
      code: 'UTF8_INVALID_BYTE',
      message: 'Invalid UTF-8 byte in proto3 string field.',
      details: {
        byte: first,
      },
    });
  }

  return String.fromCharCode(...codeUnits);
}

function readContinuationByte(bytes: Uint8Array, offset: number): number {
  if (offset >= bytes.byteLength) {
    throw new FrameworkError({
      module: 'Proto3NetworkProtocolCodec',
      code: 'UTF8_TRUNCATED',
      message: 'UTF-8 sequence ended unexpectedly.',
    });
  }

  const value = bytes[offset];
  if ((value & 0xc0) !== 0x80) {
    throw new FrameworkError({
      module: 'Proto3NetworkProtocolCodec',
      code: 'UTF8_INVALID_CONTINUATION',
      message: 'Invalid UTF-8 continuation byte.',
      details: {
        byte: value,
      },
    });
  }

  return value & 0x3f;
}
