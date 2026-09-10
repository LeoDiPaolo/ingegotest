import { CORPUS, NIVEAUX_SOUS_THEME, type Famille, type Question, type TypeExo } from "./corpus";

/* ============================================================
   Répétition espacée — repris verbatim de l'artefact IngéGo.
   planifier / niveauActif / entrelacer / composerSession ne
   doivent pas être réécrits : dix mois de calibrage en dépendent.
   ============================================================ */

export interface Carte {
  p: number;
  e: number;
  du: number;
  reps: number;
  echecs: number;
  vu: boolean;
  dernier: number;
}

export type Etat = Record<string, Carte | undefined>;

export interface Reglages {
  axes: string[];
  familles: Famille[];
  types: TypeExo[];
  parSession: number;
  chrono: number;
  cible: "normal" | "fragiles";
}

export const PALIERS = [0, 1, 3, 7, 16, 35, 75, 160];
export const JOUR = 86400000;

export const carteNeuve = (): Carte => ({
  p: 0,
  e: 2.3,
  du: 0,
  reps: 0,
  echecs: 0,
  vu: false,
  dernier: 0,
});

export function planifier(
  c: Carte,
  note: number,
  maintenant: number,
  validationPremierCoup = true,
): Carte {
  const n = { ...c, vu: true, reps: c.reps + 1, dernier: maintenant };
  if (note === 0) {
    n.p = 0;
    n.e = Math.max(1.5, c.e - 0.25);
    n.echecs = c.echecs + 1;
    n.du = maintenant + JOUR; // la reprise à chaud est gérée par la file de session
    return n;
  }
  /* Une réussite après une erreur dans la même mission clôt la reprise à chaud,
     mais ne valide pas la carte. Elle devra être réussie du premier coup lors
     d'une mission ultérieure avant de pouvoir débloquer le niveau suivant. */
  if (!validationPremierCoup) {
    n.p = 0;
    n.du = maintenant + JOUR;
    return n;
  }
  if (note === 1) {
    n.p = Math.max(1, c.p);
    n.e = Math.max(1.5, c.e - 0.12);
  }
  if (note === 2) {
    n.p = Math.min(PALIERS.length - 1, c.p + 1);
  }
  if (note === 3) {
    n.p = Math.min(PALIERS.length - 1, c.p + 2);
    n.e = Math.min(3.0, c.e + 0.12);
  }
  const jours = Math.max(1, Math.round((PALIERS[n.p] || 1) * (n.e / 2.3)));
  n.du = maintenant + jours * JOUR;
  return n;
}

export const validee = (c: Carte | undefined) => !!c && c.p >= 1;

/* Chaque thème avance à son rythme : on ne propose en nouveauté que le plus bas
   niveau non encore validé du thème. Les révisions dues remontent, elles, à tout niveau. */
export function niveauActif(sousTheme: string, etat: Etat) {
  for (const q of NIVEAUX_SOUS_THEME[sousTheme] || []) if (!validee(etat[q.id])) return q.niv;
  return Infinity;
}

export function progressionSousTheme(sousTheme: string, etat: Etat) {
  const questions = NIVEAUX_SOUS_THEME[sousTheme] ?? [];
  const niveau = niveauActif(sousTheme, etat);
  const niveauCourant = Number.isFinite(niveau)
    ? niveau
    : Math.max(1, ...questions.map((q) => q.niv));
  const duNiveau = questions.filter((q) => q.niv === niveauCourant);
  const valideesNiveau = duNiveau.filter((q) => validee(etat[q.id])).length;
  const validees = questions.filter((q) => validee(etat[q.id])).length;
  return {
    niveau: niveauCourant,
    termine: !Number.isFinite(niveau),
    valideesNiveau,
    totalNiveau: duNiveau.length,
    restantesNiveau: Math.max(0, duNiveau.length - valideesNiveau),
    validees,
    total: questions.length,
  };
}

export type EtatCarte = "neuf" | "fragile" | "acquis" | "encours";

export const etatCarte = (c: Carte | undefined): EtatCarte =>
  !c || !c.vu ? "neuf" : c.echecs > 0 && c.p <= 1 ? "fragile" : c.p >= 4 ? "acquis" : "encours";

export function graineDe(s: string) {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) & 0x7fffffff;
  return h || 7;
}

/* Le corpus est majoritairement en choix multiple : sans répartition explicite,
   les premières sessions seraient monotypes. On pioche en ronde, un format après l'autre. */
export function rondeParFormat(liste: Question[]): Question[] {
  const paquets: Record<string, Question[]> = {};
  for (const q of liste) (paquets[q.type] = paquets[q.type] || []).push(q);
  const cles = Object.keys(paquets),
    out: Question[] = [];
  let reste = liste.length;
  while (reste > 0)
    for (const c of cles)
      if (paquets[c].length) {
        out.push(paquets[c].shift()!);
        reste--;
      }
  return out;
}

/* Évite deux questions de suite du même format ou du même axe. */
export function entrelacer(liste: Question[]): Question[] {
  const reste = [...liste],
    out: Question[] = [];
  while (reste.length) {
    const a = out[out.length - 1];
    let i = reste.findIndex((q) => !a || (q.type !== a.type && q.axe !== a.axe));
    if (i === -1) i = reste.findIndex((q) => !a || q.type !== a.type);
    if (i === -1) i = 0;
    out.push(reste.splice(i, 1)[0]);
  }
  return out;
}

/* Répartit une mission selon le poids de chaque sous-thème dans le corpus actif.
   Le plafond d'un thème est son poids arrondi au-dessus : un thème représentant
   10 % du corpus ne peut ainsi fournir qu'une question dans une mission de 8. */
export function repartirParTheme(
  priorite: Question[],
  corpusActif: Question[],
  nombre: number,
): Question[] {
  if (priorite.length <= nombre) return priorite;
  const poids = new Map<string, number>();
  for (const q of corpusActif) poids.set(q.sousTheme, (poids.get(q.sousTheme) ?? 0) + 1);
  const total = Math.max(1, corpusActif.length);
  const plafonds = new Map<string, number>();
  for (const [theme, quantite] of poids)
    plafonds.set(theme, Math.max(1, Math.ceil((quantite / total) * nombre)));

  const selection: Question[] = [];
  const retenues = new Set<string>();
  const compte = new Map<string, number>();
  while (selection.length < nombre) {
    let meilleur: Question | undefined;
    let meilleurScore = Infinity;
    for (let rang = 0; rang < priorite.length; rang++) {
      const q = priorite[rang];
      if (retenues.has(q.id)) continue;
      const pris = compte.get(q.sousTheme) ?? 0;
      const plafond = plafonds.get(q.sousTheme) ?? 1;
      if (pris >= plafond) continue;
      const part = (poids.get(q.sousTheme) ?? 1) / total;
      const score = pris / part + rang / Math.max(1, priorite.length * 100);
      if (score < meilleurScore) {
        meilleur = q;
        meilleurScore = score;
      }
    }
    if (!meilleur) break;
    selection.push(meilleur);
    retenues.add(meilleur.id);
    compte.set(meilleur.sousTheme, (compte.get(meilleur.sousTheme) ?? 0) + 1);
  }
  return selection;
}

export function composerSession(etat: Etat, reglages: Reglages, now: number): Question[] {
  const ouvert = (q: Question) =>
    reglages.axes.includes(q.axe) &&
    reglages.familles.includes(q.fam) &&
    reglages.types.includes(q.type);
  /* Ciblage des cartes fragiles : on ignore les échéances et les nouveautés,
     on reprend uniquement ce qui a été raté et n'est pas reconsolidé. */
  if (reglages.cible === "fragiles") {
    const frag = CORPUS.filter((q) => ouvert(q) && etatCarte(etat[q.id]) === "fragile").sort(
      (a, b) => etat[a.id]!.du - etat[b.id]!.du,
    );
    const actifs = CORPUS.filter(ouvert);
    return entrelacer(repartirParTheme(rondeParFormat(frag), actifs, reglages.parSession));
  }
  const cache: Record<string, number> = {};
  const nivDe = (s: string) =>
    cache[s] !== undefined ? cache[s] : (cache[s] = niveauActif(s, etat));
  const dues: Question[] = [],
    neuves: Question[] = [];
  for (const q of CORPUS) {
    if (!ouvert(q)) continue;
    const c = etat[q.id];
    if (c && c.vu) {
      if (c.du <= now) dues.push(q);
    } else if (q.niv === nivDe(q.sousTheme)) neuves.push(q);
  }
  dues.sort((a, b) => etat[a.id]!.du - etat[b.id]!.du);
  neuves.sort((a, b) => a.niv - b.niv || a.id.localeCompare(b.id));

  const n = reglages.parSession;
  const pool = rondeParFormat(neuves);
  const partNeuves = pool.slice(0, Math.max(1, Math.round(n * 0.4)));
  let lot = [...dues.slice(0, n - partNeuves.length), ...partNeuves];
  if (lot.length < n)
    lot = lot.concat(pool.slice(partNeuves.length, partNeuves.length + (n - lot.length)));
  if (lot.length < n) lot = lot.concat(dues.slice(lot.length, n));
  const actifs = CORPUS.filter(ouvert);
  const candidats = [...lot, ...dues, ...pool].filter(
    (q, index, liste) => liste.findIndex((autre) => autre.id === q.id) === index,
  );
  return entrelacer(repartirParTheme(candidats, actifs, n));
}

export function resteAFaire(etat: Etat, reglages: Reglages, now: number) {
  const ouvert = (q: Question) =>
    reglages.axes.includes(q.axe) &&
    reglages.familles.includes(q.fam) &&
    reglages.types.includes(q.type);
  if (reglages.cible === "fragiles")
    return CORPUS.filter((q) => ouvert(q) && etatCarte(etat[q.id]) === "fragile").length;
  const cache: Record<string, number> = {};
  const nivDe = (s: string) =>
    cache[s] !== undefined ? cache[s] : (cache[s] = niveauActif(s, etat));
  let n = 0;
  for (const q of CORPUS) {
    if (!ouvert(q)) continue;
    const c = etat[q.id];
    if (c && c.vu) {
      if (c.du <= now) n++;
    } else if (q.niv === nivDe(q.sousTheme)) n++;
  }
  return n;
}

/* ---------- OUTILS ---------- */
export function melange<T>(arr: T[], graine: number): T[] {
  const a = [...arr];
  let s = graine;
  const r = () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const jourDe = (t: number) => new Date(t).toISOString().slice(0, 10);

export const REGLAGES_DEFAUT: Reglages = {
  axes: ["A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8"],
  familles: ["S", "M", "E"],
  types: [
    "qcm",
    "libre",
    "ordre",
    "frise",
    "assoc",
    "trous",
    "vf",
    "tri",
    "erreur",
    "carte",
    "graphe",
    "camembert",
    "plan",
    "courbe",
    "organigramme",
    "coupe",
    "synoptique",
    "radar",
    "cycle",
    "echelle",
    "chantier",
    "paroi",
    "pmr",
    "facade",
    "pluvial",
    "curseur",
    "empilement",
    "zonage",
    "circuit",
    "cablage",
  ],
  parSession: 8,
  chrono: 0,
  cible: "normal",
};

const TYPES_OK = REGLAGES_DEFAUT.types;

export function normaliserReglages(r: Partial<Reglages> | null | undefined): Reglages {
  const n: Reglages = { ...REGLAGES_DEFAUT, ...(r || {}) };
  /* L'ancienne valeur par défaut était 12 ; les missions standard passent à 8. */
  if (n.parSession === 12) n.parSession = 8;
  if (!["normal", "fragiles"].includes(n.cible)) n.cible = "normal";
  const existants = (n.types || []).filter((t) => TYPES_OK.includes(t));
  n.types = [...new Set([...existants, ...TYPES_OK])];
  if (!n.axes?.length) n.axes = [...REGLAGES_DEFAUT.axes];
  /* Nouvel axe A8 : on l'active aussi pour les réglages enregistrés avant son ajout. */
  if (!n.axes.includes("A8")) n.axes = [...n.axes, "A8"];
  if (!n.familles?.length) n.familles = [...REGLAGES_DEFAUT.familles];
  return n;
}
