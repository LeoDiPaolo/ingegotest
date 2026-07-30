import { cn } from "@/lib/utils";

export type Orientation = "N" | "E" | "S" | "O";

export interface FaceBatiment {
  /** libellé de la façade */
  l: string;
  /** orientation dessinée sur le plan masse */
  o: Orientation;
  /** index de la protection attendue */
  col: number;
  /** précision courte (usage, vitrage…) */
  d?: string;
}

export interface DonneesFacade {
  titre?: string;
  colonnes: string[];
  faces: FaceBatiment[];
  legende?: string;
}

const POS: Record<Orientation, { x: number; y: number; nom: string }> = {
  N: { x: 160, y: 26, nom: "Nord" },
  E: { x: 268, y: 78, nom: "Est" },
  S: { x: 160, y: 132, nom: "Sud" },
  O: { x: 52, y: 78, nom: "Ouest" },
};

/**
 * Plan masse d'un bâtiment avec ses quatre façades et la course du soleil.
 * On répond en associant à chaque façade la protection solaire adaptée.
 */
export function FacadeSolaire({
  donnees,
  reponses,
  onAffecter,
  corrige,
}: {
  donnees: DonneesFacade;
  reponses: Record<string, number>;
  onAffecter: (i: number, col: number) => void;
  corrige: boolean;
}) {
  const { titre, colonnes, faces, legende } = donnees;

  return (
    <div className="trame-plan space-y-3 rounded-2xl border border-border p-3">
      {titre && (
        <p className="px-1 text-[0.68rem] tracking-[0.15em] text-muted-foreground uppercase">
          {titre}
        </p>
      )}

      <svg
        viewBox="0 0 320 182"
        className="h-auto w-full rounded-xl border border-border bg-card"
        role="img"
        aria-label={`Plan masse : ${faces.map((f) => `${f.l} orientée ${POS[f.o].nom}`).join(", ")}`}
      >
        {/* course du soleil : lever à l'est (droite), midi au sud (bas), coucher à l'ouest (gauche) */}
        <path
          d="M36 40A132 132 0 0 0 284 40"
          fill="none"
          stroke="var(--primary)"
          strokeWidth="1.2"
          strokeDasharray="4 5"
          opacity="0.6"
        />
        <g>
          <circle cx="160" cy="164" r="8" fill="var(--primary)" opacity="0.2" />
          <circle cx="160" cy="164" r="4.5" fill="var(--primary)" />
          <text x="174" y="167" fontSize="8" fill="var(--muted-foreground)">
            soleil haut (midi, sud)
          </text>
        </g>
        <text x="12" y="40" fontSize="8" fill="var(--muted-foreground)">
          coucher (ouest)
        </text>
        <text x="308" y="40" fontSize="8" textAnchor="end" fill="var(--muted-foreground)">
          lever (est)
        </text>

        {/* emprise du bâtiment */}
        <rect
          x="98"
          y="46"
          width="124"
          height="64"
          rx="3"
          fill="var(--muted)"
          opacity="0.45"
          stroke="var(--border)"
          strokeWidth="1.5"
        />
        <text x="160" y="82" fontSize="9" textAnchor="middle" fill="var(--muted-foreground)">
          bâtiment
        </text>

        {faces.map((f, i) => {
          const p = POS[f.o];
          const choisi = reponses[i];
          const bon = corrige && choisi === f.col;
          const couleur = corrige
            ? bon
              ? "var(--success)"
              : "var(--destructive)"
            : choisi !== undefined
              ? "var(--primary)"
              : "var(--border)";
          return (
            <g key={i}>
              <circle
                cx={p.x}
                cy={p.y}
                r={11}
                fill="var(--elevated)"
                stroke={couleur}
                strokeWidth={choisi !== undefined || corrige ? 2.5 : 1.2}
              />
              <text
                x={p.x}
                y={p.y + 3.5}
                fontSize="10"
                textAnchor="middle"
                fontWeight="700"
                fill="var(--foreground)"
              >
                {i + 1}
              </text>
              <text
                x={p.x}
                y={p.y + 23}
                fontSize="8.5"
                textAnchor="middle"
                fill="var(--muted-foreground)"
              >
                {p.nom}
              </text>
            </g>
          );
        })}
      </svg>

      <ul className="space-y-2">
        {faces.map((f, i) => {
          const choisi = reponses[i];
          const bon = corrige && choisi === f.col;
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
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border text-xs font-bold">
                  {i + 1}
                </span>
                <p className="min-w-0 text-sm leading-snug">
                  <span className="font-semibold">{f.l}</span>
                  {f.d && (
                    <span className="block text-xs text-muted-foreground">{f.d}</span>
                  )}
                </p>
              </div>

              {corrige ? (
                <p className="mt-2 text-xs text-muted-foreground">→ {colonnes[f.col]}</p>
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
