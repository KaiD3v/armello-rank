export type RankablePlayer = {
  id: string;
  slug: string;
  name: string;
  points: number;
};

export type RankedPlayer = RankablePlayer & {
  rank: number;
};

export function applyPointDelta(points: number, delta: 1 | -1): number {
  return Math.max(0, points + delta);
}

export function rankPlayers(players: RankablePlayer[]): RankedPlayer[] {
  const sorted = [...players].sort((a, b) => {
    if (b.points !== a.points) {
      return b.points - a.points;
    }
    return a.name.localeCompare(b.name, "pt-BR");
  });

  return sorted.map((player, index) => ({
    ...player,
    rank: index + 1,
  }));
}

export function isValidDelta(value: unknown): value is 1 | -1 {
  return value === 1 || value === -1;
}
