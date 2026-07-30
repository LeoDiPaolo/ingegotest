import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import { AppShell } from "@/components/ingego/app-shell";
import { Exercice } from "@/components/ingego/exercice";
import { PanneauConnexion } from "@/components/ingego/panneau-connexion";
import { useAuth } from "@/hooks/use-auth";
import { useProgression } from "@/hooks/use-progression";
import type { Question } from "@/lib/ingego/corpus";
import { composerSession, type Etat, type Reglages } from "@/lib/ingego/algo";

export const Route = createFileRoute("/session")({
  validateSearch: (search: Record<string, unknown>): { cible?: "fragiles" } =>
    search.cible === "fragiles" ? { cible: "fragiles" } : {},
  head: () => ({
    meta: [
      { title: "Session de révision — IngéGo" },
      {
        name: "description",
        content:
          "Session calibrée : reprises dues et nouveautés du niveau actif, entrelacées par format et par axe.",
      },
      { property: "og:title", content: "Session de révision — IngéGo" },
      {
        property: "og:description",
        content: "Reprises dues et nouveautés entrelacées, notation en quatre paliers.",
      },
    ],
  }),
  component: Session,
});

function Session() {
  const { user, pret } = useAuth();
  const { etat, reglages, chargement, noter } = useProgression(user?.id);

  if (!pret || (user && chargement)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-sm text-muted-foreground">Composition de la session…</p>
      </div>
    );
  }
  if (!user) return <PanneauConnexion />;

  return <Deroule etat={etat} reglages={reglages} noter={noter.mutate} />;
}

function Deroule({
  etat,
  reglages,
  noter,
}: {
  etat: Etat;
  reglages: Reglages;
  noter: (v: { questionId: string; note: number }) => void;
}) {
  const { cible } = Route.useSearch();
  const navigate = useNavigate();

  const [file, setFile] = useState<Question[]>(() =>
    composerSession(etat, cible ? { ...reglages, cible } : reglages, Date.now()),
  );
  const [i, setI] = useState(0);
  const [faites, setFaites] = useState(0);
  const [rates, setRates] = useState(0);

  const total = useMemo(() => file.length, [file]);
  const courante = file[i];

  function surNote(note: number) {
    if (!courante) return;
    noter({ questionId: courante.id, note });
    setFaites((n) => n + 1);
    if (note === 0) {
      setRates((n) => n + 1);
      setFile((f) => [...f, courante]);
    }
    setI((n) => n + 1);
  }

  if (total === 0) {
    return (
      <AppShell titre="Rien d'exigible">
        <div className="surface space-y-4 p-6 text-center">
          <p className="text-sm text-muted-foreground">
            Aucune carte due et aucune nouveauté au niveau actif avec vos filtres actuels. Élargissez
            les axes ou les formats, ou revenez à la prochaine échéance.
          </p>
          <Link
            to="/reglages"
            className="tap inline-flex rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
          >
            Ouvrir les réglages
          </Link>
        </div>
      </AppShell>
    );
  }

  if (!courante) {
    return (
      <AppShell titre="Session terminée">
        <div className="surface space-y-5 p-6 text-center">
          <Check className="mx-auto h-10 w-10 text-success" />
          <div>
            <p className="font-display text-4xl">{faites}</p>
            <p className="text-sm text-muted-foreground">réponses enregistrées</p>
          </div>
          <p className="text-sm text-muted-foreground">
            {rates === 0
              ? "Aucun raté : tous les paliers avancent."
              : `${rates} reprise(s) ratée(s), remises en file et replanifiées à court terme.`}
          </p>
          <div className="grid gap-2">
            <button
              onClick={() => {
                setFile(composerSession(etat, cible ? { ...reglages, cible } : reglages, Date.now()));
                setI(0);
                setFaites(0);
                setRates(0);
              }}
              className="tap rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground"
            >
              Enchaîner une session
            </button>
            <button
              onClick={() => navigate({ to: "/" })}
              className="tap rounded-xl border border-border py-3 text-sm font-semibold"
            >
              Retour au tableau du jour
            </button>
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      surTitre={cible === "fragiles" ? "Reprise ciblée · cartes fragiles" : "Session du jour"}
      titre={`${Math.min(i + 1, total)} sur ${total}`}
    >
      <div className="space-y-5">
        <div className="h-1 overflow-hidden rounded-full bg-elevated">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-300"
            style={{ width: `${(i / total) * 100}%` }}
          />
        </div>
        <Exercice key={`${courante.id}-${i}`} q={courante} numero={i + 1} total={total} onNote={surNote} />
      </div>
    </AppShell>
  );
}
