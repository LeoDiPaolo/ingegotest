import { cn } from "@/lib/utils";

export interface EtapeCircuit {
  l: string;
  sub?: string;
  /** position sur la grille du schéma (0-100) */
  x: number;
  y: number;
}

export interface DonneesCircuit {
  titre?: string;
  etapes: EtapeCircuit[];
  /** suite attendue d'indices d'étapes */
  chemin: number[];
  legende?: string;
}

/**
 * Chemin à tracer : on enchaîne les étapes en les touchant dans l'ordre.
 * Le trait se dessine au fur et à mesure ; la dernière étape posée se retire.
 */
export function Circuit({
  donnees,
  chemin,
  onToucher,
  corrige,
}: {
  donnees: DonneesCircuit;
  chemin: number[];
  onToucher: (i: number) => void;
  corrige: boolean;
}) {
  const { titre, etapes, chemin: attendu, legende } = donnees;
  const trace = corrige ? attendu : chemin;

  const points = trace.map((i) => etapes[i]).filter(Boolean);
  const d = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const posesJustes = chemin.map((v, i) => v === attendu[i]);

  return (
    <div className="trame-plan space-y-2.5 rounded-2xl border border-border p-3">
      {titre && (
        <p className="px-1 text-[0.68rem] tracking-[0.15em] text-muted-foreground uppercase">
          {titre}
        </p>
      )}

      <div className="relative w-full rounded-xl border border-plan-line/70 bg-card" style={{ aspectRatio: "5 / 4" }}>
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="absolute inset-0 h-full w-full">
          {d && (
            <path
              d={d}
              fill="none"
              stroke={corrige ? "var(--success)" : "var(--primary)"}
              strokeWidth={0.9}
              strokeLinecap="round"
              strokeDasharray={corrige ? undefined : "2 1.5"}
            />
          )}
        </svg>

        {etapes.map((e, i) => {
          const rang = chemin.indexOf(i);
          const attenduRang = attendu.indexOf(i);
          const bon = corrige && rang === attenduRang;
          return (
            <button
              key={i}
              type="button"
              disabled={corrige}
              onClick={() => onToucher(i)}
              className={cn(
                "tap absolute w-[38%] -translate-x-1/2 -translate-y-1/2 rounded-lg border-2 px-1.5 py-1 text-center transition-all active:scale-95",
                rang < 0 && !corrige && "border-border bg-elevated",
                rang >= 0 && !corrige && "anim-pop border-primary bg-primary/15",
                corrige && bon && "border-success bg-success/15",
                corrige && !bon && rang >= 0 && "border-destructive bg-destructive/15",
                corrige && !bon && rang < 0 && "border-border bg-elevated",
              )}
              style={{ left: `${e.x}%`, top: `${e.y}%` }}
            >
              {(rang >= 0 || corrige) && (
                <span
                  className={cn(
                    "mx-auto mb-0.5 flex h-4 w-4 items-center justify-center rounded-full text-[0.6rem] font-bold",
                    corrige ? "bg-success/25 text-success" : "bg-primary text-primary-foreground",
                  )}
                >
                  {(corrige ? attenduRang : rang) + 1}
                </span>
              )}
              <span className="block text-[0.66rem] leading-tight font-medium">{e.l}</span>
              {e.sub && (
                <span className="block text-[0.58rem] leading-tight text-muted-foreground">
                  {e.sub}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-muted-foreground">
        {corrige
          ? `Chemin attendu affiché. Vous aviez ${posesJustes.filter(Boolean).length} étape(s) bien placée(s).`
          : (legende ?? "Touchez les étapes dans l'ordre. Touchez la dernière posée pour la retirer.")}
      </p>
    </div>
  );
}
