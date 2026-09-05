import type { ReactNode } from "react";

type LedgerProps = {
  children: ReactNode;
  className?: string;
};

export function Ledger({ children, className = "" }: LedgerProps) {
  return (
    <div className={`ledger ${className}`.trim()}>
      <img
        className="ledger-scroll"
        src="/realm/pergaminho-ranking-sangue.png"
        alt=""
        decoding="async"
        draggable={false}
      />
      <div className="ledger-body">{children}</div>
    </div>
  );
}
