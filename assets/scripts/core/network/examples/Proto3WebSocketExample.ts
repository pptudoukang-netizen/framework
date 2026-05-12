import type { MessageEnvelope } from '../protocol/MessageEnvelope';
import type { Proto3PayloadCodec } from '../protocol/MessageTypeRegistry';
import type { NetworkService } from '../NetworkService';
import {
  ExampleEchoRequest,
  ExampleEchoResponse,
  ExampleNoticePush,
} from './generated/example_network';

export const ExampleProto3MessageTypes = {
  EchoRequest: 'example.echoRequest',
  EchoResponse: 'example.echoResponse',
  NoticePush: 'example.noticePush',
} as const;

export function registerExampleProto3Codecs(networkService: NetworkService): void {
  networkService.registerProto3PayloadCodec(createPayloadCodec(
    ExampleProto3MessageTypes.EchoRequest,
    ExampleEchoRequest.encode,
    ExampleEchoRequest.decode,
  ));

  networkService.registerProto3PayloadCodec(createPayloadCodec(
    ExampleProto3MessageTypes.EchoResponse,
    ExampleEchoResponse.encode,
    ExampleEchoResponse.decode,
  ));

  networkService.registerProto3PayloadCodec(createPayloadCodec(
    ExampleProto3MessageTypes.NoticePush,
    ExampleNoticePush.encode,
    ExampleNoticePush.decode,
  ));
}

export function registerExampleNoticePushHandler(
  networkService: NetworkService,
  handler: (payload: ExampleNoticePush, envelope: MessageEnvelope<ExampleNoticePush>) => void,
): void {
  networkService.registerPushHandler(ExampleProto3MessageTypes.NoticePush, (envelope) => {
    handler(envelope.payload as ExampleNoticePush, envelope as MessageEnvelope<ExampleNoticePush>);
  });
}

export async function sendExampleEchoRequest(networkService: NetworkService): Promise<ExampleEchoResponse> {
  await networkService.connectIfNeeded();

  return networkService.send<ExampleEchoRequest, ExampleEchoResponse>(ExampleProto3MessageTypes.EchoRequest, {
    text: 'hello pb over websocket',
    clientTimeMs: Date.now(),
  });
}

function createPayloadCodec<TPayload>(
  messageType: string,
  encode: (payload: TPayload) => { finish(): Uint8Array },
  decode: (bytes: Uint8Array) => TPayload,
): Proto3PayloadCodec<TPayload> {
  return {
    messageType,
    encode: (payload: TPayload) => encode(payload).finish(),
    decode,
  };
}
