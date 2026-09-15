import {
  CORPUS,
  NIVEAUX_AXE,
  NIVEAUX_SOUS_THEME,
  type Famille,
  type Question,
  type TypeExo,
} from "./corpus";

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

/* Échéance placée à l'infini pour les cartes validées du premier coup :
   elles ne doivent plus jamais être reposées. */
export const JAMAIS = 8.64e15;
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
  /* Réussite du premier coup : la carte est validée définitivement et n'est
     plus jamais reposée. Seules les questions ratées (ou jamais vues) restent
     en jeu jusqu'à leur validation du premier coup. */
  n.p = 1;
  n.du = JAMAIS;
  return n;
}

export const validee = (c: Carte | undefined) => !!c && c.p >= 1;

/* Chaque thème avance à son rythme : on ne propose en nouveauté que le plus bas
   niveau non encore validé du thème. Les révisions dues remontent, elles, à tout niveau. */
export function niveauActif(sousTheme: string, etat: Etat) {
  for (const q of NIVEAUX_SOUS_THEME[sousTheme] || []) if (!validee(etat[q.id])) return q.niv;
  return Infinity;
}

/* Déblocage raisonné par chapitre : tant que 100 % des questions d'un niveau
   d'un chapitre ne sont pas validées, aucune nouveauté d'un niveau supérieur
   n'est proposée, quel que soit le sous-thème. Une question de niveau inférieur
   ajoutée plus tard redevient donc prioritaire pour tout le chapitre. */
export function niveauActifAxe(axe: string, etat: Etat) {
  for (const q of NIVEAUX_AXE[axe] || []) if (!validee(etat[q.id])) return q.niv;
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

/* « Acquis » suit la règle de maîtrise de l'application : une carte validée
   (réussie du premier coup dans une mission) compte comme acquise. */
export const etatCarte = (c: Carte | undefined): EtatCarte =>
  !c || !c.vu ? "neuf" : c.p >= 1 ? "acquis" : c.echecs > 0 ? "fragile" : "encours";

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

/* Répartit une mission au prorata du poids réel de chaque sous-thème disponible.
   Chaque thème reçoit un quota = part du corpus actif × taille de la mission,
   réparti à la plus forte moyenne (partie entière puis restes décroissants).
   Un gros thème (ex. le Guide, ~43 % du corpus) obtient ainsi plusieurs
   questions par mission, alors qu'un petit thème n'en donne qu'une de temps
   en temps : la graine fait tourner les restes d'une mission à l'autre. */
export function repartirParTheme(
  priorite: Question[],
  corpusActif: Question[],
  nombre: number,
  graine = 0,
): Question[] {
  if (priorite.length <= nombre) return priorite;

  /* Seuls les thèmes réellement proposables entrent dans la répartition. */
  const dispo = new Map<string, number>();
  for (const q of priorite) dispo.set(q.sousTheme, (dispo.get(q.sousTheme) ?? 0) + 1);
  const poids = new Map<string, number>();
  for (const q of corpusActif)
    if (dispo.has(q.sousTheme)) poids.set(q.sousTheme, (poids.get(q.sousTheme) ?? 0) + 1);
  for (const theme of dispo.keys()) if (!poids.has(theme)) poids.set(theme, 1);
  const total = Math.max(
    1,
    [...poids.values()].reduce((a, b) => a + b, 0),
  );

  const themes = [...poids.keys()];
  const quotas = new Map<string, number>();
  const restes: { theme: string; reste: number }[] = [];
  let attribues = 0;
  for (const theme of themes) {
    const exact = Math.min(dispo.get(theme) ?? 0, ((poids.get(theme) ?? 1) / total) * nombre);
    const base = Math.floor(exact);
    quotas.set(theme, base);
    attribues += base;
    restes.push({ theme, reste: exact - base });
  }
  /* Tirage pondéré par les restes (course exponentielle) : un thème deux fois
     plus lourd a deux fois plus de chances de prendre la place suivante, sans
     jamais exclure définitivement les petits thèmes. La graine change à chaque
     mission, si bien que la répartition tend vers le poids réel du corpus. */
  const ordonnes = restes
    .map((r) => {
      let x = (graineDe(r.theme) ^ (graine * 2654435761)) >>> 0;
      for (let i = 0; i < 3; i++) x = (Math.imul(x ^ (x >>> 15), 2246822507) + 3266489909) >>> 0;
      const u = (x % 1000000) / 1000000 || 0.000001;

      return { ...r, cle: r.reste > 0 ? -Math.log(u) / r.reste : Infinity };
    })
    .sort((a, b) => a.cle - b.cle);
  for (const r of ordonnes) {
    if (attribues >= nombre) break;
    const dejà = quotas.get(r.theme) ?? 0;
    if (dejà >= (dispo.get(r.theme) ?? 0)) continue;
    quotas.set(r.theme, dejà + 1);
    attribues++;
  }

  const selection: Question[] = [];
  const compte = new Map<string, number>();
  const restant: Question[] = [];
  for (const q of priorite) {
    if (selection.length >= nombre) break;
    const pris = compte.get(q.sousTheme) ?? 0;
    if (pris < (quotas.get(q.sousTheme) ?? 0)) {
      selection.push(q);
      compte.set(q.sousTheme, pris + 1);
    } else restant.push(q);
  }
  /* Complément si un thème n'avait pas assez de questions proposables. */
  for (const q of restant) {
    if (selection.length >= nombre) break;
    selection.push(q);
  }
  return selection;
}

/* Équilibrage des chapitres en pourcentage : chaque place de la mission est
   attribuée au chapitre dont le taux de maîtrise projeté (déjà acquis + places
   déjà réservées dans cette mission) est le plus bas. Le remplissage se fait
   donc par nivellement : un chapitre en retard reçoit les places jusqu'à
   rejoindre les autres, puis les places repassent au suivant. Aucun chapitre
   n'est traité à part : un gros chapitre déjà avancé (Guide) ne revient que
   lorsque son pourcentage redevient le plus bas. En cas d'égalité, les places
   tournent entre les chapitres concernés. À l'intérieur d'un chapitre, la
   répartition reste proportionnelle aux thèmes. */
export function repartirParRetard(
  priorite: Question[],
  corpusActif: Question[],
  etat: Etat,
  nombre: number,
  graine = 0,
): Question[] {
  if (priorite.length <= nombre) return priorite;

  const total = new Map<string, number>();
  const acquises = new Map<string, number>();
  for (const q of corpusActif) {
    total.set(q.axe, (total.get(q.axe) ?? 0) + 1);
    if (validee(etat[q.id])) acquises.set(q.axe, (acquises.get(q.axe) ?? 0) + 1);
  }
  const dispo = new Map<string, Question[]>();
  for (const q of priorite) {
    const l = dispo.get(q.axe) ?? [];
    l.push(q);
    dispo.set(q.axe, l);
  }

  const quotas = new Map<string, number>();
  for (let i = 0; i < nombre; i++) {
    let tauxMinimum = Infinity;
    const axesAuMinimum: string[] = [];
    for (const [axe, liste] of dispo) {
      const pris = quotas.get(axe) ?? 0;
      if (pris >= liste.length) continue;
      const taux = ((acquises.get(axe) ?? 0) + pris) / Math.max(1, t);
      if (taux < tauxMinimum) {
        tauxMinimum = taux;
        axesAuMinimum.length = 0;
        axesAuMinimum.push(axe);
      } else if (taux === tauxMinimum) {
        axesAuMinimum.push(axe);
      }
    }
    /* Parmi les chapitres exactement au même taux, servir d'abord celui qui a
       reçu le moins de places dans cette mission. La graine ne départage que
       l'égalité restante et fait tourner le premier chapitre d'un jour à l'autre. */
    const meilleur = axesAuMinimum.sort((a, b) => {
      const ecartQuota = (quotas.get(a) ?? 0) - (quotas.get(b) ?? 0);
      if (ecartQuota) return ecartQuota;
      const rangA = (graineDe(a) ^ (graine * 2654435761)) >>> 0;
      const rangB = (graineDe(b) ^ (graine * 2654435761)) >>> 0;
      return rangA - rangB || a.localeCompare(b);
    })[0];
    if (!meilleur) break;
    quotas.set(meilleur, (quotas.get(meilleur) ?? 0) + 1);
  }

  const retenus = new Set<string>();
  for (const [axe, liste] of dispo) {
    const quota = quotas.get(axe) ?? 0;
    if (!quota) continue;
    const actifsAxe = corpusActif.filter((q) => q.axe === axe);
    for (const q of repartirParTheme(liste, actifsAxe, quota, graine)) retenus.add(q.id);
  }
  return priorite.filter((q) => retenus.has(q.id)).slice(0, nombre);
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
    return entrelacer(
      repartirParTheme(rondeParFormat(frag), actifs, reglages.parSession, Math.floor(now / JOUR)),
    );
  }
  const cache: Record<string, number> = {};
  const nivDe = (a: string) =>
    cache[a] !== undefined ? cache[a] : (cache[a] = niveauActifAxe(a, etat));
  /* Plus de révisions des cartes validées : une mission ne pioche que parmi
     les questions jamais validées du premier coup (neuves ou déjà ratées). */
  const neuves: Question[] = [];
  for (const q of CORPUS) {
    if (!ouvert(q)) continue;
    const c = etat[q.id];
    if (c && c.vu) {
      if (c.p === 0 && q.niv <= nivDe(q.axe)) neuves.push(q);
    } else if (q.niv <= nivDe(q.axe)) neuves.push(q);
  }
  /* À niveau égal, les cartes travaillées le plus récemment passent en dernier :
     une question ratée ne revient donc pas dès la mission suivante tant qu'il
     reste d'autres questions non validées du même niveau. Les cartes jamais
     vues (dernier = 0) restent servies en premier. */
  neuves.sort(
    (a, b) =>
      a.niv - b.niv ||
      (etat[a.id]?.dernier ?? 0) - (etat[b.id]?.dernier ?? 0) ||
      a.id.localeCompare(b.id),
  );

  const n = reglages.parSession;
  /* Délai de repos : les questions travaillées il y a moins de 12 h passent
     après les autres, mais restent candidates. Les exclure globalement dès que
     huit autres cartes existaient pouvait supprimer entièrement un chapitre en
     retard avant même l'équilibrage des pourcentages. */
  const repos = now - 12 * 3600000;
  const fraiches = neuves.filter((q) => (etat[q.id]?.dernier ?? 0) > repos);
  const reposees = neuves.filter((q) => (etat[q.id]?.dernier ?? 0) <= repos);
  const pool = [...rondeParFormat(reposees), ...rondeParFormat(fraiches)];
  const actifs = CORPUS.filter(ouvert);
  return entrelacer(repartirParRetard(pool, actifs, etat, n, Math.floor(now / JOUR)));
}

export function resteAFaire(etat: Etat, reglages: Reglages, now: number) {
  const ouvert = (q: Question) =>
    reglages.axes.includes(q.axe) &&
    reglages.familles.includes(q.fam) &&
    reglages.types.includes(q.type);
  if (reglages.cible === "fragiles")
    return CORPUS.filter((q) => ouvert(q) && etatCarte(etat[q.id]) === "fragile").length;
  const cache: Record<string, number> = {};
  const nivDe = (a: string) =>
    cache[a] !== undefined ? cache[a] : (cache[a] = niveauActifAxe(a, etat));
  let n = 0;
  for (const q of CORPUS) {
    if (!ouvert(q)) continue;
    const c = etat[q.id];
    if (c && c.vu) {
      if (c.p === 0 && q.niv <= nivDe(q.axe)) n++;
    } else if (q.niv <= nivDe(q.axe)) n++;
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
  axes: ["A1", "A2", "A3", "A4", "A5", "A6", "A7", "A8", "A9"],
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
  /* Nouvel axe A9 (IA et collectivités) : activé aussi pour les réglages antérieurs. */
  if (!n.axes.includes("A9")) n.axes = [...n.axes, "A9"];
  if (!n.familles?.length) n.familles = [...REGLAGES_DEFAUT.familles];
  return n;
}
