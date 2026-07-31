import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, ListOrdered, SkipForward } from "lucide-react";
import { Exercice } from "@/components/ingego/exercice";
import { MotIngego, PastilleIngego } from "@/components/ingego/marque";
import { AXE_BY_ID, CORPUS } from "@/lib/ingego/corpus";
import { useHistorique } from "@/lib/ingego/historique";

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: search.q ? Number(search.q) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "IngéGo bêta — relecture des questions" },
      {
        name: "description",
        content:
          "Mode bêta test : parcours linéaire des questions du concours d'ingénieur territorial, une par une, numérotées, sans compte ni validation.",
      },
      { property: "og:title", content: "IngéGo bêta — relecture des questions" },
      {
        property: "og:description",
        content: "Mode bêta test : parcours linéaire des questions du concours d'ingénieur territorial, une par une, numérotées, sans compte ni validation.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: BetaTest,
});

const CLE = "ingego-beta-index";

function BetaTest() {
  const total = CORPUS.length;
  const { q: cible } = Route.useSearch();
  const [i, setI] = useState(0);
  const [saut, setSaut] = useState("");
  const [repondu, setRepondu] = useState(false);
  const { historique, commentaires, noter, commenter } = useHistorique();

  useEffect(() => {
    if (cible && Number.isFinite(cible)) {
      setI(Math.min(Math.max(1, Math.round(cible)), total) - 1);
      return;
    }
    const brut = Number(localStorage.getItem(CLE));
    if (Number.isFinite(brut) && brut > 0 && brut < total) setI(brut);
  }, [total, cible]);

  useEffect(() => {
    localStorage.setItem(CLE, String(i));
    setRepondu(false);
  }, [i]);

  const q = CORPUS[i];
  const statut = q ? historique[q.id] : undefined;

  function suivante(note?: number) {
    if (q && typeof note === "number") noter(q.id, note >= 2 ? "ok" : "ko");
    setI((n) => Math.min(n + 1, total));
    window.scrollTo({ top: 0 });
  }


  function allerA(n: number) {
    if (!Number.isFinite(n)) return;
    setI(Math.min(Math.max(1, Math.round(n)), total) - 1);
    window.scrollTo({ top: 0 });
  }

  return (
    <div className="min-h-screen bg-background pb-16">
      <header className="border-b border-border bg-card/90 px-5 pt-4 pb-4 backdrop-blur">
        <div className="mx-auto flex max-w-2xl items-center gap-2.5">
          <PastilleIngego className="h-7 w-7 rounded-lg" />
          <MotIngego className="text-lg" />
          <Link
            to="/questions"
            className="tap ml-auto inline-flex items-center gap-1.5 rounded-full border border-border px-3 py-1.5 text-xs font-medium"
          >
            <ListOrdered className="h-3.5 w-3.5" />
            Toutes les questions
          </Link>
        </div>
        <div className="mx-auto mt-3 flex max-w-2xl items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-[0.7rem] font-medium tracking-[0.12em] text-brand uppercase">
              {q ? `${AXE_BY_ID[q.axe]?.court ?? q.axe} · ${q.sousTheme}` : "Relecture linéaire"}
            </p>
            <h1 className="truncate text-3xl text-primary">
              {q ? `Question ${i + 1}` : "Corpus terminé"}
              <span className="text-lg text-muted-foreground"> / {total}</span>
            </h1>
          </div>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              allerA(Number(saut));
              setSaut("");
            }}
            className="flex shrink-0 items-center gap-1.5"
          >
            <input
              inputMode="numeric"
              value={saut}
              onChange={(e) => setSaut(e.target.value)}
              placeholder="N°"
              aria-label="Aller à la question numéro"
              className="w-16 rounded-lg border border-input bg-background px-2 py-1.5 text-sm outline-none focus:border-ring"
            />
            <button
              type="submit"
              className="tap rounded-lg border border-border bg-elevated px-2.5 py-1.5 text-xs font-medium"
            >
              Aller
            </button>
          </form>
        </div>
        <div className="mx-auto mt-3 h-1 max-w-2xl overflow-hidden rounded-full bg-elevated">
          <div
            className="h-full rounded-full bg-primary transition-[width] duration-300"
            style={{ width: `${(i / total) * 100}%` }}
          />
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-5 py-6">
        {q ? (
          <div className="space-y-4">
            <p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="font-mono">{q.id}</span> · {AXE_BY_ID[q.axe]?.nom ?? q.axe} · format{" "}
              {q.type} · niveau {q.niv}
              {statut ? (
                <span
                  className={
                    statut === "ok"
                      ? "rounded-full bg-success/15 px-2 py-0.5 text-success"
                      : "rounded-full bg-destructive/15 px-2 py-0.5 text-destructive"
                  }
                >
                  {statut === "ok" ? "déjà juste" : "déjà à revoir"}
                </span>
              ) : null}
            </p>
            <Exercice
              key={q.id}
              q={q}
              numero={i + 1}
              total={total}
              onNote={suivante}
              onCorrige={(juste) => {
                noter(q.id, juste ? "ok" : "ko");
                setRepondu(true);
              }}
            />
            {repondu || commentaires[q.id] ? (
              <Observation
                key={`obs-${q.id}`}
                valeur={commentaires[q.id] ?? ""}
                onChange={(t) => commenter(q.id, t)}
              />
            ) : null}

            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => allerA(i)}
                disabled={i === 0}
                className="tap rounded-xl border border-border py-3 text-sm font-medium disabled:opacity-40"
              >
                Question précédente
              </button>
              <button
                onClick={() => suivante()}
                className="tap flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground"
              >
                Passer à la suivante
                <SkipForward className="h-4 w-4" />
              </button>
            </div>
          </div>
        ) : (
          <div className="surface space-y-4 p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Les {total} questions ont été parcourues.
            </p>
            <button
              onClick={() => allerA(1)}
              className="tap inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
            >
              Repartir de la question 1
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
