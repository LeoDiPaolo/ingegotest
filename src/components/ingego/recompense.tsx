import { useEffect } from "react";
import { Trophy } from "lucide-react";
import { Confettis } from "@/components/ingego/confettis";
import { FeuArtifice } from "@/components/ingego/feu-artifice";
import { Castor } from "@/components/ingego/marque";
import { Medaille } from "@/components/ingego/univers";
import { Button } from "@/components/ui/button";
import type { Badge } from "@/lib/ingego/badges";

/* Écran plein cadre de récompense : l'animation dépend du palier du badge. */
export function Recompense({ badge, onFermer }: { badge: Badge; onFermer: () => void }) {
  const palier = badge.palier;
  const special = palier === "special";

  useEffect(() => {
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(special ? [30, 55, 30, 55, 90] : [12, 50, 22]);
    }
  }, [badge.cle, special]);

  return (
    <div
      role="dialog"
      aria-label={`Badge débloqué : ${badge.titre}`}
      className="fixed inset-0 z-50 grid place-items-center overflow-hidden bg-primary/92 px-6 backdrop-blur-sm"
    >
      {palier === "or" ? <FeuArtifice /> : <Confettis nombre={special ? 56 : 40} />}
      {palier === "argent" ? (
        <span
          aria-hidden
          className="anim-flash-impact pointer-events-none absolute inset-0"
          style={{ background: "var(--color-card)" }}
        />
      ) : null}
      <div className="anim-pop relative w-full max-w-xs rounded-3xl bg-card p-6 text-center shadow-[var(--shadow-lift)]">
        <p className="text-[0.65rem] font-extrabold tracking-[0.2em] text-brand uppercase">
          {special ? "Palier historique" : "Badge débloqué"}
        </p>
        {special ? (
          <Castor className="anim-monte-castor mx-auto mt-3 h-14 w-14" />
        ) : null}
        <div
          className={`relative mt-3 flex justify-center ${
            palier === "argent" ? "anim-tampon-grand" : "anim-unlock"
          }`}
          style={special ? { animationDelay: "1s" } : undefined}
        >
          <Medaille
            libelle={badge.libelle}
            couleur={badge.couleur}
            palier={palier}
            acquis
            taille="lg"
            legende={badge.legende}
            icone={special ? Trophy : undefined}
          />
          {special ? (
            <span
              aria-hidden
              className="anim-shine-sweep pointer-events-none absolute inset-0"
              style={{
                background:
                  "linear-gradient(115deg, transparent 40%, color-mix(in oklab, white 70%, transparent) 50%, transparent 60%)",
              }}
            />
          ) : null}
        </div>
        <h2 className="mt-3 text-lg font-bold">{badge.titre}</h2>
        {special ? (
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
