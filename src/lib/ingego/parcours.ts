import { useCallback, useEffect, useState } from "react";
import { AXES, CORPUS, type Axe, type Question } from "./corpus";

/* Découpage du corpus en unités (axe → sous-thème) puis en leçons courtes,
   façon Duolingo : on avance leçon par leçon, du niveau 1 au niveau 10. */

export const PAR_LECON = 6;
export const COEURS_MAX = 5;

export interface Lecon {
  id: string;
  axe: string;
  sousTheme: string;
  rang: number; // 1..n dans le sous-thème
  questions: Question[];
}

export interface Unite {
  axe: Axe;
  sousTheme: string;
  lecons: Lecon[];
}

function construire(): Unite[] {
  const unites: Unite[] = [];
  for (const axe of AXES) {
    const parSousTheme = new Map<string, Question[]>();
    for (const q of CORPUS) {
      if (q.axe !== axe.id) continue;
      const l = parSousTheme.get(q.sousTheme) ?? [];
      l.push(q);
      parSousTheme.set(q.sousTheme, l);
    }
    for (const [sousTheme, questions] of parSousTheme) {
      const lecons: Lecon[] = [];
      for (let i = 0; i < questions.length; i += PAR_LECON) {
        const rang = lecons.length + 1;
        lecons.push({
          id: `${axe.id}|${sousTheme}|${rang}`,
          axe: axe.id,
          sousTheme,
          rang,
          questions: questions.slice(i, i + PAR_LECON),
        });
      }
      if (lecons.length) unites.push({ axe, sousTheme, lecons });
    }
  }
  return unites;
}

export const UNITES: Unite[] = construire();
export const LECONS: Lecon[] = UNITES.flatMap((u) => u.lecons);
export const LECON_PAR_ID: Record<string, Lecon> = Object.fromEntries(
  LECONS.map((l) => [l.id, l]),
);

export const suivante = (id: string) => LECONS[LECONS.findIndex((l) => l.id === id) + 1] ?? null;

/* ---------- progression locale ---------- */

export interface Progres {
  xp: number;
  serie: number;
  dernierJour: string;
  lecons: Record<string, { etoiles: number; xp: number }>;
}

const CLE = "ingego-progres";
const VIDE: Progres = { xp: 0, serie: 0, dernierJour: "", lecons: {} };

const jour = () => new Date().toISOString().slice(0, 10);
const veille = () => new Date(Date.now() - 86400000).toISOString().slice(0, 10);

function lire(): Progres {
  if (typeof localStorage === "undefined") return VIDE;
  try {
    const brut = localStorage.getItem(CLE);
    return brut ? { ...VIDE, ...(JSON.parse(brut) as Progres) } : VIDE;
  } catch {
    return VIDE;
  }
}

export function useProgres() {
  const [progres, setProgres] = useState<Progres>(VIDE);
  const [pret, setPret] = useState(false);

  useEffect(() => {
    setProgres(lire());
    setPret(true);
  }, []);

  const enregistrer = useCallback((leconId: string, justes: number, total: number) => {
    setProgres((p) => {
      const etoiles = justes === total ? 3 : justes >= Math.ceil(total * 0.7) ? 2 : 1;
      const gagne = justes * 10 + (etoiles === 3 ? 20 : 0);
      const ancien = p.lecons[leconId];
      const aujourdhui = jour();
      const serie =
        p.dernierJour === aujourdhui
          ? p.serie || 1
          : p.dernierJour === veille()
            ? p.serie + 1
            : 1;
      const suivant: Progres = {
        xp: p.xp + gagne,
        serie,
        dernierJour: aujourdhui,
        lecons: {
          ...p.lecons,
          [leconId]: {
            etoiles: Math.max(etoiles, ancien?.etoiles ?? 0),
            xp: (ancien?.xp ?? 0) + gagne,
          },
        },
      };
      try {
        localStorage.setItem(CLE, JSON.stringify(suivant));
      } catch {
        /* stockage indisponible */
      }
      return suivant;
    });
  }, []);

  const reinitialiser = useCallback(() => {
    setProgres(VIDE);
    try {
      localStorage.removeItem(CLE);
    } catch {
      /* stockage indisponible */
    }
  }, []);

  return { progres, pret, enregistrer, reinitialiser };
}

/* Une leçon est ouverte si c'est la première du parcours, si elle est déjà faite
   ou si la leçon précédente est terminée. */
export function ouverte(id: string, progres: Progres) {
  const i = LECONS.findIndex((l) => l.id === id);
  if (i <= 0) return true;
  if (progres.lecons[id]) return true;
  return Boolean(progres.lecons[LECONS[i - 1].id]);
}

export function prochaineLecon(progres: Progres) {
  return LECONS.find((l) => !progres.lecons[l.id]) ?? LECONS[LECONS.length - 1];
}
