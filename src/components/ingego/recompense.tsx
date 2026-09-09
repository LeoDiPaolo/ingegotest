import { useEffect } from "react";
import { Confettis } from "@/components/ingego/confettis";
import { Medaille } from "@/components/ingego/univers";
import { Button } from "@/components/ui/button";
import type { Badge } from "@/lib/ingego/badges";

/* Écran plein cadre de récompense : médaille, confettis, vibration courte. */
export function Recompense({ badge, onFermer }: { badge: Badge; onFermer: () => void }) {
  useEffect(() => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) navigator.vibrate([12, 50, 22]);
  }, [badge.cle]);

  return (
    <div
      role="dialog"
      aria-label={`Badge débloqué : ${badge.titre}`}
      className="fixed inset-0 z-50 grid place-items-center bg-primary/92 px-6 backdrop-blur-sm"
    >
      <Confettis nombre={56} />
      <div className="anim-pop relative w-full max-w-xs rounded-3xl bg-card p-6 text-center shadow-[var(--shadow-lift)]">
        <p className="text-[0.65rem] font-extrabold tracking-[0.2em] text-brand uppercase">
          Badge débloqué
        </p>
        <div className="anim-unlock mt-3 flex justify-center">
          <Medaille
            libelle={badge.libelle}
            couleur={badge.couleur}
            acquis
            taille="lg"
            legende={badge.legende}
          />
        </div>
        <h2 className="mt-3 text-lg font-bold">{badge.titre}</h2>
        <Button
          onClick={onFermer}
          className="touche touche-brand mt-4 h-12 w-full rounded-xl bg-brand text-base font-extrabold text-brand-foreground hover:bg-brand/90"
        >
          Continuer
        </Button>
      </div>
    </div>
  );
}
