import { cn } from "@/lib/utils";

export interface CelluleZonage {
  /** colonne (0-indexée) sur la grille du plan */
  x: number;
  /** ligne (0-indexée) */
  y: number;
  w?: number;
  h?: number;
  l: string;
  /** catégorie attendue (indice dans legende) */
  cat: number;
}

export interface DonneesZonage {
  titre?: string;
  /** nombre de colonnes de la grille */
  cols: number;
  /** nombre de lignes */
  lignes: number;
  /** catégories peignables */
  legende: string[];
  cellules: CelluleZonage[];
  legendeBas?: string;
}

const TEINTES = [
  "var(--primary)",
  "var(--brand)",
  "var(--success)",
  "var(--accent-foreground)",
] as const;

/**
 * Plan de masse à zoner : on choisit une catégorie dans la palette,
 * puis on peint les emprises du plan en les touchant.
 */
export function Zonage({
  donnees,
  reponses,
  pinceau,
  onPinceau,
  onPeindre,
  corrige,
}: {
  donnees: DonneesZonage;
  reponses: Record<string, number>;
  pinceau: number;
  onPinceau: (c: number) => void;
  onPeindre: (i: number, cat: number) => void;
  corrige: boolean;
}) {
  const { titre, cols, lignes, legende, cellules, legendeBas } = donnees;
  const U = 100 / cols;

  return (
    <div className="trame-plan space-y-2.5 rounded-2xl border border-border p-3">
      {titre && (
        <p className="px-1 text-[0.68rem] tracking-[0.15em] text-muted-foreground uppercase">
          {titre}
        </p>
      )}

      {!corrige && (
        <div className="flex flex-wrap gap-1.5">
          {legende.map((c, ci) => (
            <button
              key={c}
              type="button"
              aria-pressed={pinceau === ci}
              onClick={() => onPinceau(ci)}
              className={cn(
                "tap flex items-center gap-1.5 rounded-lg border-2 px-2.5 py-1.5 text-xs font-medium transition-all active:scale-95",
                pinceau === ci ? "border-foreground bg-elevated" : "border-border bg-card",
              )}
            >
              <span
                className="h-3.5 w-3.5 rounded-sm"
                style={{ background: `color-mix(in oklab, ${TEINTES[ci % 4]} 55%, transparent)` }}
                aria-hidden
              />
              {c}
            </button>
          ))}
        </div>
      )}

      <div
        className="relative w-full overflow-hidden rounded-xl border border-plan-line/70 bg-card"
        style={{ aspectRatio: `${cols} / ${lignes}` }}
      >
        <svg viewBox={`0 0 ${cols * 10} ${lignes * 10}`} className="absolute inset-0 h-full w-full">
          {Array.from({ length: cols - 1 }, (_, i) => (
            <line
              key={`v${i}`}
              x1={(i + 1) * 10}
              y1={0}
              x2={(i + 1) * 10}
              y2={lignes * 10}
              stroke="var(--plan-line)"
              strokeWidth={0.2}
              strokeDasharray="1 1"
            />
          ))}
          {Array.from({ length: lignes - 1 }, (_, i) => (
            <line
              key={`h${i}`}
              x1={0}
              y1={(i + 1) * 10}
              x2={cols * 10}
              y2={(i + 1) * 10}
              stroke="var(--plan-line)"
              strokeWidth={0.2}
              strokeDasharray="1 1"
            />
          ))}
        </svg>

        {cellules.map((c, i) => {
          const choisi = reponses[i];
          const bon = corrige && choisi === c.cat;
          const teinte = TEINTES[(choisi ?? 0) % 4];
          return (
            <button
              key={i}
              type="button"
              disabled={corrige}
              onClick={() => onPeindre(i, pinceau)}
              className={cn(
                "tap absolute rounded-md border-2 p-1 text-left transition-all active:scale-[0.97]",
                choisi === undefined && "border-dashed border-plan-line bg-elevated/70",
                choisi !== undefined && !corrige && "anim-pop border-foreground/25",
                corrige && bon && "border-success",
                corrige && !bon && "border-destructive",
              )}
              style={{
                left: `${c.x * U}%`,
                top: `${(c.y * 100) / lignes}%`,
                width: `${(c.w ?? 1) * U}%`,
                height: `${((c.h ?? 1) * 100) / lignes}%`,
                background:
                  choisi === undefined
                    ? undefined
                    : `color-mix(in oklab, ${teinte} 40%, transparent)`,
              }}
            >
              <span className="block text-[0.62rem] leading-tight font-medium">{c.l}</span>
              {corrige && !bon && (
                <span className="block text-[0.58rem] leading-tight text-muted-foreground">
                  → {legende[c.cat]}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        {corrige
          ? "Les emprises en vert sont correctement zonées."
          : (legendeBas ?? "Choisissez une couleur, puis touchez chaque emprise du plan.")}
      </p>
    </div>
  );
}
