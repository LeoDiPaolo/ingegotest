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
import { Castor } from "@/components/ingego/marque";
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
    () =>
      serieJours(donnees.journal.filter((e) => e.id === MARQUE_SESSION).map((e) => e.jour)),
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

  return (
    <div className="min-h-screen bg-background pb-24">
      <Entete serie={serie} etat={donnees.cartes} synchro={synchro} jauges={false} />

      <main className="mx-auto max-w-2xl px-5 py-5">
        {!ordre ? (
          <div className="grid grid-cols-2 gap-3">
            <section className="blueprint anim-monte col-span-2 overflow-hidden rounded-3xl border border-primary/20 bg-card shadow-[var(--shadow-lift)]">
              <div className="bg-primary px-5 py-3 text-primary-foreground">
                <p className="text-[0.68rem] font-bold uppercase opacity-75">Mission du jour</p>
                <h1 className="mt-0.5 text-2xl text-primary-foreground">Consolider le terrain</h1>
              </div>
              <div className="relative p-5">
                <div className="flex items-center justify-center gap-1 py-2">
                  {bilan.lignes.slice(0, 5).map((l, index) => (
                    <div key={l.axe.id} className="flex items-center">
                      <IconeAxe axe={l.axe} className="h-12 w-12 sm:h-14 sm:w-14" active={l.part > 0} />
                      {index < 4 ? <span className="h-1 w-3 bg-border sm:w-6" /> : null}
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-bold">{Math.min(total, reste || total)} défis variés</p>
                    <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock3 className="h-3.5 w-3.5" /> environ {Math.max(5, Math.round(total * 0.75))} min
                    </p>
                  </div>
                  <Castor className="h-16 w-16 shrink-0" />
                </div>
                <Button onClick={demarrer} disabled={!pret} className="touche touche-brand mt-4 h-14 w-full rounded-xl bg-brand text-base font-extrabold text-brand-foreground hover:bg-brand/90">
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
              <p className="text-3xl font-extrabold text-success tabular-nums">
                {bilan.acquises}
              </p>
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

            <section className="anim-monte col-span-2 space-y-3">
              <div className="flex items-center justify-between">
                <p className="flex items-center gap-1.5 text-sm font-bold"><Sparkles className="h-4 w-4 text-brand" /> Badges de maîtrise</p>
                <Link to="/elevation" className="flex items-center text-xs font-bold text-primary">Tout voir <ChevronRight className="h-4 w-4" /></Link>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                {bilan.lignes.slice(0, 4).map((l) => <BadgeMaitrise key={l.axe.id} axe={l.axe} acquis={l.acquises} total={l.total} />)}
              </div>
            </section>
          </div>
        ) : !missionCommencee ? (
          <section className="blueprint anim-pop overflow-hidden rounded-3xl border border-primary/20 bg-card shadow-[var(--shadow-lift)]">
            <div className="bg-primary px-6 py-5 text-center text-primary-foreground">
              <p className="text-xs font-bold uppercase opacity-70">Brief de mission</p>
              <h1 className="mt-1 text-2xl text-primary-foreground">Révision transversale</h1>
            </div>
            <div className="space-y-5 p-6 text-center">
              <div className="flex justify-center -space-x-2">
                {(ordre ?? []).slice(0, 5).map((question) => <IconeAxe key={question.id} axe={question.axe} className="h-14 w-14 bg-card" />)}
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">Une mission courte mêlant réglementation, technique et décision. Les erreurs reviennent quelques étapes plus loin.</p>
              <div className="grid grid-cols-2 gap-2 text-left">
                <div className="rounded-xl bg-elevated p-3"><p className="text-2xl font-extrabold text-primary">{ordre?.length ?? total}</p><p className="text-xs text-muted-foreground">défis</p></div>
                <div className="rounded-xl bg-elevated p-3"><p className="text-2xl font-extrabold text-brand">≈ {Math.max(5, Math.round(total * 0.75))}</p><p className="text-xs text-muted-foreground">minutes</p></div>
              </div>
              <Button onClick={() => setMissionCommencee(true)} className="touche touche-brand h-14 w-full rounded-xl bg-brand font-extrabold text-brand-foreground hover:bg-brand/90">Démarrer <ArrowRight className="h-5 w-5" /></Button>
              <button onClick={quitter} className="text-xs font-semibold text-muted-foreground">Retour au tableau de bord</button>
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
          <section className="space-y-4">
            <div className="flex items-center gap-3">
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

            <div className="surface anim-pop p-5">
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

      <NavBas />
    </div>
  );
}

