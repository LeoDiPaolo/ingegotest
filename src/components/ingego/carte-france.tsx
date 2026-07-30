import { useMemo, useState } from "react";
import { CARTE_VIEWBOX, DEPARTEMENTS, REGIONS, type ZoneCarte } from "@/data/carte-france";
import { cn } from "@/lib/utils";

export type EchelleCarte = "regions" | "departements";

export function zonesDe(echelle: EchelleCarte): ZoneCarte[] {
  return echelle === "departements" ? DEPARTEMENTS : REGIONS;
}

export function nomZone(echelle: EchelleCarte, code: string | null): string | null {
  if (!code) return null;
  return zonesDe(echelle).find((z) => z.code === code)?.nom ?? null;
}

/** Carte de France métropolitaine cliquable : régions ou départements. */
export function CarteFrance({
  echelle,
  selection,
  onSelect,
  bonneZone,
  corrige,
  codesAutorises,
}: {
  echelle: EchelleCarte;
  selection: string | null;
  onSelect: (code: string) => void;
  bonneZone?: string;
  corrige: boolean;
  codesAutorises?: string[];
}) {
  const [survol, setSurvol] = useState<string | null>(null);

  const zones = useMemo(() => {
    const toutes = zonesDe(echelle);
    if (!codesAutorises?.length) return toutes;
    const set = new Set(codesAutorises);
    return toutes.filter((z) => set.has(z.code));
  }, [echelle, codesAutorises]);

  const actif = survol ?? selection;
  const nomActif = zones.find((z) => z.code === actif)?.nom ?? null;

  const remplissage = (code: string) => {
    if (corrige) {
      if (code === bonneZone) return "var(--color-success)";
      if (code === selection) return "var(--color-destructive)";
      return "var(--color-elevated)";
    }
    if (code === selection) return "var(--color-primary)";
    if (code === survol) return "color-mix(in oklab, var(--color-primary) 30%, var(--color-elevated))";
    return "var(--color-elevated)";
  };

  const contraste = (code: string) =>
    (corrige && (code === bonneZone || code === selection)) || (!corrige && code === selection);

  return (
    <div className="space-y-2">
      <div className="trame-plan overflow-hidden rounded-2xl border border-border p-1">
        <svg
          viewBox={CARTE_VIEWBOX}
          role="group"
          aria-label={`Carte de France — ${echelle === "regions" ? "régions" : "départements"}`}
          className="h-auto w-full touch-manipulation select-none"
        >
          {zones.map((z) => (
            <path
              key={z.code}
              d={z.d}
              tabIndex={corrige ? -1 : 0}
              role="button"
              aria-label={z.nom}
              aria-pressed={selection === z.code}
              onClick={() => !corrige && onSelect(z.code)}
              onKeyDown={(e) => {
                if (corrige) return;
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  onSelect(z.code);
                }
              }}
              onPointerEnter={() => setSurvol(z.code)}
              onPointerLeave={() => setSurvol((s) => (s === z.code ? null : s))}
              fill={remplissage(z.code)}
              stroke="var(--color-plan-line)"
              strokeWidth={contraste(z.code) ? 3 : 1.4}
              strokeLinejoin="round"
              className={cn(
                "outline-none transition-[fill] duration-150",
                !corrige && "cursor-pointer focus-visible:stroke-[var(--color-ring)]",
              )}
            />
          ))}

          {/* Étiquettes : uniquement à l'échelle régionale, sinon illisible sur mobile. */}
          {echelle === "regions" &&
            zones.map((z) => (
              <text
                key={`t-${z.code}`}
                x={z.cx}
                y={z.cy}
                textAnchor="middle"
                fontSize={22}
                pointerEvents="none"
                fill={contraste(z.code) ? "var(--color-primary-foreground)" : "var(--color-muted-foreground)"}
                className="font-semibold"
              >
                {z.code}
              </text>
            ))}
        </svg>
      </div>

      <p className="min-h-[1.25rem] text-center text-sm font-semibold text-foreground">
        {nomActif ?? (
          <span className="font-normal text-muted-foreground">
            {echelle === "regions"
              ? "Touchez une région sur la carte"
              : "Touchez un département sur la carte"}
          </span>
        )}
      </p>

      {/* Repli accessible : sélection à la liste, indispensable sur petit écran. */}
      {!corrige && (
        <select
          value={selection ?? ""}
          onChange={(e) => onSelect(e.target.value)}
          aria-label="Choisir dans la liste"
          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring"
        >
          <option value="">Ou choisir dans la liste…</option>
          {[...zones]
            .sort((a, b) => a.nom.localeCompare(b.nom, "fr"))
            .map((z) => (
              <option key={z.code} value={z.code}>
                {z.code} — {z.nom}
              </option>
            ))}
        </select>
      )}
    </div>
  );
}
