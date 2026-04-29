export interface MessageEnvelope<TPayload = unknown> {
  readonly messageType: string;
  readonly requestId?: string;
  readonly sequenceId?: number;
  readonly timestamp: number;
  readonly payload: TPayload;
}