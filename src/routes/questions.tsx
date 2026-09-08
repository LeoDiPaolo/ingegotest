import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, Check, MessageSquare, RotateCcw, X } from "lucide-react";
import { AXES, AXE_BY_ID, CORPUS } from "@/lib/ingego/corpus";
import { useHistorique } from "@/lib/ingego/historique";

export const Route = createFileRoute("/questions")({
  head: () => ({
    meta: [
      { title: "Toutes les questions — IngéGo bêta" },
      {
        name: "description",
        content:
          "Index complet des questions du corpus IngéGo avec l'historique des réponses déjà données, juste ou à revoir.",
      },
      { property: "og:title", content: "Toutes les questions — IngéGo bêta" },
      {
        property: "og:description",
        content: "Index numéroté du corpus avec historique juste / à revoir.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ListeQuestions,
});

type Filtre = "tout" | "repondu" | "ok" | "ko" | "reste";

const FILTRES: [Filtre, string][] = [
  ["tout", "Toutes"],
  ["repondu", "Répondues"],
  ["ok", "Justes"],
  ["ko", "À revoir"],
  ["reste", "Non vues"],
];

function ListeQuestions() {
  const { historique, commentaires, reinitialiser } = useHistorique();
  const [filtre, setFiltre] = useState<Filtre>("tout");
  const [axe, setAxe] = useState<string>("tout");
  const [recherche, setRecherche] = useState("");

  const liste = useMemo(
    () =>
      CORPUS.map((q, index) => ({ q, numero: index + 1, statut: historique[q.id] })).filter(
        ({ q, numero, statut }) => {
          if (axe !== "tout" && q.axe !== axe) return false;
          if (filtre === "repondu" && !statut) return false;
          if (filtre === "ok" && statut !== "ok") return false;
          if (filtre === "ko" && statut !== "ko") return false;
          if (filtre === "reste" && statut) return false;
          const texte = recherche.trim().toLowerCase();
          if (
            texte &&
            !`${numero} ${q.id} ${q.question} ${q.sousTheme}`.toLowerCase().includes(texte)
          )
            return false;
          return true;
        },
      ),
    [historique, filtre, axe, recherche],
  );

  const justes = Object.values(historique).filter((s) => s === "ok").length;
  const revoir = Object.values(historique).filter((s) => s === "ko").length;

  return (
    <div className="min-h-screen bg-background pb-16">
      <header className="border-b border-border bg-card/90 px-5 pt-4 pb-4 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-2">
          <Link
            to="/beta"
            search={{ q: undefined }}
            className="tap inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Parcours
          </Link>
          <button
            onClick={reinitialiser}
            className="tap ml-auto inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium text-muted-foreground"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Vider l'historique
          </button>
        </div>
        <div className="mx-auto mt-3 max-w-2xl">
          <h1 className="text-3xl text-primary">Toutes les questions</h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {CORPUS.length} questions · {justes} justes · {revoir} à revoir ·{" "}
            {CORPUS.length - justes - revoir} non vues
          </p>
        </div>
        <div className="mx-auto mt-3 flex max-w-2xl flex-wrap gap-1.5">
          {FILTRES.map(([cle, label]) => (
            <button
              key={cle}
              onClick={() => setFiltre(cle)}
              className={`tap rounded-full border px-3 py-1.5 text-xs font-medium ${
                filtre === cle
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border bg-elevated text-muted-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="mx-auto mt-2 flex max-w-2xl gap-2">
          <input
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            placeholder="Rechercher un numéro, un identifiant, un mot…"
            aria-label="Rechercher une question"
            className="min-w-0 flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring"
          />
          <select
            value={axe}
            onChange={(e) => setAxe(e.target.value)}
            aria-label="Filtrer par axe"
            className="rounded-lg border border-input bg-background px-2 py-2 text-sm outline-none focus:border-ring"
          >
            <option value="tout">Tous les axes</option>
            {AXES.map((a) => (
              <option key={a.id} value={a.id}>
                {a.court}
              </option>
            ))}
          </select>
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 py-4">
        <ul className="space-y-2">
          {liste.map(({ q, numero, statut }) => (
            <li key={q.id}>
              <Link
                to="/beta"
                search={{ q: numero }}
                className="tap flex items-start gap-3 rounded-xl border border-border bg-card p-3"
              >
                <span className="mt-0.5 w-10 shrink-0 text-right font-mono text-xs text-muted-foreground">
                  {numero}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm">{q.question}</span>
                  <span className="mt-1 block text-[0.68rem] text-muted-foreground">
                    {AXE_BY_ID[q.axe]?.court ?? q.axe} · {q.sousTheme} · niveau {q.niv}
                  </span>
                </span>
                <span className="hidden w-40 shrink-0 text-[0.68rem] text-muted-foreground sm:block">
                  {commentaires[q.id] ? (
                    <span className="line-clamp-3 whitespace-pre-wrap">{commentaires[q.id]}</span>
                  ) : (
                    <span className="opacity-40">—</span>
                  )}
                </span>
                {statut ? (
                  <span
                    className={`mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                      statut === "ok"
                        ? "bg-success/15 text-success"
                        : "bg-destructive/15 text-destructive"
                    }`}
                    aria-label={statut === "ok" ? "Répondu juste" : "Répondu à revoir"}
                  >
                    {statut === "ok" ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                  </span>
                ) : (
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-elevated" />
                )}
              </Link>
              {commentaires[q.id] ? (
                <p className="mt-1 rounded-lg bg-elevated px-3 py-2 text-[0.7rem] whitespace-pre-wrap text-muted-foreground sm:hidden">
                  <MessageSquare className="mr-1 inline h-3 w-3" />
                  {commentaires[q.id]}
                </p>
              ) : null}
            </li>
          ))}

        </ul>
        {liste.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Aucune question ne correspond à ce filtre.
          </p>
        ) : null}
      </main>
    </div>
  );
}
