"use client";

import { useEffect, useState } from "react";

import {
  RankingBoard,
  type RankedPlayerView,
} from "@/components/RankingBoard";
import { RealmBackdrop } from "@/components/RealmBackdrop";
import { UnlockGate } from "@/components/UnlockGate";

type AppState = "loading" | "locked" | "open";

const BOOTSTRAP_TIMEOUT_MS = 12_000;

function fetchWithTimeout(input: string, ms = BOOTSTRAP_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return fetch(input, { signal: controller.signal }).finally(() => {
    clearTimeout(timer);
  });
}

export default function Home() {
  const [state, setState] = useState<AppState>("loading");
  const [players, setPlayers] = useState<RankedPlayerView[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);

  async function loadPlayers() {
    const response = await fetchWithTimeout("/api/players");
    if (response.status === 401) {
      setState("locked");
      setPlayers([]);
      return;
    }
    if (response.status === 503) {
      throw new Error("database");
    }
    if (!response.ok) {
      throw new Error("failed");
    }
    const data = (await response.json()) as { players: RankedPlayerView[] };
    setPlayers(data.players);
    setState("open");
  }

  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      try {
        const session = await fetchWithTimeout("/api/auth/session");
        if (!session.ok) {
          throw new Error("session");
        }
        const data = (await session.json()) as { authenticated: boolean };
        if (cancelled) {
          return;
        }
        if (!data.authenticated) {
          setState("locked");
          return;
        }
        await loadPlayers();
      } catch (error) {
        if (!cancelled) {
          const isAbort =
            error instanceof DOMException && error.name === "AbortError";
          const isDb = error instanceof Error && error.message === "database";
          setLoadError(
            isDb || isAbort
              ? "O reino não alcançou o banco de dados. Confira o MongoDB Atlas (Network Access / cluster) e as variáveis na Vercel."
              : "Não foi possível consultar o reino.",
          );
          setState("locked");
        }
      }
    }

    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleUnlocked() {
    setLoadError(null);
    try {
      await loadPlayers();
    } catch (error) {
      const isDb = error instanceof Error && error.message === "database";
      setLoadError(
        isDb
          ? "Pergaminho aberto, mas o MongoDB Atlas não respondeu. Libere 0.0.0.0/0 no Network Access e confira MONGODB_URI."
          : "Pergaminho aberto, mas o ranking não carregou.",
      );
      setState("locked");
    }
  }

  function handleLogout() {
    setPlayers([]);
    setState("locked");
  }

  return (
    <div className="realm-backdrop flex h-dvh max-h-dvh min-h-dvh flex-1 flex-col overflow-hidden">
      <RealmBackdrop />
      <main className="realm-content flex min-h-0 flex-1 flex-col items-center overflow-x-hidden overflow-y-auto overscroll-contain px-[max(0.5rem,env(safe-area-inset-left))] pr-[max(0.5rem,env(safe-area-inset-right))] pt-[max(0.75rem,env(safe-area-inset-top))] pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        {state === "loading" ? (
          <div
            className="animate-unfurl flex flex-col items-center justify-center gap-4 py-8"
            role="status"
            aria-live="polite"
          >
            <div
              className="wax-seal animate-float-seal h-12 w-12 rounded-full"
              aria-hidden
            />
            <p className="font-display text-[0.7rem] uppercase tracking-[0.35em] text-[color:var(--ash)]/70">
              Consultando os escribas…
            </p>
          </div>
        ) : null}

        {state === "locked" ? (
          <div className="w-full max-w-full">
            <UnlockGate onUnlocked={handleUnlocked} />
          </div>
        ) : null}

        {state === "open" ? (
          <div className="rank-court-shell w-full max-w-[1440px]">
            <RankingBoard
              players={players}
              onPlayersChange={setPlayers}
              onLogout={handleLogout}
            />
          </div>
        ) : null}

        {loadError ? (
          <p
            className="mt-3 max-w-md px-2 text-center text-sm text-[color:var(--ash)]/80"
            role="alert"
          >
            {loadError}
          </p>
        ) : null}
      </main>
    </div>
  );
}
