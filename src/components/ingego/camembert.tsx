import { cn } from "@/lib/utils";

export interface SegmentCamembert {
  l: string;
  v: number;
  sub?: string;
}

export interface DonneesCamembert {
  titre?: string;
  unite?: string;
  segments: SegmentCamembert[];
}

const R = 100;
const CX = 110;
const CY = 110;

function arc(debut: number, fin: number) {
  const p = (a: number) => [CX + R * Math.cos(a), CY + R * Math.sin(a)] as const;
  const [x1, y1] = p(debut);
  const [x2, y2] = p(fin);
  const grand = fin - debut > Math.PI ? 1 : 0;
  return `M${CX} ${CY}L${x1.toFixed(1)} ${y1.toFixed(1)}A${R} ${R} 0 ${grand} 1 ${x2.toFixed(1)} ${y2.toFixed(1)}Z`;
}

/** Camembert cliquable : on répond en désignant une part. */
export function Camembert({
  donnees,
  selection,
  onSelect,
  bonneCible,
  corrige,
}: {
  donnees: DonneesCamembert;
  selection: number | null;
  onSelect: (i: number) => void;
  bonneCible?: number;
  corrige: boolean;
}) {
  const { segments, unite = "", titre } = donnees;
  const total = segments.reduce((s, x) => s + x.v, 0) || 1;

  let angle = -Math.PI / 2;
  const parts = segments.map((s) => {
    const debut = angle;
    angle += (s.v / total) * Math.PI * 2;
    const milieu = (debut + angle) / 2;
    return { ...s, d: arc(debut, angle), milieu, part: (s.v / total) * 100 };
  });

  const couleur = (i: number) => {
    if (corrige) {
      if (i === bonneCible) return "var(--color-success)";
      if (i === selection) return "var(--color-destructive)";
      return "var(--color-elevated)";
    }
    if (i === selection) return "var(--color-primary)";
    return `color-mix(in oklab, var(--color-primary) ${8 + i * 9}%, var(--color-elevated))`;
  };

  return (
    <div className="trame-plan space-y-3 rounded-2xl border border-border p-4">
      {titre && (
        <p className="text-[0.68rem] tracking-[0.15em] text-muted-foreground uppercase">{titre}</p>
      )}

      <div className="grid gap-4 sm:grid-cols-[220px_minmax(0,1fr)] sm:items-center">
        <svg viewBox="0 0 220 220" className="mx-auto h-auto w-[200px] max-w-full select-none">
          {parts.map((p, i) => (
            <path
              key={i}
              d={p.d}
              role="button"
              aria-label={p.l}
              tabIndex={corrige ? -1 : 0}
              onClick={() => !corrige && onSelect(i)}
              onKeyDown={(e) => {
                if (!corrige && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  onSelect(i);
                }
              }}
              fill={couleur(i)}
              stroke="var(--color-plan-line)"
              strokeWidth={selection === i || (corrige && i === bonneCible) ? 3 : 1.4}
              className={cn("outline-none transition-[fill]", !corrige && "cursor-pointer")}
            />
          ))}
          {parts.map((p, i) =>
            p.part >= 7 ? (
              <text
                key={`v-${i}`}
                x={CX + R * 0.62 * Math.cos(p.milieu)}
                y={CY + R * 0.62 * Math.sin(p.milieu) + 4}
                textAnchor="middle"
                fontSize={13}
                pointerEvents="none"
                className="font-semibold"
                fill={
                  (corrige && (i === bonneCible || i === selection)) || (!corrige && i === selection)
                    ? "var(--color-primary-foreground)"
                    : "var(--color-muted-foreground)"
                }
              >
                {Math.round(p.part)}%
              </text>
            ) : null,
          )}
        </svg>

        <ul className="space-y-1.5">
          {parts.map((p, i) => (
            <li key={i}>
              <button
                type="button"
                disabled={corrige}
                onClick={() => onSelect(i)}
                aria-pressed={selection === i}
                className={cn(
                  "tap flex w-full items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring",
                  corrige && i === bonneCible
                    ? "border-success bg-success/10"
                    : corrige && i === selection
                      ? "border-destructive bg-destructive/10"
                      : selection === i
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card",
                )}
              >
                <span
                  className="h-3 w-3 shrink-0 rounded-full border border-plan-line/50"
                  style={{ backgroundColor: couleur(i) }}
                />
                <span className="min-w-0 flex-1">
                  <span className="block leading-snug">{p.l}</span>
                  {p.sub && <span className="block text-xs text-muted-foreground">{p.sub}</span>}
                </span>
                <span className="shrink-0 tabular-nums text-xs text-muted-foreground">
                  {p.v.toLocaleString("fr-FR")}
                  {unite ? ` ${unite}` : ""}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>

      {!corrige && <p className="text-xs text-muted-foreground">Touchez la part qui répond à la question.</p>}
    </div>
  );
}
