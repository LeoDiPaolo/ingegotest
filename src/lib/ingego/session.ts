import { AXES, CORPUS, type Question } from "./corpus";
import {
  entrelacer,
  etatCarte,
  JOUR,
  repartirParTheme,
  rondeParFormat,
  type Etat,
  type Reglages,
} from "./algo";

/* File de session : une question ratée revient quelques étapes plus loin autant
   de fois que nécessaire. Sa réussite à chaud termine la mission, mais seule
   une réussite au premier passage d'une mission ultérieure la validera. */

export const RECUL = 3; // nombre de questions intercalées avant la reprise à chaud

export interface File {
  ordre: Question[]; // file effective, avec reprises à chaud
  faits: Set<string>; // questions déjà comptées dans la progression
  rates: Record<string, number>; // nombre d'échecs dans la session
}

export const fileNeuve = (questions: Question[]): File => ({
  ordre: [...questions],
  faits: new Set(),
  rates: {},
});

/* Insère la question ratée quelques positions plus loin. S'il ne reste pas
   assez de questions, elle est ajoutée à la fin et bloque ainsi la clôture. */
export function reinjecter(ordre: Question[], position: number, q: Question) {
  const suite = [...ordre];
  const cible = Math.min(suite.length, position + 1 + RECUL);
  suite.splice(cible, 0, q);
  return suite;
}

/* Quand aucune carte n'est due, une nouvelle mission reste possible le même jour.
   Les fragiles passent d'abord afin de pouvoir être validées du premier coup dans
   cette nouvelle mission, puis les cartes les moins récemment travaillées. */
export function composerContinuation(
  etat: Etat,
  reglages: Reglages,
  maintenant: number,
): Question[] {
  const ouvert = (q: Question) =>
    reglages.axes.includes(q.axe) &&
    reglages.familles.includes(q.fam) &&
    reglages.types.includes(q.type);
  const vues = CORPUS.filter((q) => ouvert(q) && etat[q.id]?.vu);
  const fragiles = vues
    .filter((q) => etatCarte(etat[q.id]) === "fragile")
    .sort((a, b) => (etat[a.id]?.dernier ?? 0) - (etat[b.id]?.dernier ?? 0));
  const autres = vues
    .filter((q) => etatCarte(etat[q.id]) !== "fragile")
    .sort((a, b) => (etat[a.id]?.dernier ?? 0) - (etat[b.id]?.dernier ?? 0));
  const actifs = CORPUS.filter(ouvert);
  const graine = Math.floor(maintenant / JOUR);
  const reprises = repartirParTheme(rondeParFormat(fragiles), actifs, reglages.parSession, graine);
  const places = Math.max(0, reglages.parSession - reprises.length);
  const complement = repartirParTheme(rondeParFormat(autres), actifs, places, graine);
  return entrelacer([...reprises, ...complement]);
}

/* Progression par axe : part des questions acquises sur l'ensemble de l'axe. */
export function jaugesParAxe(etat: Etat) {
  return AXES.map((axe) => {
    const qs = CORPUS.filter((q) => q.axe === axe.id);
    const acquises = qs.filter((q) => etatCarte(etat[q.id]) === "acquis").length;
    const encours = qs.filter((q) => {
      const e = etatCarte(etat[q.id]);
      return e === "encours" || e === "fragile";
    }).length;
    return {
      axe,
      total: qs.length,
      acquises,
      encours,
      part: qs.length ? acquises / qs.length : 0,
      partVue: qs.length ? (acquises + encours) / qs.length : 0,
    };
  });
}
