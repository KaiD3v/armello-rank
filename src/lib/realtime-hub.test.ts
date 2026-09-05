import {
  __resetRealtimeHubForTests,
  __realtimeSubscriberCountForTests,
  publishRanking,
  subscribeRealtime,
} from "@/lib/realtime-hub";
import {
  getSessionTokenFromCookieHeader,
  parseCookieHeader,
  SESSION_COOKIE_NAME,
} from "@/lib/realtime-cookies";
import type { RankingMessage } from "@/lib/realtime-protocol";

describe("realtime-hub", () => {
  beforeEach(() => {
    __resetRealtimeHubForTests();
  });

  it("delivers publishRanking to all subscribers", () => {
    const receivedA: RankingMessage[] = [];
    const receivedB: RankingMessage[] = [];

    const unsubA = subscribeRealtime((message) => {
      if (message.type === "ranking") {
        receivedA.push(message);
      }
    });
    const unsubB = subscribeRealtime((message) => {
      if (message.type === "ranking") {
        receivedB.push(message);
      }
    });

    expect(__realtimeSubscriberCountForTests()).toBe(2);

    const payload: RankingMessage = {
      type: "ranking",
      players: [
        {
          id: "1",
          slug: "kaique",
          name: "Kaique",
          points: 2,
          rank: 1,
        },
      ],
      change: {
        playerId: "1",
        playerName: "Kaique",
        delta: 1,
        resultingPoints: 2,
        at: 100,
      },
    };

    publishRanking(payload);

    expect(receivedA).toEqual([payload]);
    expect(receivedB).toEqual([payload]);

    unsubA();
    unsubB();
    expect(__realtimeSubscriberCountForTests()).toBe(0);
  });

  it("stops delivering after unsubscribe", () => {
    const received: RankingMessage[] = [];
    const unsub = subscribeRealtime((message) => {
      if (message.type === "ranking") {
        received.push(message);
      }
    });

    unsub();
    publishRanking({
      type: "ranking",
      players: [],
    });

    expect(received).toHaveLength(0);
  });
});

describe("realtime cookie parse", () => {
  it("parses session cookie from header", () => {
    const header = `${SESSION_COOKIE_NAME}=abc%2Edef; Path=/`;
    expect(parseCookieHeader(header)[SESSION_COOKIE_NAME]).toBe("abc.def");
    expect(getSessionTokenFromCookieHeader(header)).toBe("abc.def");
    expect(getSessionTokenFromCookieHeader(undefined)).toBeNull();
  });
});
