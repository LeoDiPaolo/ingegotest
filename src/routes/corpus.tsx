import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { CheckCircle2, ChevronDown, Lock, MessageSquareText, Search, X } from "lucide-react";
import { Entete } from "@/components/ingego/entete";
import { NavBas } from "@/components/ingego/nav-bas";
import { AXES, CORPUS, FAMILLES, TYPES, attendue, type Question } from "@/lib/ingego/corpus";
import { etatCarte, validee } from "@/lib/ingego/algo";
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
  encours: "En consolidation",
  acquis: "Validée du 1er coup",
  fragile: "À valider du 1er coup",
};

const MARQUEUR = "En savoir plus";

/* L'explication porte parfois un bloc de définitions ajouté après relecture :
   on le détache pour l'afficher comme un vrai « en savoir plus ». */
function decouper(explication: string) {
  const i = explication.indexOf(MARQUEUR);
  if (i < 0) return { corps: explication, plus: "" };
  return {
    corps: explication.slice(0, i).trim(),
    plus: explication
      .slice(i + MARQUEUR.length)
      .replace(/^\s*[—-]\s*/, "")
      .trim(),
  };
}

/* Affiche explicitement la ou les bonnes réponses d'une question validée. */
function reponseAttendue(q: Question) {
  if (q.type === "qcm") {
    const idx = q.bonneReponse ?? 0;
    const texte = q.options?.[idx];
    if (!texte) return null;
    return (
      <div className="space-y-1.5">
        {q.options?.map((opt, i) => (
          <div
            key={i}
            className={cn(
              "flex items-start gap-2 rounded-lg border px-2.5 py-1.5 text-sm",
              i === idx
                ? "border-success/40 bg-success/15 font-semibold text-success"
                : "border-success/15 bg-success/5 text-muted-foreground",
            )}
          >
            <span
              className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[0.65rem] font-bold",
                i === idx ? "bg-success text-white" : "bg-success/10 text-success/70",
              )}
            >
              {String.fromCharCode(65 + i)}
            </span>
            <span className="flex-1">{opt}</span>
          </div>
        ))}
      </div>
    );
  }

  if (q.type === "libre") {
    const texte = q.options?.[q.bonneReponse ?? 0] ?? "";
    return texte ? <p>{texte}</p> : null;
  }

  if (q.type === "vf") {
    return q.justification ? (
      <p>
        <span className="font-semibold">{q.vrai ? "Vrai" : "Faux"}</span> — {q.justification}
      </p>
    ) : null;
  }

  if (q.type === "ordre" && q.items && q.items.length > 0) {
    return (
      <ol className="list-decimal pl-4">
        {q.items.map((item, i) => (
          <li key={i}>{item}</li>
        ))}
      </ol>
    );
  }

  if (q.type === "assoc" && q.paires && q.paires.length > 0) {
    return (
      <ul className="space-y-1">
        {q.paires.map(([a, b], i) => (
          <li key={i}>
            <span className="font-semibold">{a}</span> → {b}
          </li>
        ))}
      </ul>
    );
  }

  if (q.type === "tri" && q.colonnes && q.elements) {
    const parColonne: Record<string, string[]> = {};
    for (const [nom] of q.colonnes.map((c) => [c] as const)) parColonne[nom] = [];
    for (const [elt, idx] of q.elements) {
      const col = q.colonnes[idx];
      if (col) (parColonne[col] ??= []).push(elt);
    }
    return (
      <div className="grid gap-3 sm:grid-cols-2">
        {q.colonnes.map((col) => (
          <div key={col} className="rounded-lg border border-success/20 bg-success/5 px-2.5 py-2">
            <p className="text-[0.62rem] font-bold text-success uppercase">{col}</p>
            <ul className="list-disc pl-4 text-sm">
              {parColonne[col]?.map((e, i) => <li key={i}>{e}</li>)}
            </ul>
          </div>
        ))}
      </div>
    );
  }

  if (q.type === "erreur" && q.correction) {
    return <p>{q.correction}</p>;
  }

  if (q.type === "trous" && q.texte && q.mots) {
    let texte = q.texte;
    for (const mot of q.mots) {
      texte = texte.replace("_____", `<strong>${mot}</strong>`);
    }
    return <p dangerouslySetInnerHTML={{ __html: texte }} />;
  }

  if (q.type === "carte" && q.bonneZone) {
    return <p>Bonne zone : <span className="font-semibold">{q.bonneZone}</span></p>;
  }

  if (q.type === "graphe" && q.bonneBarre != null && q.graphe?.labels) {
    return (
      <p>
        Bonne barre : <span className="font-semibold">{q.graphe.labels[q.bonneBarre]}</span>
      </p>
    );
  }

  if ((q.type === "camembert" || q.type === "plan") && q.bonneCible != null) {
    return <p>Bonne cible n° <span className="font-semibold">{q.bonneCible + 1}</span></p>;
  }

  if (q.type === "courbe" && q.bonnePoint != null) {
    return <p>Bon point n° <span className="font-semibold">{q.bonnePoint + 1}</span></p>;
  }

  if (q.correction) {
    return <p>{q.correction}</p>;
  }

  return null;
}

function Page() {
  const { donnees, synchro, commenter } = useDonnees();
  const [ouvert, setOuvert] = useState<string | null>(null);
  const [filtre, setFiltre] = useState("");
  const [voirCommentaires, setVoirCommentaires] = useState(false);
  const [detail, setDetail] = useState<Question | null>(null);
  const [voirPlus, setVoirPlus] = useState(false);

  const serie = useMemo(
    () => serieJours(donnees.journal.filter((e) => e.id === "__session").map((e) => e.jour)),
    [donnees.journal],
  );

  const totalValidees = useMemo(
    () => CORPUS.filter((q) => validee(donnees.cartes[q.id])).length,
    [donnees.cartes],
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

  const commentaires = useMemo(
    () =>
      CORPUS.filter((q) => Boolean(donnees.commentaires[q.id]?.trim())).map((q) => ({
        q,
        texte: donnees.commentaires[q.id],
      })),
    [donnees.commentaires],
  );

  const ouvrir = (q: Question) => {
    setDetail(q);
    setVoirPlus(false);
  };

  const detailDecoupe = detail ? decouper(detail.explication) : null;

  return (
    <div className="min-h-screen bg-background pb-24">
      <Entete serie={serie} etat={donnees.cartes} synchro={synchro} jauges={false} />

      <main className="mx-auto max-w-4xl space-y-5 px-5 py-5">
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-brand uppercase">Bibliothèque technique</p>
            <h1 className="text-2xl text-primary">Corpus</h1>
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <CheckCircle2 className="h-3.5 w-3.5 text-success" />
              <span>
                <span className="font-bold text-success">{totalValidees}</span> / {CORPUS.length}{" "}
                questions validées
              </span>
            </p>
          </div>
          <button
            onClick={() => setVoirCommentaires(true)}
            className="tap flex items-center gap-1.5 text-[0.68rem] font-semibold text-muted-foreground hover:text-primary"
          >
            <MessageSquareText className="h-3.5 w-3.5" /> Commentaires
            {commentaires.length ? (
              <span className="rounded-full bg-brand/15 px-1.5 py-0.5 text-brand">
                {commentaires.length}
              </span>
            ) : null}
          </button>
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
              {[...parSousTheme.entries()].map(([sousTheme, qs]) => {
                const nbValidees = qs.filter((q) => validee(donnees.cartes[q.id])).length;
                return (
                  <div
                    key={sousTheme}
                    className="mission-strip overflow-hidden rounded-2xl border border-border"
                  >
                    <button
                      onClick={() =>
                        setOuvert(ouvert === axe.id + sousTheme ? null : axe.id + sousTheme)
                      }
                      className="tap w-full bg-card px-4 py-3 text-left text-sm font-semibold"
                    >
                      <span className="flex items-center gap-2">
                        <span className="flex-1">{sousTheme}</span>
                        <span
                          className={cn(
                            "rounded-full px-2 py-0.5 text-[0.62rem] font-bold",
                            nbValidees === qs.length
                              ? "bg-success/15 text-success"
                              : "bg-elevated text-muted-foreground",
                          )}
                        >
                          {nbValidees}/{qs.length} validées
                        </span>
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 transition-transform",
                            ouvert === axe.id + sousTheme && "rotate-180",
                          )}
                        />
                      </span>
                      <span className="mt-2 flex h-1.5 w-full overflow-hidden rounded-full bg-elevated">
                        <span
                          className="h-full rounded-full bg-success transition-all"
                          style={{ width: `${(nbValidees / qs.length) * 100}%` }}
                        />
                      </span>
                      <span className="mt-1.5 flex flex-wrap gap-1">
                        {qs.map((q) => (
                          <span
                            key={q.id}
                            aria-hidden
                            className={cn(
                              "h-1.5 w-4 rounded-full",
                              validee(donnees.cartes[q.id]) ? "bg-success" : "bg-border",
                            )}
                          />
                        ))}
                      </span>
                    </button>
                    {ouvert === axe.id + sousTheme ? (
                      <ul className="divide-y divide-border border-t border-border">
                        {qs.map((q) => {
                          const ok = validee(donnees.cartes[q.id]);
                          return (
                            <li key={q.id}>
                              <button
                                onClick={() => ok && ouvrir(q)}
                                disabled={!ok}
                                className={cn(
                                  "tap flex w-full items-start gap-2 border-l-4 px-4 py-3 text-left",
                                  ok
                                    ? "border-success bg-success/8"
                                    : "cursor-not-allowed border-transparent bg-background opacity-60",
                                )}
                              >
                                {ok ? (
                                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-success" />
                                ) : (
                                  <Lock className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/35" />
                                )}
                                <span className="min-w-0 flex-1">
                                  <span className="block text-sm leading-snug">{q.question}</span>
                                  <span className="mt-1 block text-[0.62rem] text-muted-foreground">
                                    Niveau {q.niv} ·{" "}
                                    {ok ? "Validée — voir la fiche" : "Validez-la en session pour l'ouvrir"}
                                  </span>
                                </span>
                              </button>
                            </li>
                          );
                        })}
                      </ul>
                    ) : null}
                  </div>
                );
              })}
            </section>
          ))}
        </div>
      </main>

      {detail && detailDecoupe ? (
        <div
          className="fixed inset-0 z-50 bg-primary/35 p-3 backdrop-blur-sm sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Détail de la question"
        >
          <section className="mx-auto flex max-h-[calc(100dvh-1.5rem)] max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-lift)] sm:max-h-[calc(100dvh-3rem)]">
            <header className="flex items-start gap-3 border-b border-border px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="text-[0.62rem] font-bold text-brand uppercase">
                  {detail.sousTheme} · Niveau {detail.niv} · {TYPES[detail.type]}
                </p>
                <h2 className="text-base leading-snug font-bold">{detail.question}</h2>
              </div>
              <button
                onClick={() => setDetail(null)}
                aria-label="Fermer"
                className="tap rounded-full p-2 text-muted-foreground hover:bg-elevated"
              >
                <X className="h-5 w-5" />
              </button>
            </header>
            <div className="space-y-3 overflow-auto px-4 py-4">
              <div className="flex flex-wrap items-center gap-1.5 text-[0.62rem]">
                <span
                  className="rounded-full px-2 py-0.5 font-semibold"
                  style={{
                    backgroundColor: `${FAMILLES[detail.fam].c}22`,
                    color: FAMILLES[detail.fam].c,
                  }}
                >
                  {FAMILLES[detail.fam].nom}
                  {detail.fam === "M" && detail.derniereVerification
                    ? ` · vérifié ${detail.derniereVerification}`
                    : ""}
                </span>
                <span className="rounded-full bg-elevated px-2 py-0.5 text-muted-foreground">
                  {ETIQUETTE[etatCarte(donnees.cartes[detail.id])]}
                </span>
              </div>

              {reponseAttendue(detail) ? (
                <div className="rounded-xl border border-success/30 bg-success/10 px-3 py-2.5">
                  <p className="text-[0.62rem] font-bold text-success uppercase">
                    Réponse attendue
                  </p>
                  <div className="text-sm">{reponseAttendue(detail)}</div>
                </div>
              ) : null}

              <p className="text-sm leading-relaxed text-muted-foreground">
                {detailDecoupe.corps}
              </p>

              {detailDecoupe.plus ? (
                <div className="overflow-hidden rounded-xl border border-border">
                  <button
                    onClick={() => setVoirPlus((v) => !v)}
                    className="tap flex w-full items-center gap-2 bg-elevated px-3 py-2.5 text-left text-xs font-bold"
                  >
                    <span className="flex-1">En savoir plus</span>
                    <ChevronDown className={cn("h-4 w-4 transition-transform", voirPlus && "rotate-180")} />
                  </button>
                  {voirPlus ? (
                    <p className="border-t border-border px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
                      {detailDecoupe.plus}
                    </p>
                  ) : null}
                </div>
              ) : null}

              <div>
                <p className="mb-1 text-[0.62rem] font-bold text-muted-foreground uppercase">
                  Observation personnelle
                </p>
                <textarea
                  defaultValue={donnees.commentaires[detail.id] ?? ""}
                  onBlur={(e) => commenter(detail.id, e.target.value)}
                  placeholder="Observation personnelle…"
                  rows={3}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-xs outline-none focus:border-ring"
                />
              </div>
            </div>
          </section>
        </div>
      ) : null}

      {voirCommentaires ? (
        <div
          className="fixed inset-0 z-50 bg-primary/35 p-3 backdrop-blur-sm sm:p-6"
          role="dialog"
          aria-modal="true"
          aria-label="Tableau des commentaires"
        >
          <section className="mx-auto flex max-h-[calc(100dvh-1.5rem)] max-w-4xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-[var(--shadow-lift)] sm:max-h-[calc(100dvh-3rem)]">
            <header className="flex items-center gap-3 border-b border-border px-4 py-3">
              <MessageSquareText className="h-5 w-5 text-brand" />
              <div className="min-w-0 flex-1">
                <h2 className="text-base font-bold">Commentaires enregistrés</h2>
                <p className="text-xs text-muted-foreground">
                  {commentaires.length} question{commentaires.length > 1 ? "s" : ""} annotée
                  {commentaires.length > 1 ? "s" : ""}
                </p>
              </div>
              <button
                onClick={() => setVoirCommentaires(false)}
                aria-label="Fermer"
                className="tap rounded-full p-2 text-muted-foreground hover:bg-elevated"
              >
                <X className="h-5 w-5" />
              </button>
            </header>
            <div className="overflow-auto">
              {commentaires.length ? (
                <table className="w-full table-fixed border-collapse text-left text-xs sm:text-sm">
                  <thead className="sticky top-0 bg-elevated text-muted-foreground">
                    <tr>
                      <th className="w-[38%] px-4 py-2.5">Question</th>
                      <th className="px-4 py-2.5">Commentaire</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {commentaires.map(({ q, texte }) => (
                      <tr key={q.id} className="align-top">
                        <td className="px-4 py-3">
                          <span className="mb-1 block text-[0.62rem] font-bold text-brand uppercase">
                            {q.sousTheme} · Niv. {q.niveau}
                          </span>
                          {q.question}
                        </td>
                        <td className="px-4 py-3 leading-relaxed text-muted-foreground">{texte}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <p className="p-8 text-center text-sm text-muted-foreground">
                  Aucun commentaire enregistré pour le moment.
                </p>
              )}
            </div>
          </section>
        </div>
      ) : null}

      <NavBas />
    </div>
  );
}
