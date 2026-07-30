/**
 * Petites illustrations vectorielles dessinées à la main (SVG) servant aux
 * exercices visuels : matériaux de chantier, couches de paroi, scène de
 * déconstruction sélective. Aucune information chiffrée n'y est inscrite :
 * le texte pédagogique reste dans le corpus, l'illustration ne fait que
 * représenter l'objet.
 */

export type CleMateriau =
  | "poutre-acier"
  | "brique"
  | "fenetre"
  | "porte"
  | "gravats"
  | "platre"
  | "laine"
  | "bois"
  | "paille"
  | "chanvre"
  | "ouate"
  | "amiante"
  | "tuile"
  | "cable";

/** Icône matière, dessinée dans une boîte 48×48. */
export function IconeMateriau({ cle, className }: { cle: CleMateriau; className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} role="presentation" aria-hidden="true">
      {cle === "poutre-acier" && (
        <g stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinejoin="round">
          <path d="M8 12h32M8 12l6 6M40 12l-6 6M14 18h20M24 18v12M14 36h20M8 36h32M14 30h20M8 36l6-6M40 36l-6-6" />
          <path d="M14 18h20v12H14z" fill="currentColor" opacity="0.12" />
        </g>
      )}
      {cle === "brique" && (
        <g stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round">
          <rect x="6" y="14" width="16" height="8" rx="1" fill="currentColor" opacity="0.25" />
          <rect x="24" y="14" width="18" height="8" rx="1" fill="currentColor" opacity="0.18" />
          <rect x="6" y="24" width="18" height="8" rx="1" fill="currentColor" opacity="0.18" />
          <rect x="26" y="24" width="16" height="8" rx="1" fill="currentColor" opacity="0.25" />
          <rect x="12" y="34" width="24" height="8" rx="1" fill="currentColor" opacity="0.2" />
        </g>
      )}
      {cle === "fenetre" && (
        <g stroke="currentColor" strokeWidth="1.6" fill="none">
          <rect x="9" y="7" width="30" height="34" rx="2" fill="currentColor" opacity="0.1" />
          <rect x="9" y="7" width="30" height="34" rx="2" />
          <path d="M24 7v34M9 24h30" />
        </g>
      )}
      {cle === "porte" && (
        <g stroke="currentColor" strokeWidth="1.6" fill="none">
          <rect x="12" y="5" width="24" height="38" rx="2" fill="currentColor" opacity="0.1" />
          <rect x="12" y="5" width="24" height="38" rx="2" />
          <rect x="17" y="10" width="14" height="12" rx="1" />
          <circle cx="31" cy="27" r="1.6" fill="currentColor" />
        </g>
      )}
      {cle === "gravats" && (
        <g stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" fill="none">
          <path d="M4 40l12-18 10 18z" fill="currentColor" opacity="0.18" />
          <path d="M4 40l12-18 10 18z" />
          <path d="M22 40l10-13 12 13z" fill="currentColor" opacity="0.12" />
          <path d="M22 40l10-13 12 13z" />
          <path d="M14 30l4 4M30 33l3 3" />
        </g>
      )}
      {cle === "platre" && (
        <g stroke="currentColor" strokeWidth="1.6" fill="none">
          <path d="M8 8h26l6 6v26H8z" fill="currentColor" opacity="0.1" />
          <path d="M8 8h26l6 6v26H8z" />
          <path d="M34 8v6h6M14 20h18M14 27h18M14 34h10" />
        </g>
      )}
      {cle === "laine" && (
        <g stroke="currentColor" strokeWidth="1.6" fill="none">
          <rect x="6" y="12" width="36" height="24" rx="3" fill="currentColor" opacity="0.12" />
          <rect x="6" y="12" width="36" height="24" rx="3" />
          <path d="M6 18c6 4 12-4 18 0s12 4 18 0M6 26c6 4 12-4 18 0s12 4 18 0M6 33c6 3 12-3 18 0s12 3 18 0" />
        </g>
      )}
      {cle === "bois" && (
        <g stroke="currentColor" strokeWidth="1.6" fill="none">
          <rect x="6" y="10" width="36" height="12" rx="2" fill="currentColor" opacity="0.15" />
          <rect x="6" y="10" width="36" height="12" rx="2" />
          <rect x="6" y="26" width="36" height="12" rx="2" fill="currentColor" opacity="0.1" />
          <rect x="6" y="26" width="36" height="12" rx="2" />
          <path d="M14 10v12M28 26v12" />
        </g>
      )}
      {cle === "paille" && (
        <g stroke="currentColor" strokeWidth="1.6" fill="none">
          <rect x="7" y="14" width="34" height="22" rx="4" fill="currentColor" opacity="0.15" />
          <rect x="7" y="14" width="34" height="22" rx="4" />
          <path d="M13 14v22M20 14v22M27 14v22M34 14v22" opacity="0.7" />
          <path d="M7 21h34M7 29h34" opacity="0.5" />
        </g>
      )}
      {cle === "chanvre" && (
        <g stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round">
          <path d="M24 42V20" />
          <path d="M24 22c-6-1-9-5-10-11 6 0 10 3 10 8M24 22c6-1 9-5 10-11-6 0-10 3-10 8M24 16c-4-2-6-6-5-11 4 2 6 6 5 11M24 16c4-2 6-6 5-11-4 2-6 6-5 11" />
        </g>
      )}
      {cle === "ouate" && (
        <g stroke="currentColor" strokeWidth="1.6" fill="none">
          <circle cx="18" cy="22" r="9" fill="currentColor" opacity="0.14" />
          <circle cx="30" cy="28" r="8" fill="currentColor" opacity="0.14" />
          <circle cx="18" cy="22" r="9" />
          <circle cx="30" cy="28" r="8" />
          <path d="M12 34h24" opacity="0.6" />
        </g>
      )}
      {cle === "amiante" && (
        <g stroke="currentColor" strokeWidth="1.6" fill="none">
          <path d="M24 6l18 34H6z" fill="currentColor" opacity="0.12" />
          <path d="M24 6l18 34H6z" />
          <path d="M24 18v10" strokeLinecap="round" />
          <circle cx="24" cy="33" r="1.4" fill="currentColor" stroke="none" />
        </g>
      )}
      {cle === "tuile" && (
        <g stroke="currentColor" strokeWidth="1.6" fill="none">
          <path d="M6 34c4-6 8-6 12 0 4-6 8-6 12 0 4-6 8-6 12 0" />
          <path d="M6 24c4-6 8-6 12 0 4-6 8-6 12 0 4-6 8-6 12 0" />
          <path d="M6 14c4-6 8-6 12 0 4-6 8-6 12 0 4-6 8-6 12 0" />
        </g>
      )}
      {cle === "cable" && (
        <g stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round">
          <path d="M8 34c6 0 6-20 12-20s6 20 12 20 6-16 8-16" />
          <circle cx="8" cy="34" r="2.5" />
          <circle cx="40" cy="18" r="2.5" />
        </g>
      )}
    </svg>
  );
}

/**
 * Scène de chantier de déconstruction sélective : dépôts de matériaux
 * alignés devant un mur de refend, panneau de tri au fond.
 */
export function SceneDeconstruction({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 320 120"
      className={className}
      role="img"
      aria-label="Chantier de déconstruction sélective : dépôts de matériaux triés devant un mur"
    >
      {/* ciel / fond */}
      <rect x="0" y="0" width="320" height="120" fill="var(--elevated)" />
      {/* mur de refend */}
      <g stroke="var(--border)" strokeWidth="1">
        {[0, 1, 2, 3].map((r) => (
          <g key={r}>
            {Array.from({ length: 9 }).map((_, c) => (
              <rect
                key={c}
                x={4 + c * 36 + (r % 2 ? 18 : 0)}
                y={8 + r * 14}
                width="34"
                height="12"
                rx="1.5"
                fill="var(--muted)"
                opacity="0.5"
              />
            ))}
          </g>
        ))}
      </g>
      {/* sol */}
      <rect x="0" y="70" width="320" height="50" fill="var(--accent)" opacity="0.25" />
      <path d="M0 70h320" stroke="var(--border)" strokeWidth="1.5" />

      {/* pile de briques */}
      <g fill="var(--strate-3)" opacity="0.85">
        {[0, 1, 2].map((r) =>
          Array.from({ length: 4 - r }).map((_, c) => (
            <rect
              key={`${r}-${c}`}
              x={16 + c * 16 + r * 8}
              y={92 - r * 8}
              width="14"
              height="7"
              rx="1"
            />
          )),
        )}
      </g>
      {/* poutres acier empilées */}
      <g stroke="var(--foreground)" strokeWidth="1.2" fill="var(--muted)">
        {[0, 1, 2].map((i) => (
          <rect key={i} x={104} y={82 + i * 8} width="70" height="6" rx="1" />
        ))}
      </g>
      {/* fenêtres appuyées */}
      <g stroke="var(--foreground)" strokeWidth="1.2" fill="var(--primary)" opacity="0.85">
        {[0, 1].map((i) => (
          <g key={i}>
            <rect x={190 + i * 16} y={64} width="26" height="34" rx="1" fillOpacity="0.18" />
            <path d={`M${203 + i * 16} 64v34`} />
          </g>
        ))}
      </g>
      {/* tas de gravats */}
      <path
        d="M244 100l16-22 16 22z"
        fill="var(--foreground)"
        opacity="0.35"
        stroke="var(--border)"
      />
      <path d="M272 100l12-14 12 14z" fill="var(--foreground)" opacity="0.25" />

      {/* panneau de tri */}
      <g transform="translate(276 18)">
        <rect
          width="36"
          height="30"
          rx="2"
          fill="var(--card)"
          stroke="var(--border)"
          strokeWidth="1.2"
        />
        <path
          d="M12 20l-3-5 6-1zM24 20l3-5-6-1zM18 8l4 6h-8z"
          fill="var(--success)"
          opacity="0.9"
        />
        <path d="M8 48v-18M28 48v-18" stroke="var(--border)" strokeWidth="1.2" />
      </g>
    </svg>
  );
}
