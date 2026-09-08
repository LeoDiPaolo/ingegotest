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
  const { donnees, pret, synchro, enregistrerCarte, maj } = useDonnees();
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
          <div className="journal-page relative grid gap-8 overflow-hidden lg:grid-cols-12 lg:gap-12">
            <section className="anim-monte relative overflow-hidden border-b border-border pb-8 lg:col-span-5 lg:border-r lg:border-b-0 lg:pr-10">
              <span className="brand-watermark -top-3 -left-5">IG</span>
              <div className="relative z-10">
                <LogoIngego className="w-52 object-contain object-left sm:w-64" />
                <p className="editorial-kicker mt-8">Carnet de missions · Volume 01</p>
                <h1 className="mt-3 text-6xl leading-[0.85] text-primary sm:text-7xl">
                  Réviser.<br /><em className="text-brand">Décider.</em><br />Construire.
                </h1>
                <p className="mt-7 max-w-sm text-base leading-relaxed text-muted-foreground">
                  Votre préparation de terrain au concours d’ingénieur territorial, entre faits,
                  réglementation et décisions techniques.
                </p>
                <div className="journal-rule mt-8 flex gap-8 pt-4 text-sm">
                  <div><p className="editorial-kicker">Série</p><p className="mt-1 text-xl font-bold text-brand">{serie} j</p></div>
                  <div><p className="editorial-kicker">Acquises</p><p className="mt-1 text-xl font-bold text-success">{bilan.acquises}</p></div>
                  <div><p className="editorial-kicker">Corpus</p><p className="mt-1 text-xl font-bold text-primary">{bilan.total}</p></div>
                </div>
              </div>
            </section>

            <div className="grid gap-4 sm:grid-cols-2 lg:col-span-7">
            <section className="dossier-sheet anim-monte relative flex min-h-[25rem] flex-col justify-end overflow-hidden bg-primary p-6 text-primary-foreground sm:min-h-[29rem]">
              <div className="blueprint absolute inset-0 opacity-25" />
              <div className="absolute top-6 right-6 text-[7rem] font-display leading-none text-primary-foreground/10">01</div>
              <div className="relative">
                <p className="editorial-kicker text-primary-foreground/60">Mission du jour</p>
                <h2 className="mt-2 text-4xl leading-none text-primary-foreground">Consolider<br /><em>le terrain.</em></h2>
                <div className="mt-8 flex items-center gap-1">
                  {bilan.lignes.slice(0, 5).map((l, index) => (
                    <div key={l.axe.id} className="flex items-center">
                      <IconeAxe
                        axe={l.axe}
                        className="h-10 w-10 border-primary-foreground/30 bg-card sm:h-11 sm:w-11"
                        active={l.part > 0}
                      />
                      {index < 4 ? <span className="h-px w-2 bg-primary-foreground/30" /> : null}
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex items-end justify-between gap-3 border-t border-primary-foreground/20 pt-4">
                  <div className="text-primary-foreground">
                    <p className="font-bold">{Math.min(total, reste || total)} défis</p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs opacity-65">
                      <Clock3 className="h-3.5 w-3.5" /> environ{" "}
                      {Math.max(5, Math.round(total * 0.75))} min
                    </p>
                  </div>
                  <span className="font-display text-4xl italic text-brand">Go.</span>
                </div>
                <Button
                  onClick={demarrer}
                  disabled={!pret}
                  className="touche touche-brand mt-5 h-14 w-full rounded-none bg-brand text-base font-extrabold text-brand-foreground hover:bg-brand/90"
                >
                  <Play className="h-5 w-5" /> Lancer la mission
                </Button>
              </div>
            </section>

            <section className="dossier-sheet anim-monte flex min-h-[25rem] flex-col p-6 sm:min-h-[29rem]">
              <p className="editorial-kicker">Journal de progression</p>
              <h2 className="mt-2 text-3xl text-primary">Vos domaines<br /><em>en mouvement.</em></h2>
              <div className="journal-rule mt-6 space-y-3 pt-5">
                {bilan.lignes.slice(0, 4).map((l) => (
                  <BadgeMaitrise key={l.axe.id} axe={l.axe} acquis={l.acquises} total={l.total} />
                ))}
              </div>
              <div className="mt-auto grid grid-cols-2 border-t border-border pt-4">
                <Link to="/elevation" className="tap flex items-center gap-2 text-sm font-bold text-primary"><Layers className="h-4 w-4" /> Élévation</Link>
                <Link to="/corpus" className="tap flex items-center justify-end gap-2 text-sm font-bold text-primary">Corpus <Library className="h-4 w-4" /></Link>
              </div>
            </section>
            <Link to="/corpus" className="tap journal-rule flex items-center justify-between py-5 sm:col-span-2">
              <div><p className="font-display text-2xl text-primary">Explorer les archives</p><p className="editorial-kicker mt-1">{bilan.total} questions documentées</p></div>
              <span className="grid h-10 w-10 place-items-center rounded-full border border-primary text-primary"><ChevronRight className="h-5 w-5" /></span>
            </Link>
            </div>
          </div>
        ) : !missionCommencee ? (
          <section className="dossier-sheet anim-pop overflow-hidden">
            <div className="relative overflow-hidden bg-primary px-6 pt-7 pb-16 text-center text-primary-foreground">
              <div className="blueprint pointer-events-none absolute inset-0 opacity-25" />
              <div className="pointer-events-none absolute top-7 left-0 h-px w-16 bg-primary-foreground/20" />
              <div className="pointer-events-none absolute top-7 right-0 h-px w-16 bg-primary-foreground/20" />
              <div className="relative mx-auto mb-5 w-[14rem] -rotate-1 bg-card px-5 py-4 shadow-[var(--shadow-lift)] ring-1 ring-primary-foreground/20">
                <LogoIngego className="mx-auto w-full" />
                <span className="absolute -right-2 -bottom-2 grid h-7 w-7 rotate-6 place-items-center bg-brand text-[0.58rem] font-extrabold text-brand-foreground shadow-[var(--shadow-card)]">
                  GO
                </span>
              </div>
              <p className="relative text-[0.65rem] font-bold tracking-[0.2em] uppercase opacity-70">
                Brief de mission
              </p>
              <h1 className="relative mt-2 text-4xl leading-none text-primary-foreground">
                Révision <em>transversale.</em>
              </h1>
            </div>
            <div className="relative -mt-7 bg-card px-5 pt-5 pb-5 text-center">
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
              <p className="mx-auto mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
                Une mission courte mêlant réglementation, technique et décision. Les erreurs
                reviennent quelques étapes plus loin.
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
                  className="touche touche-brand mt-4 h-14 w-full rounded-none bg-brand text-base font-extrabold text-brand-foreground hover:bg-brand/90"
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
          <section className="surface anim-pop space-y-4 p-6 text-center">
            <Confettis />
            <Castor className="mx-auto h-28 w-28" />
            <CheckCircle2 className="mx-auto h-10 w-10 text-success" />
            <h1 className="text-2xl text-primary">Séance terminée</h1>
            <p className="text-sm text-muted-foreground">
              {justes} / {faits.length} questions réussies du premier coup.
            </p>
            <div className="h-4 overflow-hidden rounded-full bg-elevated ring-1 ring-border/60">
              <div
                className="h-full rounded-full bg-success transition-[width] duration-1000"
                style={{ width: `${(justes / Math.max(1, faits.length)) * 100}%` }}
              />
            </div>
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

            <div className="dossier-sheet anim-pop p-3.5 sm:p-6">
              <Exercice
                key={`${q.id}-${i}`}
                q={q}
                numero={faits.length + 1}
                total={total}
                onNote={(note) => noter(q, note)}
              />
            </div>
          </section>
        ) : null}
      </main>

      {!exerciceActif ? <NavBas /> : null}
    </div>
  );
}
