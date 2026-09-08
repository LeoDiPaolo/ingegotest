import { useMemo, useState } from "react";
import {
  ArrowRight,
  ArrowDown,
  ArrowUp,
  BarChart3,
  Check,
  ClipboardCheck,
  Clock3,
  MessageSquareText,
  X,
} from "lucide-react";
import { AXE_BY_ID, FAMILLES, TYPES, type Question } from "@/lib/ingego/corpus";
import { graineDe, melange } from "@/lib/ingego/algo";
import { CarteFrance } from "@/components/ingego/carte-france";
import { GrapheBarres } from "@/components/ingego/graphe-barres";
import { Camembert } from "@/components/ingego/camembert";
import { SchemaPlan } from "@/components/ingego/schema-plan";
import { GrapheCourbe } from "@/components/ingego/graphe-courbe";
import { Organigramme } from "@/components/ingego/organigramme";
import { CoupeSol } from "@/components/ingego/coupe-sol";
import { Synoptique } from "@/components/ingego/synoptique";
import { Radar } from "@/components/ingego/radar";
import { CycleVie } from "@/components/ingego/cycle-vie";
import { Echelle } from "@/components/ingego/echelle";
import { TriChantier } from "@/components/ingego/tri-chantier";
import { CoupeParoi } from "@/components/ingego/coupe-paroi";
import { ParcoursPmr } from "@/components/ingego/parcours-pmr";
import { FacadeSolaire } from "@/components/ingego/facade-solaire";
import { PlanPluvial } from "@/components/ingego/plan-pluvial";
import { Curseur } from "@/components/ingego/curseur";
import { Empilement } from "@/components/ingego/empilement";
import { Zonage } from "@/components/ingego/zonage";
import { Circuit } from "@/components/ingego/circuit";
import { Cablage } from "@/components/ingego/cablage";
import { IconeAxe } from "@/components/ingego/univers";
import { Button } from "@/components/ui/button";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

type Reponse = unknown;

/* Un mélange qui ne redonne jamais l'ordre d'origine : sinon la bonne réponse
   est déjà affichée telle quelle (remarque de relecture). */
function melangeStrict<T>(liste: T[], graine: number): T[] {
  if (liste.length < 2) return [...liste];
  let out = melange(liste, graine);
  let essai = 1;
  while (out.every((v, i) => v === liste[i]) && essai < 8)
    out = melange(liste, graine + essai++ * 977);
  if (out.every((v, i) => v === liste[i])) out = [...liste.slice(1), liste[0]];
  return out;
}

const AUTO_NOTE = ["libre", "vf"];

const CONSIGNES: Record<Question["type"], string> = {
  qcm: "Prenez une décision",
  libre: "Préparez votre réponse au jury",
  ordre: "Remettez l'opération dans le bon ordre",
  frise: "Reconstituez la chronologie",
  assoc: "Reliez les bons repères",
  trous: "Complétez le document",
  vf: "Contrôlez cette affirmation",
  tri: "Classez les éléments",
  erreur: "Repérez l'anomalie",
  carte: "Localisez la bonne zone",
  graphe: "Analysez les données",
  camembert: "Identifiez la bonne part",
  plan: "Intervenez sur le plan",
  courbe: "Lisez le bon point",
  organigramme: "Identifiez le bon acteur",
  coupe: "Diagnostiquez la coupe",
  synoptique: "Suivez le système",
  radar: "Arbitrez les critères",
  cycle: "Situez l'étape",
  echelle: "Placez le bon niveau",
  chantier: "Affectez chaque élément",
  paroi: "Inspectez la paroi",
  pmr: "Contrôlez le cheminement",
  facade: "Analysez les façades",
  pluvial: "Organisez la gestion des eaux",
  curseur: "Réglez le curseur sur la bonne valeur",
  empilement: "Composez la coupe couche par couche",
  zonage: "Zonez le plan de masse",
  circuit: "Tracez le circuit dans le bon ordre",
  cablage: "Raccordez chaque repère",
};

const CONTEXTES: Partial<Record<Question["type"], string>> = {
  qcm: "Décision à prendre",
  vf: "Contrôle de conformité",
  erreur: "Inspection d'un dossier",
  ordre: "Préparation d'une intervention",
  frise: "Reconstitution du calendrier",
  assoc: "Raccordement des responsabilités",
  tri: "Organisation du terrain",
  libre: "Passage devant le jury",
  curseur: "Réglage sur site",
  empilement: "Composition d'ouvrage",
  zonage: "Étude d'implantation",
  circuit: "Circuit de décision",
  cablage: "Raccordement des repères",
};

function initiale(q: Question): Reponse {
  switch (q.type) {
    case "ordre":
      return melangeStrict(q.items ?? [], graineDe(q.id));
    case "libre":
      return "";
    case "curseur":
      return null;
    case "empilement":
    case "circuit":
      return [] as number[];
    case "zonage":
    case "cablage":
      return {} as Record<string, number>;
    case "frise":
    case "assoc":
    case "trous":
    case "tri":
    case "chantier":
    case "facade":
    case "pluvial":
      return {} as Record<string, number | string>;
    default:
      return null;
  }
}

function complet(q: Question, rep: Reponse): boolean {
  switch (q.type) {
    case "qcm":
    case "erreur":
    case "vf":
    case "carte":
    case "graphe":
    case "camembert":
    case "plan":
    case "courbe":
    case "organigramme":
    case "coupe":
    case "synoptique":
    case "radar":
    case "cycle":
    case "echelle":
    case "paroi":
    case "pmr":
      return rep !== null;
    case "libre":
      return true;
    case "ordre":
      return true;
    case "frise":
      return Object.keys(rep as object).length === (q.points ?? []).length;
    case "assoc":
      return Object.keys(rep as object).length === (q.paires ?? []).length;
    case "trous":
      return Object.keys(rep as object).length === (q.mots ?? []).length;
    case "tri":
      return Object.keys(rep as object).length === (q.elements ?? []).length;
    case "chantier":
      return Object.keys(rep as object).length === (q.chantier?.depots ?? []).length;
    case "facade":
      return Object.keys(rep as object).length === (q.facade?.faces ?? []).length;
    case "pluvial":
      return Object.keys(rep as object).length === (q.pluvial?.ouvrages ?? []).length;
    case "curseur":
      return rep !== null;
    case "empilement":
      return (rep as number[]).length === (q.empilement?.couches ?? []).length;
    case "circuit":
      return (rep as number[]).length === (q.circuit?.chemin ?? []).length;
    case "zonage":
      return Object.keys(rep as object).length === (q.zonage?.cellules ?? []).length;
    case "cablage":
      return Object.keys(rep as object).length === (q.cablage?.gauche ?? []).length;
    default:
      return false;
  }
}

function juste(q: Question, rep: Reponse): boolean {
  const m = rep as Record<string, number>;
  switch (q.type) {
    case "qcm":
      return rep === q.bonneReponse;
    case "erreur":
      return rep === q.phraseFautive;
    case "vf":
      return rep === q.vrai;
    case "carte":
      return rep === q.bonneZone;
    case "graphe":
      return rep === q.bonneBarre;
    case "camembert":
    case "plan":
    case "organigramme":
    case "coupe":
    case "synoptique":
    case "radar":
    case "cycle":
    case "echelle":
    case "paroi":
    case "pmr":
      return rep === q.bonneCible;
    case "courbe":
      return rep === q.bonnePoint;
    case "ordre":
      return (rep as string[]).every((s, i) => s === (q.items ?? [])[i]);
    case "frise":
      return (q.points ?? []).every((_, i) => m[i] === i);
    case "assoc":
      return (q.paires ?? []).every((_, i) => m[i] === i);
    case "trous":
      return (q.mots ?? []).every((mot, i) => (rep as Record<string, string>)[i] === mot);
    case "tri":
      return (q.elements ?? []).every((el, i) => m[i] === el[1]);
    case "chantier":
      return (q.chantier?.depots ?? []).every((d, i) => m[i] === d.col);
    case "facade":
      return (q.facade?.faces ?? []).every((f, i) => m[i] === f.col);
    case "pluvial":
      return (q.pluvial?.ouvrages ?? []).every((o, i) => m[i] === o.col);
    case "curseur":
      return (
        rep !== null &&
        Math.abs((rep as number) - (q.curseur?.cible ?? 0)) <= (q.curseur?.tolerance ?? 0)
      );
    case "empilement":
      return (q.empilement?.couches ?? []).every((_, i) => (rep as number[])[i] === i);
    case "circuit":
      return (q.circuit?.chemin ?? []).every((e, i) => (rep as number[])[i] === e);
    case "zonage":
      return (q.zonage?.cellules ?? []).every((c, i) => m[i] === c.cat);
    case "cablage":
      return (q.cablage?.gauche ?? []).every((_, i) => m[i] !== undefined);
    default:
      return false;
  }
}

/* Notation partielle : sur les formats à plusieurs éléments (association, tri,
   remise en ordre, frise, texte à trous), la part d'éléments corrects évite le
   tout-ou-rien qui pénaliserait ces formats face à un simple QCM. */
export function partJuste(q: Question, rep: unknown): number {
  const m = rep as Record<string, number>;
  const ratio = (bons: number, total: number) => (total ? bons / total : 0);
  switch (q.type) {
    case "ordre": {
      const l = (rep as string[]) ?? [];
      const items = q.items ?? [];
      return ratio(items.filter((it, i) => l[i] === it).length, items.length);
    }
    case "frise":
      return ratio((q.points ?? []).filter((_, i) => m[i] === i).length, (q.points ?? []).length);
    case "assoc":
      return ratio((q.paires ?? []).filter((_, i) => m[i] === i).length, (q.paires ?? []).length);
    case "trous": {
      const r = rep as Record<string, string>;
      const mots = q.mots ?? [];
      return ratio(mots.filter((mot, i) => r[i] === mot).length, mots.length);
    }
    case "tri":
      return ratio(
        (q.elements ?? []).filter((el, i) => m[i] === el[1]).length,
        (q.elements ?? []).length,
      );
    case "chantier":
      return ratio(
        (q.chantier?.depots ?? []).filter((d, i) => m[i] === d.col).length,
        (q.chantier?.depots ?? []).length,
      );
    case "facade":
      return ratio(
        (q.facade?.faces ?? []).filter((f, i) => m[i] === f.col).length,
        (q.facade?.faces ?? []).length,
      );
    case "pluvial":
      return ratio(
        (q.pluvial?.ouvrages ?? []).filter((o, i) => m[i] === o.col).length,
        (q.pluvial?.ouvrages ?? []).length,
      );
    default:
      return juste(q, rep) ? 1 : 0;
  }
}

const optionClass = (etat: "neutre" | "choisi" | "ok" | "ko") =>
  cn(
    "tap w-full rounded-xl border-2 px-3 py-2.5 text-left text-sm font-medium leading-snug transition-all duration-150 active:scale-[0.98] sm:rounded-2xl sm:px-4 sm:py-3.5",
    etat === "neutre" && "border-border bg-elevated text-foreground hover:border-primary/40",
    etat === "choisi" && "border-primary bg-primary/15 text-foreground shadow-[var(--shadow-card)]",
    etat === "ok" && "anim-pop border-success bg-success/15 text-foreground",
    etat === "ko" && "anim-tremble border-destructive bg-destructive/15 text-foreground",
  );

const selectClass =
  "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring";

const MASQUE = "\u0001";

/* Les explications juridiques sont pleines de « article L. 551-1 », « art. 3 », « n° 2019-1 » :
   on masque ces points d'abréviation avant de découper en phrases, sinon la liste
   « En savoir plus » commence par des fragments comme « 551-1 du code… ». */
function masquerAbreviations(texte: string) {
  return texte.replace(
    /(?<=(?:^|[\s(])(?:[A-Za-zÀ-ÿ]|art|arts|al|cf|etc|env|no|n°|p|pp|ex|réf|éd|fig|vol|chap))\.(?=\s)/gu,
    MASQUE,
  );
}

const demasquer = (t: string) => t.split(MASQUE).join(".");

function phrasesDe(texte: string) {
  return masquerAbreviations(texte.replace(/\s+/g, " ").trim())
    .split(/(?<=[.!?])\s+(?=[A-ZÀ-ÖØ-Þ«“])/u)
    .map((p) => demasquer(p).trim())
    .filter(Boolean)
    .map((p) => (/[^.!?»)]$/u.test(p) ? `${p}.` : p));
}

/* Le bloc « ce qu'il faut retenir » est un résumé du contenu détaillé :
   les premières phrases complètes, jamais un fragment coupé au milieu. */
function decouperExplication(texte: string) {
  const phrases = phrasesDe(texte);
  if (phrases.length === 0) return { essentiel: texte, details: [] as string[] };

  const resume: string[] = [];
  for (const phrase of phrases) {
    const longueur = resume.join(" ").length;
    if (resume.length > 0 && (longueur >= 160 || longueur + phrase.length > 320)) break;
    resume.push(phrase);
  }

  /* Le détail ne répète pas le résumé : « en savoir plus » reprend uniquement
     les phrases qui ne sont pas déjà affichées au-dessus. */
  const details = phrases.slice(resume.length);
  return { essentiel: resume.join(" "), details };
}

function reperesPourcentages(texte: string) {
  const reperes = Array.from(texte.matchAll(/(\d{1,3})\s*%\s+en\s+(\d{4})/gu)).map((match) => ({
    valeur: Number(match[1]),
    label: match[2],
  }));
  return reperes.length >= 2 && reperes.every((repere) => repere.valeur <= 100) ? reperes : [];
}

function TableauAssociation({ paires }: { paires: [string, string][] }) {
  return (
    <div className="overflow-hidden rounded-lg border border-border">
      <table className="w-full table-fixed border-collapse text-left text-xs sm:text-sm">
        <thead className="bg-muted text-muted-foreground">
          <tr>
            <th scope="col" className="w-2/5 px-3 py-2 font-medium">
              Repère
            </th>
            <th scope="col" className="px-3 py-2 font-medium">
              À retenir
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {paires.map(([repere, contenu]) => (
            <tr key={`${repere}-${contenu}`} className="align-top">
              <th scope="row" className="px-3 py-2.5 font-medium text-foreground">
                {repere}
              </th>
              <td className="px-3 py-2.5 leading-relaxed text-muted-foreground">{contenu}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Chronologie({ points }: { points: [string, string][] }) {
  return (
    <ol className="space-y-3 border-l border-primary/40 pl-4 text-sm">
      {points.map(([date, evenement]) => (
        <li key={`${date}-${evenement}`} className="relative">
          <span className="absolute -left-[1.22rem] top-1.5 h-2 w-2 rounded-full bg-primary" />
          <p className="font-medium text-primary">{date}</p>
          <p className="mt-0.5 leading-relaxed text-muted-foreground">{evenement}</p>
        </li>
      ))}
    </ol>
  );
}

function ReperesChiffres({ reperes }: { reperes: { valeur: number; label: string }[] }) {
  return (
    <div className="space-y-2.5" aria-label="Repères chiffrés">
      {reperes.map((repere) => (
        <div
          key={`${repere.label}-${repere.valeur}`}
          className="grid grid-cols-[3rem_1fr_3rem] items-center gap-2 text-xs"
        >
          <span className="font-medium text-muted-foreground">{repere.label}</span>
          <span className="h-2 overflow-hidden rounded-full bg-muted">
            <span
              className="block h-full rounded-full bg-primary"
              style={{ width: `${repere.valeur}%` }}
            />
          </span>
          <span className="text-right font-semibold tabular-nums text-foreground">
            {repere.valeur} %
          </span>
        </div>
      ))}
    </div>
  );
}

function ExplicationStructuree({ q }: { q: Question }) {
  const texte = q.explication;
  const { essentiel, details } = useMemo(() => decouperExplication(texte), [texte]);
  const pourcentages = useMemo(() => reperesPourcentages(texte), [texte]);
  const tableau = q.type === "assoc" && (q.paires?.length ?? 0) >= 2 ? q.paires : undefined;
  const chronologie = q.type === "frise" && (q.points?.length ?? 0) >= 2 ? q.points : undefined;
  const avecComplements = details.length > 0 || tableau || chronologie || pourcentages.length > 0;

  return (
    <div className="mt-2 space-y-3">
      <p className="border-l-2 border-primary pl-3 text-[0.82rem] leading-5 sm:text-sm sm:leading-relaxed">
        {essentiel}
      </p>
      {avecComplements ? (
        <Accordion type="single" collapsible>
          <AccordionItem value="details" className="rounded-lg border border-border px-3">
            <AccordionTrigger className="py-3 text-primary hover:no-underline">
              En savoir plus
            </AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                {details.length > 0 ? (
                  <ul className="space-y-2.5 text-sm leading-relaxed text-foreground">
                    {details.map((detail, index) => (
                      <li key={`${index}-${detail.slice(0, 24)}`} className="flex gap-2.5">
                        <span
                          aria-hidden="true"
                          className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand"
                        />
                        <span>{detail}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}
                {tableau ? (
                  <section aria-label="Tableau de synthèse" className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground uppercase">
                      Tableau de synthèse
                    </p>
                    <TableauAssociation paires={tableau} />
                  </section>
                ) : null}
                {chronologie ? (
                  <section aria-label="Chronologie" className="space-y-2">
                    <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase">
                      <Clock3 className="h-3.5 w-3.5" /> Chronologie
                    </p>
                    <Chronologie points={chronologie} />
                  </section>
                ) : null}
                {pourcentages.length > 0 ? (
                  <section aria-label="Repères chiffrés" className="space-y-2">
                    <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase">
                      <BarChart3 className="h-3.5 w-3.5" /> Repères chiffrés
                    </p>
                    <ReperesChiffres reperes={pourcentages} />
                  </section>
                ) : null}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      ) : null}
    </div>
  );
}

export function Exercice({
  q,
  numero,
  total,
  onNote,
  onCorrige,
  commentaire = "",
  onCommentaire,
  reprise = false,
}: {
  q: Question;
  numero: number;
  total: number;
  onNote: (note: number, juste: boolean) => void;
  onCorrige?: (juste: boolean, part: number) => void;
  commentaire?: string;
  onCommentaire?: (texte: string) => void;
  reprise?: boolean;
}) {
  const [rep, setRep] = useState<Reponse>(() => initiale(q));
  const [corrige, setCorrige] = useState(false);
  const [observation, setObservation] = useState(commentaire);

  const axe = AXE_BY_ID[q.axe];
  const famille = FAMILLES[q.fam];
  const estJuste = useMemo(() => (corrige ? juste(q, rep) : false), [corrige, q, rep]);
  const part = useMemo(() => (corrige ? partJuste(q, rep) : 0), [corrige, q, rep]);
  const autoNote = AUTO_NOTE.includes(q.type);

  const melangeMots = useMemo(
    () => melange([...new Set([...(q.mots ?? []), ...(q.leurres ?? [])])], graineDe(q.id)),
    [q],
  );
  const melangeDroite = useMemo(
    () =>
      melange(
        (q.paires ?? []).map((p, i) => ({ texte: p[1], i })),
        graineDe(q.id + "d"),
      ),
    [q],
  );
  const melangeFrise = useMemo(
    () =>
      melange(
        (q.points ?? []).map((p, i) => ({ texte: p[1], i })),
        graineDe(q.id + "f"),
      ),
    [q],
  );
  /* Les options d'un QCM, les intitulés à associer et les éléments à trier sont
     stockés dans l'ordre logique du corpus : on les présente mélangés pour que
     la bonne réponse ne soit pas devinable à sa position. */
  const melangeOptions = useMemo(
    () =>
      melangeStrict(
        (q.options ?? []).map((texte, i) => ({ texte, i })),
        graineDe(q.id + "o"),
      ),
    [q],
  );
  const melangeGauche = useMemo(
    () =>
      melangeStrict(
        (q.paires ?? []).map((paire, i) => ({ paire, i })),
        graineDe(q.id + "g"),
      ),
    [q],
  );
  const melangeElements = useMemo(
    () =>
      melangeStrict(
        (q.elements ?? []).map((el, i) => ({ el, i })),
        graineDe(q.id + "t"),
      ),
    [q],
  );

  const setMap = (cle: number, valeur: number | string) =>
    setRep((r: Reponse) => ({ ...(r as object), [cle]: valeur }));

  function deplacer(i: number, d: number) {
    setRep((r: Reponse) => {
      const l = [...(r as string[])];
      const j = i + d;
      if (j < 0 || j >= l.length) return l;
      [l[i], l[j]] = [l[j], l[i]];
      return l;
    });
  }

  return (
    <article className={cn("exercice-compact space-y-2 sm:space-y-4", corrige && "est-corrige")}>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-1.5 sm:flex sm:gap-3">
        <IconeAxe axe={axe} className="hidden h-8 w-8 shrink-0 sm:block sm:h-11 sm:w-11" />
        <div className="flex min-w-0 items-center gap-1.5 text-[0.68rem] sm:flex-1 sm:flex-wrap">
          <span
            className="min-w-0 truncate rounded-full px-2 py-0.5 font-semibold sm:px-2.5 sm:py-1"
            style={{ backgroundColor: `${axe.couleur}22`, color: axe.couleur }}
          >
            {axe.court} · {q.sousTheme}
          </span>
          <span className="hidden rounded-full bg-elevated px-2 py-0.5 text-muted-foreground sm:inline sm:px-2.5 sm:py-1">
            {TYPES[q.type]}
          </span>
          <span className="ml-auto hidden text-muted-foreground sm:inline">
            {numero} / {total}
          </span>
        </div>
        <span
          className="shrink-0 rounded-full bg-elevated px-2 py-0.5 text-[0.68rem] font-semibold text-foreground sm:px-2.5 sm:py-1"
          aria-label={`Niveau de difficulté ${q.niveau} sur 10`}
        >
          <span className="sm:hidden">Niv. {q.niveau}</span>
          <span className="hidden sm:inline">Niveau {q.niveau} / 10</span>
        </span>
      </div>

      {reprise ? (
        <div className="anim-pop flex items-center justify-between rounded-lg border border-brand/35 bg-brand/10 px-3 py-1.5 text-xs">
          <span className="font-bold text-brand">Reprise à chaud</span>
          <span className="text-muted-foreground">Réussissez pour terminer la mission</span>
        </div>
      ) : null}

      <div className="mission-strip rounded-r-xl bg-primary/[0.055] px-3 py-2 sm:px-4 sm:py-3">
        <div className="mb-0.5 flex items-center justify-between gap-2 sm:mb-1">
          <p className="flex items-center gap-1.5 text-[0.62rem] font-extrabold tracking-[0.12em] text-brand uppercase sm:text-[0.65rem]">
            <ClipboardCheck className="h-3.5 w-3.5" /> {CONSIGNES[q.type]}
          </p>
          <span className="hidden text-[0.62rem] font-semibold text-muted-foreground sm:inline">
            {CONTEXTES[q.type] ?? "Mission technique"}
          </span>
        </div>
        <h2 className="text-base leading-snug sm:text-xl">{q.question}</h2>
      </div>

      {/* ---------- SAISIE ---------- */}
      {q.type === "qcm" && (
        <div className="space-y-1.5 sm:space-y-2">
          {melangeOptions
            .filter(({ i }) => !corrige || i === q.bonneReponse || i === rep)
            .map(({ texte: o, i }) => (
              <button
                key={i}
                disabled={corrige}
                onClick={() => setRep(i)}
                className={optionClass(
                  corrige
                    ? i === q.bonneReponse
                      ? "ok"
                      : rep === i
                        ? "ko"
                        : "neutre"
                    : rep === i
                      ? "choisi"
                      : "neutre",
                )}
              >
                {o}
              </button>
            ))}
        </div>
      )}

      {q.type === "carte" && (
        <CarteFrance
          echelle={q.echelle ?? "regions"}
          selection={(rep as string | null) ?? null}
          onSelect={(code) => setRep(code || null)}
          bonneZone={q.bonneZone}
          corrige={corrige}
          codesAutorises={q.zonesAutorisees}
        />
      )}

      {q.type === "graphe" && q.graphe && (
        <GrapheBarres
          donnees={q.graphe}
          selection={rep as number | null}
          onSelect={(i) => setRep(i)}
          bonneBarre={q.bonneBarre}
          corrige={corrige}
        />
      )}

      {q.type === "camembert" && q.camembert && (
        <Camembert
          donnees={q.camembert}
          selection={rep as number | null}
          onSelect={(i) => setRep(i)}
          bonneCible={q.bonneCible}
          corrige={corrige}
        />
      )}

      {q.type === "plan" && q.plan && (
        <SchemaPlan
          donnees={q.plan}
          selection={rep as number | null}
          onSelect={(i) => setRep(i)}
          bonneCible={q.bonneCible}
          corrige={corrige}
        />
      )}

      {q.type === "courbe" && q.courbe && (
        <GrapheCourbe
          donnees={q.courbe}
          selection={rep as number | null}
          onSelect={(i) => setRep(i)}
          bonnePoint={q.bonnePoint}
          corrige={corrige}
        />
      )}

      {q.type === "organigramme" && q.orga && (
        <Organigramme
          donnees={q.orga}
          selection={rep as number | null}
          onSelect={(i) => setRep(i)}
          bonneCible={q.bonneCible}
          corrige={corrige}
        />
      )}

      {q.type === "coupe" && q.coupe && (
        <CoupeSol
          donnees={q.coupe}
          selection={rep as number | null}
          onSelect={(i) => setRep(i)}
          bonneCible={q.bonneCible}
          corrige={corrige}
        />
      )}

      {q.type === "synoptique" && q.synoptique && (
        <Synoptique
          donnees={q.synoptique}
          selection={rep as number | null}
          onSelect={(i) => setRep(i)}
          bonneCible={q.bonneCible}
          corrige={corrige}
        />
      )}

      {q.type === "radar" && q.radar && (
        <Radar
          donnees={q.radar}
          selection={rep as number | null}
          onSelect={(i) => setRep(i)}
          bonneCible={q.bonneCible}
          corrige={corrige}
        />
      )}

      {q.type === "cycle" && q.cycle && (
        <CycleVie
          donnees={q.cycle}
          selection={rep as number | null}
          onSelect={(i) => setRep(i)}
          bonneCible={q.bonneCible}
          corrige={corrige}
        />
      )}

      {q.type === "echelle" && q.echelle_g && (
        <Echelle
          donnees={q.echelle_g}
          selection={rep as number | null}
          onSelect={(i) => setRep(i)}
          bonneCible={q.bonneCible}
          corrige={corrige}
        />
      )}

      {q.type === "chantier" && q.chantier && (
        <TriChantier
          donnees={q.chantier}
          reponses={rep as Record<string, number>}
          onAffecter={(i, col) => setMap(i, col)}
          corrige={corrige}
        />
      )}

      {q.type === "paroi" && q.paroi && (
        <CoupeParoi
          donnees={q.paroi}
          selection={rep as number | null}
          onSelect={(i) => setRep(i)}
          bonneCible={q.bonneCible}
          corrige={corrige}
        />
      )}

      {q.type === "pmr" && q.pmr && (
        <ParcoursPmr
          donnees={q.pmr}
          selection={rep as number | null}
          onSelect={(i) => setRep(i)}
          bonneCible={q.bonneCible}
          corrige={corrige}
        />
      )}

      {q.type === "facade" && q.facade && (
        <FacadeSolaire
          donnees={q.facade}
          reponses={rep as Record<string, number>}
          onAffecter={(i, col) => setMap(i, col)}
          corrige={corrige}
        />
      )}

      {q.type === "pluvial" && q.pluvial && (
        <PlanPluvial
          donnees={q.pluvial}
          reponses={rep as Record<string, number>}
          onAffecter={(i, col) => setMap(i, col)}
          corrige={corrige}
        />
      )}

      {q.type === "erreur" && (
        <div className="space-y-2">
          {(q.segments ?? [])
            .map((s, i) => ({ s, i }))
            .filter(({ i }) => !corrige || i === q.phraseFautive || i === rep)
            .map(({ s, i }) => (
              <button
                key={i}
                disabled={corrige}
                onClick={() => setRep(i)}
                className={optionClass(
                  corrige
                    ? i === q.phraseFautive
                      ? "ok"
                      : rep === i
                        ? "ko"
                        : "neutre"
                    : rep === i
                      ? "choisi"
                      : "neutre",
                )}
              >
                {corrige && i === q.phraseFautive ? (
                  <span className="mb-1 block text-[0.68rem] font-semibold tracking-[0.12em] text-success uppercase">
                    Phrase fautive
                  </span>
                ) : null}
                {s}
              </button>
            ))}
          <p className="text-xs text-muted-foreground">
            Les phrases se lisent à la suite. Touchez celle qui est fautive : en correction, elle
            apparaît en vert, et votre choix erroné éventuel en rouge.
          </p>
        </div>
      )}

      {q.type === "vf" && (
        <div className="grid grid-cols-2 gap-2">
          {[true, false].map((v) => (
            <button
              key={String(v)}
              disabled={corrige}
              onClick={() => setRep(v)}
              className={optionClass(
                corrige
                  ? v === q.vrai
                    ? "ok"
                    : rep === v
                      ? "ko"
                      : "neutre"
                  : rep === v
                    ? "choisi"
                    : "neutre",
              )}
            >
              <span className="font-semibold">{v ? "Vrai" : "Faux"}</span>
            </button>
          ))}
        </div>
      )}

      {q.type === "libre" && (
        <textarea
          value={rep as string}
          onChange={(e) => setRep(e.target.value)}
          disabled={corrige}
          rows={6}
          placeholder="Formulez votre réponse comme devant un jury, puis comparez."
          className="w-full rounded-xl border border-input bg-background p-3 text-base leading-relaxed text-foreground outline-none focus:border-ring"
        />
      )}

      {q.type === "ordre" && (
        <ol className="space-y-2">
          {(rep as string[]).map((s, i) => (
            <li
              key={s}
              className={cn(
                "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2 rounded-xl border px-3 py-2.5 text-sm",
                corrige
                  ? s === (q.items ?? [])[i]
                    ? "border-success bg-success/10"
                    : "border-destructive bg-destructive/10"
                  : "border-border bg-elevated",
              )}
            >
              <span className="min-w-0">
                <span className="mr-2 text-muted-foreground">{i + 1}.</span>
                {s}
              </span>
              {!corrige && (
                <span className="flex shrink-0 gap-1">
                  <button
                    onClick={() => deplacer(i, -1)}
                    className="tap rounded-md bg-background p-1.5"
                    aria-label="Monter"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => deplacer(i, 1)}
                    className="tap rounded-md bg-background p-1.5"
                    aria-label="Descendre"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                </span>
              )}
            </li>
          ))}
        </ol>
      )}

      {q.type === "ordre" && corrige && !estJuste && (
        <div className="rounded-xl border border-success/40 bg-success/10 p-3">
          <p className="text-[0.68rem] tracking-[0.15em] text-muted-foreground uppercase">
            Ordre attendu
          </p>
          <ol className="mt-2 space-y-1.5">
            {(q.items ?? []).map((s, i) => (
              <li key={s} className="text-sm leading-snug">
                <span className="mr-2 text-muted-foreground">{i + 1}.</span>
                {s}
              </li>
            ))}
          </ol>
        </div>
      )}

      {q.type === "frise" && (
        <div className="space-y-2">
          {(q.points ?? []).map((p, i) => {
            const choisi = (rep as Record<string, number>)[i];
            return (
              <div
                key={i}
                className={cn(
                  "rounded-xl border p-3",
                  corrige
                    ? choisi === i
                      ? "border-success bg-success/10"
                      : "border-destructive bg-destructive/10"
                    : "border-border bg-elevated",
                )}
              >
                <p className="font-display text-lg">{p[0]}</p>
                {corrige ? (
                  <p className="mt-1 text-sm text-muted-foreground">{p[1]}</p>
                ) : (
                  <select
                    value={choisi ?? ""}
                    onChange={(e) => setMap(i, Number(e.target.value))}
                    className={cn(selectClass, "mt-2")}
                  >
                    <option value="">Choisir l'événement…</option>
                    {melangeFrise.map((o) => (
                      <option key={o.i} value={o.i}>
                        {o.texte}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            );
          })}
        </div>
      )}

      {q.type === "assoc" && (
        <div className="space-y-2">
          {melangeGauche.map(({ paire: p, i }) => {
            const choisi = (rep as Record<string, number>)[i];
            return (
              <div
                key={i}
                className={cn(
                  "rounded-xl border p-3",
                  corrige
                    ? choisi === i
                      ? "border-success bg-success/10"
                      : "border-destructive bg-destructive/10"
                    : "border-border bg-elevated",
                )}
              >
                <p className="text-sm font-semibold">{p[0]}</p>
                {corrige ? (
                  <p className="mt-1 text-sm text-muted-foreground">{p[1]}</p>
                ) : (
                  <select
                    value={choisi ?? ""}
                    onChange={(e) => setMap(i, Number(e.target.value))}
                    className={cn(selectClass, "mt-2")}
                  >
                    <option value="">Associer…</option>
                    {melangeDroite.map((o) => (
                      <option key={o.i} value={o.i}>
                        {o.texte}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            );
          })}
        </div>
      )}

      {q.type === "trous" && (
        <div className="space-y-3">
          <p className="rounded-xl border border-border bg-elevated p-3 text-sm leading-relaxed">
            {(q.texte ?? "").split(/(\{\d+\})/).map((frag, k) => {
              const m = frag.match(/^\{(\d+)\}$/);
              if (!m) return <span key={k}>{frag}</span>;
              const idx = Number(m[1]) - 1;
              const val = (rep as Record<string, string>)[idx];
              const bon = (q.mots ?? [])[idx];
              return (
                <span
                  key={k}
                  className={cn(
                    "mx-0.5 rounded px-1.5 py-0.5 font-semibold",
                    corrige
                      ? val === bon
                        ? "bg-success/25"
                        : "bg-destructive/25"
                      : val
                        ? "bg-primary/20"
                        : "bg-background text-muted-foreground",
                  )}
                >
                  {corrige ? bon : (val ?? `…${idx + 1}`)}
                </span>
              );
            })}
          </p>
          {!corrige &&
            (q.mots ?? []).map((_, idx) => (
              <select
                key={idx}
                value={(rep as Record<string, string>)[idx] ?? ""}
                onChange={(e) => setMap(idx, e.target.value)}
                className={selectClass}
              >
                <option value="">Trou {idx + 1}…</option>
                {melangeMots.map((mot) => (
                  <option key={mot} value={mot}>
                    {mot}
                  </option>
                ))}
              </select>
            ))}
        </div>
      )}

      {q.type === "tri" && (
        <div className="space-y-2">
          {melangeElements.map(({ el, i }) => {
            const choisi = (rep as Record<string, number>)[i];
            return (
              <div
                key={i}
                className={cn(
                  "rounded-xl border p-3",
                  corrige
                    ? choisi === el[1]
                      ? "border-success bg-success/10"
                      : "border-destructive bg-destructive/10"
                    : "border-border bg-elevated",
                )}
              >
                <p className="text-sm leading-snug">{el[0]}</p>
                {corrige ? (
                  <p className="mt-1 text-xs text-muted-foreground">
                    → {(q.colonnes ?? [])[el[1]]}
                  </p>
                ) : (
                  <select
                    value={choisi ?? ""}
                    onChange={(e) => setMap(i, Number(e.target.value))}
                    className={cn(selectClass, "mt-2")}
                  >
                    <option value="">Classer dans…</option>
                    {(q.colonnes ?? []).map((c, ci) => (
                      <option key={ci} value={ci}>
                        {c}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ---------- VALIDATION ET CORRECTION ---------- */}
      {!corrige ? (
        <Button
          onClick={() => {
            setCorrige(true);
            const ok = juste(q, rep);
            if (typeof navigator !== "undefined" && "vibrate" in navigator) {
              navigator.vibrate(ok ? 16 : [20, 45, 20]);
            }
            onCorrige?.(ok, partJuste(q, rep));
          }}
          disabled={!complet(q, rep)}
          className="tap touche sticky bottom-2 z-10 h-11 w-full rounded-xl text-sm font-extrabold uppercase disabled:opacity-40 disabled:shadow-none sm:static sm:h-14"
        >
          {q.type === "libre" ? "Voir la réponse attendue" : "Valider"}
        </Button>
      ) : (
        <div className="space-y-2.5 sm:space-y-4">
          {!autoNote || q.type === "vf" ? (
            <div
              className={cn(
                "relative flex min-h-14 items-center gap-3 overflow-hidden rounded-xl border-2 px-3 py-2 text-sm font-bold sm:py-3",
                estJuste
                  ? "anim-pop border-success/50 bg-success/15 text-success"
                  : part > 0
                    ? "anim-pop border-warning/60 bg-warning/15 text-foreground"
                    : "anim-tremble border-destructive/45 bg-destructive/15 text-destructive",
              )}
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 border-current">
                {estJuste ? <Check className="h-5 w-5" /> : <X className="h-5 w-5" />}
              </span>
              <span>
                <span className="block text-[0.62rem] font-extrabold tracking-[0.14em] uppercase opacity-70">
                  Contrôle IngéGo
                </span>
                {estJuste
                  ? "Mission validée"
                  : part > 0
                    ? `Étape partiellement validée · ${Math.round(part * 100)} %`
                    : "Point à reprendre"}
              </span>
              <span className="anim-tampon pointer-events-none absolute -right-2 -bottom-2 rounded-md border-2 border-current px-2 py-1 text-[0.58rem] font-black tracking-[0.15em] uppercase">
                {estJuste ? "Validé" : "À revoir"}
              </span>
            </div>
          ) : null}

          {q.type === "libre" && (
            <div className="rounded-xl border border-success/40 bg-success/10 p-3">
              <p className="text-[0.68rem] tracking-[0.15em] text-muted-foreground uppercase">
                Réponse attendue
              </p>
              <p className="mt-1 text-sm leading-relaxed">
                {q.options?.[q.bonneReponse ?? 0] ?? ""}
              </p>
            </div>
          )}

          {q.type === "vf" && q.justification && (
            <div className="rounded-xl border border-border bg-elevated p-3">
              <p className="text-[0.68rem] tracking-[0.15em] text-muted-foreground uppercase">
                Justification
              </p>
              <p className="mt-1 text-sm leading-relaxed">{q.justification}</p>
            </div>
          )}

          {q.correction && (
            <Accordion type="single" collapsible>
              <AccordionItem
                value="correction"
                className="rounded-xl border border-border bg-elevated px-3"
              >
                <AccordionTrigger className="py-2.5 text-sm text-primary hover:no-underline">
                  Correction détaillée
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-sm leading-relaxed">{q.correction}</p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}

          <div className="rounded-xl border border-border bg-card p-2.5 sm:p-3">
            <p className="text-[0.68rem] tracking-[0.15em] text-muted-foreground uppercase">
              Ce qu'il faut retenir
            </p>
            <ExplicationStructuree q={q} />
            <p className="mt-3 text-xs" style={{ color: famille.c }}>
              {famille.nom}
              {q.derniereVerification ? ` · vérifié ${q.derniereVerification}` : ""}
            </p>
            {q.aVerifier ? (
              <p className="mt-2 text-xs text-warning">À revérifier : {q.aVerifier}</p>
            ) : null}
          </div>

          {onCommentaire ? (
            <Accordion
              type="single"
              collapsible
              defaultValue={observation ? "observation" : undefined}
            >
              <AccordionItem
                value="observation"
                className="rounded-xl border border-border bg-elevated/60 px-3"
              >
                <AccordionTrigger className="py-2.5 text-sm text-primary hover:no-underline">
                  <span className="flex items-center gap-1.5">
                    <MessageSquareText className="h-3.5 w-3.5" /> Ajouter une observation
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <textarea
                    value={observation}
                    onChange={(e) => setObservation(e.target.value)}
                    onBlur={() => onCommentaire(observation)}
                    rows={2}
                    placeholder="Notez un doute, une précision ou une correction à revoir…"
                    className="w-full resize-none rounded-lg border border-input bg-card px-3 py-2 text-sm leading-snug outline-none focus:border-ring"
                  />
                  <p className="mt-1 text-[0.65rem] text-muted-foreground">
                    Enregistrée automatiquement.
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          ) : null}

          {autoNote ? (
            <div>
              <p className="mb-2 text-xs text-muted-foreground">
                Évaluez votre restitution : c'est elle qui règle la prochaine échéance.
              </p>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    [0, "Raté"],
                    [1, "Difficile"],
                    [2, "Correct"],
                    [3, "Évident"],
                  ] as const
                ).map(([note, label]) => (
                  <button
                    key={note}
                    onClick={() => onNote(note, q.type === "libre" ? note > 0 : estJuste)}
                    className={cn(
                      "tap rounded-xl border py-3 text-sm font-semibold",
                      note === 0
                        ? "border-destructive/50 bg-destructive/15 text-foreground"
                        : note === 3
                          ? "border-success/50 bg-success/15 text-foreground"
                          : "border-border bg-elevated text-foreground",
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="sticky bottom-2 z-20 space-y-2 rounded-xl bg-card/95 pt-1 backdrop-blur-sm sm:static sm:bg-transparent sm:pt-0 sm:backdrop-blur-none">
              <Button
                onClick={() => onNote(estJuste ? 2 : part >= 0.6 ? 1 : 0, estJuste)}
                className="tap touche-brand h-12 w-full rounded-xl bg-brand text-base font-bold text-brand-foreground hover:bg-brand/90 sm:h-14"
              >
                Question suivante <ArrowRight className="h-4 w-4" />
              </Button>
              {estJuste ? (
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => onNote(1, true)}
                    className="tap rounded-xl border border-border bg-elevated py-2.5 text-xs font-semibold"
                  >
                    C'était difficile
                  </button>
                  <button
                    onClick={() => onNote(3, true)}
                    className="tap rounded-xl border border-success/50 bg-success/15 py-2.5 text-xs font-semibold"
                  >
                    C'était évident
                  </button>
                </div>
              ) : null}
            </div>
          )}
        </div>
      )}
    </article>
  );
}
