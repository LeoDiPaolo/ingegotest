import { useMemo } from "react";
import type { Palier } from "@/lib/ingego/badges";

const COULEURS: Record<Palier, string[]> = {
  bronze: ["#B87333", "#E1A06A", "#F2C49D"],
  argent: ["#AAB3C1", "#E4E8EE", "#FFFFFF"],
  or: ["#D4AF37", "#F5D061", "#FFF1A8"],
  special: ["#2F9B74", "#72D6B1", "#D8FFF0"],
};

const POSITIONS = [
  [18, 24],
  [78, 20],
  [48, 14],
  [24, 58],
  [76, 60],
  [42, 72],
  [62, 42],
] as const;

/* Explosion radiale décroissante : physique volontairement différente des confettis. */
export function FeuArtifice({
  salves = 3,
  palier = "or",
}: {
  salves?: number;
  palier?: Palier;
}) {
  const couleurs = COULEURS[palier];
  const eclats = useMemo(
    () =>
      Array.from({ length: salves }, (_, s) =>
        Array.from({ length: 14 }, (_, i) => {
          const angle = (i / 14) * 360 + s * 12;
          return {
            key: `${s}-${i}`,
            angle,
            distance: 90 + Math.random() * 60,
            retard: s * 0.38 + Math.random() * 0.1,
            couleur: couleurs[i % couleurs.length],
            position: POSITIONS[s % POSITIONS.length],
          };
        }),
      ).flat(),
    [couleurs, salves],
  );

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-40 grid place-items-center overflow-hidden"
    >
      {eclats.map((e) => (
        <span
          key={e.key}
          className="eclat-feu"
          style={
            {
              backgroundColor: e.couleur,
              animationDelay: `${e.retard}s`,
              left: `${e.position[0]}%`,
              top: `${e.position[1]}%`,
              "--angle": `${e.angle}deg`,
              "--distance": `${e.distance}px`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
