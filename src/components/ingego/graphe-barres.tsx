import { cn } from "@/lib/utils";

export interface BarreGraphe {
  l: string;
  v: number;
  sub?: string;
}

export interface DonneesGraphe {
  titre?: string;
  unite?: string;
  barres: BarreGraphe[];
}

/** Graphique en barres cliquable : on répond en désignant une barre. */
export function GrapheBarres({
  donnees,
  selection,
  onSelect,
  bonneBarre,
  corrige,
}: {
  donnees: DonneesGraphe;
  selection: number | null;
  onSelect: (i: number) => void;
  bonneBarre?: number;
  corrige: boolean;
}) {
  const { barres, unite = "", titre } = donnees;
  const max = Math.max(...barres.map((b) => b.v), 1);

  const couleur = (i: number) => {
    if (corrige) {
      if (i === bonneBarre) return "var(--color-success)";
      if (i === selection) return "var(--color-destructive)";
      return "var(--color-elevated)";
    }
    if (i === selection) return "var(--color-primary)";
    return "color-mix(in oklab, var(--color-primary) 18%, var(--color-elevated))";
  };

  return (
    <div className="trame-plan space-y-3 rounded-2xl border border-border p-4">
      {titre && (
        <p className="text-[0.68rem] tracking-[0.15em] text-muted-foreground uppercase">{titre}</p>
      )}

      <div className="space-y-2.5">
        {barres.map((b, i) => {
          const actif = corrige ? i === bonneBarre || i === selection : i === selection;
          return (
            <button
              key={i}
              type="button"
              disabled={corrige}
              onClick={() => onSelect(i)}
              aria-pressed={selection === i}
              className={cn(
                "tap block w-full rounded-lg px-1 text-left outline-none focus-visible:ring-2 focus-visible:ring-ring",
                !corrige && "cursor-pointer",
              )}
            >
              <span className="flex items-baseline justify-between gap-3 text-sm">
                <span className={cn("font-medium", actif ? "text-foreground" : "text-muted-foreground")}>
                  {b.l}
                </span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {b.v.toLocaleString("fr-FR")}
                  {unite ? ` ${unite}` : ""}
                </span>
              </span>
              <span
                className="mt-1 block h-4 overflow-hidden rounded-md border border-plan-line/40"
                style={{ backgroundColor: "color-mix(in oklab, var(--color-plan-line) 8%, transparent)" }}
              >
                <span
                  className="block h-full rounded-md transition-[width,background-color] duration-300"
                  style={{ width: `${Math.max(4, (b.v / max) * 100)}%`, backgroundColor: couleur(i) }}
                />
              </span>
              {b.sub && <span className="mt-1 block text-xs text-muted-foreground">{b.sub}</span>}
            </button>
          );
        })}
      </div>

      {!corrige && (
        <p className="text-xs text-muted-foreground">Touchez la barre qui répond à la question.</p>
      )}
    </div>
  );
}
