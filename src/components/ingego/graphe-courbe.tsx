import { cn } from "@/lib/utils";

export interface PointCourbe {
  x: string;
  y: number;
  sub?: string;
}

export interface SerieCourbe {
  nom: string;
  points: PointCourbe[];
  /** série de contexte, non cliquable */
  contexte?: boolean;
}

export interface DonneesCourbe {
  titre?: string;
  unite?: string;
  legendeY?: string;
  series: SerieCourbe[];
}

const W = 320;
const H = 200;
const M = { top: 16, right: 14, bottom: 30, left: 44 };

/** Graphique en courbe cliquable : on répond en désignant un point de la trajectoire. */
export function GrapheCourbe({
  donnees,
  selection,
  onSelect,
  bonnePoint,
  corrige,
}: {
  donnees: DonneesCourbe;
  selection: number | null;
  onSelect: (i: number) => void;
  bonnePoint?: number;
  corrige: boolean;
}) {
  const { series, unite = "", titre, legendeY } = donnees;
  const principale = series.find((s) => !s.contexte) ?? series[0];
  const toutes = series.flatMap((s) => s.points.map((p) => p.y));
  const brut = Math.max(...toutes) * 1.18;
  const pas = Math.pow(10, Math.floor(Math.log10(brut || 1))) / 2;
  const maxY = Math.ceil(brut / (pas * 4)) * pas * 4;
  const minY = 0;

  const PAD = 16;
  const iw = W - M.left - M.right - PAD * 2;
  const ih = H - M.top - M.bottom;
  const px = (i: number, n: number) =>
    M.left + PAD + (n <= 1 ? iw / 2 : (i / (n - 1)) * iw);
  const py = (v: number) => M.top + ih - ((v - minY) / (maxY - minY)) * ih;

  const couleurPoint = (i: number) => {
    if (corrige) {
      if (i === bonnePoint) return "var(--color-success)";
      if (i === selection) return "var(--color-destructive)";
      return "var(--color-muted-foreground)";
    }
    return i === selection ? "var(--color-primary)" : "var(--color-brand, var(--color-primary))";
  };

  const graduations = [0, 0.25, 0.5, 0.75, 1].map((f) => minY + f * (maxY - minY));

  return (
    <div className="trame-plan space-y-3 rounded-2xl border border-border p-4">
      {titre && (
        <p className="text-[0.68rem] tracking-[0.15em] text-muted-foreground uppercase">{titre}</p>
      )}

      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="block w-full"
        role="img"
        aria-label={titre ?? "Graphique en courbe"}
      >
        {graduations.map((g, i) => (
          <g key={i}>
            <line
              x1={M.left}
              x2={W - M.right}
              y1={py(g)}
              y2={py(g)}
              stroke="var(--color-plan-line)"
              strokeOpacity={0.35}
              strokeWidth={0.6}
            />
            <text
              x={M.left - 5}
              y={py(g) + 3}
              textAnchor="end"
              fontSize={7}
              fill="var(--color-muted-foreground)"
            >
              {Math.round(g).toLocaleString("fr-FR")}
            </text>
          </g>
        ))}

        {series.map((s, si) => {
          const d = s.points.map((p, i) => `${i ? "L" : "M"}${px(i, s.points.length)},${py(p.y)}`).join(" ");
          return (
            <path
              key={si}
              d={d}
              fill="none"
              stroke={s.contexte ? "var(--color-muted-foreground)" : "var(--color-primary)"}
              strokeOpacity={s.contexte ? 0.5 : 1}
              strokeDasharray={s.contexte ? "4 3" : undefined}
              strokeWidth={s.contexte ? 1.2 : 1.8}
              strokeLinejoin="round"
            />
          );
        })}

        {principale.points.map((p, i) => {
          const n = principale.points.length;
          const actif = corrige ? i === bonnePoint || i === selection : i === selection;
          return (
            <g
              key={i}
              role="button"
              tabIndex={corrige ? -1 : 0}
              aria-pressed={selection === i}
              aria-label={`${p.x} : ${p.y} ${unite}`}
              onClick={() => !corrige && onSelect(i)}
              onKeyDown={(e) => {
                if (!corrige && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  onSelect(i);
                }
              }}
              className={cn("outline-none", !corrige && "cursor-pointer")}
            >
              <rect
                x={px(i, n) - 16}
                y={M.top}
                width={32}
                height={ih}
                fill="transparent"
              />
              <circle cx={px(i, n)} cy={py(p.y)} r={actif ? 6 : 4} fill={couleurPoint(i)} />
              <text
                x={px(i, n)}
                y={py(p.y) - 10}
                textAnchor="middle"
                fontSize={8}
                fontWeight={actif ? 700 : 500}
                fill={actif ? couleurPoint(i) : "var(--color-muted-foreground)"}
              >
                {p.y.toLocaleString("fr-FR")}
              </text>
              <text
                x={px(i, n)}
                y={H - 10}
                textAnchor="middle"
                fontSize={8}
                fontWeight={actif ? 700 : 500}
                fill={actif ? "var(--color-foreground)" : "var(--color-muted-foreground)"}
              >
                {p.x}
              </text>
            </g>
          );
        })}
      </svg>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
        <span>{legendeY ? `${legendeY}${unite ? ` (${unite})` : ""}` : unite}</span>
        {!corrige && <span>Touchez le point qui répond à la question.</span>}
      </div>
    </div>
  );
}
