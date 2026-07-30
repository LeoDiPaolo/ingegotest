import { cn } from "@/lib/utils";

export type MotifStrate = "remblai" | "argile" | "sable" | "grave" | "rocher";

export interface Strate {
  /** nom de la couche, ex. « Argile plastique » */
  l: string;
  /** épaisseur en mètres */
  ep: number;
  motif: MotifStrate;
  /** annotation courte affichée à droite, ex. « nappe » */
  note?: string;
}

export interface DonneesCoupe {
  titre?: string;
  strates: Strate[];
  /** profondeur de la nappe phréatique en mètres (optionnel) */
  nappe?: number;
  /** légende de l'axe des profondeurs */
  uniteProfondeur?: string;
}

const TEINTE: Record<MotifStrate, string> = {
  remblai: "var(--strate-1)",
  argile: "var(--strate-2)",
  sable: "var(--strate-3)",
  grave: "var(--strate-4)",
  rocher: "var(--strate-5)",
};

const W = 320;
const X0 = 46; // marge gauche (axe des profondeurs)
const X1 = 300;
const Y0 = 26; // niveau du terrain naturel

/** Motifs de hachures normalisés, inspirés des coupes géotechniques. */
function Motifs() {
  return (
    <defs>
      <pattern id="mt-remblai" width="10" height="10" patternUnits="userSpaceOnUse">
        <path d="M0 8 l4 -4 l4 4" fill="none" stroke="var(--plan-line)" strokeWidth="0.7" opacity="0.55" />
      </pattern>
      <pattern id="mt-argile" width="12" height="8" patternUnits="userSpaceOnUse">
        <path d="M0 4 h6 M8 8 h4" fill="none" stroke="var(--plan-line)" strokeWidth="0.8" opacity="0.5" />
      </pattern>
      <pattern id="mt-sable" width="9" height="9" patternUnits="userSpaceOnUse">
        <circle cx="2" cy="2" r="0.9" fill="var(--plan-line)" opacity="0.5" />
        <circle cx="6.5" cy="6" r="0.9" fill="var(--plan-line)" opacity="0.5" />
      </pattern>
      <pattern id="mt-grave" width="14" height="12" patternUnits="userSpaceOnUse">
        <circle cx="4" cy="4" r="2.2" fill="none" stroke="var(--plan-line)" strokeWidth="0.8" opacity="0.5" />
        <circle cx="10" cy="9" r="1.6" fill="none" stroke="var(--plan-line)" strokeWidth="0.8" opacity="0.5" />
      </pattern>
      <pattern id="mt-rocher" width="12" height="12" patternUnits="userSpaceOnUse">
        <path d="M0 12 L12 0 M-3 3 L3 -3 M9 15 L15 9" stroke="var(--plan-line)" strokeWidth="0.8" opacity="0.5" />
      </pattern>
    </defs>
  );
}

/**
 * Coupe géotechnique cliquable : on répond en désignant une couche de sol.
 * Échelle verticale proportionnelle aux épaisseurs réelles.
 */
export function CoupeSol({
  donnees,
  selection,
  onSelect,
  bonneCible,
  corrige,
}: {
  donnees: DonneesCoupe;
  selection: number | null;
  onSelect: (i: number) => void;
  bonneCible?: number;
  corrige: boolean;
}) {
  const { strates, titre, nappe, uniteProfondeur = "Profondeur (m/TN)" } = donnees;
  const total = strates.reduce((s, c) => s + c.ep, 0);
  const HAUT = Math.max(210, Math.min(340, strates.length * 54));
  const ech = HAUT / total;
  const H = Y0 + HAUT + 30;

  const bornes: { y: number; h: number; prof: number }[] = [];
  let cur = Y0;
  let prof = 0;
  for (const s of strates) {
    const h = s.ep * ech;
    bornes.push({ y: cur, h, prof });
    cur += h;
    prof += s.ep;
  }

  const etat = (i: number) => {
    if (corrige) {
      if (i === bonneCible) return "ok" as const;
      if (i === selection) return "ko" as const;
      return "neutre" as const;
    }
    return i === selection ? ("choisi" as const) : ("neutre" as const);
  };

  const contour = (e: ReturnType<typeof etat>) =>
    e === "ok"
      ? "var(--success)"
      : e === "ko"
        ? "var(--destructive)"
        : e === "choisi"
          ? "var(--primary)"
          : "var(--plan-line)";

  return (
    <div className="trame-plan space-y-2 rounded-2xl border border-border p-3">
      {titre && (
        <p className="px-1 text-[0.68rem] tracking-[0.15em] text-muted-foreground uppercase">
          {titre}
        </p>
      )}
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="group" aria-label={titre ?? "Coupe de sol"}>
        <Motifs />

        {/* Terrain naturel */}
        <line x1={X0 - 8} y1={Y0} x2={X1} y2={Y0} stroke="var(--plan-line)" strokeWidth="1.4" />
        <text x={X0} y={Y0 - 9} fontSize="9" fill="var(--muted-foreground)" letterSpacing="0.08em">
          TERRAIN NATUREL
        </text>
        {/* Symbole tarière de sondage */}
        <g opacity="0.75">
          <line x1={X1 - 12} y1={Y0 - 14} x2={X1 - 12} y2={Y0 + HAUT * 0.82} stroke="var(--brand)" strokeWidth="1.6" />
          <path
            d={Array.from({ length: 7 })
              .map((_, k) => `M${X1 - 17} ${Y0 + k * 18 + 6} q5 6 10 0`)
              .join(" ")}
            fill="none"
            stroke="var(--brand)"
            strokeWidth="1.2"
          />
        </g>

        {strates.map((s, i) => {
          const b = bornes[i];
          const e = etat(i);
          const interactif = !corrige;
          return (
            <g
              key={i}
              role="button"
              tabIndex={corrige ? -1 : 0}
              aria-pressed={selection === i}
              aria-label={s.l}
              onClick={() => !corrige && onSelect(i)}
              onKeyDown={(ev) => {
                if (!corrige && (ev.key === "Enter" || ev.key === " ")) {
                  ev.preventDefault();
                  onSelect(i);
                }
              }}
              className={cn(interactif && "cursor-pointer")}
            >
              <rect x={X0} y={b.y} width={X1 - X0} height={b.h} fill={TEINTE[s.motif]} opacity="0.55" />
              <rect x={X0} y={b.y} width={X1 - X0} height={b.h} fill={`url(#mt-${s.motif})`} />
              <rect
                x={X0}
                y={b.y}
                width={X1 - X0}
                height={b.h}
                fill={
                  e === "ok"
                    ? "color-mix(in oklab, var(--success) 22%, transparent)"
                    : e === "ko"
                      ? "color-mix(in oklab, var(--destructive) 22%, transparent)"
                      : e === "choisi"
                        ? "color-mix(in oklab, var(--primary) 18%, transparent)"
                        : "transparent"
                }
                stroke={contour(e)}
                strokeWidth={e === "neutre" ? 0.9 : 2}
              />
              <text
                x={X0 + 10}
                y={b.y + 15}
                fontSize="11"
                fontWeight={e === "neutre" ? 500 : 700}
                fill="var(--foreground)"
              >
                {s.l}
              </text>
              {s.note && (
                <text x={X0 + 10} y={b.y + 27} fontSize="8.5" fill="var(--muted-foreground)">
                  {s.note}
                </text>
              )}
              {/* cote de profondeur */}
              <text x={X0 - 6} y={b.y + 4} fontSize="8.5" textAnchor="end" fill="var(--muted-foreground)">
                {b.prof.toFixed(b.prof % 1 ? 1 : 0)}
              </text>
            </g>
          );
        })}

        {nappe !== undefined && nappe <= total && (
          <g>
            <line
              x1={X0}
              y1={Y0 + nappe * ech}
              x2={X1}
              y2={Y0 + nappe * ech}
              stroke="var(--primary)"
              strokeWidth="1.4"
              strokeDasharray="6 3"
            />
            <path
              d={`M${X1 - 30} ${Y0 + nappe * ech - 8} l5 6 h-10 z`}
              fill="var(--primary)"
              opacity="0.85"
            />
            <text
              x={X1 - 26}
              y={Y0 + nappe * ech - 4}
              fontSize="8.5"
              textAnchor="end"
              fill="var(--primary)"
            >
              nappe {nappe} m
            </text>
          </g>
        )}

        {/* fond de coupe */}
        <text x={X0 - 6} y={Y0 + HAUT + 4} fontSize="8.5" textAnchor="end" fill="var(--muted-foreground)">
          {total.toFixed(total % 1 ? 1 : 0)}
        </text>
        <line x1={X0} y1={Y0} x2={X0} y2={Y0 + HAUT} stroke="var(--plan-line)" strokeWidth="1" />

        <text x={X0} y={H - 8} fontSize="8.5" fill="var(--muted-foreground)" letterSpacing="0.06em">
          {uniteProfondeur}
        </text>
      </svg>
      {!corrige && (
        <p className="px-1 text-xs text-muted-foreground">Touchez la couche qui répond à la question.</p>
      )}
    </div>
  );
}
