import type { RankedPlayer } from "@/lib/ranking";

export type RankingChange = {
  playerId: string;
  playerName: string;
  delta: 1 | -1;
  resultingPoints: number;
  at: number;
};

export type RankingMessage = {
  type: "ranking";
  players: RankedPlayer[];
  change?: RankingChange;
};

export type PongMessage = {
  type: "pong";
};

export type ServerRealtimeMessage = RankingMessage | PongMessage;

export type ClientRealtimeMessage = {
  type: "ping";
};

export function isClientRealtimeMessage(
  value: unknown,
): value is ClientRealtimeMessage {
  return (
    typeof value === "object" &&
    value !== null &&
    "type" in value &&
    (value as { type: unknown }).type === "ping"
  );
}
