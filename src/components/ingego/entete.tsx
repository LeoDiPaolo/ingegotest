import { CloudOff, Flame, RefreshCw } from "lucide-react";
import { LogoIngego } from "@/components/ingego/marque";
import { jaugesParAxe } from "@/lib/ingego/session";
import type { Etat } from "@/lib/ingego/algo";

export type EtatSynchro = "local" | "en-cours" | "ok" | "erreur";

/* Bandeau haut : logo IngéGo, série de jours et jauges de progression par axe,
   lisibles d'un coup d'œil (couleur de l'axe, épaisseur généreuse). */
export function Entete({
  serie,
  etat,
  synchro,
  jauges = true,
}: {
  serie: number;
  etat: Etat;
  synchro: EtatSynchro;
  jauges?: boolean;
}) {
  const lignes = jaugesParAxe(etat);

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-card/95 px-5 py-3 backdrop-blur">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center gap-3">
          <LogoIngego className="h-11 w-auto max-w-[12rem] object-contain object-left" />
          <div className="ml-auto flex shrink-0 items-center gap-2 text-sm font-semibold">
            {synchro === "erreur" ? (
              <span title="Sauvegarde en ligne indisponible — progression conservée sur l'appareil">
                <CloudOff className="h-4 w-4 text-warning" />
              </span>
            ) : synchro === "en-cours" ? (
              <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : null}
            <span
              className="flex items-center gap-1 rounded-full bg-brand/15 px-3 py-1.5 text-brand"
              title="Jours consécutifs avec une session terminée"
            >
              <Flame className={serie > 0 ? "h-4 w-4 animate-pulse" : "h-4 w-4"} />
              {serie}
            </span>
          </div>
        </div>

        {jauges ? (
          <div className="mt-3 grid grid-cols-2 gap-x-3 gap-y-2 sm:grid-cols-3">
            {lignes.map((l) => (
              <div key={l.axe.id}>
                <div className="flex items-baseline justify-between gap-1">
                  <span
                    className="truncate text-[0.68rem] font-bold"
                    style={{ color: l.axe.couleur }}
                  >
                    {l.axe.court}
                  </span>
                  <span className="text-[0.62rem] font-semibold text-muted-foreground tabular-nums">
                    {Math.round(l.part * 100)} %
                  </span>
                </div>
                <div className="mt-1 h-3.5 overflow-hidden rounded-full bg-elevated ring-1 ring-border/60">
                  <div className="flex h-full">
                    <div
                      className="h-full rounded-l-full transition-[width] duration-700"
                      style={{ width: `${l.part * 100}%`, backgroundColor: l.axe.couleur }}
                    />
                    <div
                      className="h-full transition-[width] duration-700"
                      style={{
                        width: `${Math.max(0, l.partVue - l.part) * 100}%`,
                        backgroundColor: `${l.axe.couleur}55`,
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </header>
  );
}
