"use client";

import { useEffect, useRef } from "react";

import type { RankedPlayer } from "@/lib/ranking";
import type { RankingChange } from "@/lib/realtime-protocol";

type UseRankingRealtimeOptions = {
  enabled: boolean;
  onRanking: (players: RankedPlayer[]) => void;
  onChange?: (change: RankingChange) => void;
};

function wsUrl(): string {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/api/ws`;
}

export function useRankingRealtime({
  enabled,
  onRanking,
  onChange,
}: UseRankingRealtimeOptions) {
  const onRankingRef = useRef(onRanking);
  const onChangeRef = useRef(onChange);

  useEffect(() => {
    onRankingRef.current = onRanking;
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    if (!enabled) {
      return;
    }

    let socket: WebSocket | null = null;
    let closed = false;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let attempt = 0;

    function clearReconnect() {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
      }
    }

    function scheduleReconnect() {
      if (closed) {
        return;
      }
      clearReconnect();
      const delay = Math.min(1000 * 2 ** attempt, 5000);
      attempt += 1;
      reconnectTimer = setTimeout(connect, delay);
    }

    function connect() {
      if (closed) {
        return;
      }

      socket = new WebSocket(wsUrl());

      socket.addEventListener("open", () => {
        attempt = 0;
      });

      socket.addEventListener("message", (event) => {
        try {
          const data = JSON.parse(String(event.data)) as {
            type?: string;
            players?: RankedPlayer[];
            change?: RankingChange;
          };
          if (data.type !== "ranking" || !Array.isArray(data.players)) {
            return;
          }
          onRankingRef.current(data.players);
          if (data.change) {
            onChangeRef.current?.(data.change);
          }
        } catch {
          /* ignore */
        }
      });

      socket.addEventListener("close", () => {
        scheduleReconnect();
      });

      socket.addEventListener("error", () => {
        socket?.close();
      });
    }

    connect();

    return () => {
      closed = true;
      clearReconnect();
      socket?.close();
      socket = null;
    };
  }, [enabled]);
}
