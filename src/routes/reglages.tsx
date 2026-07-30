import { createFileRoute } from "@tanstack/react-router";
import { LogOut } from "lucide-react";
import { AppShell } from "@/components/ingego/app-shell";
import { PanneauConnexion } from "@/components/ingego/panneau-connexion";
import { useAuth } from "@/hooks/use-auth";
import { useProgression } from "@/hooks/use-progression";
import { AXES, CORPUS, FAMILLES, META, TYPES, type Famille, type TypeExo } from "@/lib/ingego/corpus";
import { REGLAGES_DEFAUT } from "@/lib/ingego/algo";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/reglages")({
  head: () => ({
    meta: [
      { title: "Réglages — IngéGo" },
      {
        name: "description",
        content:
          "Choisissez les axes, les familles de savoir, les formats d'exercice et la taille de session. Vos réglages suivent votre compte.",
      },
      { property: "og:title", content: "Réglages — IngéGo" },
      {
        property: "og:description",
        content: "Axes, familles, formats et taille de session, synchronisés avec votre compte.",
      },
    ],
  }),
  component: Reglages,
});

function Reglages() {
  const { user, pret } = useAuth();
  const { reglages, majReglages } = useProgression(user?.id);

  if (!pret) return null;
  if (!user) return <PanneauConnexion />;

  const bascule = <T,>(liste: T[], v: T): T[] =>
    liste.includes(v) ? liste.filter((x) => x !== v) : [...liste, v];

  return (
    <AppShell surTitre={user.email ?? undefined} titre="Réglages">
      <div className="space-y-5">
        <section className="surface p-5">
          <h2 className="text-lg">Taille de session</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Les reprises dues passent avant les nouveautés ; environ 40 % de nouveau quand la file
            due est courte.
          </p>
          <div className="mt-4 flex items-center gap-4">
            <input
              type="range"
              min={6}
              max={30}
              step={2}
              value={reglages.parSession}
              onChange={(e) => majReglages({ parSession: Number(e.target.value) })}
              className="min-w-0 flex-1 accent-[var(--primary)]"
            />
            <span className="w-10 shrink-0 text-right font-display text-2xl">
              {reglages.parSession}
            </span>
          </div>
        </section>

        <section className="surface p-5">
          <h2 className="text-lg">Mode de ciblage</h2>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {(
              [
                ["normal", "Programme normal"],
                ["fragiles", "Cartes fragiles"],
              ] as const
            ).map(([v, label]) => (
              <button
                key={v}
                onClick={() => majReglages({ cible: v })}
                className={cn(
                  "tap rounded-xl border py-3 text-sm font-semibold",
                  reglages.cible === v
                    ? "border-primary bg-primary/15"
                    : "border-border bg-elevated text-muted-foreground",
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        <section className="surface p-5">
          <h2 className="text-lg">Axes</h2>
          <ul className="mt-3 space-y-2">
            {AXES.map((a) => {
              const actif = reglages.axes.includes(a.id);
              return (
                <li key={a.id}>
                  <button
                    onClick={() => majReglages({ axes: bascule(reglages.axes, a.id) })}
                    className={cn(
                      "tap grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-xl border px-3 py-3 text-left",
                      actif ? "border-border bg-elevated" : "border-border/40 opacity-50",
                    )}
                  >
                    <span
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ backgroundColor: a.couleur }}
                    />
                    <span className="min-w-0 truncate text-sm">{a.nom}</span>
                    <span className="shrink-0 text-xs text-muted-foreground">
                      {CORPUS.filter((q) => q.axe === a.id).length}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="surface p-5">
          <h2 className="text-lg">Familles de savoir</h2>
          <div className="mt-3 grid gap-2">
            {(Object.keys(FAMILLES) as Famille[]).map((f) => {
              const actif = reglages.familles.includes(f);
              return (
                <button
                  key={f}
                  onClick={() => majReglages({ familles: bascule(reglages.familles, f) })}
                  className={cn(
                    "tap rounded-xl border px-3 py-3 text-left text-sm",
                    actif ? "border-border bg-elevated" : "border-border/40 opacity-50",
                  )}
                  style={actif ? { borderColor: FAMILLES[f].c } : undefined}
                >
                  {FAMILLES[f].nom}
                </button>
              );
            })}
          </div>
        </section>

        <section className="surface p-5">
          <h2 className="text-lg">Formats d'exercice</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {(Object.keys(TYPES) as TypeExo[]).map((t) => {
              const actif = reglages.types.includes(t);
              return (
                <button
                  key={t}
                  onClick={() => majReglages({ types: bascule(reglages.types, t) })}
                  className={cn(
                    "tap rounded-full border px-3.5 py-2 text-xs",
                    actif
                      ? "border-primary bg-primary/15"
                      : "border-border/50 text-muted-foreground",
                  )}
                >
                  {TYPES[t]}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => majReglages(REGLAGES_DEFAUT)}
            className="tap mt-4 text-xs text-muted-foreground underline"
          >
            Rétablir les réglages par défaut
          </button>
        </section>

        <section className="surface p-5">
          <h2 className="text-lg">Compte</h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Progression synchronisée : téléphone, tablette et ordinateur partagent la même file.
          </p>
          <button
            onClick={() => supabase.auth.signOut()}
            className="tap mt-4 flex items-center gap-2 rounded-xl border border-border px-4 py-3 text-sm font-semibold"
          >
            <LogOut className="h-4 w-4" />
            Se déconnecter
          </button>
        </section>

        <p className="px-1 text-center text-[0.68rem] text-muted-foreground">
          Corpus {META.version} · {CORPUS.length} questions · algorithmes de planification repris tels
          quels de l'artefact d'origine.
        </p>
      </div>
    </AppShell>
  );
}
