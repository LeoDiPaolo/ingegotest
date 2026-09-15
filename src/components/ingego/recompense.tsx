import { useEffect } from "react";
import { Sparkles, Star, Trophy } from "lucide-react";
import { Confettis } from "@/components/ingego/confettis";
import { Medaille } from "@/components/ingego/univers";
import { Button } from "@/components/ui/button";
import type { Badge } from "@/lib/ingego/badges";

/* Écran plein cadre de récompense : médaille, confettis, vibration courte. */
export function Recompense({ badge, onFermer }: { badge: Badge; onFermer: () => void }) {
  const palierCumule = badge.cle.startsWith("rep-");

  useEffect(() => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(palierCumule ? [30, 55, 30, 55, 90] : [12, 50, 22]);
    }
  }, [badge.cle, palierCumule]);

  return (
    <div
      role="dialog"
      aria-label={`Badge débloqué : ${badge.titre}`}
      className={
        palierCumule
          ? "palier-celebration fixed inset-0 z-50 grid place-items-center overflow-hidden bg-primary px-6"
          : "fixed inset-0 z-50 grid place-items-center bg-primary/92 px-6 backdrop-blur-sm"
      }
    >
      {palierCumule ? (
        <div aria-hidden className="absolute inset-0 grid place-items-center">
          <span className="palier-halo palier-halo-un" />
          <span className="palier-halo palier-halo-deux" />
          <span className="palier-rayons" />
          <Sparkles className="palier-etincelle palier-etincelle-une" />
          <Star className="palier-etincelle palier-etincelle-deux" />
          <Sparkles className="palier-etincelle palier-etincelle-trois" />
          <Star className="palier-etincelle palier-etincelle-quatre" />
        </div>
      ) : (
        <Confettis nombre={56} />
      )}
      <div
        className={
          palierCumule
            ? "anim-palier relative w-full max-w-xs rounded-3xl border border-brand/40 bg-card p-6 text-center shadow-[var(--shadow-lift)]"
            : "anim-pop relative w-full max-w-xs rounded-3xl bg-card p-6 text-center shadow-[var(--shadow-lift)]"
        }
      >
        <p className="text-[0.65rem] font-extrabold tracking-[0.2em] text-brand uppercase">
          {palierCumule ? "Palier historique" : "Badge débloqué"}
        </p>
        <div className="anim-unlock mt-3 flex justify-center">
          <Medaille
            libelle={badge.libelle}
            couleur={badge.couleur}
            acquis
            taille="lg"
            legende={badge.legende}
            icone={palierCumule ? Trophy : undefined}
          />
        </div>
        <h2 className="mt-3 text-lg font-bold">{badge.titre}</h2>
        {palierCumule ? (
          <p className="mt-1 text-sm font-semibold text-muted-foreground">
            Une marche de plus. Le chantier de la mémoire tient bon.
          </p>
        ) : null}
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
