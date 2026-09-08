import raw from "@/data/ingego-corpus.json";
import type { DonneesGraphe } from "@/components/ingego/graphe-barres";
import type { DonneesCamembert } from "@/components/ingego/camembert";
import type { DonneesSchema } from "@/components/ingego/schema-plan";
import type { DonneesCourbe } from "@/components/ingego/graphe-courbe";
import type { DonneesOrga } from "@/components/ingego/organigramme";
import type { DonneesCoupe } from "@/components/ingego/coupe-sol";
import type { DonneesSynoptique } from "@/components/ingego/synoptique";
import type { DonneesRadar } from "@/components/ingego/radar";
import type { DonneesCycle } from "@/components/ingego/cycle-vie";
import type { DonneesEchelle } from "@/components/ingego/echelle";
import type { DonneesChantier } from "@/components/ingego/tri-chantier";
import type { DonneesParoi } from "@/components/ingego/coupe-paroi";
import type { DonneesPmr } from "@/components/ingego/parcours-pmr";
import type { DonneesFacade } from "@/components/ingego/facade-solaire";
import type { DonneesPluvial } from "@/components/ingego/plan-pluvial";

export type TypeExo =
  | "qcm"
  | "libre"
  | "ordre"
  | "frise"
  | "assoc"
  | "trous"
  | "vf"
  | "tri"
  | "erreur"
  | "carte"
  | "graphe"
  | "camembert"
  | "plan"
  | "courbe"
  | "organigramme"
  | "coupe"
  | "synoptique"
  | "radar"
  | "cycle"
  | "echelle"
  | "chantier"
  | "paroi"
  | "pmr"
  | "facade"
  | "pluvial";

export type Famille = "S" | "M" | "E";

export interface Question {
  id: string;
  axe: string;
  sousTheme: string;
  stIdx: number;
  sujet: string;
  niveau: number;
  famille: Famille;
  type: TypeExo;
  question: string;
  explication: string;
  derniereVerification?: string | null;
  aVerifier?: string | null;
  /* champs propres aux types */
  options?: string[];
  bonneReponse?: number;
  items?: string[];
  paires?: [string, string][];
  points?: [string, string][];
  texte?: string;
  mots?: string[];
  leurres?: string[];
  vrai?: boolean;
  justification?: string;
  colonnes?: string[];
  elements?: [string, number][];
  segments?: string[];
  phraseFautive?: number;
  /* carte cliquable */
  echelle?: "regions" | "departements";
  bonneZone?: string;
  zonesAutorisees?: string[];
  /* graphique en barres cliquable */
  graphe?: DonneesGraphe;
  bonneBarre?: number;
  /* camembert et schéma cliquables */
  camembert?: DonneesCamembert;
  plan?: DonneesSchema;
  bonneCible?: number;
  /* courbe cliquable */
  courbe?: DonneesCourbe;
  bonnePoint?: number;
  /* organigramme cliquable */
  orga?: DonneesOrga;
  /* coupe de sol, synoptique GTB et radar multicritère cliquables */
  coupe?: DonneesCoupe;
  synoptique?: DonneesSynoptique;
  radar?: DonneesRadar;
  /* cycle de vie et réglette graduée cliquables */
  cycle?: DonneesCycle;
  echelle_g?: DonneesEchelle;
  /* tri de chantier illustré et coupe de paroi cliquables */
  chantier?: DonneesChantier;
  paroi?: DonneesParoi;
  /* cheminement accessible, façades et plan pluvial */
  pmr?: DonneesPmr;
  facade?: DonneesFacade;
  pluvial?: DonneesPluvial;
  correction?: string;
  /* alias courts utilisés par l'algorithme (verbatim de l'artefact) */
  niv: number;
  fam: Famille;
}

export interface Axe {
  id: string;
  nom: string;
  court: string;
  couleur: string;
  sousThemes: string[];
}

interface CorpusFile {
  meta: { application: string; specialite: string; totalQuestions: number; version: string };
  axes: Axe[];
  familles: Record<Famille, { code: Famille; nom: string; desc: string; c: string }>;
  types: Record<TypeExo, string>;
  questions: Omit<Question, "niv" | "fam">[];
}

const file = raw as unknown as CorpusFile;

export const META = file.meta;
export const AXES: Axe[] = file.axes;
export const FAMILLES = file.familles;
export const TYPES = file.types;

const ORDRE_AXE: Record<string, number> = Object.fromEntries(AXES.map((a, i) => [a.id, i]));

/* Ordre de parcours : thème par thème (axe puis sous-thème), et dans chaque thème
   les questions du niveau 1 au niveau le plus élevé. */
export const CORPUS: Question[] = file.questions
  .map((q) => ({
    ...q,
    niv: q.niveau,
    fam: q.famille,
  }))
  .sort(
    (a, b) =>
      (ORDRE_AXE[a.axe] ?? 99) - (ORDRE_AXE[b.axe] ?? 99) ||
      (a.stIdx ?? 0) - (b.stIdx ?? 0) ||
      a.sousTheme.localeCompare(b.sousTheme, "fr") ||
      a.niv - b.niv ||
      a.sujet.localeCompare(b.sujet, "fr") ||
      a.id.localeCompare(b.id),
  );

export const AXE_BY_ID: Record<string, Axe> = Object.fromEntries(AXES.map((a) => [a.id, a]));
export const Q_BY_ID: Record<string, Question> = Object.fromEntries(CORPUS.map((q) => [q.id, q]));

/* Chaque thème avance à son rythme : liste des questions d'un sujet triées par niveau. */
export const NIVEAUX_SUJET: Record<string, Question[]> = {};
for (const q of CORPUS) (NIVEAUX_SUJET[q.sujet] = NIVEAUX_SUJET[q.sujet] || []).push(q);
Object.values(NIVEAUX_SUJET).forEach((l) => l.sort((a, b) => a.niv - b.niv));

export const NIVEAUX_SOUS_THEME: Record<string, Question[]> = {};
for (const q of CORPUS)
  (NIVEAUX_SOUS_THEME[q.sousTheme] = NIVEAUX_SOUS_THEME[q.sousTheme] || []).push(q);
Object.values(NIVEAUX_SOUS_THEME).forEach((l) => l.sort((a, b) => a.niv - b.niv));

/* Ancienneté en mois d'une date de vérification "AAAA-MM". */
export function moisDepuis(maj: string | null | undefined, now: number) {
  if (!maj) return Infinity;
  const [a, m] = maj.split("-").map(Number);
  const d = new Date(now);
  return (d.getFullYear() - a) * 12 + (d.getMonth() + 1 - m);
}

export const mouvantsARevoir = (now: number) =>
  CORPUS.filter((q) => q.fam === "M" && moisDepuis(q.derniereVerification, now) >= 6);

export const attendue = (q: Question) =>
  q.type === "libre"
    ? (q.options?.[q.bonneReponse ?? 0] ?? "")
    : q.type === "vf"
      ? (q.justification ?? "")
      : "";
