import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Flame,
  LockKeyhole,
  Medal,
  Play,
  RotateCcw,
  Sparkles,
  Target,
  Trophy,
  X,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Entete } from "@/components/ingego/entete";
import { NavBas } from "@/components/ingego/nav-bas";
import { Confettis } from "@/components/ingego/confettis";
import { Castor, LogoIngego } from "@/components/ingego/marque";
import { BadgeMaitrise, IconeAxe, Medaille } from "@/components/ingego/univers";
import { Recompense } from "@/components/ingego/recompense";
import {
  PALIERS_REPONSES,
  badgePalierReponses,
  badgesDebloques,
  useRecompenses,
} from "@/lib/ingego/badges";
import { Button } from "@/components/ui/button";
import { Exercice } from "@/components/ingego/exercice";
import { AXE_BY_ID, Q_BY_ID, type Question } from "@/lib/ingego/corpus";
import {
  carteNeuve,
  composerSession,
  niveauActif,
  planifier,
  progressionSousTheme,
  resteAFaire,
} from "@/lib/ingego/algo";
import { jaugesParAxe, reinjecter } from "@/lib/ingego/session";
import { serieJours, useDonnees } from "@/lib/ingego/stockage";

const TITRE = "IngéGo — révision du concours d'ingénieur territorial";
const DESC =
  "Session de révision par répétition espacée pour préparer l'écrit et l'oral du concours d'ingénieur territorial, spécialité bâtiment.";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: TITRE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITRE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: TITRE },
      { name: "twitter:description", content: DESC },
    ],
  }),
  component: Reviser,
});

const MARQUE_SESSION = "__session";

/* Titres de mission : un intitulé différent chaque jour, tiré de façon
   déterministe pour rester stable pendant la journée. Deux familles selon
   qu'il y a des révisions dues ou uniquement des nouvelles questions. */
const TITRES_DECOUVERTE = [
  "Ouvrir un nouveau lot",
  "Poser les fondations",
  "Monter d'un niveau",
  "Avancer d'un cran",
  "Explorer un nouveau chantier",
  "Prendre de l'avance",
];

function titreMissionDuJour(maintenant = Date.now()): string {
  const jour = Math.floor(maintenant / 86_400_000);
  return TITRES_DECOUVERTE[jour % TITRES_DECOUVERTE.length];
}


function Reviser() {
  const { donnees, pret, synchro, enregistrerCarte, commenter, maj } = useDonnees();
  const [ordre, setOrdre] = useState<Question[] | null>(null);
  const [i, setI] = useState(0);
  const [faits, setFaits] = useState<string[]>([]);
  const [rates, setRates] = useState<Record<string, number>>({});
  const [justes, setJustes] = useState(0);
  const [fini, setFini] = useState(false);
  const [missionCommencee, setMissionCommencee] = useState(false);
  const [niveauxDepart, setNiveauxDepart] = useState<Record<string, number>>({});
  const [axeOuvert, setAxeOuvert] = useState<string | null>(null);

  const serie = useMemo(
    () => serieJours(donnees.journal.filter((e) => e.id === MARQUE_SESSION).map((e) => e.jour)),
    [donnees.journal],
  );
  const reste = useMemo(
    () => (pret ? resteAFaire(donnees.cartes, donnees.reglages, Date.now()) : 0),
    [donnees.cartes, donnees.reglages, pret],
  );
  /* Une question validée du premier coup n'est plus jamais reposée : les
     missions ne contiennent que des découvertes et des reprises de questions
     ratées. Le titre du jour reste stable pendant la journée. */
  const titreMission = useMemo(() => titreMissionDuJour(), []);


  const bilan = useMemo(() => {
    const l = jaugesParAxe(donnees.cartes);
    const total = l.reduce((s, x) => s + x.total, 0);
    const acquises = l.reduce((s, x) => s + x.acquises, 0);
    return { total, acquises, part: total ? acquises / total : 0, lignes: l };
  }, [donnees.cartes]);

  /* Paliers cumulés : uniquement les questions validées (réussies du premier coup). */
  const bonnesReponses = bilan.acquises;
  const prochainPalier = PALIERS_REPONSES.find((p) => p > bonnesReponses) ?? null;

  /* Récompenses : file des badges nouvellement débloqués. */
  const badges = useMemo(
    () => badgesDebloques(bilan.lignes, bonnesReponses),
    [bilan.lignes, bonnesReponses],
  );
  const { badge: recompense, suivant: recompenseSuivante } = useRecompenses(badges, pret);

  const detailAxe = useMemo(() => {
    if (!axeOuvert) return null;
    const ligne = bilan.lignes.find((l) => l.axe.id === axeOuvert);
    if (!ligne) return null;
    const progression = ligne.axe.sousThemes.map((theme) => ({
      theme,
      ...progressionSousTheme(theme, donnees.cartes),
    }));
    const suivant = progression
      .filter((p) => !p.termine)
      .sort((a, b) => a.niveau - b.niveau || a.restantesNiveau - b.restantesNiveau)[0];
    const derniereEntree = [...donnees.journal]
      .reverse()
      .find((e) => Q_BY_ID[e.id]?.axe === axeOuvert);
    return { ligne, progression, suivant, derniereEntree };
  }, [axeOuvert, bilan.lignes, donnees.cartes, donnees.journal]);

  const total = donnees.reglages.parSession;
  const objectif = useMemo(() => {
    const actifs = donnees.reglages.axes;
    const themes = [
      ...new Set(
        bilan.lignes.filter((l) => actifs.includes(l.axe.id)).flatMap((l) => l.axe.sousThemes),
      ),
    ];
    return themes
      .map((theme) => ({ theme, ...progressionSousTheme(theme, donnees.cartes) }))
      .filter((item) => !item.termine)
      .sort((a, b) => a.niveau - b.niveau || a.restantesNiveau - b.restantesNiveau)[0];
  }, [bilan.lignes, donnees.cartes, donnees.reglages.axes]);
  const mission = useMemo(() => {
    if (!ordre?.length) return null;
    const comptes = ordre.reduce<Record<string, number>>((acc, question) => {
      acc[question.axe] = (acc[question.axe] ?? 0) + 1;
      return acc;
    }, {});
    const [axeId, nombre] = Object.entries(comptes).sort((a, b) => b[1] - a[1])[0] ?? [];
    const dominant = axeId && nombre / ordre.length >= 0.5 ? AXE_BY_ID[axeId] : null;
    const themes = [...new Set(ordre.map((question) => question.sousTheme))];
    const nouvelles = ordre.filter((question) => !donnees.cartes[question.id]?.vu).length;
    return {
      titre: dominant ? `Mission · ${dominant.court}` : "Mission transversale",
      detail: themes.slice(0, 3).join(" · "),
      themes,
      nouvelles,
      revisions: ordre.length - nouvelles,
    };
  }, [donnees.cartes, ordre]);

  function demarrer() {
    const lot = composerSession(donnees.cartes, donnees.reglages, Date.now());
    if (!lot.length) return;
    setOrdre(lot);
    setI(0);
    setFaits([]);
    setRates({});
    setJustes(0);
    setFini(false);
    setMissionCommencee(false);
    setNiveauxDepart(
      Object.fromEntries(
        [...new Set(lot.map((q) => q.sousTheme))].map((theme) => [
          theme,
          niveauActif(theme, donnees.cartes),
        ]),
      ),
    );
  }

  function quitter() {
    setOrdre(null);
    setFini(false);
  }

  function noter(q: Question, note: number, reponseJuste: boolean) {
    const maintenant = Date.now();
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(note === 0 ? [18, 40, 18] : 14);
    }
    const premierPassage = !faits.includes(q.id);
    const valideDuPremierCoup = premierPassage && reponseJuste;
    enregistrerCarte(
      q.id,
      planifier(
        donnees.cartes[q.id] ?? carteNeuve(),
        reponseJuste ? note : 0,
        maintenant,
        valideDuPremierCoup,
      ),
      reponseJuste ? note : 0,
      maintenant,
    );

    if (premierPassage) {
      setFaits((f) => [...f, q.id]);
      if (reponseJuste) setJustes((n) => n + 1);
    }

    const echecs = (rates[q.id] ?? 0) + (reponseJuste ? 0 : 1);
    if (!reponseJuste) setRates((r) => ({ ...r, [q.id]: echecs }));

    /* Toute erreur revient dans la mission jusqu'à réussite. Même corrigée à
       chaud, la carte reste à valider du premier coup dans une autre mission. */
    let suite = ordre ?? [];
    if (!reponseJuste) suite = reinjecter(suite, i, q);
    setOrdre(suite);

    if (i + 1 >= suite.length) {
      const jour = new Date(maintenant).toISOString().slice(0, 10);
      maj((d) =>
        d.journal.some((e) => e.id === MARQUE_SESSION && e.jour === jour)
          ? d
          : {
              ...d,
              journal: [...d.journal, { id: MARQUE_SESSION, note: 1, jour, t: maintenant }],
            },
      );
      setFini(true);
    } else {
      setI(i + 1);
    }
  }

  const q = ordre && !fini ? ordre[i] : null;
  const avance = ordre ? Math.min(100, (faits.length / Math.max(1, total)) * 100) : 0;
  const exerciceActif = Boolean(ordre && missionCommencee && !fini && q);
  const niveauxDebloques = useMemo(
    () =>
      Object.entries(niveauxDepart)
        .map(([theme, avant]) => ({ theme, avant, apres: niveauActif(theme, donnees.cartes) }))
        .filter(({ avant, apres }) => apres > avant),
    [donnees.cartes, niveauxDepart],
  );

  return (
    <div className={exerciceActif ? "min-h-dvh bg-background" : "min-h-screen bg-background pb-24"}>
      {recompense ? <Recompense badge={recompense} onFermer={recompenseSuivante} /> : null}
      {!exerciceActif ? (
        <Entete serie={serie} etat={donnees.cartes} synchro={synchro} jauges={false} />
      ) : null}

      <main
        className={
          exerciceActif
            ? "mx-auto max-w-2xl px-2.5 py-2.5 sm:px-5 sm:py-5"
            : ordre
              ? "mx-auto max-w-2xl px-3 py-2 sm:px-5 sm:py-5"
              : "mx-auto max-w-5xl px-5 py-5"
        }
      >
        {!ordre ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <section className="blueprint anim-monte col-span-2 overflow-hidden rounded-3xl border border-primary/20 bg-card shadow-[var(--shadow-lift)] lg:row-span-2">
              <div className="bg-primary px-5 py-3 text-primary-foreground">
                <p className="flex items-center gap-1.5 text-[0.68rem] font-bold uppercase opacity-75">
                  Mission du jour
                  <Sparkles className="h-3 w-3 animate-pulse" aria-hidden />
                </p>
                <h1
                  key={titreMission}
                  className="anim-monte mt-0.5 text-2xl text-primary-foreground"
                >
                  {titreMission}
                </h1>
              </div>
              <div className="relative p-5">
                <div className="flex flex-wrap items-center justify-center gap-1 py-2">
                  {bilan.lignes.map((l, index) => (
                    <div key={l.axe.id} className="flex items-center">
                      <button
                        type="button"
                        onClick={() => setAxeOuvert(l.axe.id)}
                        aria-label={`Ouvrir la catégorie ${l.axe.court}`}
                        className="tap rounded-full transition-transform active:scale-95"
                      >
                        <span
                          className="anim-pop inline-block"
                          style={{ animationDelay: `${index * 0.05}s` }}
                        >
                          <IconeAxe
                            axe={l.axe}
                            className="h-11 w-11 sm:h-14 sm:w-14"
                            active={l.part > 0}
                          />
                        </span>
                      </button>
                      {index < bilan.lignes.length - 1 ? (
                        <span className="h-1 w-2 bg-border sm:w-4" />
                      ) : null}
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[0.65rem] font-extrabold tracking-[0.13em] text-brand uppercase">
                      Prochain objectif
                    </p>
                    <p className="font-bold">{objectif?.theme ?? "Consolider les acquis"}</p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <LockKeyhole className="h-3.5 w-3.5" /> Niveau {objectif?.niveau ?? 1} ·{" "}
                      {objectif?.restantesNiveau ?? reste} validation
                      {(objectif?.restantesNiveau ?? reste) > 1 ? "s" : ""} restante
                      {(objectif?.restantesNiveau ?? reste) > 1 ? "s" : ""}
                    </p>
                  </div>
                  <Castor className="anim-flotte h-16 w-16 shrink-0" />
                </div>
                <Button
                  onClick={demarrer}
                  disabled={!pret}
                  className="touche touche-brand mt-4 h-14 w-full rounded-xl bg-brand text-base font-extrabold text-brand-foreground hover:bg-brand/90"
                >
                  <Play className="h-5 w-5" /> Lancer la mission
                </Button>
              </div>
            </section>

            <section className="anim-monte surface flex flex-col justify-between gap-1 p-4">
              <p className="flex items-center gap-1.5 text-[0.68rem] font-bold tracking-[0.14em] text-muted-foreground uppercase">
                <Flame className="h-3.5 w-3.5 text-brand" /> Série
              </p>
              <p className="text-3xl font-extrabold text-brand tabular-nums">{serie}</p>
              <p className="text-xs text-muted-foreground">
                jour{serie > 1 ? "s" : ""} d'affilée — une séance non terminée ne compte pas.
              </p>
            </section>

            <section className="anim-monte surface flex flex-col justify-between gap-1 p-4">
              <p className="flex items-center gap-1.5 text-[0.68rem] font-bold tracking-[0.14em] text-muted-foreground uppercase">
                <Target className="h-3.5 w-3.5 text-success" /> Acquises
              </p>
              <p className="text-3xl font-extrabold text-success tabular-nums">{bilan.acquises}</p>
              <div className="h-2.5 overflow-hidden rounded-full bg-elevated">
                <div
                  className="h-full rounded-full bg-success transition-[width] duration-700"
                  style={{ width: `${bilan.part * 100}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">sur {bilan.total} questions</p>
            </section>

            <section className="anim-monte col-span-2 space-y-3 lg:col-start-3 lg:row-span-3">
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-1.5 text-sm font-bold">
                  <Sparkles className="h-4 w-4 text-brand" /> Badges de maîtrise
                </p>
                <Link to="/elevation" className="flex items-center text-xs font-bold text-primary">
                  Tout voir <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {bilan.lignes.map((l) => (
                  <BadgeMaitrise
                    key={l.axe.id}
                    axe={l.axe}
                    acquis={l.acquises}
                    total={l.total}
                    vus={l.acquises + l.encours}
                    onClick={() => setAxeOuvert(l.axe.id)}
                  />
                ))}
              </div>

              <div className="flex items-center gap-1.5 pt-1 text-sm font-bold">
                <Medal className="h-4 w-4 text-brand" /> Paliers de bonnes réponses
              </div>
              <div className="surface grid grid-cols-4 gap-3 p-3 sm:grid-cols-6">
                {PALIERS_REPONSES.map((p) => {
                  const b = badgePalierReponses(p);
                  return (
                    <Medaille
                      key={p}
                      libelle={b.libelle}
                      acquis={bonnesReponses >= p}
                      icone={p === PALIERS_REPONSES.at(-1) ? Trophy : Medal}
                    />
                  );
                })}
              </div>
              <p className="text-xs text-muted-foreground">
                {bonnesReponses} bonne{bonnesReponses > 1 ? "s" : ""} réponse
                {bonnesReponses > 1 ? "s" : ""} cumulée{bonnesReponses > 1 ? "s" : ""}
                {prochainPalier
                  ? ` · prochain palier à ${prochainPalier}`
                  : " · tous les paliers atteints"}
              </p>
            </section>
          </div>
        ) : !missionCommencee ? (
          <section className="mission-brief anim-pop overflow-hidden rounded-2xl border border-primary/20 bg-card shadow-[var(--shadow-lift)] sm:rounded-3xl">
            <div className="relative overflow-hidden bg-primary px-4 pt-3 pb-9 text-center text-primary-foreground sm:px-6 sm:pt-5 sm:pb-14">
              <div className="blueprint pointer-events-none absolute inset-0 opacity-25" />
              <div className="pointer-events-none absolute top-7 left-0 h-px w-16 bg-primary-foreground/20" />
              <div className="pointer-events-none absolute top-7 right-0 h-px w-16 bg-primary-foreground/20" />
              <div className="relative mx-auto mb-2 w-[9.5rem] -rotate-1 rounded-xl bg-card px-3 py-2 shadow-[var(--shadow-lift)] ring-1 ring-primary-foreground/20 sm:mb-4 sm:w-[12.5rem] sm:rounded-2xl sm:px-4 sm:py-3">
                <LogoIngego className="mx-auto w-full" />
                <span className="absolute -right-2 -bottom-2 grid h-7 w-7 rotate-6 place-items-center rounded-lg bg-brand text-[0.58rem] font-extrabold text-brand-foreground shadow-[var(--shadow-card)]">
                  GO
                </span>
              </div>
              <p className="relative text-[0.65rem] font-bold tracking-[0.2em] uppercase opacity-70">
                Brief de mission
              </p>
              <h1 className="relative mt-0.5 text-xl font-bold text-primary-foreground sm:mt-1 sm:text-2xl">
                {mission?.titre ?? "Mission transversale"}
              </h1>
            </div>
            <div className="relative -mt-5 rounded-t-3xl bg-card px-4 pt-3 pb-3 text-center sm:-mt-7 sm:px-5 sm:pt-5 sm:pb-5">
              <div className="flex justify-center -space-x-2.5" aria-label="Thèmes de la mission">
                {(ordre ?? []).slice(0, 5).map((question) => (
                  <IconeAxe
                    key={question.id}
                    axe={question.axe}
                    className="h-9 w-9 border-card bg-card ring-2 ring-card sm:h-12 sm:w-12"
                    active
                  />
                ))}
              </div>
              <p className="mx-auto mt-2 max-w-sm text-sm font-semibold leading-snug text-foreground sm:mt-4 sm:leading-relaxed">
                {mission?.detail}
              </p>
              <p className="mission-brief-note mx-auto mt-1 max-w-sm text-xs leading-snug text-muted-foreground sm:leading-relaxed">
                Les erreurs reviennent quelques étapes plus loin pour être consolidées.
              </p>
              {objectif ? (
                <p className="mx-auto mt-1 max-w-sm text-[0.68rem] font-bold text-primary">
                  Cap niveau {objectif.niveau} · {objectif.restantesNiveau} validation
                  {objectif.restantesNiveau > 1 ? "s" : ""} à obtenir du premier coup
                </p>
              ) : null}
              <div className="mx-auto mt-2 flex w-fit items-center gap-2 text-[0.65rem] font-bold">
                <span className="rounded-full bg-success/12 px-2 py-1 text-success">
                  {mission?.nouvelles ?? 0} nouvelles
                </span>
                <span className="rounded-full bg-primary/10 px-2 py-1 text-primary">
                  {mission?.revisions ?? 0} reprises
                </span>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-center sm:mt-4 sm:gap-3">
                <div className="rounded-xl border border-border bg-elevated px-3 py-1.5 sm:rounded-2xl sm:py-2.5">
                  <p className="text-xl font-extrabold text-primary sm:text-2xl">
                    {ordre?.length ?? total}
                  </p>
                  <p className="text-[0.65rem] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                    défis
                  </p>
                </div>
                <div className="rounded-xl border border-border bg-elevated px-3 py-1.5 sm:rounded-2xl sm:py-2.5">
                  <p className="text-xl font-extrabold text-brand sm:text-2xl">
                    ≈ {Math.max(5, Math.round(total * 0.75))}
                  </p>
                  <p className="text-[0.65rem] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                    minutes
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setMissionCommencee(true)}
                className="touche touche-brand mt-2 h-12 w-full rounded-xl bg-brand text-base font-extrabold text-brand-foreground hover:bg-brand/90 sm:mt-4 sm:h-14"
              >
                Démarrer <ArrowRight className="h-5 w-5" />
              </Button>
              <button
                onClick={quitter}
                className="mt-2 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground sm:mt-4"
              >
                Retour au tableau de bord
              </button>
            </div>
          </section>
        ) : fini ? (
          <section className="surface anim-pop overflow-hidden text-center">
            <Confettis />
            <div className="blueprint bg-primary px-4 pt-3 pb-8 text-primary-foreground">
              <div className="relative mx-auto h-16 w-20">
                <Castor
                  className={`mx-auto h-16 w-16 ${justes / Math.max(1, faits.length) >= 0.75 ? "anim-pop rotate-2" : ""}`}
                />
                <CheckCircle2 className="absolute right-0 bottom-0 h-7 w-7 rounded-full bg-card p-0.5 text-success" />
              </div>
              <h1 className="mt-1 text-xl text-primary-foreground">Mission accomplie</h1>
            </div>
            <div className="relative -mt-5 space-y-2.5 rounded-t-3xl bg-card p-4">
              <div className="grid grid-cols-3 gap-1.5">
                <div className="rounded-xl bg-success/12 p-1.5">
                  <p className="text-xl font-extrabold text-success">{justes}</p>
                  <p className="text-[0.58rem] font-bold text-muted-foreground uppercase">
                    du 1er coup
                  </p>
                </div>
                <div className="rounded-xl bg-brand/12 p-1.5">
                  <p className="text-xl font-extrabold text-brand">{faits.length}</p>
                  <p className="text-[0.58rem] font-bold text-muted-foreground uppercase">
                    consolidées
                  </p>
                </div>
                <div className="rounded-xl bg-destructive/10 p-1.5">
                  <p className="text-xl font-extrabold text-destructive">
                    {Object.keys(rates).length}
                  </p>
                  <p className="text-[0.58rem] font-bold text-muted-foreground uppercase">
                    à reprendre
                  </p>
                </div>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-elevated ring-1 ring-border/60">
                <div
                  className="h-full rounded-full bg-success transition-[width] duration-1000"
                  style={{ width: `${(justes / Math.max(1, faits.length)) * 100}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                {justes === faits.length
                  ? "Parcours net : tous les points validés dès le premier passage."
                  : `${mission?.themes.length ?? 0} thèmes parcourus · les points repris reviendront demain pour une validation du premier coup.`}
              </p>
              {niveauxDebloques.length ? (
                <div className="anim-unlock rounded-xl border-2 border-success/50 bg-success/10 p-2 text-left">
                  <p className="text-[0.6rem] font-extrabold tracking-[0.14em] text-success uppercase">
                    Niveau déverrouillé
                  </p>
                  {niveauxDebloques.map(({ theme, apres }) => (
                    <p key={theme} className="mt-0.5 text-xs font-bold">
                      {theme} · {Number.isFinite(apres) ? `niveau ${apres}` : "parcours validé"}
                    </p>
                  ))}
                </div>
              ) : null}
              {Object.keys(rates).length ? (
                <p className="rounded-xl border border-brand/30 bg-brand/10 px-3 py-1.5 text-left text-[0.7rem] text-muted-foreground">
                  <span className="font-bold text-brand">Reprises réussies :</span>{" "}
                  {Object.keys(rates).length} point{Object.keys(rates).length > 1 ? "s" : ""}{" "}
                  corrigé{Object.keys(rates).length > 1 ? "s" : ""} à chaud.
                </p>
              ) : null}
              <div className="flex gap-2">
                <button
                  onClick={demarrer}
                  className="tap touche touche-brand flex-1 bg-brand py-3 text-xs font-extrabold text-brand-foreground uppercase"
                >
                  <RotateCcw className="mr-1 inline h-4 w-4" /> Nouvelle séance
                </button>
                <button
                  onClick={quitter}
                  className="tap touche flex-1 border border-border bg-card py-3 text-xs font-bold"
                >
                  Terminer
                </button>
              </div>
            </div>
          </section>
        ) : q ? (
          <section className="space-y-2 pb-[max(1rem,env(safe-area-inset-bottom))] sm:space-y-4">
            <div className="flex items-center gap-2 sm:gap-3">
              <button onClick={quitter} aria-label="Quitter la séance" className="tap p-1">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
              <div className="h-4 flex-1 overflow-hidden rounded-full bg-elevated ring-1 ring-border/60">
                <div
                  className="h-full rounded-full transition-[width] duration-500"
                  style={{
                    width: `${avance}%`,
                    backgroundColor: AXE_BY_ID[q.axe]?.couleur ?? "var(--color-brand)",
                  }}
                />
              </div>
              <span className="text-xs font-bold text-muted-foreground tabular-nums">
                {faits.length}/{total}
              </span>
            </div>

            <div className="anim-pop sm:surface sm:p-5">
              <Exercice
                key={`${q.id}-${i}`}
                q={q}
                numero={faits.length + 1}
                total={total}
                onNote={(note, juste) => noter(q, note, juste)}
                reprise={(rates[q.id] ?? 0) > 0}
                commentaire={donnees.commentaires[q.id] ?? ""}
                onCommentaire={(texte) => commenter(q.id, texte)}
              />
            </div>
          </section>
        ) : null}
      </main>

      <Dialog open={Boolean(detailAxe)} onOpenChange={(o) => !o && setAxeOuvert(null)}>
        <DialogContent className="max-h-[85dvh] overflow-y-auto rounded-2xl">
          {detailAxe ? (
            <>
              <DialogHeader className="flex-row items-center gap-3 text-left">
                <IconeAxe axe={detailAxe.ligne.axe} className="h-12 w-12 shrink-0" active />
                <div className="min-w-0">
                  <DialogTitle className="text-lg">{detailAxe.ligne.axe.court}</DialogTitle>
                  <DialogDescription>{detailAxe.ligne.axe.nom}</DialogDescription>
                </div>
              </DialogHeader>

              <div>
                <p className="text-[0.65rem] font-extrabold tracking-[0.14em] text-muted-foreground uppercase">
                  Points abordés
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {detailAxe.ligne.axe.sousThemes.map((t) => (
                    <span
                      key={t}
                      className="rounded-full bg-elevated px-2.5 py-1 text-xs font-semibold"
                    >
                      {t}
                    </span>
                  ))}
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Objectif : maîtriser du premier coup les faits et repères réglementaires de{" "}
                  {detailAxe.ligne.axe.nom.toLowerCase()}, niveau par niveau.
                </p>
              </div>

              <div className="rounded-2xl border border-border bg-elevated p-3">
                <div className="flex items-baseline justify-between">
                  <p className="text-sm font-bold">
                    {detailAxe.ligne.acquises}/{detailAxe.ligne.total} validées
                  </p>
                  <p
                    className="text-sm font-extrabold tabular-nums"
                    style={{ color: detailAxe.ligne.axe.couleur }}
                  >
                    {Math.round(detailAxe.ligne.part * 100)} %
                  </p>
                </div>
                <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-card">
                  <div
                    className="h-full rounded-full transition-[width] duration-700"
                    style={{
                      width: `${detailAxe.ligne.part * 100}%`,
                      backgroundColor: detailAxe.ligne.axe.couleur,
                    }}
                  />
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Dernière session :{" "}
                  {detailAxe.derniereEntree
                    ? new Date(detailAxe.derniereEntree.t).toLocaleDateString("fr-FR")
                    : "aucune pour l'instant"}
                </p>
                <p className="mt-1 text-xs font-semibold text-primary">
                  {detailAxe.suivant
                    ? `Prochain objectif : ${detailAxe.suivant.theme} · niveau ${detailAxe.suivant.niveau} (${detailAxe.suivant.restantesNiveau} à valider)`
                    : "Catégorie entièrement validée."}
                </p>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>

      {!exerciceActif ? <NavBas /> : null}
    </div>
  );
}
