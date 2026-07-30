import type { ReactElement } from "react";
import { cn } from "@/lib/utils";

export interface EquipementSyn {
  l: string;
  sub?: string;
  /** icône symbolique dessinée en SVG */
  icone?: "chauffage" | "eclairage" | "ventilation" | "securite" | "compteur" | "solaire";
  /** nœud de contexte non cliquable */
  fixe?: boolean;
}

export interface DonneesSynoptique {
  titre?: string;
  /** libellé de l'automate central */
  hub: string;
  hubSub?: string;
  equipements: EquipementSyn[];
}

const W = 320;
const HUB_W = 108;
const HUB_H = 46;
const CARD_W = 96;
const CARD_H = 44;

/** Petits pictogrammes vectoriels tracés au trait. */
function Icone({ type, x, y }: { type: NonNullable<EquipementSyn["icone"]>; x: number; y: number }) {
  const s = "var(--brand)";
  const p: Record<string, ReactElement> = {
    chauffage: (
      <g stroke={s} strokeWidth="1.3" fill="none">
        <rect x={-5} y={-5} width={10} height={10} rx="1.5" />
        <path d="M-2 -5 v10 M2 -5 v10" />
      </g>
    ),
    eclairage: (
      <g stroke={s} strokeWidth="1.3" fill="none">
        <circle cx="0" cy="-1" r="4" />
        <path d="M-2 4 h4 M-1.5 6 h3" />
      </g>
    ),
    ventilation: (
      <g stroke={s} strokeWidth="1.3" fill="none">
        <circle cx="0" cy="0" r="5" />
        <path d="M0 0 l0 -5 M0 0 l4.3 2.5 M0 0 l-4.3 2.5" />
      </g>
    ),
    securite: (
      <g stroke={s} strokeWidth="1.3" fill="none">
        <path d="M0 -5 l4.5 2 v4 q0 3.5 -4.5 5 q-4.5 -1.5 -4.5 -5 v-4 z" />
      </g>
    ),
    compteur: (
      <g stroke={s} strokeWidth="1.3" fill="none">
        <circle cx="0" cy="0" r="5" />
        <path d="M0 0 l3 -2.5" />
      </g>
    ),
    solaire: (
      <g stroke={s} strokeWidth="1.3" fill="none">
        <path d="M-5 4 l2.5 -8 h5 l2.5 8 z M-3.5 0 h7" />
      </g>
    ),
  };
  return <g transform={`translate(${x} ${y})`}>{p[type]}</g>;
}

/**
 * Synoptique de supervision (GTB/BACS) : un automate central relié à des
 * équipements cliquables, en deux colonnes pour rester lisible sur mobile.
 */
export function Synoptique({
  donnees,
  selection,
  onSelect,
  bonneCible,
  corrige,
}: {
  donnees: DonneesSynoptique;
  selection: number | null;
  onSelect: (i: number) => void;
  bonneCible?: number;
  corrige: boolean;
}) {
  const { titre, hub, hubSub, equipements } = donnees;
  const lignes = Math.ceil(equipements.length / 2);
  const PAS = CARD_H + 20;
  const HAUT_COL = lignes * PAS;
  const H = 34 + HAUT_COL + 16;
  const hubY = 34 + HAUT_COL / 2 - HUB_H / 2;
  const hubX = W / 2 - HUB_W / 2;

  const pos = (i: number) => {
    const col = i % 2; // 0 = gauche, 1 = droite
    const rang = Math.floor(i / 2);
    const x = col === 0 ? 6 : W - 6 - CARD_W;
    const y = 34 + rang * PAS + (PAS - CARD_H) / 2;
    return { x, y, col };
  };

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
          : "var(--border)";

  const remplissage = (e: ReturnType<typeof etat>) =>
    e === "ok"
      ? "color-mix(in oklab, var(--success) 16%, var(--card))"
      : e === "ko"
        ? "color-mix(in oklab, var(--destructive) 16%, var(--card))"
        : e === "choisi"
          ? "color-mix(in oklab, var(--primary) 14%, var(--card))"
          : "var(--card)";

  return (
    <div className="trame-plan space-y-2 rounded-2xl border border-border p-3">
      {titre && (
        <p className="px-1 text-[0.68rem] tracking-[0.15em] text-muted-foreground uppercase">
          {titre}
        </p>
      )}
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="group" aria-label={titre ?? "Synoptique"}>
        {/* bus de terrain */}
        {equipements.map((_, i) => {
          const { x, y, col } = pos(i);
          const cy = y + CARD_H / 2;
          const xDepart = col === 0 ? x + CARD_W : x;
          const xPivot = col === 0 ? W / 2 - HUB_W / 2 - 12 : W / 2 + HUB_W / 2 + 12;
          const xHub = col === 0 ? hubX : hubX + HUB_W;
          return (
            <g key={`l${i}`} opacity="0.75">
              <path
                d={`M${xDepart} ${cy} H${xPivot} V${hubY + HUB_H / 2} H${xHub}`}
                fill="none"
                stroke="var(--plan-line)"
                strokeWidth="1"
                strokeDasharray="3 3"
              />
              <circle cx={xDepart} cy={cy} r="1.8" fill="var(--plan-line)" />
            </g>
          );
        })}

        {/* automate central */}
        <g>
          <rect
            x={hubX}
            y={hubY}
            width={HUB_W}
            height={HUB_H}
            rx="8"
            fill="var(--primary)"
            stroke="var(--primary)"
          />
          {/* broches façon microcontrôleur */}
          {Array.from({ length: 5 }).map((_, k) => (
            <rect
              key={k}
              x={hubX + 14 + k * 20}
              y={hubY - 4}
              width="8"
              height="4"
              rx="1"
              fill="var(--brand)"
            />
          ))}
          <text
            x={W / 2}
            y={hubSub ? hubY + 20 : hubY + 27}
            textAnchor="middle"
            fontSize="12"
            fontWeight="700"
            fill="var(--primary-foreground)"
          >
            {hub}
          </text>
          {hubSub && (
            <text
              x={W / 2}
              y={hubY + 33}
              textAnchor="middle"
              fontSize="8.5"
              fill="var(--primary-foreground)"
              opacity="0.85"
            >
              {hubSub}
            </text>
          )}
        </g>

        {equipements.map((eq, i) => {
          const { x, y } = pos(i);
          const e = etat(i);
          const cliquable = !corrige && !eq.fixe;
          return (
            <g
              key={i}
              role={eq.fixe ? undefined : "button"}
              tabIndex={cliquable ? 0 : -1}
              aria-pressed={selection === i}
              aria-label={eq.l}
              onClick={() => cliquable && onSelect(i)}
              onKeyDown={(ev) => {
                if (cliquable && (ev.key === "Enter" || ev.key === " ")) {
                  ev.preventDefault();
                  onSelect(i);
                }
              }}
              className={cn(cliquable && "cursor-pointer")}
            >
              <rect
                x={x}
                y={y}
                width={CARD_W}
                height={CARD_H}
                rx="8"
                fill={remplissage(e)}
                stroke={contour(e)}
                strokeWidth={e === "neutre" ? 1 : 2}
              />
              {eq.icone && <Icone type={eq.icone} x={x + 13} y={y + CARD_H / 2} />}
              <text
                x={x + (eq.icone ? 25 : 8)}
                y={eq.sub ? y + 19 : y + CARD_H / 2 + 3}
                fontSize="9.5"
                fontWeight="600"
                fill="var(--foreground)"
              >
                {eq.l}
              </text>
              {eq.sub && (
                <text
                  x={x + (eq.icone ? 25 : 8)}
                  y={y + 31}
                  fontSize="8"
                  fill="var(--muted-foreground)"
                >
                  {eq.sub}
                </text>
              )}
            </g>
          );
        })}
      </svg>
      {!corrige && (
        <p className="px-1 text-xs text-muted-foreground">Touchez l'équipement attendu sur le synoptique.</p>
      )}
    </div>
  );
}
