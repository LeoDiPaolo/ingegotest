import { useMemo } from "react";
import { X } from "lucide-react";
import { melange } from "@/lib/ingego/algo";
import { cn } from "@/lib/utils";

export interface CoucheEmpilement {
  l: string;
  sub?: string;
}

export interface DonneesEmpilement {
  titre?: string;
  /** libellé de l'appui bas de la coupe, ex. « Support maçonné » */
  base?: string;
  /** libellé du côté haut, ex. « Extérieur » */
  sommet?: string;
  /** couches dans l'ordre attendu, du haut vers le bas */
  couches: CoucheEmpilement[];
  legende?: string;
}

/**
 * Coupe à composer : on empile les couches une par une, du haut vers le bas.
 * Chaque appui pose la couche dans l'emplacement suivant ; on peut retirer
 * la dernière posée. La correction affiche la couche attendue à chaque niveau.
 */
export function Empilement({
  donnees,
  pose,
  onPoser,
  onRetirer,
  graine,
  corrige,
}: {
  donnees: DonneesEmpilement;
  pose: number[];
  onPoser: (i: number) => void;
  onRetirer: (rang: number) => void;
  graine: number;
  corrige: boolean;
}) {
  const { titre, base, sommet, couches, legende } = donnees;
  const stock = useMemo(
    () => melange(couches.map((_, i) => i), graine),
    [couches, graine],
  );
  const restant = stock.filter((i) => !pose.includes(i));

  return (
    <div className="trame-plan space-y-3 rounded-2xl border border-border p-3">
      {titre && (
        <p className="px-1 text-[0.68rem] tracking-[0.15em] text-muted-foreground uppercase">
          {titre}
        </p>
      )}

      <div className="rounded-xl border border-border bg-card p-2">
        {sommet && (
          <p className="mb-1.5 text-center text-[0.62rem] tracking-[0.14em] text-muted-foreground uppercase">
            {sommet}
          </p>
        )}
        <ul className="space-y-1.5">
          {couches.map((_, rang) => {
            const idx = pose[rang];
            const vide = idx === undefined;
            const bon = corrige && idx === rang;
            return (
              <li key={rang}>
                <button
                  type="button"
                  disabled={corrige || vide}
                  onClick={() => onRetirer(rang)}
                  className={cn(
                    "tap flex w-full items-center gap-2 rounded-lg border-2 px-2.5 py-2 text-left transition-all",
                    vide && "border-dashed border-border bg-elevated/60",
                    !vide && !corrige && "anim-pop border-primary bg-primary/12",
                    corrige && !vide && bon && "border-success bg-success/15",
                    corrige && !vide && !bon && "border-destructive bg-destructive/15",
                  )}
                >
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded bg-brand/12 text-[0.65rem] font-semibold text-brand">
                    {rang + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm leading-snug font-medium">
                      {vide ? "Emplacement libre" : couches[idx].l}
                    </span>
                    {!vide && couches[idx].sub && (
                      <span className="block text-[0.68rem] text-muted-foreground">
                        {couches[idx].sub}
                      </span>
                    )}
                    {corrige && !bon && (
                      <span className="block text-[0.68rem] text-muted-foreground">
                        Attendu : {couches[rang].l}
                      </span>
                    )}
                  </span>
                  {!vide && !corrige && <X className="h-4 w-4 shrink-0 text-muted-foreground" />}
                </button>
              </li>
            );
          })}
        </ul>
        {base && (
          <p className="mt-1.5 rounded-lg bg-muted px-2.5 py-1.5 text-center text-[0.68rem] text-muted-foreground">
            {base}
          </p>
        )}
      </div>

      {!corrige && (
        <>
          <div className="flex flex-wrap gap-1.5">
            {restant.map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => onPoser(i)}
                className="tap rounded-lg border-2 border-border bg-elevated px-2.5 py-2 text-left text-sm leading-snug font-medium active:scale-[0.97] hover:border-primary/50"
              >
                {couches[i].l}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            {legende ?? "Touchez une couche pour la poser, puis touchez-la à nouveau pour la retirer."}
          </p>
        </>
      )}
    </div>
  );
}
