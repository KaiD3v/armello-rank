"use client";

import { useEffect, useRef, useState } from "react";

import {
  ChroniclePanel,
  type ChronicleEntry,
} from "@/components/ChroniclePanel";
import { Ledger } from "@/components/Ledger";
import { ThronePanel } from "@/components/ThronePanel";
import { useRankingRealtime } from "@/hooks/useRankingRealtime";
import { clanClass, formatPointsLabel } from "@/lib/clan-art";
import type { RankingChange } from "@/lib/realtime-protocol";

export type RankedPlayerView = {
  rank: number;
  id: string;
  slug: string;
  name: string;
  points: number;
};

type RankingBoardProps = {
  players: RankedPlayerView[];
  onPlayersChange: (players: RankedPlayerView[]) => void;
  onLogout: () => void;
};

function sealClassForRank(rank: number): string {
  if (rank === 1) {
    return "seal-gilt";
  }
  if (rank === 2) {
    return "seal-silver";
  }
  if (rank === 3) {
    return "seal-bronze";
  }
  return "seal-blood";
}

const MAX_CHRONICLE = 5;

function isNearDuplicate(
  existing: ChronicleEntry,
  incoming: ChronicleEntry,
): boolean {
  return (
    existing.playerName === incoming.playerName &&
    existing.delta === incoming.delta &&
    existing.resultingPoints === incoming.resultingPoints &&
    Math.abs(existing.at - incoming.at) < 4000
  );
}

export function RankingBoard({
  players,
  onPlayersChange,
  onLogout,
}: RankingBoardProps) {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [flashId, setFlashId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [chronicle, setChronicle] = useState<ChronicleEntry[]>([]);
  const flashTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  function pushChronicle(entry: ChronicleEntry) {
    setChronicle((prev) => {
      if (prev.some((item) => isNearDuplicate(item, entry))) {
        return prev;
      }
      return [entry, ...prev].slice(0, MAX_CHRONICLE);
    });
  }

  useRankingRealtime({
    enabled: true,
    onRanking: onPlayersChange,
    onChange: (change: RankingChange) => {
      pushChronicle({
        id: `${change.playerId}-${change.at}`,
        playerName: change.playerName,
        delta: change.delta,
        resultingPoints: change.resultingPoints,
        at: change.at,
      });
      setFlashId(change.playerId);
      if (flashTimer.current) {
        clearTimeout(flashTimer.current);
      }
      flashTimer.current = setTimeout(() => setFlashId(null), 400);
    },
  });

  useEffect(() => {
    return () => {
      if (flashTimer.current) {
        clearTimeout(flashTimer.current);
      }
    };
  }, []);

  async function adjustPoints(player: RankedPlayerView, delta: 1 | -1) {
    if (busyId || loggingOut) {
      return;
    }
    setError(null);
    setBusyId(player.id);

    try {
      const response = await fetch(`/api/players/${player.id}/points`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ delta }),
      });

      if (response.status === 401) {
        onLogout();
        return;
      }

      if (!response.ok) {
        setError("O escriba não registrou a alteração.");
        return;
      }

      const listResponse = await fetch("/api/players");
      if (listResponse.status === 401) {
        onLogout();
        return;
      }
      if (!listResponse.ok) {
        setError("Falha ao atualizar o ranking.");
        return;
      }

      const data = (await listResponse.json()) as { players: RankedPlayerView[] };
      onPlayersChange(data.players);

      // Chronicle + flash come from the WebSocket ranking event (including this client).
    } catch {
      setError("A conexão com o reino falhou.");
    } finally {
      setBusyId(null);
    }
  }

  async function handleLogout() {
    if (loggingOut) {
      return;
    }
    setLoggingOut(true);
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      onLogout();
      setLoggingOut(false);
    }
  }

  const leader = players[0];

  return (
    <section className="animate-unfurl rank-court">
      <div className="rank-court__brand">
        <p className="brand-mark text-[0.62rem] sm:text-[0.7rem]">Armello Rank</p>
      </div>

      <div className="rank-court__ledger">
        <Ledger>
          <header className="mb-3 shrink-0 text-center sm:mb-4">
            <h1 className="hero-title hero-title--board font-black">
              Quadro dos Heróis
            </h1>
            <p className="mt-1.5 text-[clamp(0.8rem,2vw+0.35rem,0.98rem)] leading-snug text-[color:var(--ink-soft)]">
              {leader
                ? `${leader.name} lidera o trono com ${formatPointsLabel(leader.points)}.`
                : "Marque vitórias. O trono favorece quem lidera."}
            </p>
            <div className="ink-rule mt-2.5 sm:mt-3" aria-hidden />
          </header>

          {players.length === 0 ? (
            <p className="rounded-sm border border-[color:var(--ink)]/15 bg-[color:var(--ink)]/5 px-3 py-5 text-center text-sm text-[color:var(--ink-soft)]">
              Nenhum herói encontrado. Rode o seed do banco e recarregue.
            </p>
          ) : (
            <ol
              className="flex min-h-0 flex-1 flex-col gap-2 sm:gap-2.5"
              aria-label="Ranking dos heróis"
            >
              {players.map((player, index) => {
                const isBusy = busyId === player.id;
                return (
                  <li
                    key={player.id}
                    data-rank={player.rank}
                    aria-busy={isBusy || undefined}
                    style={{ animationDelay: `${index * 40}ms` }}
                    className={`hero-row animate-row flex items-center gap-2 px-2 py-2 sm:gap-3 sm:px-3 sm:py-2.5 ${clanClass(player.slug)} ${
                      flashId === player.id ? "animate-seal" : ""
                    }`}
                  >
                    <span
                      className={`wax-seal ${sealClassForRank(player.rank)} flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display text-base font-bold sm:h-11 sm:w-11 sm:text-lg`}
                      aria-label={`Posição ${player.rank}`}
                    >
                      {player.rank}
                    </span>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span
                          className="clan-dot shrink-0"
                          style={{ background: "var(--clan)" }}
                          aria-hidden
                        />
                        <p className="truncate font-display text-[clamp(1rem,2.5vw+0.4rem,1.25rem)] font-bold text-[color:var(--ink)]">
                          {player.name}
                        </p>
                      </div>
                      <p className="score-chip mt-0.5 text-[0.7rem] sm:text-xs">
                        {formatPointsLabel(player.points)}
                      </p>
                    </div>

                    <div className="flex shrink-0 gap-1.5">
                      <button
                        type="button"
                        aria-label={`Subtrair um ponto de ${player.name}`}
                        disabled={isBusy || loggingOut || player.points === 0}
                        onClick={() => adjustPoints(player, -1)}
                        className="btn-scribe btn-icon btn-minus flex h-11 w-11 items-center justify-center rounded-sm text-xl disabled:cursor-not-allowed"
                      >
                        −
                      </button>
                      <button
                        type="button"
                        aria-label={`Adicionar um ponto a ${player.name}`}
                        disabled={isBusy || loggingOut}
                        onClick={() => adjustPoints(player, 1)}
                        className="btn-scribe btn-icon btn-plus flex h-11 w-11 items-center justify-center rounded-sm text-xl disabled:cursor-not-allowed"
                      >
                        +
                      </button>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}

          {error ? (
            <p
              className="mt-3 shrink-0 rounded-sm border border-[color:var(--wax)]/30 bg-[color:var(--wax)]/8 px-3 py-2 text-center text-sm text-[color:var(--wax)]"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut || Boolean(busyId)}
            aria-busy={loggingOut}
            className="btn-scribe btn-ghost mt-auto min-h-11 w-full shrink-0 rounded-sm px-3 py-2.5 text-[0.6rem] disabled:cursor-not-allowed disabled:opacity-50 sm:mt-4 sm:text-[0.65rem]"
          >
            {loggingOut ? "Fechando…" : "Fechar o pergaminho"}
          </button>
        </Ledger>
      </div>

      <div className="rank-court__throne">
        <ThronePanel players={players} />
      </div>

      <div className="rank-court__chronicle">
        <ChroniclePanel entries={chronicle} />
      </div>
    </section>
  );
}
