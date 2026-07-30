import { cn } from "@/lib/utils";

export type CleOuvrage = "noue" | "toiture-vegetalisee" | "puits" | "cuve" | "chaussee" | "bassin";

/** Petites vignettes d'ouvrages de gestion des eaux pluviales (boîte 48×48). */
export function IconeOuvrage({ cle, className }: { cle: CleOuvrage; className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} role="presentation" aria-hidden="true">
      {cle === "noue" && (
        <g stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round">
          <path d="M4 16c6 0 10 16 20 16s14-16 20-16" />
          <path d="M4 24c6 0 10 14 20 14s14-14 20-14" fill="currentColor" opacity="0.15" />
          <path d="M14 38v5M24 40v5M34 38v5" opacity="0.7" />
        </g>
      )}
      {cle === "toiture-vegetalisee" && (
        <g stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round">
          <path d="M8 26h32v14H8z" fill="currentColor" opacity="0.1" />
          <path d="M8 26h32v14H8z" />
          <path d="M10 26c2-5 6-5 8 0M22 26c2-6 6-6 8 0M32 26c2-4 5-4 6 0" />
        </g>
      )}
      {cle === "puits" && (
        <g stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round">
          <ellipse cx="24" cy="14" rx="10" ry="4" />
          <path d="M14 14v22M34 14v22" />
          <path d="M14 36c0 3 20 3 20 0" />
          <path d="M24 20v10M20 26l4 5 4-5" opacity="0.8" />
        </g>
      )}
      {cle === "cuve" && (
        <g stroke="currentColor" strokeWidth="1.6" fill="none">
          <rect x="10" y="12" width="28" height="28" rx="4" fill="currentColor" opacity="0.1" />
          <rect x="10" y="12" width="28" height="28" rx="4" />
          <path d="M10 28c5 4 9-4 14 0s9 4 14 0" />
          <path d="M24 4v8" strokeLinecap="round" />
        </g>
      )}
      {cle === "chaussee" && (
        <g stroke="currentColor" strokeWidth="1.6" fill="none">
          <rect x="5" y="14" width="38" height="6" rx="1" fill="currentColor" opacity="0.2" />
          <rect x="5" y="20" width="38" height="16" rx="1" />
          <circle cx="13" cy="26" r="2" />
          <circle cx="22" cy="30" r="2" />
          <circle cx="31" cy="25" r="2" />
          <circle cx="38" cy="30" r="2" />
        </g>
      )}
      {cle === "bassin" && (
        <g stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round">
          <path d="M6 18l6 20h24l6-20z" fill="currentColor" opacity="0.12" />
          <path d="M6 18l6 20h24l6-20z" />
          <path d="M12 28h24" />
          <path d="M36 33h8" />
        </g>
      )}
    </svg>
  );
}

export interface OuvragePluvial {
  /** libellé de l'ouvrage */
  l: string;
  /** vignette */
  icone: CleOuvrage;
  /** index de la filière attendue */
  col: number;
}

export interface DonneesPluvial {
  titre?: string;
  colonnes: string[];
  ouvrages: OuvragePluvial[];
  legende?: string;
}

/**
 * Plan de parcelle dessiné (bâtiment, noue, chaussée, exutoire) puis liste
 * illustrée d'ouvrages à orienter vers la bonne filière de gestion des eaux
 * pluviales à la parcelle.
 */
export function PlanPluvial({
  donnees,
  reponses,
  onAffecter,
  corrige,
}: {
  donnees: DonneesPluvial;
  reponses: Record<string, number>;
  onAffecter: (i: number, col: number) => void;
  corrige: boolean;
}) {
  const { titre, colonnes, ouvrages, legende } = donnees;

  return (
    <div className="trame-plan space-y-3 rounded-2xl border border-border p-3">
      {titre && (
        <p className="px-1 text-[0.68rem] tracking-[0.15em] text-muted-foreground uppercase">
          {titre}
        </p>
      )}

      <svg
        viewBox="0 0 320 130"
        className="h-auto w-full rounded-xl border border-border bg-card"
        role="img"
        aria-label="Plan de parcelle : bâtiment à toiture végétalisée, noue paysagère, chaussée à structure réservoir et exutoire régulé"
      >
        <rect x="0" y="0" width="320" height="130" fill="var(--elevated)" />
        {/* limite de parcelle */}
        <rect
          x="8"
          y="8"
          width="304"
          height="114"
          rx="3"
          fill="none"
          stroke="var(--border)"
          strokeDasharray="6 4"
        />

        {/* bâtiment + toiture végétalisée */}
        <rect x="24" y="26" width="96" height="52" rx="2" fill="var(--muted)" opacity="0.6" />
        <rect x="24" y="26" width="96" height="52" rx="2" fill="none" stroke="var(--border)" />
        <g stroke="var(--success)" strokeWidth="1.4" fill="none" opacity="0.9">
          {[0, 1, 2, 3, 4].map((i) => (
            <path key={i} d={`M${34 + i * 18} 44c3-8 8-8 11 0`} />
          ))}
        </g>
        <text x="72" y="70" fontSize="8.5" textAnchor="middle" fill="var(--muted-foreground)">
          toiture végétalisée
        </text>

        {/* noue paysagère */}
        <path
          d="M132 34c34 6 34 46 68 52"
          stroke="var(--primary)"
          strokeWidth="9"
          fill="none"
          opacity="0.3"
          strokeLinecap="round"
        />
        <path
          d="M132 34c34 6 34 46 68 52"
          stroke="var(--primary)"
          strokeWidth="1.4"
          fill="none"
          strokeDasharray="5 4"
        />
        <text x="150" y="28" fontSize="8.5" fill="var(--muted-foreground)">
          noue d’infiltration
        </text>

        {/* chaussée à structure réservoir */}
        <rect x="200" y="24" width="96" height="30" rx="2" fill="var(--accent)" opacity="0.3" />
        <rect x="200" y="24" width="96" height="30" rx="2" fill="none" stroke="var(--border)" />
        <g fill="var(--muted-foreground)" opacity="0.6">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <circle key={i} cx={210 + i * 16} cy={44} r="2.2" />
          ))}
        </g>
        <text x="248" y="20" fontSize="8.5" textAnchor="middle" fill="var(--muted-foreground)">
          chaussée réservoir
        </text>

        {/* exutoire régulé */}
        <circle cx="288" cy="96" r="10" fill="var(--card)" stroke="var(--border)" strokeWidth="1.4" />
        <path d="M283 96h10M288 91v10" stroke="var(--muted-foreground)" strokeWidth="1.4" />
        <text x="288" y="118" fontSize="8" textAnchor="middle" fill="var(--muted-foreground)">
          débit de fuite
        </text>
      </svg>

      <ul className="space-y-2">
        {ouvrages.map((o, i) => {
          const choisi = reponses[i];
          const bon = corrige && choisi === o.col;
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
                <span
                  className={cn(
                    "flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border",
                    corrige
                      ? bon
                        ? "border-success/50 bg-success/15 text-success"
                        : "border-destructive/50 bg-destructive/15 text-destructive"
                      : "border-border bg-elevated text-primary",
                  )}
                >
                  <IconeOuvrage cle={o.icone} className="h-7 w-7" />
                </span>
                <p className="min-w-0 text-sm leading-snug">{o.l}</p>
              </div>

              {corrige ? (
                <p className="mt-2 text-xs text-muted-foreground">→ {colonnes[o.col]}</p>
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
