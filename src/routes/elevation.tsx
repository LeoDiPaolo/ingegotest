import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Check, Flag, LockKeyhole, Sparkles } from "lucide-react";
import { Entete } from "@/components/ingego/entete";
import { NavBas } from "@/components/ingego/nav-bas";
import { AXES, CORPUS, FAMILLES, TYPES, type Question } from "@/lib/ingego/corpus";
import { etatCarte, progressionSousTheme, type EtatCarte } from "@/lib/ingego/algo";
import { serieJours, useDonnees } from "@/lib/ingego/stockage";
import { cn } from "@/lib/utils";
import { IconeAxe } from "@/components/ingego/univers";

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
  ["acquis", "Validée du 1er coup"],
  ["fragile", "À valider du 1er coup"],
];

function Page() {
  const { donnees, synchro } = useDonnees();
  const [choisie, setChoisie] = useState<Question | null>(null);

  const serie = useMemo(
    () => serieJours(donnees.journal.filter((e) => e.id === "__session").map((e) => e.jour)),
    [donnees.journal],
  );
  const prochain = useMemo(
    () => CORPUS.find((q) => etatCarte(donnees.cartes[q.id]) !== "acquis"),
    [donnees.cartes],
  );
  const totalAcquis = useMemo(
    () => CORPUS.filter((q) => etatCarte(donnees.cartes[q.id]) === "acquis").length,
    [donnees.cartes],
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      <Entete serie={serie} etat={donnees.cartes} synchro={synchro} />

      <main className="blueprint mx-auto min-h-[calc(100vh-8rem)] max-w-5xl space-y-7 px-5 py-5">
        <div>
          <p className="text-xs font-bold text-brand uppercase">Plan de progression</p>
          <h1 className="text-2xl text-primary">Arbre de compétences</h1>
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

        <section className="mission-strip flex items-center gap-3 rounded-r-2xl bg-card px-4 py-3 shadow-[var(--shadow-card)]">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-brand/15 text-brand">
            <Flag className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-[0.62rem] font-extrabold tracking-[0.13em] text-brand uppercase">
              Prochain jalon
            </p>
            <p className="truncate text-sm font-bold">
              {prochain?.sousTheme ?? "Tous les jalons sont construits"}
            </p>
            <p className="text-xs text-muted-foreground">
              {totalAcquis} compétences acquises sur {CORPUS.length}
            </p>
          </div>
          <Sparkles className="h-5 w-5 text-brand" />
        </section>

        <div className="grid min-w-0 gap-4 lg:grid-cols-2">
          {AXES.map((axe, axeIndex) => {
            const qs = CORPUS.filter((q) => q.axe === axe.id);
            if (!qs.length) return null;
            const acquisAxe = qs.filter((q) => etatCarte(donnees.cartes[q.id]) === "acquis").length;
            const pctAxe = Math.floor((acquisAxe / qs.length) * 100);
            const themes = [...new Set(qs.map((q) => q.sousTheme))];
            return (
              <section
                key={axe.id}
                className="relative min-w-0 space-y-2 overflow-hidden rounded-3xl border border-border bg-card/95 px-3 py-3 shadow-[var(--shadow-card)]"
              >
                {axeIndex < AXES.length - 1 ? (
                  <span className="absolute -bottom-4 left-1/2 h-4 border-l-2 border-dashed border-primary/30" />
                ) : null}
                <div className="flex items-center gap-2.5">
                  <IconeAxe axe={axe} className="h-10 w-10" />
                  <div className="min-w-0">
                    <p className="text-[0.6rem] font-bold text-muted-foreground uppercase">
                      Étape {axeIndex + 1}
                    </p>
                    <h2 className="text-[0.82rem] font-bold" style={{ color: axe.couleur }}>
                      {axe.nom}
                    </h2>
                  </div>
                  <span
                    className="ml-auto flex shrink-0 flex-col items-center rounded-full px-2 py-1 text-center"
                    style={{ backgroundColor: `${axe.couleur}22`, color: axe.couleur }}
                  >
                    <span className="text-xs leading-none font-extrabold tabular-nums">
                      {pctAxe}%
                    </span>
                    <span className="mt-0.5 text-[0.5rem] leading-none font-bold whitespace-nowrap">
                      maîtrisé
                    </span>
                  </span>
                </div>
                <div className="space-y-1.5">

                  {themes.map((theme, themeIndex) => {
                    const questions = qs.filter((q) => q.sousTheme === theme);
                    const progression = progressionSousTheme(theme, donnees.cartes);
                    const vus = questions.filter(
                      (q) => etatCarte(donnees.cartes[q.id]) !== "neuf",
                    ).length;
                    const terminees = questions.filter(
                      (q) => etatCarte(donnees.cartes[q.id]) === "acquis",
                    ).length;
                    const complet = terminees === questions.length;
                    const actif = vus > 0 && !complet;
                    const estProchain = prochain?.sousTheme === theme;
                    return (
                      <div key={theme} className="relative flex items-center gap-2.5">
                        {themeIndex < themes.length - 1 ? (
                          <span className="absolute top-9 bottom-[-0.3rem] left-[1.06rem] border-l-2 border-dashed border-primary/25" />
                        ) : null}
                        <button
                          onClick={() => setChoisie(questions[0] ?? null)}
                          className={cn(
                            "tap relative z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 text-[0.7rem] font-extrabold shadow-[0_2px_0_var(--color-border)] transition-transform active:translate-y-0.5",

                            complet
                              ? "bg-success text-success-foreground ring-4 ring-success/15"
                              : actif || estProchain
                                ? "bg-card ring-4 ring-primary/10"
                                : "bg-elevated",
                          )}
                          style={{ borderColor: `${axe.couleur}77`, color: axe.couleur }}
                        >
                          {complet ? (
                            <Check className="h-4 w-4" />
                          ) : actif || estProchain ? (
                            themeIndex + 1
                          ) : (
                            <LockKeyhole className="h-3.5 w-3.5 opacity-55" />

                          )}
                        </button>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <p className="min-w-0 truncate text-xs font-semibold">{theme}</p>
                            {!progression.termine ? (
                              <span className="shrink-0 rounded-full bg-primary/10 px-1.5 py-0.5 text-[0.58rem] font-bold text-primary">
                                Niv. {progression.niveau}
                              </span>
                            ) : null}
                          </div>
                          <div className="mt-1 h-2 overflow-hidden rounded-full bg-elevated">

                            <div
                              className="h-full rounded-full transition-[width] duration-700"
                              style={{
                                width: `${questions.length ? (vus / questions.length) * 100 : 0}%`,
                                backgroundColor: axe.couleur,
                              }}
                            />
                          </div>
                          {!progression.termine ? (
                            <p className="mt-0.5 text-[0.58rem] text-muted-foreground">

                              {progression.restantesNiveau} validation
                              {progression.restantesNiveau > 1 ? "s" : ""} avant le niveau{" "}
                              {progression.niveau + 1}
                            </p>
                          ) : null}
                        </div>
                        <span className="text-[0.65rem] font-semibold text-muted-foreground">
                          {terminees}/{questions.length} validées
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
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
