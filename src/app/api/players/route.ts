import { NextResponse } from "next/server";

import {
  databaseUnavailableResponse,
  isDatabaseConnectivityError,
} from "@/lib/db-errors";
import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rankPlayers } from "@/lib/ranking";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const players = await prisma.player.findMany();
    const ranked = rankPlayers(players);
    return NextResponse.json({ players: ranked });
  } catch (error) {
    console.error("[GET /api/players]", error);
    if (isDatabaseConnectivityError(error)) {
      return databaseUnavailableResponse();
    }
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
