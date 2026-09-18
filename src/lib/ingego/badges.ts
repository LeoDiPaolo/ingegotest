import { useCallback, useEffect, useRef, useState } from "react";
import { CORPUS, type Axe } from "@/lib/ingego/corpus";
import { serieJours } from "@/lib/ingego/stockage";
import { PALIERS_PART } from "@/components/ingego/univers";

/* Paliers de questions validées, dernier palier = corpus complet. */
export const PALIERS_REPONSES = [
  10,
  25,
  50,
  100,
  150,
  200,
  250,
  300,
  350,
  400,
  450,
  500,
  550,
  600,
  650,
  700,
  750,
  800,
  850,
  900,
  950,
  1000,
  CORPUS.length,
];

export type Badge = {
  cle: string;
  libelle: string;
  titre: string;
  legende: string;
  couleur?: string;
};

export type LigneAxe = { axe: Axe; acquises: number; total: number };

export function badgePalierReponses(p: number): Badge {
  const complet = p >= CORPUS.length;
  return {
    cle: `rep-${p}`,
    libelle: String(p),
    titre: complet ? "Corpus complet" : `${p} questions validées`,
    legende: complet ? "Toutes les questions validées" : "Palier cumulé",
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
    const badgesVus = vus.current;
    if (!badgesVus) return;
    const nouveaux = badges.filter((b) => !badgesVus.has(b.cle));
    if (!nouveaux.length) return;
    for (const b of nouveaux) badgesVus.add(b.cle);
    localStorage.setItem(CLE_VUS, JSON.stringify([...badgesVus]));
    setFile((f) => [...f, ...nouveaux]);
  }, [badges, actif]);

  const suivant = useCallback(() => setFile((f) => f.slice(1)), []);
  return { badge: file[0] ?? null, suivant };
}

/* ---- Badges de régularité (séries et constance hebdomadaire) ---- */

export type BadgeRegularite = {
  cle: string;
  seuil: number;
  titre: string;
  legende: string;
};

export const PALIERS_SERIE = [7, 14, 21, 30, 60, 90];
export const PALIERS_HEBDO = [2, 4, 8, 12];
const JOURS_MIN_SEMAINE = 5;

function jourPrecedent(jour: string): string {
  const d = new Date(`${jour}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() - 1);
  return d.toISOString().slice(0, 10);
}

/* Série actuelle : jours consécutifs jusqu'à aujourd'hui (ou hier si la
   séance du jour n'est pas encore faite). */
export function serieActuelle(joursTermines: string[], aujourdhui = new Date()): number {
  const set = new Set(joursTermines);
  let curseur = aujourdhui.toISOString().slice(0, 10);
  if (!set.has(curseur)) curseur = jourPrecedent(curseur);
  let n = 0;
  while (set.has(curseur)) {
    n += 1;
    curseur = jourPrecedent(curseur);
  }
  return n;
}

/* Clé de semaine ISO (lundi-dimanche) sous forme d'index entier continu,
   ce qui rend la détection de semaines consécutives triviale. */
function indexSemaine(jour: string): number {
  const d = new Date(`${jour}T00:00:00Z`);
  const decalage = (d.getUTCDay() + 6) % 7; // lundi = 0
  const lundi = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() - decalage);
  return Math.round(lundi / 604_800_000);
}

/* Plus longue suite de semaines calendaires consécutives comptant au moins
   JOURS_MIN_SEMAINE jours de séance chacune. */
export function semainesConstantes(joursTermines: string[]): number {
  const parSemaine = new Map<number, Set<string>>();
  for (const jour of new Set(joursTermines)) {
    const s = indexSemaine(jour);
    const set = parSemaine.get(s) ?? new Set<string>();
    set.add(jour);
    parSemaine.set(s, set);
  }
  const valides = [...parSemaine.entries()]
    .filter(([, jours]) => jours.size >= JOURS_MIN_SEMAINE)
    .map(([s]) => s)
    .sort((a, b) => a - b);
  let meilleure = 0;
  let courante = 0;
  let precedente: number | null = null;
  for (const s of valides) {
    courante = precedente !== null && s === precedente + 1 ? courante + 1 : 1;
    precedente = s;
    if (courante > meilleure) meilleure = courante;
  }
  return meilleure;
}

export function badgesRegulariteDebloques(joursTermines: string[]): BadgeRegularite[] {
  const out: BadgeRegularite[] = [];
  const serie = serieActuelle(joursTermines);
  for (const n of PALIERS_SERIE) {
    if (serie >= n)
      out.push({
        cle: `reg-serie-${n}`,
        seuil: n,
        titre: `${n} jours d'affilée`,
        legende: "Série de révision maintenue",
      });
  }
  const semaines = semainesConstantes(joursTermines);
  for (const n of PALIERS_HEBDO) {
    if (semaines >= n)
      out.push({
        cle: `reg-hebdo-${n}`,
        seuil: n,
        titre: `${n} semaines à 5 jours ou plus`,
        legende: "Constance hebdomadaire",
      });
  }
  return out;
}
