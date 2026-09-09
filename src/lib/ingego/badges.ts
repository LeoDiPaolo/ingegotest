import { useCallback, useEffect, useRef, useState } from "react";
import type { Axe } from "@/lib/ingego/corpus";
import { PALIERS_PART } from "@/components/ingego/univers";

/* Paliers de bonnes réponses cumulées, dernier palier = corpus complet. */
export const PALIERS_REPONSES = [10, 25, 50, 100, 200, 300, 400, 500, 600, 700, 783];

export type Badge = {
  cle: string;
  libelle: string;
  titre: string;
  legende: string;
  couleur?: string;
};

export type LigneAxe = { axe: Axe; acquises: number; total: number };

export function badgePalierReponses(p: number): Badge {
  return {
    cle: `rep-${p}`,
    libelle: p === 783 ? "783" : String(p),
    titre: p === 783 ? "Corpus complet" : `${p} bonnes réponses`,
    legende: p === 783 ? "Toutes les questions validées" : "Palier cumulé",
  };
}

export function badgePalierAxe(axe: Axe, part: number): Badge {
  return {
    cle: `axe-${axe.id}-${Math.round(part * 100)}`,
    libelle: `${Math.round(part * 100)}%`,
    titre: `${axe.court} · ${Math.round(part * 100)} %`,
    legende: part >= 1 ? "Catégorie maîtrisée" : "Palier de catégorie",
    couleur: axe.couleur,
  };
}

/* Liste complète des badges débloqués à un instant donné. */
export function badgesDebloques(lignes: LigneAxe[], bonnesReponses: number): Badge[] {
  const out: Badge[] = [];
  for (const p of PALIERS_REPONSES) if (bonnesReponses >= p) out.push(badgePalierReponses(p));
  for (const l of lignes) {
    const part = l.total ? l.acquises / l.total : 0;
    for (const p of PALIERS_PART) if (part >= p) out.push(badgePalierAxe(l.axe, p));
  }
  return out;
}

const CLE_VUS = "ingego.badges.vus";

function lireVus(): string[] {
  if (typeof localStorage === "undefined") return [];
  try {
    const brut = localStorage.getItem(CLE_VUS);
    return brut ? (JSON.parse(brut) as string[]) : [];
  } catch {
    return [];
  }
}

/**
 * File d'attente des badges nouvellement débloqués.
 * Au tout premier chargement, les badges déjà acquis sont marqués comme vus
 * pour ne pas déclencher une avalanche de récompenses rétroactives.
 */
export function useRecompenses(badges: Badge[], actif = true) {
  const [file, setFile] = useState<Badge[]>([]);
  const vus = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (!actif) return;
    if (vus.current === null) {
      const connus = lireVus();
      vus.current = new Set(connus);
      if (!connus.length) {
        const toutes = badges.map((b) => b.cle);
        vus.current = new Set(toutes);
        localStorage.setItem(CLE_VUS, JSON.stringify(toutes));
        return;
      }
    }
    const nouveaux = badges.filter((b) => !vus.current!.has(b.cle));
    if (!nouveaux.length) return;
    for (const b of nouveaux) vus.current.add(b.cle);
    localStorage.setItem(CLE_VUS, JSON.stringify([...vus.current]));
    setFile((f) => [...f, ...nouveaux]);
  }, [badges, actif]);

  const suivant = useCallback(() => setFile((f) => f.slice(1)), []);
  return { badge: file[0] ?? null, suivant };
}
