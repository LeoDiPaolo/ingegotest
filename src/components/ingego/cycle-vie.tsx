import { cn } from "@/lib/utils";

export interface EtapeCycle {
  /** code de module (A1-A3, B, C, D…) */
  code: string;
  /** libellé court de l'étape */
  l: string;
  /** détail affiché sous le libellé */
  d?: string;
}

export interface DonneesCycle {
  titre?: string;
  etapes: EtapeCycle[];
  legende?: string;
}

/**
 * Cycle de vie d'un ouvrage : chaîne d'étapes cliquables (modules ACV).
 * On répond en désignant l'étape concernée par la question.
 */
export function CycleVie({
  donnees,
  selection,
  onSelect,
  bonneCible,
  corrige,
}: {
  donnees: DonneesCycle;
  selection: number | null;
  onSelect: (i: number) => void;
  bonneCible?: number;
  corrige: boolean;
}) {
  const { etapes, titre, legende } = donnees;

  const etat = (i: number) => {
    if (corrige) {
      if (i === bonneCible) return "ok" as const;
      if (i === selection) return "ko" as const;
      return "neutre" as const;
    }
    return i === selection ? ("choisi" as const) : ("neutre" as const);
  };

  return (
    <div className="trame-plan space-y-3 rounded-2xl border border-border p-3">
      {titre && (
        <p className="px-1 text-[0.68rem] tracking-[0.15em] text-muted-foreground uppercase">
          {titre}
        </p>
      )}

      <ol className="space-y-1.5">
        {etapes.map((e, i) => {
          const s = etat(i);
          return (
            <li key={i} className="relative">
              <button
                type="button"
                disabled={corrige}
                aria-pressed={selection === i}
                onClick={() => onSelect(i)}
                className={cn(
                  "tap grid w-full grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition-colors",
                  s === "neutre" && "border-border bg-card",
                  s === "choisi" && "border-primary bg-primary/15",
                  s === "ok" && "border-success bg-success/15",
                  s === "ko" && "border-destructive bg-destructive/15",
                )}
              >
                <span
                  className={cn(
                    "flex h-9 w-14 shrink-0 items-center justify-center rounded-lg border text-xs font-bold",
                    s === "neutre"
                      ? "border-border bg-elevated text-foreground"
                      : s === "choisi"
                        ? "border-primary bg-primary/20 text-foreground"
                        : s === "ok"
                          ? "border-success bg-success/25 text-foreground"
                          : "border-destructive bg-destructive/25 text-foreground",
                  )}
                >
                  {e.code}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm leading-snug font-semibold">{e.l}</span>
                  {e.d && (
                    <span className="mt-0.5 block text-xs leading-snug text-muted-foreground">
                      {e.d}
                    </span>
                  )}
                </span>
              </button>
              {i < etapes.length - 1 && (
                <span
                  aria-hidden
                  className="mx-auto block h-1.5 w-px bg-border"
                  style={{ marginTop: 2, marginBottom: 2 }}
                />
              )}
            </li>
          );
        })}
      </ol>

      <div className="flex items-center justify-between px-1 text-xs text-muted-foreground">
        <span>{legende ?? "Modules du cycle de vie"}</span>
        {!corrige && <span>Touchez une étape</span>}
      </div>
    </div>
  );
}
