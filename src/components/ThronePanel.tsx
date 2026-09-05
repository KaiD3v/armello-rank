import { formatPointsLabel, heroArtForSlug, clanClass } from "@/lib/clan-art";
import type { RankedPlayerView } from "@/components/RankingBoard";

type ThronePanelProps = {
  players: RankedPlayerView[];
};

function CrownIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 48 36"
      width="28"
      height="21"
      aria-hidden
      fill="none"
    >
      <path
        d="M4 28 L8 10 L16 20 L24 6 L32 20 L40 10 L44 28 Z"
        fill="url(#crownGilt)"
        stroke="#8a6a28"
        strokeWidth="1.2"
      />
      <rect x="4" y="28" width="40" height="5" rx="1" fill="#c9a84a" stroke="#8a6a28" />
      <circle cx="8" cy="10" r="2.2" fill="#e8d08a" />
      <circle cx="24" cy="6" r="2.5" fill="#f0d78c" />
      <circle cx="40" cy="10" r="2.2" fill="#e8d08a" />
      <defs>
        <linearGradient id="crownGilt" x1="24" y1="6" x2="24" y2="28">
          <stop stopColor="#f0d78c" />
          <stop offset="1" stopColor="#a88430" />
        </linearGradient>
      </defs>
    </svg>
  );
}

export function ThronePanel({ players }: ThronePanelProps) {
  const topScore = players[0]?.points ?? 0;
  const contenders = players.filter((p) => p.points === topScore);
  const disputed = contenders.length > 1;
  const leader = contenders[0];

  return (
    <aside className={`side-panel side-panel--throne ${leader ? clanClass(leader.slug) : ""}`}>
      <div className="side-panel__frame">
        <header className="side-panel__head">
          <CrownIcon className="side-panel__crown" />
          <h2 className="side-panel__title">
            {disputed ? "Trono Disputado" : "O Trono Atual"}
          </h2>
        </header>

        {!leader ? (
          <p className="side-panel__empty">O trono aguarda um herói.</p>
        ) : disputed ? (
          <div className="throne-contenders">
            <p className="side-panel__lede">
              {contenders.length} heróis dividem a liderança com{" "}
              {formatPointsLabel(topScore)}.
            </p>
            <ul className="throne-contenders__list">
              {contenders.map((player) => {
                const art = heroArtForSlug(player.slug);
                return (
                  <li
                    key={player.id}
                    className={`throne-contenders__item ${clanClass(player.slug)}`}
                  >
                    <div className="throne-portrait throne-portrait--compact">
                      <img
                        src={art.src}
                        alt=""
                        className="throne-portrait__img"
                        decoding="async"
                      />
                    </div>
                    <div className="throne-contenders__meta">
                      <p className="throne-name truncate" title={player.name}>
                        {player.name}
                      </p>
                      <p className="throne-score">
                        <span
                          className="clan-dot shrink-0"
                          style={{ background: "var(--clan)" }}
                          aria-hidden
                        />
                        <span>{formatPointsLabel(player.points)}</span>
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : (
          <div className="throne-solo">
            <div className="throne-portrait">
              <img
                src={heroArtForSlug(leader.slug).src}
                alt=""
                className="throne-portrait__img"
                decoding="async"
              />
            </div>
            <p className="throne-name">{leader.name}</p>
            <p className="throne-score">
              <span
                className="clan-dot"
                style={{ background: "var(--clan)" }}
                aria-hidden
              />
              <span>{formatPointsLabel(leader.points)}</span>
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
