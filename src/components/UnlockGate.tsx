"use client";

import { FormEvent, useState } from "react";

import { Ledger } from "@/components/Ledger";

type UnlockGateProps = {
  onUnlocked: () => void;
};

export function UnlockGate({ onUnlocked }: UnlockGateProps) {
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (pending || !code.trim()) {
      return;
    }

    setError(null);
    setPending(true);

    try {
      const response = await fetch("/api/auth/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      });

      if (!response.ok) {
        setError(
          response.status === 401
            ? "O selo rejeitou o código. Tente novamente."
            : "Não foi possível abrir o reino.",
        );
        return;
      }

      onUnlocked();
    } catch {
      setError("A conexão com o reino falhou.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="animate-unfurl board-stage board-stage--unlock">
      <div className="mb-2 text-center sm:mb-3">
        <p className="brand-mark text-[0.62rem] sm:text-[0.7rem]">Armello Rank</p>
      </div>

      <Ledger>
        <h1 className="hero-title hero-title--unlock text-center font-black">
          O Trono
          <span className="mt-0.5 block text-[0.92em] text-[color:var(--wax)]">
            Aguarda
          </span>
        </h1>

        <p className="mx-auto mt-2 max-w-[22ch] text-center text-[clamp(0.85rem,2.4vw+0.35rem,1.05rem)] leading-snug text-[color:var(--ink-soft)] sm:mt-3 sm:max-w-sm">
          Digite o código do clã para abrir o ranking dos heróis.
        </p>

        <div className="ink-rule my-3 sm:my-5" aria-hidden />

        <form className="flex flex-col gap-3 sm:gap-4" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-1.5" htmlFor="clan-code">
            <span className="font-display text-[0.6rem] uppercase tracking-[0.24em] text-[color:var(--ink-soft)]">
              Código do clã
            </span>
            <input
              id="clan-code"
              type="password"
              name="code"
              autoComplete="current-password"
              enterKeyHint="go"
              inputMode="text"
              value={code}
              onChange={(event) => setCode(event.target.value)}
              className="field-ink min-h-11 w-full max-w-full rounded-sm px-3 py-2.5 text-base tracking-[0.12em] sm:min-h-12 sm:px-4 sm:text-lg"
              placeholder="Digite o código"
              data-testid="access-code"
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? "unlock-error" : undefined}
              required
            />
          </label>

          {error ? (
            <p
              id="unlock-error"
              className="rounded-sm border border-[color:var(--wax)]/30 bg-[color:var(--wax)]/8 px-3 py-2 text-center text-sm text-[color:var(--wax)]"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={pending || !code.trim()}
            aria-busy={pending}
            className="btn-scribe btn-primary mt-0.5 min-h-11 w-full rounded-sm px-4 py-3 text-[0.7rem] disabled:cursor-not-allowed disabled:opacity-55 sm:min-h-12 sm:text-sm"
          >
            {pending ? "Abrindo o selo…" : "Abrir o pergaminho"}
          </button>
        </form>
      </Ledger>

      <p className="mt-2 text-center font-display text-[0.55rem] uppercase tracking-[0.28em] text-[color:var(--ash)]/55 sm:mt-3 sm:tracking-[0.32em]">
        Quatro heróis · Um ranking
      </p>
    </section>
  );
}
