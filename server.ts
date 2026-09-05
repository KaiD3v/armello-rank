import { createServer } from "node:http";
import { parse } from "node:url";

import next from "next";
import { WebSocketServer, type WebSocket } from "ws";

import { authorizeRealtimeCookie } from "./src/lib/realtime-auth";
import { subscribeRealtime } from "./src/lib/realtime-hub";
import {
  isClientRealtimeMessage,
  type RankingMessage,
  type ServerRealtimeMessage,
} from "./src/lib/realtime-protocol";
import { prisma } from "./src/lib/db";
import { rankPlayers } from "./src/lib/ranking";

function readArg(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  if (index === -1) {
    return undefined;
  }
  return process.argv[index + 1];
}

const wantProd =
  process.env.NODE_ENV === "production" || process.argv.includes("--prod");
const dev = !wantProd;
const hostname =
  readArg("--hostname") || process.env.HOSTNAME || "0.0.0.0";
const port = Number(readArg("--port") || process.env.PORT || 3000);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

async function buildRankingSnapshot(): Promise<RankingMessage> {
  const players = await prisma.player.findMany();
  return {
    type: "ranking",
    players: rankPlayers(players),
  };
}

function sendJson(socket: WebSocket, message: ServerRealtimeMessage) {
  if (socket.readyState === socket.OPEN) {
    socket.send(JSON.stringify(message));
  }
}

async function main() {
  await app.prepare();

  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url || "", true);
    void handle(req, res, parsedUrl);
  });

  const wss = new WebSocketServer({ noServer: true });

  server.on("upgrade", (req, socket, head) => {
    const { pathname } = parse(req.url || "");
    // Only claim /api/ws — never destroy other upgrades (Next/Turbopack HMR).
    if (pathname !== "/api/ws") {
      return;
    }

    void (async () => {
      const allowed = await authorizeRealtimeCookie(req.headers.cookie);
      if (!allowed) {
        socket.write("HTTP/1.1 401 Unauthorized\r\n\r\n");
        socket.destroy();
        return;
      }

      wss.handleUpgrade(req, socket, head, (ws) => {
        wss.emit("connection", ws, req);
      });
    })().catch(() => {
      socket.destroy();
    });
  });

  wss.on("connection", (ws: WebSocket) => {
    const unsubscribe = subscribeRealtime((message) => {
      sendJson(ws, message);
    });

    void buildRankingSnapshot()
      .then((snapshot) => sendJson(ws, snapshot))
      .catch(() => {
        /* client can retry via reconnect */
      });

    ws.on("message", (raw) => {
      try {
        const parsedMsg = JSON.parse(String(raw)) as unknown;
        if (isClientRealtimeMessage(parsedMsg)) {
          sendJson(ws, { type: "pong" });
        }
      } catch {
        /* ignore malformed */
      }
    });

    ws.on("close", () => {
      unsubscribe();
    });

    ws.on("error", () => {
      unsubscribe();
    });
  });

  server.listen(port, () => {
    console.log(`> Armello Rank ready on http://localhost:${port}`);
  });
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
