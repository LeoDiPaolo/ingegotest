import { createFileRoute, Link, useNavigate, useParams } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Heart, X } from "lucide-react";
import castor from "@/assets/ingego-castor.png.asset.json";
import { Exercice } from "@/components/ingego/exercice";
import { AXE_BY_ID } from "@/lib/ingego/corpus";
import { useHistorique } from "@/lib/ingego/historique";
import { COEURS_MAX, LECON_PAR_ID, suivante, useProgres } from "@/lib/ingego/parcours";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/lecon/$id")({
  head: () => ({
    meta: [
      { title: "Leçon — IngéGo" },
      { name: "description", content: "Enchaînez les exercices de la leçon : questions à choix, jeux d'association et restitutions du concours d'ingénieur territorial." },
      { property: "og:title", content: "Leçon — IngéGo" },
      { property: "og:description", content: "Exercices variés du concours d'ingénieur territorial bâtiment." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

function Page() {
  const { id } = useParams({ from: "/lecon/$id" });
  const lecon = LECON_PAR_ID[id];
  const navigate = useNavigate();
  const { noter } = useHistorique();
  const { enregistrer } = useProgres();

  const [i, setI] = useState(0);
  const [coeurs, setCoeurs] = useState(COEURS_MAX);
  const [justes, setJustes] = useState(0);
  const [fini, setFini] = useState(false);

  const suite = useMemo(() => (lecon ? suivante(lecon.id) : null), [lecon]);

  if (!lecon) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6 text-center">
        <p className="text-sm text-muted-foreground">
          Leçon introuvable.{" "}
          <Link to="/" search={{ q: undefined }} className="text-primary underline">
            Retour au parcours
          </Link>
        </p>
      </div>
    );
  }

  const total = lecon.questions.length;
  const q = lecon.questions[i];
  const axe = AXE_BY_ID[lecon.axe];

  if (fini) {
    const etoiles = justes === total ? 3 : justes >= Math.ceil(total * 0.7) ? 2 : 1;
    const echec = coeurs <= 0;
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-6 text-center">
        <img src={castor.url} alt="" className="h-28 w-28 object-contain" />
        <h1 className="text-2xl text-primary">{echec ? "Presque !" : "Leçon terminée !"}</h1>
        <p className="text-sm text-muted-foreground">
          {justes} bonne{justes > 1 ? "s" : ""} réponse{justes > 1 ? "s" : ""} sur {total}
          {echec ? " — reprenez la leçon pour la valider." : ` · ${etoiles} étoile(s)`}
        </p>
        <div className="mt-2 flex w-full max-w-xs flex-col gap-2">
          <button
            onClick={() => {
              setI(0);
              setJustes(0);
              setCoeurs(COEURS_MAX);
              setFini(false);
            }}
            className="tap rounded-xl border border-border bg-elevated py-3 text-sm font-semibold"
          >
            Refaire la leçon
          </button>
          {!echec && suite ? (
            <Link
              to="/lecon/$id"
              params={{ id: suite.id }}
              onClick={() => {
                setI(0);
                setJustes(0);
                setCoeurs(COEURS_MAX);
                setFini(false);
              }}
              className="tap rounded-xl bg-brand py-3 text-sm font-semibold text-brand-foreground"
            >
              Leçon suivante
            </Link>
          ) : null}
          <Link
            to="/"
            search={{ q: undefined }}
            className="tap rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground"
          >
            Retour au parcours
          </Link>
        </div>
      </div>
    );
  }

  const terminer = (bonnes: number) => {
    if (coeurs > 0) enregistrer(lecon.id, bonnes, total);
    setFini(true);
  };

  return (
    <div className="min-h-screen bg-background pb-10">
      <header className="sticky top-0 z-20 border-b border-border bg-card/95 px-5 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-3">
          <Link
            to="/"
            search={{ q: undefined }}
            aria-label="Quitter la leçon"
            className="tap text-muted-foreground"
          >
            <X className="h-5 w-5" />
          </Link>
          <div className="h-3 flex-1 overflow-hidden rounded-full bg-elevated">
            <div
              className="h-full rounded-full bg-success transition-[width] duration-300"
              style={{ width: `${(i / total) * 100}%` }}
            />
          </div>
          <span className="flex items-center gap-0.5" aria-label={`${coeurs} vies restantes`}>
            {Array.from({ length: COEURS_MAX }, (_, k) => (
              <Heart
                key={k}
                className={cn(
                  "h-4 w-4",
                  k < coeurs ? "fill-destructive text-destructive" : "text-border",
                )}
              />
            ))}
          </span>
        </div>
        <p className="mx-auto mt-2 max-w-2xl truncate text-[0.7rem] font-medium tracking-[0.12em] text-brand uppercase">
          {axe?.court ?? lecon.axe} · {lecon.sousTheme} · leçon {lecon.rang}
        </p>
      </header>

      <main className="mx-auto max-w-2xl px-5 py-5">
        <Exercice
          key={q.id}
          q={q}
          numero={i + 1}
          total={total}
          onCorrige={(juste) => {
            noter(q.id, juste ? "ok" : "ko");
            if (juste) setJustes((n) => n + 1);
            else setCoeurs((c) => Math.max(0, c - 1));
          }}
          onNote={() => {
            const bonnes = justes;
            if (coeurs <= 0 || i + 1 >= total) terminer(bonnes);
            else setI(i + 1);
          }}
        />
      </main>
    </div>
  );
}
