import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { Entete } from "@/components/ingego/entete";
import { NavBas } from "@/components/ingego/nav-bas";
import { AXES, CORPUS, FAMILLES, TYPES, attendue } from "@/lib/ingego/corpus";
import { etatCarte } from "@/lib/ingego/algo";
import { serieJours, useDonnees } from "@/lib/ingego/stockage";
import { cn } from "@/lib/utils";
import { IconeAxe } from "@/components/ingego/univers";

const TITRE = "Corpus — toutes les questions IngéGo";
const DESC =
  "Consultation du corpus complet par axe et sous-thème : énoncé, réponse attendue, famille de contenu et observations personnelles.";

export const Route = createFileRoute("/corpus")({
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

const ETIQUETTE: Record<string, string> = {
  neuf: "Jamais posée",
  encours: "En cours",
  acquis: "Acquise",
  fragile: "Fragile",
};

function Page() {
  const { donnees, synchro, commenter } = useDonnees();
  const [ouvert, setOuvert] = useState<string | null>(null);
  const [filtre, setFiltre] = useState("");

  const serie = useMemo(
    () => serieJours(donnees.journal.filter((e) => e.id === "__session").map((e) => e.jour)),
    [donnees.journal],
  );

  const groupes = useMemo(() => {
    const f = filtre.trim().toLowerCase();
    return AXES.map((axe) => {
      const parSousTheme = new Map<string, typeof CORPUS>();
      for (const q of CORPUS) {
        if (q.axe !== axe.id) continue;
        if (f && !`${q.question} ${q.sousTheme} ${q.explication}`.toLowerCase().includes(f))
          continue;
        parSousTheme.set(q.sousTheme, [...(parSousTheme.get(q.sousTheme) ?? []), q]);
      }
      return { axe, parSousTheme };
    }).filter((g) => g.parSousTheme.size > 0);
  }, [filtre]);

  return (
    <div className="min-h-screen bg-background pb-24">
      <Entete serie={serie} etat={donnees.cartes} synchro={synchro} jauges={false} />

      <main className="mx-auto max-w-4xl space-y-5 px-5 py-5">
        <div>
          <p className="text-xs font-bold text-brand uppercase">Bibliothèque technique</p>
          <h1 className="text-2xl text-primary">Corpus</h1>
        </div>
        <label className="flex items-center gap-2 rounded-2xl border border-input bg-card px-4 shadow-[var(--shadow-card)] focus-within:border-ring">
          <Search className="h-4 w-4 text-muted-foreground" />
          <input
            value={filtre}
            onChange={(e) => setFiltre(e.target.value)}
            placeholder="Rechercher une question, un thème…"
            className="min-w-0 flex-1 bg-transparent py-3.5 text-sm outline-none"
          />
        </label>

        <div className="grid items-start gap-5 lg:grid-cols-2">
          {groupes.map(({ axe, parSousTheme }) => (
            <section key={axe.id} className="space-y-2">
              <div className="flex items-center gap-3">
                <IconeAxe axe={axe} className="h-11 w-11" />
                <div>
                  <p className="text-[0.62rem] font-bold text-muted-foreground uppercase">
                    Dossier {axe.id}
                  </p>
                  <h2 className="text-sm font-bold" style={{ color: axe.couleur }}>
                    {axe.nom}
                  </h2>
                </div>
              </div>
              {[...parSousTheme.entries()].map(([sousTheme, qs]) => (
                <div
                  key={sousTheme}
                  className="mission-strip overflow-hidden rounded-2xl border border-border"
                >
                  <button
                    onClick={() =>
                      setOuvert(ouvert === axe.id + sousTheme ? null : axe.id + sousTheme)
                    }
                    className="tap flex w-full items-center gap-2 bg-card px-4 py-3 text-left text-sm font-semibold"
                  >
                    <span className="flex-1">{sousTheme}</span>
                    <span className="text-xs text-muted-foreground">{qs.length}</span>
                    <ChevronDown
                      className={cn(
                        "h-4 w-4 transition-transform",
                        ouvert === axe.id + sousTheme && "rotate-180",
                      )}
                    />
                  </button>
                  {ouvert === axe.id + sousTheme ? (
                    <ul className="divide-y divide-border border-t border-border">
                      {qs.map((q) => (
                        <li key={q.id} className="space-y-2 bg-background px-4 py-3">
                          <div className="flex flex-wrap items-center gap-1.5 text-[0.62rem]">
                            <span className="rounded-full bg-elevated px-2 py-0.5 text-muted-foreground">
                              Niveau {q.niv} · {TYPES[q.type]}
                            </span>
                            <span
                              className="rounded-full px-2 py-0.5 font-semibold"
                              style={{
                                backgroundColor: `${FAMILLES[q.fam].c}22`,
                                color: FAMILLES[q.fam].c,
                              }}
                            >
                              {FAMILLES[q.fam].nom}
                              {q.fam === "M" && q.derniereVerification
                                ? ` · vérifié ${q.derniereVerification}`
                                : ""}
                            </span>
                            <span className="rounded-full bg-elevated px-2 py-0.5 text-muted-foreground">
                              {ETIQUETTE[etatCarte(donnees.cartes[q.id])]}
                            </span>
                          </div>
                          <p className="text-sm leading-snug">{q.question}</p>
                          {attendue(q) ? (
                            <p className="text-xs text-success">Réponse : {attendue(q)}</p>
                          ) : null}
                          <p className="text-xs text-muted-foreground">{q.explication}</p>
                          <textarea
                            defaultValue={donnees.commentaires[q.id] ?? ""}
                            onBlur={(e) => commenter(q.id, e.target.value)}
                            placeholder="Observation personnelle…"
                            rows={2}
                            className="w-full rounded-lg border border-input bg-card px-3 py-2 text-xs outline-none focus:border-ring"
                          />
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ))}
            </section>
          ))}
        </div>
      </main>

      <NavBas />
    </div>
  );
}
