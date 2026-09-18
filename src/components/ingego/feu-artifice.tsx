import { useMemo } from "react";

const COULEURS_OR = ["#D4AF37", "#F5D061", "#B8860B"];

/* Explosion radiale décroissante : physique volontairement différente des confettis. */
export function FeuArtifice({ salves = 3 }: { salves?: number }) {
  const eclats = useMemo(
    () =>
      Array.from({ length: salves }, (_, s) =>
        Array.from({ length: 14 }, (_, i) => {
          const angle = (i / 14) * 360 + s * 12;
          return {
            key: `${s}-${i}`,
            angle,
            distance: 90 + Math.random() * 60,
            retard: s * 0.35 + Math.random() * 0.1,
            couleur: COULEURS_OR[i % COULEURS_OR.length],
          };
        }),
      ).flat(),
    [salves],
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
              "--angle": `${e.angle}deg`,
              "--distance": `${e.distance}px`,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
