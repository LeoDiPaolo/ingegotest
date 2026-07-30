import { cn } from "@/lib/utils";
import { IconeMateriau, SceneDeconstruction, type CleMateriau } from "./illustrations";

export interface DepotChantier {
  /** libellé du dépôt de matériau */
  l: string;
  /** illustration associée */
  icone: CleMateriau;
  /** index de la colonne attendue */
  col: number;
}

export interface DonneesChantier {
  titre?: string;
  /** affiche la scène de chantier illustrée en tête */
  scene?: boolean;
  colonnes: string[];
  depots: DepotChantier[];
  legende?: string;
}

/**
 * Tri visuel de chantier : chaque dépôt illustré est orienté vers une filière.
 * On répond en affectant chaque matériau à une colonne.
 */
export function TriChantier({
  donnees,
  reponses,
  onAffecter,
  corrige,
}: {
  donnees: DonneesChantier;
  reponses: Record<string, number>;
  onAffecter: (i: number, col: number) => void;
  corrige: boolean;
}) {
  const { titre, scene, colonnes, depots, legende } = donnees;

  return (
    <div className="trame-plan space-y-3 rounded-2xl border border-border p-3">
      {titre && (
        <p className="px-1 text-[0.68rem] tracking-[0.15em] text-muted-foreground uppercase">
          {titre}
        </p>
      )}

      {scene !== false && (
        <SceneDeconstruction className="h-auto w-full rounded-xl border border-border" />
      )}

      <ul className="space-y-2">
        {depots.map((d, i) => {
          const choisi = reponses[i];
          const bon = corrige && choisi === d.col;
          return (
            <li
              key={i}
              className={cn(
                "rounded-xl border p-2.5",
                corrige
                  ? bon
                    ? "border-success bg-success/10"
                    : "border-destructive bg-destructive/10"
                  : "border-border bg-card",
              )}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border",
                    corrige
                      ? bon
                        ? "border-success/50 bg-success/15 text-success"
                        : "border-destructive/50 bg-destructive/15 text-destructive"
                      : "border-border bg-elevated text-primary",
                  )}
                >
                  <IconeMateriau cle={d.icone} className="h-7 w-7" />
                </span>
                <p className="min-w-0 text-sm leading-snug">{d.l}</p>
              </div>

              {corrige ? (
                <p className="mt-2 text-xs text-muted-foreground">→ {colonnes[d.col]}</p>
              ) : (
                <div
                  className="mt-2 grid gap-1.5"
                  style={{ gridTemplateColumns: `repeat(${colonnes.length}, minmax(0,1fr))` }}
                >
                  {colonnes.map((c, ci) => (
                    <button
                      key={ci}
                      type="button"
                      aria-pressed={choisi === ci}
                      onClick={() => onAffecter(i, ci)}
                      className={cn(
                        "tap rounded-lg border px-2 py-2 text-xs leading-tight font-semibold transition-colors",
                        choisi === ci
                          ? "border-primary bg-primary/15 text-foreground"
                          : "border-border bg-elevated text-muted-foreground",
                      )}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {legende && <p className="px-1 text-xs text-muted-foreground">{legende}</p>}
    </div>
  );
}
