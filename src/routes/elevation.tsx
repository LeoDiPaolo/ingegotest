import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Entete } from "@/components/ingego/entete";
import { NavBas } from "@/components/ingego/nav-bas";
import { AXES, CORPUS, FAMILLES, TYPES, type Question } from "@/lib/ingego/corpus";
import { etatCarte, type EtatCarte } from "@/lib/ingego/algo";
import { serieJours, useDonnees } from "@/lib/ingego/stockage";
import { cn } from "@/lib/utils";

const TITRE = "Élévation — vue d'ensemble du corpus IngéGo";
const DESC =
  "Mur de tuiles : une tuile par question, groupée par axe, avec l'état de mémorisation (jamais posée, en cours, acquise, fragile).";

export const Route = createFileRoute("/elevation")({
  head: () => ({
    meta: [
      { title: TITRE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITRE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

const COULEUR: Record<EtatCarte, string> = {
  neuf: "bg-elevated border-border text-muted-foreground",
  encours: "bg-primary/20 border-primary/50 text-primary",
  acquis: "bg-success/25 border-success/60 text-success",
  fragile: "bg-destructive/20 border-destructive/50 text-destructive",
};

const LEGENDE: [EtatCarte, string][] = [
  ["neuf", "Jamais posée"],
  ["encours", "En cours"],
  ["acquis", "Acquise"],
  ["fragile", "Fragile"],
];

function Page() {
  const { donnees, synchro } = useDonnees();
  const [choisie, setChoisie] = useState<Question | null>(null);

  const serie = useMemo(
    () => serieJours(donnees.journal.filter((e) => e.id === "__session").map((e) => e.jour)),
    [donnees.journal],
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      <Entete serie={serie} etat={donnees.cartes} synchro={synchro} />

      <main className="mx-auto max-w-2xl space-y-6 px-5 py-5">
        <div>
          <h1 className="text-2xl text-primary">Élévation</h1>
          <ul className="mt-2 flex flex-wrap gap-2 text-[0.68rem]">
            {LEGENDE.map(([etat, label]) => (
              <li
                key={etat}
                className={cn("rounded-full border px-2.5 py-1 font-semibold", COULEUR[etat])}
              >
                {label}
              </li>
            ))}
          </ul>
        </div>

        {AXES.map((axe) => {
          const qs = CORPUS.filter((q) => q.axe === axe.id);
          if (!qs.length) return null;
          return (
            <section key={axe.id} className="space-y-2">
              <h2 className="text-sm font-bold" style={{ color: axe.couleur }}>
                {axe.nom}
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {qs.map((q) => (
                  <button
                    key={q.id}
                    onClick={() => setChoisie(choisie?.id === q.id ? null : q)}
                    aria-label={q.question}
                    className={cn(
                      "tap h-8 w-8 rounded-lg border text-[0.6rem] font-bold",
                      COULEUR[etatCarte(donnees.cartes[q.id])],
                      choisie?.id === q.id && "ring-2 ring-brand",
                    )}
                  >
                    {q.niv}
                  </button>
                ))}
              </div>
            </section>
          );
        })}
      </main>

      {choisie ? (
        <div className="fixed inset-x-0 bottom-[4.5rem] z-30 px-4">
          <div className="surface mx-auto max-w-2xl space-y-2 p-4 shadow-lg">
            <p className="text-[0.66rem] font-semibold text-muted-foreground uppercase">
              {choisie.sousTheme} · niveau {choisie.niv} · {TYPES[choisie.type]} ·{" "}
              {FAMILLES[choisie.fam].nom}
            </p>
            <p className="text-sm leading-snug">{choisie.question}</p>
            <p className="text-xs text-muted-foreground">{choisie.explication}</p>
            <button
              onClick={() => setChoisie(null)}
              className="tap text-xs font-semibold text-primary"
            >
              Fermer
            </button>
          </div>
        </div>
      ) : null}

      <NavBas />
    </div>
  );
}
