import { cn } from "@/lib/utils";

export interface TrancheEchelle {
  /** libellé de la tranche, ex. « 28 à 50 m » */
  borne: string;
  /** contenu / régime associé à la tranche */
  l: string;
}

export interface DonneesEchelle {
  titre?: string;
  /** unité affichée sous la réglette, ex. « hauteur du plancher bas du dernier niveau (m) » */
  unite?: string;
  tranches: TrancheEchelle[];
}

const W = 320;
const H = 58;
const X0 = 12;
const X1 = W - 12;

/**
 * Réglette graduée cliquable : on répond en désignant une tranche
 * (hauteur, durée, effectif, montant…).
 */
export function Echelle({
  donnees,
  selection,
  onSelect,
  bonneCible,
  corrige,
}: {
  donnees: DonneesEchelle;
  selection: number | null;
  onSelect: (i: number) => void;
  bonneCible?: number;
  corrige: boolean;
}) {
  const { tranches, titre, unite } = donnees;
  const n = tranches.length;
  const larg = (X1 - X0) / n;

  const etat = (i: number) => {
    if (corrige) {
      if (i === bonneCible) return "ok" as const;
      if (i === selection) return "ko" as const;
      return "neutre" as const;
    }
    return i === selection ? ("choisi" as const) : ("neutre" as const);
  };

  const remplissage = (e: ReturnType<typeof etat>) =>
    e === "ok"
      ? "color-mix(in oklab, var(--success) 32%, transparent)"
      : e === "ko"
        ? "color-mix(in oklab, var(--destructive) 30%, transparent)"
        : e === "choisi"
          ? "color-mix(in oklab, var(--primary) 26%, transparent)"
          : "color-mix(in oklab, var(--brand) 10%, transparent)";

  return (
    <div className="trame-plan space-y-3 rounded-2xl border border-border p-3">
      {titre && (
        <p className="px-1 text-[0.68rem] tracking-[0.15em] text-muted-foreground uppercase">
          {titre}
        </p>
      )}

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        role="group"
        aria-label={titre ?? "Réglette graduée"}
      >
        {tranches.map((t, i) => {
          const e = etat(i);
          const x = X0 + i * larg;
          return (
            <g key={i}>
              <rect
                x={x}
                y={10}
                width={larg}
                height={22}
                fill={remplissage(e)}
                stroke="var(--plan-line)"
                strokeWidth={e === "neutre" ? 0.7 : 1.6}
              />
              <text
                x={x + larg / 2}
                y={25}
                textAnchor="middle"
                fontSize="8.5"
                fontWeight={e === "neutre" ? 500 : 700}
                fill="var(--foreground)"
              >
                {t.borne}
              </text>
              <line x1={x} y1={32} x2={x} y2={38} stroke="var(--plan-line)" strokeWidth="0.8" />
            </g>
          );
        })}
        <line x1={X1} y1={32} x2={X1} y2={38} stroke="var(--plan-line)" strokeWidth="0.8" />
        <line
          x1={X0}
          y1={38}
          x2={X1}
          y2={38}
          stroke="var(--plan-line)"
          strokeWidth="1"
          markerEnd=""
        />
        {unite && (
          <text x={W / 2} y={51} textAnchor="middle" fontSize="8" fill="var(--muted-foreground)">
            {unite}
          </text>
        )}
      </svg>

      <div className="space-y-1.5">
        {tranches.map((t, i) => {
          const e = etat(i);
          return (
            <button
              key={i}
              type="button"
              disabled={corrige}
              aria-pressed={selection === i}
              onClick={() => onSelect(i)}
              className={cn(
                "tap grid w-full grid-cols-[auto_minmax(0,1fr)] items-center gap-3 rounded-xl border px-3 py-2 text-left text-sm transition-colors",
                e === "neutre" && "border-border bg-card",
                e === "choisi" && "border-primary bg-primary/15",
                e === "ok" && "border-success bg-success/15",
                e === "ko" && "border-destructive bg-destructive/15",
              )}
            >
              <span className="shrink-0 rounded-lg bg-elevated px-2 py-1 text-xs font-bold">
                {t.borne}
              </span>
              <span className="min-w-0 leading-snug">{t.l}</span>
            </button>
          );
        })}
      </div>

      {!corrige && <p className="px-1 text-xs text-muted-foreground">Touchez une tranche</p>}
    </div>
  );
}
