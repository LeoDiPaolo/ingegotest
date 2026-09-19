import { useMemo } from "react";
import type { Palier } from "@/lib/ingego/badges";

const COULEURS = [
  "var(--color-brand)",
  "var(--color-success)",
  "var(--color-primary)",
  "var(--color-warning)",
];

const COULEURS_PALIER: Record<Palier, string[]> = {
  bronze: ["#7A4525", "#B87333", "#E1A06A", "#F2C49D"],
  argent: ["#687386", "#AAB3C1", "#E4E8EE", "#FFFFFF"],
  or: ["#9B6A08", "#D4AF37", "#F5D061", "#FFF1A8"],
  special: ["#176B52", "#2F9B74", "#72D6B1", "#D8FFF0"],
};

/* Pluie de confettis purement décorative, jouée une fois en fin de session. */
export function Confettis({
  nombre = 40,
  palier,
  spectaculaire = false,
}: {
  nombre?: number;
  palier?: Palier;
  spectaculaire?: boolean;
}) {
  const couleurs = palier ? COULEURS_PALIER[palier] : COULEURS;
  const pieces = useMemo(
    () =>
      Array.from({ length: nombre }, (_, i) => ({
        i,
        gauche: Math.random() * 100,
        retard: spectaculaire ? Math.random() * 2.2 : Math.random() * 0.8,
        duree: spectaculaire ? 2.4 + Math.random() * 2 : 1.8 + Math.random() * 1.4,
        couleur: couleurs[i % couleurs.length],
        largeur: spectaculaire ? 7 + Math.random() * 7 : undefined,
        hauteur: spectaculaire ? 10 + Math.random() * 10 : undefined,
        rotation: Math.round(Math.random() * 35),
      })),
    [couleurs, nombre, spectaculaire],
  );

  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      {pieces.map((p) => (
        <span
          key={p.i}
          className="confetti"
          style={{
            left: `${p.gauche}%`,
            backgroundColor: p.couleur,
            animationDelay: `${p.retard}s`,
            animationDuration: `${p.duree}s`,
            width: p.largeur,
            height: p.hauteur,
            rotate: `${p.rotation}deg`,
          }}
        />
      ))}
    </div>
  );
}
