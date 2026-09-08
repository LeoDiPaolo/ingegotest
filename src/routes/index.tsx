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
} from "lucide-react";
import { Entete } from "@/components/ingego/entete";
import { NavBas } from "@/components/ingego/nav-bas";
import { Confettis } from "@/components/ingego/confettis";
import { Castor } from "@/components/ingego/marque";
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
  }

  function quitter() {
    setOrdre(null);
    setFini(false);
  }

  function noter(q: Question, note: number) {
    const maintenant = Date.now();
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
      <Entete serie={serie} etat={donnees.cartes} synchro={synchro} jauges={!ordre} />

      <main className="mx-auto max-w-2xl px-5 py-5">
        {!ordre ? (
          <section className="surface space-y-4 p-5">
            <h1 className="text-2xl text-primary">Session du jour</h1>
            <p className="text-sm text-muted-foreground">
              {reste > 0
                ? `${reste} question${reste > 1 ? "s" : ""} à travailler aujourd'hui (révisions dues et nouveautés du niveau en cours de chaque thème).`
                : "Rien d'obligatoire aujourd'hui : les révisions dues sont à jour. Vous pouvez tout de même ouvrir une session."}
            </p>
            <button
              onClick={demarrer}
              disabled={!pret || reste === 0}
              className="tap flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-4 text-base font-bold text-brand-foreground disabled:opacity-40"
            >
              <Play className="h-5 w-5" />
              Commencer · {Math.min(total, Math.max(reste, 0))} questions
            </button>
            <p className="text-xs text-muted-foreground">
              Série en cours : {serie} jour{serie > 1 ? "s" : ""} · une session non terminée ne
              compte pas dans la série.
            </p>
          </section>
        ) : fini ? (
          <section className="surface space-y-4 p-6 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-success" />
            <h1 className="text-2xl text-primary">Session terminée</h1>
            <p className="text-sm text-muted-foreground">
              {justes} / {faits.length} questions réussies du premier coup.
            </p>
            <div className="flex gap-2">
              <button
                onClick={demarrer}
                className="tap flex-1 rounded-xl bg-brand py-3 text-sm font-bold text-brand-foreground"
              >
                <RotateCcw className="mr-1 inline h-4 w-4" /> Nouvelle session
              </button>
              <button
                onClick={quitter}
                className="tap flex-1 rounded-xl border border-border bg-card py-3 text-sm font-semibold"
              >
                Terminer
              </button>
            </div>
          </section>
        ) : q ? (
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <button onClick={quitter} aria-label="Quitter la session" className="tap p-1">
                <X className="h-5 w-5 text-muted-foreground" />
              </button>
              <div className="h-3 flex-1 overflow-hidden rounded-full bg-elevated">
                <div
                  className="h-full rounded-full transition-[width] duration-300"
                  style={{
                    width: `${avance}%`,
                    backgroundColor: AXE_BY_ID[q.axe]?.couleur ?? "var(--color-brand)",
                  }}
                />
              </div>
              <span className="text-xs font-semibold text-muted-foreground">
                {faits.length}/{total}
              </span>
            </div>

            <div className="surface p-5">
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
