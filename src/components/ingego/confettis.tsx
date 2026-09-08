import { useMemo } from "react";

const COULEURS = [
  "var(--color-brand)",
  "var(--color-success)",
  "var(--color-primary)",
  "var(--color-warning)",
];

/* Pluie de confettis purement décorative, jouée une fois en fin de session. */
export function Confettis({ nombre = 40 }: { nombre?: number }) {
  const pieces = useMemo(
    () =>
      Array.from({ length: nombre }, (_, i) => ({
        i,
        gauche: Math.random() * 100,
        retard: Math.random() * 0.8,
        duree: 1.8 + Math.random() * 1.4,
        couleur: COULEURS[i % COULEURS.length],
      })),
    [nombre],
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
          }}
        />
      ))}
    </div>
  );
}
