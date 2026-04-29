export type EventMapBase = object;

export type EventHandler<TPayload> = (payload: TPayload) => void;
