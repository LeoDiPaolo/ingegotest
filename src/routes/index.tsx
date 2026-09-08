import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  CheckCircle2,
  Flame,
  Layers,
  Library,
  Play,
  RotateCcw,
  Sparkles,
  Target,
  X,
  Clock3,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import { Entete } from "@/components/ingego/entete";
import { NavBas } from "@/components/ingego/nav-bas";
import { Confettis } from "@/components/ingego/confettis";
import { Castor, LogoIngego } from "@/components/ingego/marque";
import { BadgeMaitrise, IconeAxe } from "@/components/ingego/univers";
import { Button } from "@/components/ui/button";
import { Exercice } from "@/components/ingego/exercice";
import { AXE_BY_ID, type Question } from "@/lib/ingego/corpus";
import { carteNeuve, composerSession, planifier, resteAFaire } from "@/lib/ingego/algo";
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

function Reviser() {
  const { donnees, pret, synchro, enregistrerCarte, commenter, maj } = useDonnees();
  const [ordre, setOrdre] = useState<Question[] | null>(null);
  const [i, setI] = useState(0);
  const [faits, setFaits] = useState<string[]>([]);
  const [rates, setRates] = useState<Record<string, number>>({});
  const [justes, setJustes] = useState(0);
  const [fini, setFini] = useState(false);
  const [missionCommencee, setMissionCommencee] = useState(false);

  const serie = useMemo(
    () => serieJours(donnees.journal.filter((e) => e.id === MARQUE_SESSION).map((e) => e.jour)),
    [donnees.journal],
  );
  const reste = useMemo(
    () => (pret ? resteAFaire(donnees.cartes, donnees.reglages, Date.now()) : 0),
    [donnees.cartes, donnees.reglages, pret],
  );

  const bilan = useMemo(() => {
    const l = jaugesParAxe(donnees.cartes);
    const total = l.reduce((s, x) => s + x.total, 0);
    const acquises = l.reduce((s, x) => s + x.acquises, 0);
    return { total, acquises, part: total ? acquises / total : 0, lignes: l };
  }, [donnees.cartes]);

  const total = donnees.reglages.parSession;
  const mission = useMemo(() => {
    if (!ordre?.length) return null;
    const comptes = ordre.reduce<Record<string, number>>((acc, question) => {
      acc[question.axe] = (acc[question.axe] ?? 0) + 1;
      return acc;
    }, {});
    const [axeId, nombre] = Object.entries(comptes).sort((a, b) => b[1] - a[1])[0] ?? [];
    const dominant = axeId && nombre / ordre.length >= 0.5 ? AXE_BY_ID[axeId] : null;
    const themes = [...new Set(ordre.map((question) => question.sousTheme))];
    return {
      titre: dominant ? `Mission · ${dominant.court}` : "Mission transversale",
      detail: themes.slice(0, 3).join(" · "),
      themes,
    };
  }, [ordre]);

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
  }

  function quitter() {
    setOrdre(null);
    setFini(false);
  }

  function noter(q: Question, note: number) {
    const maintenant = Date.now();
    if (typeof navigator !== "undefined" && "vibrate" in navigator) {
      navigator.vibrate(note === 0 ? [18, 40, 18] : 14);
    }
    enregistrerCarte(
      q.id,
      planifier(donnees.cartes[q.id] ?? carteNeuve(), note, maintenant),
      note,
      maintenant,
    );

    const premierPassage = !faits.includes(q.id);
    if (premierPassage) {
      setFaits((f) => [...f, q.id]);
      if (note >= 2) setJustes((n) => n + 1);
    }

    const echecs = (rates[q.id] ?? 0) + (note === 0 ? 1 : 0);
    if (note === 0) setRates((r) => ({ ...r, [q.id]: echecs }));

    /* Ratée une première fois : on la remet un peu plus loin dans la session.
       Ratée une seconde fois : elle repart sur l'échéance de répétition espacée. */
    let suite = ordre ?? [];
    if (note === 0 && echecs === 1) suite = reinjecter(suite, i, q);
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

  return (
    <div className={exerciceActif ? "min-h-dvh bg-background" : "min-h-screen bg-background pb-24"}>
      {!exerciceActif ? (
        <Entete serie={serie} etat={donnees.cartes} synchro={synchro} jauges={false} />
      ) : null}

      <main
        className={
          exerciceActif
            ? "mx-auto max-w-2xl px-3 py-3 sm:px-5 sm:py-5"
            : ordre
              ? "mx-auto max-w-2xl px-5 py-5"
              : "mx-auto max-w-5xl px-5 py-5"
        }
      >
        {!ordre ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            <section className="blueprint anim-monte col-span-2 overflow-hidden rounded-3xl border border-primary/20 bg-card shadow-[var(--shadow-lift)] lg:row-span-2">
              <div className="bg-primary px-5 py-3 text-primary-foreground">
                <p className="text-[0.68rem] font-bold uppercase opacity-75">Mission du jour</p>
                <h1 className="mt-0.5 text-2xl text-primary-foreground">Consolider le terrain</h1>
              </div>
              <div className="relative p-5">
                <div className="flex items-center justify-center gap-1 py-2">
                  {bilan.lignes.slice(0, 5).map((l, index) => (
                    <div key={l.axe.id} className="flex items-center">
                      <IconeAxe
                        axe={l.axe}
                        className="h-12 w-12 sm:h-14 sm:w-14"
                        active={l.part > 0}
                      />
                      {index < 4 ? <span className="h-1 w-3 bg-border sm:w-6" /> : null}
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-bold">{Math.min(total, reste || total)} défis variés</p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock3 className="h-3.5 w-3.5" /> environ{" "}
                      {Math.max(5, Math.round(total * 0.75))} min
                    </p>
                  </div>
                  <Castor className="h-16 w-16 shrink-0" />
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

            <Link
              to="/elevation"
              className="tap anim-monte surface flex items-center gap-3 p-4 transition-transform active:scale-[0.98]"
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/10 text-primary">
                <Layers className="h-5 w-5" />
              </span>
              <span className="text-sm font-bold text-foreground">Élévation</span>
            </Link>

            <Link
              to="/corpus"
              className="tap anim-monte surface flex items-center gap-3 p-4 transition-transform active:scale-[0.98]"
            >
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand/15 text-brand">
                <Library className="h-5 w-5" />
              </span>
              <span className="text-sm font-bold text-foreground">Corpus</span>
            </Link>

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
                {bilan.lignes.slice(0, 4).map((l) => (
                  <BadgeMaitrise key={l.axe.id} axe={l.axe} acquis={l.acquises} total={l.total} />
                ))}
              </div>
            </section>
          </div>
        ) : !missionCommencee ? (
          <section className="anim-pop overflow-hidden rounded-3xl border border-primary/20 bg-card shadow-[var(--shadow-lift)]">
            <div className="relative overflow-hidden bg-primary px-6 pt-5 pb-14 text-center text-primary-foreground">
              <div className="blueprint pointer-events-none absolute inset-0 opacity-25" />
              <div className="pointer-events-none absolute top-7 left-0 h-px w-16 bg-primary-foreground/20" />
              <div className="pointer-events-none absolute top-7 right-0 h-px w-16 bg-primary-foreground/20" />
              <div className="relative mx-auto mb-4 w-[12.5rem] -rotate-1 rounded-2xl bg-card px-4 py-3 shadow-[var(--shadow-lift)] ring-1 ring-primary-foreground/20">
                <LogoIngego className="mx-auto w-full" />
                <span className="absolute -right-2 -bottom-2 grid h-7 w-7 rotate-6 place-items-center rounded-lg bg-brand text-[0.58rem] font-extrabold text-brand-foreground shadow-[var(--shadow-card)]">
                  GO
                </span>
              </div>
              <p className="relative text-[0.65rem] font-bold tracking-[0.2em] uppercase opacity-70">
                Brief de mission
              </p>
              <h1 className="relative mt-1 text-2xl font-bold text-primary-foreground">
                {mission?.titre ?? "Mission transversale"}
              </h1>
            </div>
            <div className="relative -mt-7 rounded-t-3xl bg-card px-5 pt-5 pb-5 text-center">
              <div className="flex justify-center -space-x-2.5" aria-label="Thèmes de la mission">
                {(ordre ?? []).slice(0, 5).map((question) => (
                  <IconeAxe
                    key={question.id}
                    axe={question.axe}
                    className="h-12 w-12 border-card bg-card ring-2 ring-card"
                    active
                  />
                ))}
              </div>
              <p className="mx-auto mt-4 max-w-sm text-sm font-semibold leading-relaxed text-foreground">
                {mission?.detail}
              </p>
              <p className="mx-auto mt-1 max-w-sm text-xs leading-relaxed text-muted-foreground">
                Les erreurs reviennent quelques étapes plus loin pour être consolidées.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-3 text-center">
                <div className="rounded-2xl border border-border bg-elevated px-3 py-2.5">
                  <p className="text-2xl font-extrabold text-primary">{ordre?.length ?? total}</p>
                  <p className="text-[0.65rem] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                    défis
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-elevated px-3 py-2.5">
                  <p className="text-2xl font-extrabold text-brand">
                    ≈ {Math.max(5, Math.round(total * 0.75))}
                  </p>
                  <p className="text-[0.65rem] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
                    minutes
                  </p>
                </div>
              </div>
              <Button
                onClick={() => setMissionCommencee(true)}
                className="touche touche-brand mt-4 h-14 w-full rounded-xl bg-brand text-base font-extrabold text-brand-foreground hover:bg-brand/90"
              >
                Démarrer <ArrowRight className="h-5 w-5" />
              </Button>
              <button
                onClick={quitter}
                className="mt-4 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
              >
                Retour au tableau de bord
              </button>
            </div>
          </section>
        ) : fini ? (
          <section className="surface anim-pop overflow-hidden text-center">
            <Confettis />
            <div className="blueprint bg-primary px-6 pt-6 pb-12 text-primary-foreground">
              <LogoIngego className="mx-auto w-44 rounded-xl bg-card p-2 shadow-[var(--shadow-card)]" />
              <div className="relative mx-auto mt-4 h-24 w-28">
                <Castor
                  className={`mx-auto h-24 w-24 ${justes / Math.max(1, faits.length) >= 0.75 ? "anim-pop rotate-2" : ""}`}
                />
                <CheckCircle2 className="absolute right-0 bottom-1 h-9 w-9 rounded-full bg-card p-1 text-success" />
              </div>
              <h1 className="mt-2 text-2xl text-primary-foreground">Mission accomplie</h1>
            </div>
            <div className="relative -mt-7 space-y-4 rounded-t-3xl bg-card p-5">
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-xl bg-success/12 p-2">
                  <p className="text-2xl font-extrabold text-success">{justes}</p>
                  <p className="text-[0.62rem] font-bold text-muted-foreground uppercase">du 1er coup</p>
                </div>
                <div className="rounded-xl bg-brand/12 p-2">
                  <p className="text-2xl font-extrabold text-brand">{faits.length}</p>
                  <p className="text-[0.62rem] font-bold text-muted-foreground uppercase">consolidées</p>
                </div>
                <div className="rounded-xl bg-destructive/10 p-2">
                  <p className="text-2xl font-extrabold text-destructive">{Object.keys(rates).length}</p>
                  <p className="text-[0.62rem] font-bold text-muted-foreground uppercase">à reprendre</p>
                </div>
              </div>
              <div className="h-4 overflow-hidden rounded-full bg-elevated ring-1 ring-border/60">
                <div
                  className="h-full rounded-full bg-success transition-[width] duration-1000"
                  style={{ width: `${(justes / Math.max(1, faits.length)) * 100}%` }}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                {justes === faits.length
                  ? "Parcours net : tous les points ont été validés dès le premier passage."
                  : `${mission?.themes.length ?? 0} thèmes parcourus · les points fragiles sont déjà reprogrammés.`}
              </p>
              <div className="flex gap-2">
              <button
                onClick={demarrer}
                className="tap touche touche-brand flex-1 bg-brand py-3.5 text-sm font-extrabold text-brand-foreground uppercase"
              >
                <RotateCcw className="mr-1 inline h-4 w-4" /> Nouvelle séance
              </button>
              <button
                onClick={quitter}
                className="tap touche flex-1 border border-border bg-card py-3.5 text-sm font-bold"
              >
                Terminer
              </button>
              </div>
            </div>
          </section>
        ) : q ? (
          <section className="space-y-2.5 sm:space-y-4">
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

            <div className="surface anim-pop p-3.5 sm:p-5">
              <Exercice
                key={`${q.id}-${i}`}
                q={q}
                numero={faits.length + 1}
                total={total}
                onNote={(note) => noter(q, note)}
                commentaire={donnees.commentaires[q.id] ?? ""}
                onCommentaire={(texte) => commenter(q.id, texte)}
              />
            </div>
          </section>
        ) : null}
      </main>

      {!exerciceActif ? <NavBas /> : null}
    </div>
  );
}
