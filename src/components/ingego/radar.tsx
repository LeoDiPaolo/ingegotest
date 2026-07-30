import { cn } from "@/lib/utils";

export interface AxeRadar {
  /** libellé du critère */
  l: string;
  /** note de 0 à max */
  v: number;
}

export interface DonneesRadar {
  titre?: string;
  axes: AxeRadar[];
  /** note maximale de l'échelle (défaut 5) */
  max?: number;
  /** légende de la série tracée */
  serie?: string;
}

const W = 320;
const H = 300;
const CX = W / 2;
const CY = 150;
const R = 96;

/**
 * Radar multicritère cliquable : on répond en désignant un critère
 * (le plus faible, le plus fort, celui à prioriser…).
 */
export function Radar({
  donnees,
  selection,
  onSelect,
  bonneCible,
  corrige,
}: {
  donnees: DonneesRadar;
  selection: number | null;
  onSelect: (i: number) => void;
  bonneCible?: number;
  corrige: boolean;
}) {
  const { axes, titre, max = 5, serie } = donnees;
  const n = axes.length;
  const angle = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const pt = (i: number, r: number) => [CX + Math.cos(angle(i)) * r, CY + Math.sin(angle(i)) * r] as const;

  const polygone = axes.map((a, i) => pt(i, (Math.min(a.v, max) / max) * R).join(",")).join(" ");

  const etat = (i: number) => {
    if (corrige) {
      if (i === bonneCible) return "ok" as const;
      if (i === selection) return "ko" as const;
      return "neutre" as const;
    }
    return i === selection ? ("choisi" as const) : ("neutre" as const);
  };

  const couleur = (e: ReturnType<typeof etat>) =>
    e === "ok"
      ? "var(--success)"
      : e === "ko"
        ? "var(--destructive)"
        : e === "choisi"
          ? "var(--primary)"
          : "var(--muted-foreground)";

  return (
    <div className="trame-plan space-y-2 rounded-2xl border border-border p-3">
      {titre && (
        <p className="px-1 text-[0.68rem] tracking-[0.15em] text-muted-foreground uppercase">
          {titre}
        </p>
      )}
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="group" aria-label={titre ?? "Radar"}>
        {/* toile d'araignée */}
        {Array.from({ length: max }).map((_, k) => {
          const r = (R * (k + 1)) / max;
          return (
            <polygon
              key={k}
              points={axes.map((_, i) => pt(i, r).join(",")).join(" ")}
              fill="none"
              stroke="var(--plan-line)"
              strokeWidth="0.6"
              opacity={k === max - 1 ? 0.6 : 0.28}
            />
          );
        })}
        {axes.map((_, i) => {
          const [x, y] = pt(i, R);
          return <line key={i} x1={CX} y1={CY} x2={x} y2={y} stroke="var(--plan-line)" strokeWidth="0.6" opacity="0.35" />;
        })}

        {/* série */}
        <polygon
          points={polygone}
          fill="color-mix(in oklab, var(--brand) 24%, transparent)"
          stroke="var(--brand)"
          strokeWidth="1.8"
          strokeLinejoin="round"
        />

        {axes.map((a, i) => {
          const e = etat(i);
          const [px, py] = pt(i, (Math.min(a.v, max) / max) * R);
          const [lx, ly] = pt(i, R + 22);
          const ancre = Math.abs(lx - CX) < 12 ? "middle" : lx > CX ? "start" : "end";
          const dx = ancre === "start" ? -4 : ancre === "end" ? 4 : 0;
          return (
            <g
              key={i}
              role="button"
              tabIndex={corrige ? -1 : 0}
              aria-pressed={selection === i}
              aria-label={`${a.l} : ${a.v}/${max}`}
              onClick={() => !corrige && onSelect(i)}
              onKeyDown={(ev) => {
                if (!corrige && (ev.key === "Enter" || ev.key === " ")) {
                  ev.preventDefault();
                  onSelect(i);
                }
              }}
              className={cn(!corrige && "cursor-pointer")}
            >
              {/* zone tactile généreuse */}
              <circle cx={px} cy={py} r="16" fill="transparent" />
              <rect
                x={ancre === "start" ? lx - 8 : ancre === "end" ? lx - 66 : lx - 36}
                y={ly - 12}
                width="74"
                height="28"
                fill="transparent"
              />
              <line x1={px} y1={py} x2={lx} y2={ly - 3} stroke="transparent" strokeWidth="14" />
              <circle
                cx={px}
                cy={py}
                r={e === "neutre" ? 3.4 : 5.4}
                fill={e === "neutre" ? "var(--brand)" : couleur(e)}
                stroke="var(--card)"
                strokeWidth="1.4"
              />
              <text
                x={lx + dx}
                y={ly}
                textAnchor={ancre}
                fontSize="9.5"
                fontWeight={e === "neutre" ? 500 : 700}
                fill={e === "neutre" ? "var(--foreground)" : couleur(e)}
              >
                {a.l}
              </text>
              <text
                x={lx + dx}
                y={ly + 11}
                textAnchor={ancre}
                fontSize="8.5"
                fill="var(--muted-foreground)"
              >
                {a.v}/{max}
              </text>
            </g>
          );
        })}
      </svg>
      <div className="flex items-center justify-between px-1 text-xs text-muted-foreground">
        <span>{serie ?? `Notation sur ${max}`}</span>
        {!corrige && <span>Touchez un critère</span>}
      </div>
    </div>
  );
}
