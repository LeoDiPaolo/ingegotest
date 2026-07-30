import { cn } from "@/lib/utils";

export interface EtapePmr {
  /** libellé court dessiné sur le plan */
  l: string;
  /** cote ou caractéristique affichée sous l'étape */
  cote: string;
  /** exigence de référence rappelée en correction */
  regle?: string;
}

export interface DonneesPmr {
  titre?: string;
  /** étapes du cheminement, de la voirie vers l'intérieur (4 à 6) */
  etapes: EtapePmr[];
  legende?: string;
}

/**
 * Cheminement accessible dessiné en plan : place adaptée, ressaut, rampe,
 * palier, porte, aire de rotation. Chaque station est cliquable ; on répond
 * en désignant l'étape qui ne respecte pas l'exigence.
 */
export function ParcoursPmr({
  donnees,
  selection,
  onSelect,
  bonneCible,
  corrige,
}: {
  donnees: DonneesPmr;
  selection: number | null;
  onSelect: (i: number) => void;
  bonneCible?: number;
  corrige: boolean;
}) {
  const { titre, etapes, legende } = donnees;
  const n = etapes.length;
  const L = 320;
  const marge = 30;
  const pas = (L - marge * 2) / Math.max(1, n - 1);

  const etat = (i: number) => {
    if (corrige) {
      if (i === bonneCible) return "ok" as const;
      if (i === selection) return "ko" as const;
      return "neutre" as const;
    }
    return i === selection ? ("choisi" as const) : ("neutre" as const);
  };

  const trait = (s: ReturnType<typeof etat>) =>
    s === "ok"
      ? "var(--success)"
      : s === "ko"
        ? "var(--destructive)"
        : s === "choisi"
          ? "var(--primary)"
          : "var(--border)";

  return (
    <div className="trame-plan space-y-3 rounded-2xl border border-border p-3">
      {titre && (
        <p className="px-1 text-[0.68rem] tracking-[0.15em] text-muted-foreground uppercase">
          {titre}
        </p>
      )}

      <svg
        viewBox="0 0 320 150"
        className="h-auto w-full rounded-xl border border-border bg-card"
        role="img"
        aria-label={`Cheminement accessible en plan : ${etapes.map((e) => `${e.l} (${e.cote})`).join(", ")}`}
      >
        {/* bande de cheminement */}
        <rect
          x="10"
          y="52"
          width="300"
          height="34"
          rx="4"
          fill="var(--accent)"
          opacity="0.25"
          stroke="var(--border)"
        />
        <text x="160" y="46" fontSize="8" textAnchor="middle" fill="var(--muted-foreground)">
          de la voirie vers le hall d’accueil
        </text>
        <path
          d="M14 69h292"
          stroke="var(--border)"
          strokeWidth="1"
          strokeDasharray="5 4"
          opacity="0.8"
        />
        {/* flèche de sens de parcours */}
        <path
          d="M298 69l-7-4v8z"
          fill="var(--muted-foreground)"
          opacity="0.8"
        />

        {etapes.map((e, i) => {
          const s = etat(i);
          const x = marge + i * pas;
          const ancre = i === 0 ? "start" : i === n - 1 ? "end" : "middle";
          const tx = i === 0 ? 8 : i === n - 1 ? 312 : x;
          return (
            <g key={i} className={corrige ? "" : "tap"} onClick={() => !corrige && onSelect(i)}>
              <circle
                cx={x}
                cy={69}
                r={12}
                fill={s === "neutre" ? "var(--elevated)" : "var(--card)"}
                stroke={trait(s)}
                strokeWidth={s === "neutre" ? 1.2 : 2.5}
              />
              <text
                x={x}
                y={72.5}
                fontSize="10"
                textAnchor="middle"
                fill="var(--foreground)"
                fontWeight="700"
              >
                {i + 1}
              </text>
              <text
                x={tx}
                y={i % 2 === 0 ? 24 : 108}
                fontSize="8.5"
                textAnchor={ancre}
                fill="var(--muted-foreground)"
              >
                {e.l}
              </text>
              <text
                x={tx}
                y={i % 2 === 0 ? 34 : 118}
                fontSize="8.5"
                textAnchor={ancre}
                fill={s === "neutre" ? "var(--foreground)" : trait(s)}
                fontWeight="700"
              >
                {e.cote}
              </text>
            </g>
          );
        })}

        <text x="160" y="144" fontSize="8" textAnchor="middle" fill="var(--muted-foreground)">
          plan schématique — cotes indiquées sous chaque station
        </text>
      </svg>

      <ul className="space-y-1.5">
        {etapes.map((e, i) => {
          const s = etat(i);
          return (
            <li key={i}>
              <button
                type="button"
                disabled={corrige}
                aria-pressed={selection === i}
                onClick={() => onSelect(i)}
                className={cn(
                  "tap grid w-full grid-cols-[auto_minmax(0,1fr)] items-center gap-2.5 rounded-xl border px-2.5 py-2 text-left transition-colors",
                  s === "neutre" && "border-border bg-card",
                  s === "choisi" && "border-primary bg-primary/15",
                  s === "ok" && "border-success bg-success/15",
                  s === "ko" && "border-destructive bg-destructive/15",
                )}
              >
                <span className="flex h-7 w-7 items-center justify-center rounded-full border border-border text-xs font-bold">
                  {i + 1}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm leading-snug font-semibold">{e.l}</span>
                  <span className="block text-xs leading-snug text-muted-foreground">
                    {e.cote}
                    {corrige && e.regle ? ` — ${e.regle}` : ""}
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {legende && <p className="px-1 text-xs text-muted-foreground">{legende}</p>}
    </div>
  );
}
