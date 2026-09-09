import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export interface RepereCurseur {
  v: number;
  l: string;
}

export interface DonneesCurseur {
  titre?: string;
  /** unité affichée à côté de la valeur, ex. « % », « ans », « m² » */
  unite?: string;
  min: number;
  max: number;
  pas: number;
  /** valeur attendue */
  cible: number;
  /** écart accepté autour de la cible */
  tolerance?: number;
  /** repères dessinés sous la piste */
  reperes?: RepereCurseur[];
  /** légende affichée sous la réglette */
  legende?: string;
}

const pct = (v: number, min: number, max: number) => ((v - min) / (max - min)) * 100;

/**
 * Curseur à régler : on fait glisser le doigt sur une piste graduée jusqu'à
 * la valeur demandée. La correction montre l'écart entre la valeur posée et
 * la valeur attendue, directement sur la piste.
 */
export function Curseur({
  donnees,
  valeur,
  onChange,
  corrige,
}: {
  donnees: DonneesCurseur;
  valeur: number | null;
  onChange: (v: number) => void;
  corrige: boolean;
}) {
  const { titre, unite, min, max, pas, cible, tolerance = 0, reperes = [], legende } = donnees;
  const courante = valeur ?? min + Math.round((max - min) / 2 / pas) * pas;
  const bon = valeur !== null && Math.abs(valeur - cible) <= tolerance;
  const pose = valeur !== null;

  const borne = (v: number) => Math.min(max, Math.max(min, Math.round(v / pas) * pas));
  const decimales = pas < 1 ? (String(pas).split(".")[1]?.length ?? 1) : 0;
  const format = (v: number) => v.toFixed(decimales).replace(".", ",");

  return (
    <div className="trame-plan space-y-3 rounded-2xl border border-border p-3">
      {titre && (
        <p className="px-1 text-[0.68rem] tracking-[0.15em] text-muted-foreground uppercase">
          {titre}
        </p>
      )}

      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          disabled={corrige}
          aria-label="Diminuer"
          onClick={() => onChange(borne(courante - pas))}
          className="tap flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-elevated text-foreground active:scale-95 disabled:opacity-40"
        >
          <Minus className="h-5 w-5" />
        </button>

        <div
          className={cn(
            "min-w-[7.5rem] rounded-xl border-2 px-3 py-2 text-center transition-colors",
            !corrige && !pose && "border-dashed border-border bg-card",
            !corrige && pose && "border-primary bg-primary/10",
            corrige && bon && "anim-pop border-success bg-success/15",
            corrige && !bon && "anim-tremble border-destructive bg-destructive/15",
          )}
        >
          <span className="block text-2xl leading-none font-semibold tabular-nums">
            {pose ? format(courante) : "—"}
          </span>
          {unite && <span className="mt-0.5 block text-xs text-muted-foreground">{unite}</span>}
        </div>

        <button
          type="button"
          disabled={corrige}
          aria-label="Augmenter"
          onClick={() => onChange(borne(courante + pas))}
          className="tap flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-elevated text-foreground active:scale-95 disabled:opacity-40"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      <div className="relative px-1 pt-1">
        <div className="relative h-3 rounded-full bg-elevated ring-1 ring-border">
          {pose && (
            <div
              className={cn(
                "absolute inset-y-0 left-0 rounded-full transition-all",
                corrige ? (bon ? "bg-success/60" : "bg-destructive/50") : "bg-primary/60",
              )}
              style={{ width: `${pct(courante, min, max)}%` }}
            />
          )}
          {corrige && (
            <span
              className="absolute -top-1.5 h-6 w-[3px] -translate-x-1/2 rounded bg-success"
              style={{ left: `${pct(cible, min, max)}%` }}
              aria-hidden
            />
          )}
        </div>

        <input
          type="range"
          min={min}
          max={max}
          step={pas}
          value={courante}
          disabled={corrige}
          aria-label={titre ?? "Curseur"}
          onChange={(e) => onChange(borne(Number(e.target.value)))}
          className="absolute inset-x-1 -top-2 h-12 w-[calc(100%-0.5rem)] cursor-pointer opacity-0"
        />

        <span
          className={cn(
            "pointer-events-none absolute -top-0.5 h-8 w-8 -translate-x-1/2 rounded-full border-2 shadow-[var(--shadow-card)] transition-all",
            corrige
              ? bon
                ? "border-success bg-success/25"
                : "border-destructive bg-destructive/25"
              : "border-primary bg-card",
          )}
          style={{ left: `calc(${pct(courante, min, max)}% )` }}
          aria-hidden
        />
      </div>

      {reperes.length > 0 && (
        <div className="space-y-1.5">
          <div className="relative h-4">
            {reperes.map((r, i) => (
              <span
                key={`${r.v}-${r.l}`}
                className="absolute top-0 -translate-x-1/2 text-center text-[0.6rem] leading-none text-muted-foreground"
                style={{ left: `${Math.min(97, Math.max(3, pct(r.v, min, max)))}%` }}
              >
                <span className="mx-auto mb-0.5 block h-2 w-px bg-plan-line" />
                {i + 1}
              </span>
            ))}
          </div>
          <div className="flex flex-wrap gap-x-2.5 gap-y-1">
            {reperes.map((r, i) => (
              <span
                key={`l-${r.v}-${r.l}`}
                className="text-[0.6rem] leading-tight text-muted-foreground"
              >
                <strong className="text-foreground">{i + 1}</strong> · {r.l}
              </span>
            ))}
          </div>
        </div>
      )}

      {corrige && (
        <p className="text-xs text-muted-foreground">
          Valeur attendue : <strong className="text-foreground">{format(cible)}</strong>
          {unite ? ` ${unite}` : ""}
          {pose && !bon ? ` — vous aviez posé ${format(courante)}.` : ""}
        </p>
      )}
      {!corrige && (legende || "Faites glisser le curseur, ou ajustez avec − et +.") && (
        <p className="text-xs text-muted-foreground">
          {legende ?? "Faites glisser le curseur, ou ajustez avec − et +."}
        </p>
      )}
    </div>
  );
}
