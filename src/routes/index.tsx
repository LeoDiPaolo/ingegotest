import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, SkipForward } from "lucide-react";
import { Exercice } from "@/components/ingego/exercice";
import { MotIngego, PastilleIngego } from "@/components/ingego/marque";
import { AXE_BY_ID, CORPUS } from "@/lib/ingego/corpus";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "IngéGo bêta — relecture des 322 questions" },
      {
        name: "description",
        content:
          "Mode bêta test : parcours linéaire des questions du concours d'ingénieur territorial, une par une, numérotées, sans compte ni validation.",
      },
      { property: "og:title", content: "IngéGo bêta — relecture des 322 questions" },
      {
        property: "og:description",
        content: "Parcours linéaire numéroté, question par question, pour relire tout le corpus.",
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
  const [i, setI] = useState(0);
  const [saut, setSaut] = useState("");

  useEffect(() => {
    const brut = Number(localStorage.getItem(CLE));
    if (Number.isFinite(brut) && brut > 0 && brut < total) setI(brut);
  }, [total]);

  useEffect(() => {
    localStorage.setItem(CLE, String(i));
  }, [i]);

  const q = CORPUS[i];

  function suivante() {
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
          <span className="ml-auto rounded-full border border-border px-2.5 py-1 text-[0.65rem] tracking-[0.14em] text-muted-foreground uppercase">
            Bêta test
          </span>
        </div>
        <div className="mx-auto mt-3 flex max-w-2xl items-end justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[0.7rem] font-medium tracking-[0.18em] text-brand uppercase">
              Relecture linéaire
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
            <p className="text-xs text-muted-foreground">
              <span className="font-mono">{q.id}</span> · {AXE_BY_ID[q.axe]?.nom ?? q.axe} · format{" "}
              {q.type} · niveau {q.niv}
            </p>
            <Exercice key={q.id} q={q} numero={i + 1} total={total} onNote={suivante} />
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => allerA(i)}
                disabled={i === 0}
                className="tap rounded-xl border border-border py-3 text-sm font-medium disabled:opacity-40"
              >
                Question précédente
              </button>
              <button
                onClick={suivante}
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
