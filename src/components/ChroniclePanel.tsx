"use client";

import { useId, useRef, useState } from "react";

import { formatPointsLabel } from "@/lib/clan-art";

export type ChronicleEntry = {
  id: string;
  playerName: string;
  delta: 1 | -1;
  resultingPoints: number;
  at: number;
};

type ChroniclePanelProps = {
  entries: ChronicleEntry[];
};

function formatTime(at: number): string {
  try {
    return new Intl.DateTimeFormat("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(at));
  } catch {
    return "";
  }
}

function entryText(entry: ChronicleEntry): string {
  const sign = entry.delta > 0 ? "+1" : "−1";
  const verb = entry.delta > 0 ? "recebeu" : "perdeu";
  return `${entry.playerName} ${verb} ${sign} — agora possui ${formatPointsLabel(entry.resultingPoints)}.`;
}

export function ChroniclePanel({ entries }: ChroniclePanelProps) {
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const bodyRef = useRef<HTMLDivElement>(null);

  function toggleOpen() {
    setOpen((prev) => {
      const next = !prev;
      if (next) {
        requestAnimationFrame(() => {
          bodyRef.current?.scrollIntoView({
            block: "nearest",
            behavior: "smooth",
          });
        });
      }
      return next;
    });
  }

  const body = (
    <>
      {entries.length === 0 ? (
        <p className="side-panel__empty">Nenhum feito foi registrado.</p>
      ) : (
        <ol className="chronicle-list" aria-live="polite" aria-relevant="additions">
          {entries.map((entry, index) => (
            <li
              key={entry.id}
              className={`chronicle-item${index === 0 ? " chronicle-item--fresh" : ""}`}
            >
              <p className="chronicle-item__text">{entryText(entry)}</p>
              <time className="chronicle-item__time" dateTime={new Date(entry.at).toISOString()}>
                {formatTime(entry.at)}
              </time>
            </li>
          ))}
        </ol>
      )}
    </>
  );

  return (
    <aside className="side-panel side-panel--chronicle">
      <div className="side-panel__frame">
        <header className="side-panel__head side-panel__head--split">
          <h2 className="side-panel__title" id={panelId}>
            Crônica da Partida
          </h2>
          <button
            type="button"
            className="chronicle-toggle btn-scribe"
            aria-expanded={open}
            aria-controls={`${panelId}-body`}
            onClick={toggleOpen}
          >
            {open ? "Recolher" : "Expandir"}
          </button>
        </header>

        <div
          ref={bodyRef}
          id={`${panelId}-body`}
          className={`chronicle-body${open ? " is-open" : ""}`}
          role="region"
          aria-labelledby={panelId}
        >
          {body}
        </div>
      </div>
    </aside>
  );
}
