import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { AlertTriangle, ArrowRight, Flame } from "lucide-react";
import { AppShell } from "@/components/ingego/app-shell";
import { LandingPage } from "@/components/ingego/landing-page";
import { useAuth } from "@/hooks/use-auth";
import { useProgression } from "@/hooks/use-progression";
import { AXES, CORPUS, META, mouvantsARevoir } from "@/lib/ingego/corpus";
import { etatCarte, jourDe, resteAFaire, validee } from "@/lib/ingego/algo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "IngéGo — révision concours ingénieur territorial" },
      {
        name: "description",
        content:
          "Révision par répétition espacée du concours externe d'ingénieur territorial, spécialité ingénierie, gestion technique et architecture. 322 questions, six axes.",
      },
      { property: "og:title", content: "IngéGo — révision concours ingénieur territorial" },
      {
        property: "og:description",
        content:
          "Sessions quotidiennes calibrées, six axes, progression synchronisée du téléphone au PC.",
      },
    ],
  }),
  component: Accueil,
});

function Accueil() {
  const { user, pret } = useAuth();
  const { etat, reglages, journal, chargement } = useProgression(user?.id);

  const now = Date.now();
  const aFaire = useMemo(() => resteAFaire(etat, reglages, now), [etat, reglages, now]);

  const serie = useMemo(() => {
    const jours = new Set(journal.map((j) => j.jour));
    let n = 0;
    for (let i = 0; ; i++) {
      const d = jourDe(now - i * 86400000);
      if (jours.has(d)) n++;
      else if (i > 0) break;
      else if (!jours.has(jourDe(now - 86400000))) break;
    }
    return n;
  }, [journal, now]);

  const aujourdhui = useMemo(
    () => journal.filter((j) => j.jour === jourDe(now)).length,
    [journal, now],
  );

  const mouvants = useMemo(() => mouvantsARevoir(now).length, [now]);
  const acquises = useMemo(() => CORPUS.filter((q) => validee(etat[q.id])).length, [etat]);
  const fragiles = useMemo(
    () => CORPUS.filter((q) => etatCarte(etat[q.id]) === "fragile").length,
    [etat],
  );

  if (!pret) return <Ecran />;
  if (!user) return <LandingPage />;


  return (
    <AppShell surTitre={`Écrit juin 2027 · ${META.version}`} titre="Aujourd'hui">
      <div className="space-y-5">
        <section className="surface p-5">
          <p className="text-sm text-muted-foreground">
            {chargement ? "Chargement de votre progression…" : "File du jour"}
          </p>
          <p className="mt-1 font-display text-5xl">{aFaire}</p>
          <p className="text-sm text-muted-foreground">
            {aFaire === 0
              ? "Rien d'exigible : la prochaine échéance viendra à vous."
              : `question${aFaire > 1 ? "s" : ""} à reprendre ou à découvrir`}
          </p>
          <Link
            to="/session"
            className="tap mt-4 flex items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground"
          >
            Démarrer une session de {reglages.parSession}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>

        <section className="grid grid-cols-3 gap-2">
          <Tuile valeur={`${serie}`} label="jours de suite" icone={<Flame className="h-4 w-4" />} />
          <Tuile valeur={`${aujourdhui}`} label="réponses aujourd'hui" />
          <Tuile valeur={`${acquises}/${CORPUS.length}`} label="questions validées" />
        </section>

        {fragiles > 0 && (
          <Link to="/session" search={{ cible: "fragiles" }} className="tap block">
            <section className="surface flex items-center gap-3 p-4">
              <AlertTriangle className="h-5 w-5 shrink-0 text-warning" />
              <p className="min-w-0 text-sm">
                <span className="font-semibold">{fragiles} carte(s) fragile(s)</span> — reprises
                ratées non reconsolidées. Session ciblée.
              </p>
            </section>
          </Link>
        )}

        <section className="surface p-5">
          <h2 className="text-lg">Les six axes</h2>
          <ul className="mt-3 space-y-3">
            {AXES.map((a) => {
              const qs = CORPUS.filter((q) => q.axe === a.id);
              const ok = qs.filter((q) => validee(etat[q.id])).length;
              return (
                <li key={a.id}>
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-2">
                    <p className="truncate text-sm">{a.nom}</p>
                    <p className="shrink-0 text-xs text-muted-foreground">
                      {ok}/{qs.length}
                    </p>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-elevated">
                    <div
                      className="h-full rounded-full transition-[width]"
                      style={{
                        width: `${Math.round((ok / qs.length) * 100)}%`,
                        backgroundColor: a.couleur,
                      }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {mouvants > 0 && (
          <p className="px-1 text-xs text-muted-foreground">
            {mouvants} fait(s) mouvant(s) datent de plus de six mois : à revérifier avant l'écrit.
            Détail dans Progression.
          </p>
        )}
      </div>
    </AppShell>
  );
}

function Tuile({
  valeur,
  label,
  icone,
}: {
  valeur: string;
  label: string;
  icone?: React.ReactNode;
}) {
  return (
    <div className="surface p-3">
      <p className="flex items-center gap-1 font-display text-2xl">
        {icone}
        {valeur}
      </p>
      <p className="mt-0.5 text-[0.68rem] leading-tight text-muted-foreground">{label}</p>
    </div>
  );
}

function Ecran() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="text-sm text-muted-foreground">Chargement…</p>
    </div>
  );
}
