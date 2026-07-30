import { cn } from "@/lib/utils";
import { IconeMateriau, type CleMateriau } from "./illustrations";

export interface CoucheParoi {
  /** libellé de la couche */
  l: string;
  /** détail court (rôle, épaisseur…) */
  d?: string;
  /** épaisseur relative dans le dessin (1 = fine, 6 = épaisse) */
  e: number;
  /** illustration matière */
  icone: CleMateriau;
  /** teinte : indice de strate 1→5 */
  teinte?: 1 | 2 | 3 | 4 | 5;
}

export interface DonneesParoi {
  titre?: string;
  /** de l'extérieur vers l'intérieur */
  couches: CoucheParoi[];
  exterieur?: string;
  interieur?: string;
  legende?: string;
}

/**
 * Coupe de paroi biosourcée : les couches sont dessinées à l'échelle relative
 * puis reprises en cartouches cliquables. On répond en désignant une couche.
 */
export function CoupeParoi({
  donnees,
  selection,
  onSelect,
  bonneCible,
  corrige,
}: {
  donnees: DonneesParoi;
  selection: number | null;
  onSelect: (i: number) => void;
  bonneCible?: number;
  corrige: boolean;
}) {
  const { titre, couches, exterieur = "Extérieur", interieur = "Intérieur", legende } = donnees;

  const total = couches.reduce((s, c) => s + c.e, 0);
  const L = 300;
  let x = 10;
  const bandes = couches.map((c) => {
    const w = (c.e / total) * (L - 20);
    const b = { x, w };
    x += w;
    return b;
  });

  const etat = (i: number) => {
    if (corrige) {
      if (i === bonneCible) return "ok" as const;
      if (i === selection) return "ko" as const;
      return "neutre" as const;
    }
    return i === selection ? ("choisi" as const) : ("neutre" as const);
  };

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
        aria-label={`Coupe de paroi, de l'extérieur vers l'intérieur : ${couches.map((c) => c.l).join(", ")}`}
      >
        <text x="10" y="14" fontSize="9" fill="var(--muted-foreground)">
          {exterieur}
        </text>
        <text x="310" y="14" fontSize="9" textAnchor="end" fill="var(--muted-foreground)">
          {interieur}
        </text>

        {couches.map((c, i) => {
          const s = etat(i);
          const b = bandes[i];
          return (
            <g key={i} onClick={() => !corrige && onSelect(i)} className={corrige ? "" : "tap"}>
              <rect
                x={b.x}
                y={22}
                width={b.w}
                height={86}
                fill={`var(--strate-${c.teinte ?? ((i % 5) + 1)})`}
                opacity={s === "neutre" ? 0.55 : 0.9}
                stroke={
                  s === "ok"
                    ? "var(--success)"
                    : s === "ko"
                      ? "var(--destructive)"
                      : s === "choisi"
                        ? "var(--primary)"
                        : "var(--border)"
                }
                strokeWidth={s === "neutre" ? 1 : 2.5}
              />
              <text
                x={b.x + b.w / 2}
                y={122}
                fontSize="8.5"
                textAnchor="middle"
                fill="var(--muted-foreground)"
              >
                {i + 1}
              </text>
            </g>
          );
        })}

        {/* trait de sol / arase pour donner l'échelle du dessin */}
        <path d="M10 108h300" stroke="var(--border)" strokeWidth="1.5" />
        <path
          d="M10 132h300"
          stroke="var(--border)"
          strokeWidth="1"
          strokeDasharray="4 4"
          opacity="0.7"
        />
        <text x="160" y="145" fontSize="8" textAnchor="middle" fill="var(--muted-foreground)">
          épaisseurs relatives — coupe horizontale
        </text>
      </svg>

      <ul className="space-y-1.5">
        {couches.map((c, i) => {
          const s = etat(i);
          return (
            <li key={i}>
              <button
                type="button"
                disabled={corrige}
                aria-pressed={selection === i}
                onClick={() => onSelect(i)}
                className={cn(
                  "tap grid w-full grid-cols-[auto_auto_minmax(0,1fr)] items-center gap-2.5 rounded-xl border px-2.5 py-2 text-left transition-colors",
                  s === "neutre" && "border-border bg-card",
                  s === "choisi" && "border-primary bg-primary/15",
                  s === "ok" && "border-success bg-success/15",
                  s === "ko" && "border-destructive bg-destructive/15",
                )}
              >
                <span className="w-4 text-xs font-bold text-muted-foreground">{i + 1}</span>
                <span
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-border text-foreground"
                  style={{ backgroundColor: `var(--strate-${c.teinte ?? ((i % 5) + 1)})` }}
                >
                  <IconeMateriau cle={c.icone} className="h-6 w-6" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm leading-snug font-semibold">{c.l}</span>
                  {c.d && (
                    <span className="block text-xs leading-snug text-muted-foreground">{c.d}</span>
                  )}
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
