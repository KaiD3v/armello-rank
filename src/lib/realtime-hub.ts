import type { RankingMessage, ServerRealtimeMessage } from "@/lib/realtime-protocol";

export type RealtimeSender = (message: ServerRealtimeMessage) => void;

type HubState = {
  subscribers: Set<RealtimeSender>;
};

const globalForRealtime = globalThis as typeof globalThis & {
  __armelloRealtimeHub?: HubState;
};

function getHub(): HubState {
  if (!globalForRealtime.__armelloRealtimeHub) {
    globalForRealtime.__armelloRealtimeHub = {
      subscribers: new Set(),
    };
  }
  return globalForRealtime.__armelloRealtimeHub;
}

export function subscribeRealtime(send: RealtimeSender): () => void {
  const hub = getHub();
  hub.subscribers.add(send);
  return () => {
    hub.subscribers.delete(send);
  };
}

export function publishRanking(message: RankingMessage): void {
  const payload: RankingMessage = {
    type: "ranking",
    players: message.players,
    ...(message.change ? { change: message.change } : {}),
  };

  for (const send of getHub().subscribers) {
    try {
      send(payload);
    } catch {
      // Drop broken subscribers; they should unsubscribe on close.
    }
  }
}

/** Test helper — clears in-process subscribers. */
export function __resetRealtimeHubForTests(): void {
  getHub().subscribers.clear();
}

export function __realtimeSubscriberCountForTests(): number {
  return getHub().subscribers.size;
}
