import { cn } from "@/lib/utils";

export type PrimitiveSchema =
  | { k: "mur"; x: number; y: number; w: number; h: number }
  | { k: "couche"; x: number; y: number; w: number; h: number; l?: string; t?: number }
  | { k: "trait"; x: number; y: number; w: number; h: number; l?: string }
  | { k: "cercle"; x: number; y: number; r: number; l?: string }
  | { k: "texte"; x: number; y: number; l: string; a?: "start" | "middle" | "end" };

export interface CibleSchema {
  x: number;
  y: number;
  w: number;
  h: number;
  l: string;
  sub?: string;
}

export interface DonneesSchema {
  titre?: string;
  w: number;
  h: number;
  decor?: PrimitiveSchema[];
  cibles: CibleSchema[];
}

/** Plan ou coupe schématique en SVG, avec zones cliquables. */
export function SchemaPlan({
  donnees,
  selection,
  onSelect,
  bonneCible,
  corrige,
}: {
  donnees: DonneesSchema;
  selection: number | null;
  onSelect: (i: number) => void;
  bonneCible?: number;
  corrige: boolean;
}) {
  const { w, h, decor = [], cibles, titre } = donnees;

  const traitCible = (i: number) => {
    if (corrige) {
      if (i === bonneCible) return "var(--color-success)";
      if (i === selection) return "var(--color-destructive)";
      return "transparent";
    }
    return i === selection ? "var(--color-primary)" : "color-mix(in oklab, var(--color-plan-line) 45%, transparent)";
  };
  const fondCible = (i: number) => {
    if (corrige) {
      if (i === bonneCible) return "color-mix(in oklab, var(--color-success) 22%, transparent)";
      if (i === selection) return "color-mix(in oklab, var(--color-destructive) 22%, transparent)";
      return "transparent";
    }
    return i === selection ? "color-mix(in oklab, var(--color-primary) 20%, transparent)" : "transparent";
  };

  const nom = cibles[selection ?? -1]?.l ?? null;

  return (
    <div className="space-y-2">
      {titre && (
        <p className="text-[0.68rem] tracking-[0.15em] text-muted-foreground uppercase">{titre}</p>
      )}

      <div className="trame-plan overflow-hidden rounded-2xl border border-border p-2">
        <svg viewBox={`0 0 ${w} ${h}`} className="h-auto w-full select-none" role="group" aria-label={titre ?? "Schéma"}>
          {decor.map((e, i) => {
            if (e.k === "mur")
              return <rect key={i} x={e.x} y={e.y} width={e.w} height={e.h} fill="var(--color-plan-line)" />;
            if (e.k === "couche")
              return (
                <g key={i}>
                  <rect
                    x={e.x}
                    y={e.y}
                    width={e.w}
                    height={e.h}
                    fill={`color-mix(in oklab, var(--color-plan-line) ${e.t ?? 12}%, transparent)`}
                    stroke="var(--color-plan-line)"
                    strokeWidth={1}
                  />
                  {e.l && (
                    <text
                      x={e.x + e.w / 2}
                      y={e.y + e.h / 2 + 4}
                      textAnchor="middle"
                      fontSize={12}
                      fill="var(--color-foreground)"
                    >
                      {e.l}
                    </text>
                  )}
                </g>
              );
            if (e.k === "trait")
              return (
                <g key={i}>
                  <line
                    x1={e.x}
                    y1={e.y}
                    x2={e.x + e.w}
                    y2={e.y + e.h}
                    stroke="var(--color-plan-line)"
                    strokeWidth={1}
                    strokeDasharray="5 4"
                  />
                  {e.l && (
                    <text
                      x={e.x + e.w / 2}
                      y={e.y + e.h / 2 - 5}
                      textAnchor="middle"
                      fontSize={11}
                      fill="var(--color-muted-foreground)"
                    >
                      {e.l}
                    </text>
                  )}
                </g>
              );
            if (e.k === "cercle")
              return (
                <g key={i}>
                  <circle
                    cx={e.x}
                    cy={e.y}
                    r={e.r}
                    fill="none"
                    stroke="var(--color-plan-line)"
                    strokeWidth={1}
                    strokeDasharray="4 4"
                  />
                  {e.l && (
                    <text
                      x={e.x}
                      y={e.y - e.r + 16}
                      textAnchor="middle"
                      fontSize={11}
                      fill="var(--color-muted-foreground)"
                    >
                      {e.l}
                    </text>
                  )}
                </g>
              );
            return (
              <text
                key={i}
                x={e.x}
                y={e.y}
                textAnchor={e.a ?? "start"}
                fontSize={12}
                fill="var(--color-muted-foreground)"
              >
                {e.l}
              </text>
            );
          })}

          {cibles.map((c, i) => (
            <g key={`c-${i}`}>
              <rect
                x={c.x}
                y={c.y}
                width={c.w}
                height={c.h}
                rx={6}
                role="button"
                aria-label={c.l}
                aria-pressed={selection === i}
                tabIndex={corrige ? -1 : 0}
                onClick={() => !corrige && onSelect(i)}
                onKeyDown={(e) => {
                  if (!corrige && (e.key === "Enter" || e.key === " ")) {
                    e.preventDefault();
                    onSelect(i);
                  }
                }}
                fill={fondCible(i)}
                stroke={traitCible(i)}
                strokeWidth={2}
                strokeDasharray={corrige ? undefined : "6 4"}
                className={cn("outline-none transition-[fill,stroke]", !corrige && "cursor-pointer")}
              />
              <text
                x={c.x + c.w / 2}
                y={c.y + c.h / 2 + 4}
                textAnchor="middle"
                fontSize={12}
                pointerEvents="none"
                className="font-semibold"
                fill="var(--color-foreground)"
              >
                {c.l}
              </text>
            </g>
          ))}
        </svg>
      </div>

      <p className="min-h-[1.25rem] text-center text-sm">
        {nom ? (
          <span className="font-semibold">
            {nom}
            {cibles[selection ?? -1]?.sub ? ` — ${cibles[selection ?? -1]?.sub}` : ""}
          </span>
        ) : (
          <span className="text-muted-foreground">Touchez la zone qui répond à la question</span>
        )}
      </p>
    </div>
  );
}
