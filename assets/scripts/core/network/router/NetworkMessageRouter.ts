import { FrameworkError } from '../../error/FrameworkError';
import type { MessageEnvelope } from '../protocol/MessageEnvelope';

export type NetworkPushHandler = (envelope: MessageEnvelope<unknown>) => void;

export class NetworkMessageRouter {
  private readonly handlers = new Map<string, Set<NetworkPushHandler>>();

  public register(messageType: string, handler: NetworkPushHandler): void {
    if (!messageType || messageType.trim().length === 0) {
      throw new FrameworkError({
        module: 'NetworkMessageRouter',
        code: 'MESSAGE_TYPE_EMPTY',
        message: 'Message type cannot be empty.',
      });
    }

    let bucket = this.handlers.get(messageType);
    if (!bucket) {
      bucket = new Set<NetworkPushHandler>();
      this.handlers.set(messageType, bucket);
    }

    bucket.add(handler);
  }

  public unregister(messageType: string, handler: NetworkPushHandler): void {
    const bucket = this.handlers.get(messageType);
    if (!bucket) {
      return;
    }

    bucket.delete(handler);
    if (bucket.size === 0) {
      this.handlers.delete(messageType);
    }
  }

  public route(envelope: MessageEnvelope<unknown>): void {
    const handlers = this.handlers.get(envelope.messageType);
    if (!handlers || handlers.size === 0) {
      throw new FrameworkError({
        module: 'NetworkMessageRouter',
        code: 'NO_HANDLER',
        message: `No push handler registered for messageType '${envelope.messageType}'.`,
      });
    }

    for (const handler of [...handlers]) {
      handler(envelope);
    }
  }
}