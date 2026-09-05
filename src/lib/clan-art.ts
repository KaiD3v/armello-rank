/** Visual clan / hero art for ranking side panels (UI only). */

export type ClanSlug = "kaique" | "pedro" | "henrique" | "afonso";

export function clanClass(slug: string): string {
  switch (slug) {
    case "kaique":
      return "clan-kaique";
    case "pedro":
      return "clan-pedro";
    case "henrique":
      return "clan-henrique";
    case "afonso":
      return "clan-afonso";
    default:
      return "";
  }
}

/** Transparent hero PNGs mapped per player slug. */
export function heroArtForSlug(slug: string): { src: string; alt: string } {
  switch (slug) {
    case "kaique":
      return { src: "/realm/hero-wolf.png", alt: "" };
    case "pedro":
      return { src: "/realm/hero-lion.png", alt: "" };
    case "henrique":
      return { src: "/realm/hero-badger.png", alt: "" };
    case "afonso":
      return { src: "/realm/hero-turtle.png", alt: "" };
    default:
      return { src: "/realm/hero-wolf.png", alt: "" };
  }
}

export function formatPointsLabel(points: number): string {
  return `${points} ${points === 1 ? "ponto" : "pontos"}`;
}
