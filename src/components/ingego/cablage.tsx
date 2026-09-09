import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
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

/**
 * Raccordement : on touche un repère à gauche puis sa correspondance à droite,
 * et le câble se dessine. Toucher un câble posé le retire.
 *
 * Les libellés peuvent être longs : chaque ligne s'adapte à son contenu et les
 * câbles sont tracés à partir de la position réelle des cases (mesurée).
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

  const boite = useRef<HTMLDivElement>(null);
  const refsG = useRef<(HTMLButtonElement | null)[]>([]);
  const refsD = useRef<(HTMLButtonElement | null)[]>([]);
  const [geo, setGeo] = useState<{
    w: number;
    h: number;
    g: number[];
    d: number[];
    xg: number;
    xd: number;
  } | null>(null);

  const mesurer = useCallback(() => {
    const el = boite.current;
    if (!el) return;
    const base = el.getBoundingClientRect();
    const centre = (b: HTMLButtonElement | null) => {
      if (!b) return 0;
      const r = b.getBoundingClientRect();
      return r.top - base.top + r.height / 2;
    };
    const premierG = refsG.current[0]?.getBoundingClientRect();
    const premierD = refsD.current[0]?.getBoundingClientRect();
    setGeo({
      w: base.width,
      h: base.height,
      g: gauche.map((_, i) => centre(refsG.current[i])),
      d: ordreDroite.map((_, i) => centre(refsD.current[i])),
      xg: premierG ? premierG.right - base.left : 0,
      xd: premierD ? premierD.left - base.left : base.width,
    });
  }, [gauche, ordreDroite]);

  useLayoutEffect(() => {
    mesurer();
  }, [mesurer, liens, corrige]);

  useEffect(() => {
    const el = boite.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => mesurer());
    ro.observe(el);
    return () => ro.disconnect();
  }, [mesurer]);

  const relieA = (g: number) => liens[g];
  const droiteUtilisee = new Set(Object.values(liens));

  return (
    <div className="trame-plan space-y-2.5 rounded-2xl border border-border p-3">
      {titre && (
        <p className="px-1 text-[0.68rem] tracking-[0.15em] text-muted-foreground uppercase">
          {titre}
        </p>
      )}

      {(gaucheTitre || droiteTitre) && (
        <div className="grid grid-cols-[1fr_2rem_1fr] text-[0.6rem] tracking-[0.12em] text-muted-foreground uppercase">
          <span>{gaucheTitre}</span>
          <span />
          <span className="text-right">{droiteTitre}</span>
        </div>
      )}

      <div ref={boite} className="relative grid grid-cols-[1fr_2rem_1fr] items-stretch gap-y-1.5">
        {geo && (
          <svg
            viewBox={`0 0 ${geo.w} ${geo.h}`}
            width={geo.w}
            height={geo.h}
            className="pointer-events-none absolute inset-0"
            aria-hidden
          >
            {Object.entries(liens).map(([g, d]) => {
              const gi = Number(g);
              const bon = ordreDroite[d] === gi;
              const y1 = geo.g[gi] ?? 0;
              const y2 = geo.d[d] ?? 0;
              const mx = (geo.xg + geo.xd) / 2;
              return (
                <path
                  key={g}
                  d={`M ${geo.xg} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${geo.xd} ${y2}`}
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
        )}

        {gauche.map((g, i) => {
          const lie = relieA(i);
          const bon = corrige && ordreDroite[lie] === i;
          const origine = ordreDroite[i];
          const prise = droiteUtilisee.has(i);
          return (
            <div key={g} className="contents">
              <button
                ref={(el) => {
                  refsG.current[i] = el;
                }}
                type="button"
                disabled={corrige}
                onClick={() => (lie === undefined ? onActif(actif === i ? null : i) : onDefaire(i))}
                className={cn(
                  "tap relative z-10 flex min-h-[1.9rem] w-full items-center rounded-lg border-2 px-2 py-1 text-left text-[0.68rem] leading-tight font-medium transition-all active:scale-[0.97]",
                  lie === undefined && actif !== i && "border-border bg-elevated",
                  actif === i && "border-primary bg-primary/15 ring-2 ring-primary/30",
                  lie !== undefined && !corrige && "border-primary bg-primary/10",
                  corrige && lie !== undefined && bon && "border-success bg-success/15",
                  corrige && lie !== undefined && !bon && "border-destructive bg-destructive/15",
                )}
              >
                {g}
              </button>
              <span />
              <button
                ref={(el) => {
                  refsD.current[i] = el;
                }}
                type="button"
                disabled={corrige || actif === null || prise}
                onClick={() => actif !== null && onRelier(actif, i)}
                className={cn(
                  "tap relative z-10 flex min-h-[1.9rem] w-full items-center justify-end rounded-lg border-2 px-2 py-1 text-right text-[0.68rem] leading-tight font-medium transition-all active:scale-[0.97]",
                  prise ? "border-primary/60 bg-primary/10" : "border-border bg-elevated",
                  actif !== null &&
                    !prise &&
                    !corrige &&
                    "border-primary/60 ring-1 ring-primary/25",
                )}
              >
                {droite[origine]}
              </button>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        {corrige
          ? "Les câbles verts sont correctement raccordés."
          : (legende ?? "Touchez un repère à gauche, puis sa correspondance à droite.")}
      </p>
    </div>
  );
}
