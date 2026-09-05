import { Prisma } from "@prisma/client";
import { NextResponse } from "next/server";

export function isDatabaseConnectivityError(error: unknown): boolean {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code === "P2010" || error.code === "P1001" || error.code === "P1017";
  }
  if (error instanceof Prisma.PrismaClientInitializationError) {
    return true;
  }
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes("server selection timeout") ||
      message.includes("replicasetnoprimary") ||
      message.includes("fatal alert")
    );
  }
  return false;
}

export function databaseUnavailableResponse() {
  return NextResponse.json(
    {
      error: "Database unavailable",
      message:
        "Não foi possível alcançar o MongoDB Atlas. Verifique Network Access (0.0.0.0/0), cluster ativo e MONGODB_URI na Vercel.",
    },
    { status: 503 },
  );
}
