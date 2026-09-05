import {
  applyPointDelta,
  isValidDelta,
  rankPlayers,
} from "@/lib/ranking";

describe("applyPointDelta", () => {
  it("adds one point", () => {
    expect(applyPointDelta(3, 1)).toBe(4);
  });

  it("subtracts one point", () => {
    expect(applyPointDelta(3, -1)).toBe(2);
  });

  it("does not go below zero", () => {
    expect(applyPointDelta(0, -1)).toBe(0);
    expect(applyPointDelta(1, -1)).toBe(0);
  });
});

describe("isValidDelta", () => {
  it("accepts only 1 and -1", () => {
    expect(isValidDelta(1)).toBe(true);
    expect(isValidDelta(-1)).toBe(true);
    expect(isValidDelta(0)).toBe(false);
    expect(isValidDelta(2)).toBe(false);
    expect(isValidDelta("1")).toBe(false);
  });
});

describe("rankPlayers", () => {
  it("orders by points desc then name asc with ranks 1-4", () => {
    const ranked = rankPlayers([
      { id: "1", slug: "kaique", name: "Kaique", points: 2 },
      { id: "2", slug: "pedro", name: "Pedro", points: 5 },
      { id: "3", slug: "henrique", name: "Henrique", points: 2 },
      { id: "4", slug: "afonso", name: "Afonso", points: 0 },
    ]);

    expect(ranked.map((p) => p.name)).toEqual([
      "Pedro",
      "Henrique",
      "Kaique",
      "Afonso",
    ]);
    expect(ranked.map((p) => p.rank)).toEqual([1, 2, 3, 4]);
  });
});
