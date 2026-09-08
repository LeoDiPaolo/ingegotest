import { cn } from "@/lib/utils";

export interface DonneesCablage {
  titre?: string;
  /** intitulé de la colonne gauche */
  gaucheTitre?: string;
  /** intitulé de la colonne droite */
  droiteTitre?: string;
  gauche: string[];
  /** libellés de droite, dans l'ordre affiché ; la bonne paire est gauche[i] ↔ droite[i] */
  droite: string[];
  legende?: string;
}

const H = 26;

/**
 * Raccordement : on touche un repère à gauche puis sa correspondance à droite,
 * et le câble se dessine. Toucher un câble posé le retire.
 */
export function Cablage({
  donnees,
  liens,
  actif,
  onActif,
  onRelier,
  onDefaire,
  ordreDroite,
  corrige,
}: {
  donnees: DonneesCablage;
  /** index gauche -> index droite (dans l'ordre affiché) */
  liens: Record<string, number>;
  actif: number | null;
  onActif: (i: number | null) => void;
  onRelier: (g: number, d: number) => void;
  onDefaire: (g: number) => void;
  /** ordre d'affichage de la colonne droite (indices d'origine) */
  ordreDroite: number[];
  corrige: boolean;
}) {
  const { titre, gauche, droite, gaucheTitre, droiteTitre, legende } = donnees;
  const hauteur = Math.max(gauche.length, droite.length) * H + 8;
  const yg = (i: number) => 8 + i * H + H / 2;

  const relieA = (g: number) => liens[g];
  const droiteUtilisee = new Set(Object.values(liens));

  return (
    <div className="trame-plan space-y-2.5 rounded-2xl border border-border p-3">
      {titre && (
        <p className="px-1 text-[0.68rem] tracking-[0.15em] text-muted-foreground uppercase">
          {titre}
        </p>
      )}

      <div className="relative grid grid-cols-[1fr_2.5rem_1fr] gap-0">
        <div className="space-y-1.5">
          {gaucheTitre && (
            <p className="text-[0.6rem] tracking-[0.12em] text-muted-foreground uppercase">
              {gaucheTitre}
            </p>
          )}
          {gauche.map((g, i) => {
            const lie = relieA(i);
            const bon = corrige && ordreDroite[lie] === i;
            return (
              <button
                key={g}
                type="button"
                disabled={corrige}
                onClick={() => (lie === undefined ? onActif(actif === i ? null : i) : onDefaire(i))}
                style={{ height: H - 4 }}
                className={cn(
                  "tap flex w-full items-center rounded-lg border-2 px-2 text-left text-[0.7rem] leading-tight font-medium transition-all active:scale-[0.97]",
                  lie === undefined && actif !== i && "border-border bg-elevated",
                  actif === i && "border-primary bg-primary/15 ring-2 ring-primary/30",
                  lie !== undefined && !corrige && "border-primary bg-primary/10",
                  corrige && lie !== undefined && bon && "border-success bg-success/15",
                  corrige && lie !== undefined && !bon && "border-destructive bg-destructive/15",
                )}
              >
                {g}
              </button>
            );
          })}
        </div>

        <svg
          viewBox={`0 0 40 ${hauteur}`}
          preserveAspectRatio="none"
          className="h-full w-full"
          aria-hidden
        >
          {Object.entries(liens).map(([g, d]) => {
            const gi = Number(g);
            const bon = ordreDroite[d] === gi;
            return (
              <path
                key={g}
                d={`M 0 ${yg(gi) + (gaucheTitre ? 14 : 0)} C 18 ${yg(gi)}, 22 ${yg(d)}, 40 ${yg(d) + (droiteTitre ? 14 : 0)}`}
                fill="none"
                strokeWidth={2}
                strokeLinecap="round"
                stroke={
                  corrige
                    ? bon
                      ? "var(--success)"
                      : "var(--destructive)"
                    : "color-mix(in oklab, var(--primary) 70%, transparent)"
                }
              />
            );
          })}
        </svg>

        <div className="space-y-1.5">
          {droiteTitre && (
            <p className="text-right text-[0.6rem] tracking-[0.12em] text-muted-foreground uppercase">
              {droiteTitre}
            </p>
          )}
          {ordreDroite.map((origine, d) => {
            const prise = droiteUtilisee.has(d);
            return (
              <button
                key={origine}
                type="button"
                disabled={corrige || actif === null || prise}
                onClick={() => actif !== null && onRelier(actif, d)}
                style={{ height: H - 4 }}
                className={cn(
                  "tap flex w-full items-center justify-end rounded-lg border-2 px-2 text-right text-[0.7rem] leading-tight font-medium transition-all active:scale-[0.97]",
                  prise ? "border-primary/60 bg-primary/8" : "border-border bg-elevated",
                  actif !== null && !prise && !corrige && "border-primary/60 ring-1 ring-primary/25",
                )}
              >
                {droite[origine]}
              </button>
            );
          })}
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        {corrige
          ? "Les câbles verts sont correctement raccordés."
          : (legende ?? "Touchez un repère à gauche, puis sa correspondance à droite.")}
      </p>
    </div>
  );
}
