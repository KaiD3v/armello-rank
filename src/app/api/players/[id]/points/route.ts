import { NextResponse } from "next/server";

import {
  databaseUnavailableResponse,
  isDatabaseConnectivityError,
} from "@/lib/db-errors";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { publishRanking } from "@/lib/realtime-hub";
import { applyPointDelta, isValidDelta, rankPlayers } from "@/lib/ranking";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function POST(request: Request, context: RouteContext) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const delta =
    typeof body === "object" && body !== null && "delta" in body
      ? (body as { delta: unknown }).delta
      : null;

  if (!isValidDelta(delta)) {
    return NextResponse.json(
      { error: "delta must be 1 or -1" },
      { status: 400 },
    );
  }

  try {
    const player = await prisma.player.findUnique({ where: { id } });
    if (!player) {
      return NextResponse.json({ error: "Player not found" }, { status: 404 });
    }

    const points = applyPointDelta(player.points, delta);
    const updated = await prisma.player.update({
      where: { id },
      data: { points },
    });

    const allPlayers = await prisma.player.findMany();
    const ranked = rankPlayers(allPlayers);

    publishRanking({
      type: "ranking",
      players: ranked,
      change: {
        playerId: updated.id,
        playerName: updated.name,
        delta,
        resultingPoints: updated.points,
        at: Date.now(),
      },
    });

    return NextResponse.json({ player: updated });
  } catch (error) {
    console.error("[POST /api/players/:id/points]", error);
    if (isDatabaseConnectivityError(error)) {
      return databaseUnavailableResponse();
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
