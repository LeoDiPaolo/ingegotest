import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Download,
  RotateCcw,
  SlidersHorizontal,
  Database,
  ShieldCheck,
} from "lucide-react";
import { CarteRappels } from "@/components/ingego/rappels";
import { Entete } from "@/components/ingego/entete";
import { NavBas } from "@/components/ingego/nav-bas";
import { AXES, CORPUS, FAMILLES, type Famille } from "@/lib/ingego/corpus";
import { serieJours, useDonnees } from "@/lib/ingego/stockage";
import { cn } from "@/lib/utils";

const TITRE = "Réglages — IngéGo";
const DESC =
  "Axes et familles de contenu actifs, nombre de questions par session, points à revérifier avant l'écrit, export et remise à zéro des données.";

export const Route = createFileRoute("/reglages")({
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

function Page() {
  const { donnees, synchro, majReglages, reinitialiser } = useDonnees();
  const [confirme, setConfirme] = useState(false);
  const r = donnees.reglages;

  const serie = useMemo(
    () => serieJours(donnees.journal.filter((e) => e.id === "__session").map((e) => e.jour)),
    [donnees.journal],
  );

  const aVerifier = useMemo(
    () => CORPUS.filter((q) => q.aVerifier || (q.fam === "M" && !q.derniereVerification)),
    [],
  );

  const bascule = <T,>(liste: T[], v: T) =>
    liste.includes(v) ? liste.filter((x) => x !== v) : [...liste, v];

  function exporter() {
    const blob = new Blob([JSON.stringify(donnees, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ingego-donnees-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <Entete serie={serie} etat={donnees.cartes} synchro={synchro} jauges={false} />

      <main className="mx-auto max-w-3xl space-y-5 px-5 py-5">
        <div>
          <p className="text-xs font-bold text-brand uppercase">Poste de contrôle</p>
          <h1 className="text-2xl text-primary">Réglages</h1>
        </div>

        <section className="surface space-y-3 p-4">
          <h2 className="flex items-center gap-2 text-sm font-bold">
            <SlidersHorizontal className="h-4 w-4 text-brand" /> Axes actifs
          </h2>
          <div className="flex flex-wrap gap-2">
            {AXES.map((a) => {
              const actif = r.axes.includes(a.id);
              return (
                <button
                  key={a.id}
                  onClick={() => majReglages({ axes: bascule(r.axes, a.id) })}
                  className={cn(
                    "tap rounded-full border px-3 py-2 text-xs font-semibold",
                    actif
                      ? "text-primary-foreground"
                      : "border-border bg-elevated text-muted-foreground",
                  )}
                  style={actif ? { backgroundColor: a.couleur, borderColor: a.couleur } : undefined}
                >
                  {a.court}
                </button>
              );
            })}
          </div>
        </section>

        <section className="surface space-y-3 p-4">
          <h2 className="flex items-center gap-2 text-sm font-bold">
            <ShieldCheck className="h-4 w-4 text-success" /> Familles de contenu
          </h2>
          <div className="space-y-2">
            {(Object.keys(FAMILLES) as Famille[]).map((f) => {
              const actif = r.familles.includes(f);
              return (
                <button
                  key={f}
                  onClick={() => majReglages({ familles: bascule(r.familles, f) })}
                  className={cn(
                    "tap w-full rounded-xl border px-3 py-2.5 text-left",
                    actif ? "border-primary bg-primary/10" : "border-border bg-elevated opacity-60",
                  )}
                >
                  <p className="text-sm font-semibold" style={{ color: FAMILLES[f].c }}>
                    {FAMILLES[f].nom}
                  </p>
                  <p className="text-xs text-muted-foreground">{FAMILLES[f].desc}</p>
                </button>
              );
            })}
          </div>
        </section>

        <section className="surface space-y-3 p-4">
          <h2 className="flex items-center gap-2 text-sm font-bold">
            <SlidersHorizontal className="h-4 w-4 text-brand" /> Questions par mission :{" "}
            {r.parSession}
          </h2>
          <input
            type="range"
            min={5}
            max={40}
            step={1}
            value={r.parSession}
            onChange={(e) => majReglages({ parSession: Number(e.target.value) })}
            className="w-full accent-[var(--color-brand)]"
          />
          <div className="flex gap-2">
            <button
              onClick={() => majReglages({ cible: "normal" })}
              className={cn(
                "tap flex-1 rounded-xl border py-2.5 text-xs font-semibold",
                r.cible === "normal" ? "border-primary bg-primary/10" : "border-border bg-elevated",
              )}
            >
              Mission normale
            </button>
            <button
              onClick={() => majReglages({ cible: "fragiles" })}
              className={cn(
                "tap flex-1 rounded-xl border py-2.5 text-xs font-semibold",
                r.cible === "fragiles"
                  ? "border-destructive bg-destructive/10"
                  : "border-border bg-elevated",
              )}
            >
              Reprendre les fragiles
            </button>
          </div>
        </section>

        <section className="surface space-y-2 p-4">
          <h2 className="text-sm font-bold">À revérifier avant l'écrit ({aVerifier.length})</h2>
          <ul className="space-y-2">
            {aVerifier.slice(0, 40).map((q) => (
              <li key={q.id} className="rounded-xl border border-warning/40 bg-warning/10 p-2.5">
                <p className="text-xs leading-snug">{q.question}</p>
                <p className="mt-1 text-[0.68rem] text-muted-foreground">
                  {q.sousTheme}
                  {q.aVerifier ? ` · ${q.aVerifier}` : " · date de vérification manquante"}
                </p>
              </li>
            ))}
          </ul>
          {aVerifier.length > 40 ? (
            <p className="text-xs text-muted-foreground">…et {aVerifier.length - 40} autres.</p>
          ) : null}
        </section>

        <CarteRappels />

        <section className="space-y-2">
          <p className="flex items-center gap-2 text-sm font-bold">
            <Database className="h-4 w-4 text-primary" /> Données personnelles
          </p>
          <button
            onClick={exporter}
            className="tap flex w-full items-center justify-center gap-2 rounded-xl border border-border bg-card py-3 text-sm font-semibold"
          >
            <Download className="h-4 w-4" /> Exporter mes données
          </button>
          <button
            onClick={() => (confirme ? (reinitialiser(), setConfirme(false)) : setConfirme(true))}
            className="tap flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 py-3 text-sm font-semibold text-destructive"
          >
            <RotateCcw className="h-4 w-4" />
            {confirme ? "Confirmer la remise à zéro" : "Remettre la progression à zéro"}
          </button>
          <p className="text-xs text-muted-foreground">
            Progression enregistrée en ligne et sur cet appareil, sans compte à créer.
          </p>
        </section>
      </main>

      <NavBas />
    </div>
  );
}
