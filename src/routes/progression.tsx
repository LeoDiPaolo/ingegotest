import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { AppShell } from "@/components/ingego/app-shell";
import { PanneauConnexion } from "@/components/ingego/panneau-connexion";
import { useAuth } from "@/hooks/use-auth";
import { useProgression } from "@/hooks/use-progression";
import { AXES, CORPUS, TYPES, mouvantsARevoir } from "@/lib/ingego/corpus";
import { JOUR, etatCarte, jourDe, niveauActif } from "@/lib/ingego/algo";

export const Route = createFileRoute("/progression")({
  head: () => ({
    meta: [
      { title: "Progression — IngéGo" },
      {
        name: "description",
        content:
          "État des 322 cartes : acquis, en cours, fragiles, neuf. Charge des sept prochains jours, niveaux actifs et faits mouvants à revérifier.",
      },
      { property: "og:title", content: "Progression — IngéGo" },
      {
        property: "og:description",
        content: "Répartition des cartes, charge à venir et faits à revérifier avant l'écrit.",
      },
    ],
  }),
  component: Progression,
});

const ETATS = [
  { cle: "acquis", label: "Acquis", couleur: "var(--success)" },
  { cle: "encours", label: "En cours", couleur: "var(--primary)" },
  { cle: "fragile", label: "Fragile", couleur: "var(--destructive)" },
  { cle: "neuf", label: "Non vu", couleur: "var(--muted-foreground)" },
] as const;

function Progression() {
  const { user, pret } = useAuth();
  const { etat, journal } = useProgression(user?.id);
  const now = Date.now();

  const parEtat = useMemo(() => {
    const c: Record<string, number> = { acquis: 0, encours: 0, fragile: 0, neuf: 0 };
    for (const q of CORPUS) c[etatCarte(etat[q.id])]++;
    return c;
  }, [etat]);

  const charge = useMemo(() => {
    const j: { jour: string; n: number }[] = [];
    for (let d = 0; d < 7; d++) {
      const debut = new Date(now + d * JOUR).setHours(0, 0, 0, 0);
      const fin = debut + JOUR;
      const n = CORPUS.filter((q) => {
        const c = etat[q.id];
        return c?.vu && c.du < fin && (d > 0 ? c.du >= debut : true);
      }).length;
      j.push({ jour: jourDe(debut), n });
    }
    return j;
  }, [etat, now]);

  const parType = useMemo(() => {
    const acc: Record<string, { total: number; ok: number }> = {};
    for (const q of CORPUS) {
      acc[q.type] ??= { total: 0, ok: 0 };
      acc[q.type].total++;
      if (etatCarte(etat[q.id]) === "acquis") acc[q.type].ok++;
    }
    return acc;
  }, [etat]);

  const sept = useMemo(() => {
    const set = new Map<string, number>();
    for (const e of journal) set.set(e.jour, (set.get(e.jour) ?? 0) + 1);
    return Array.from({ length: 7 }, (_, k) => {
      const j = jourDe(now - (6 - k) * JOUR);
      return { jour: j, n: set.get(j) ?? 0 };
    });
  }, [journal, now]);

  const mouvants = useMemo(() => mouvantsARevoir(now), [now]);
  const maxJ = Math.max(1, ...sept.map((s) => s.n));

  if (!pret) return null;
  if (!user) return <PanneauConnexion />;

  return (
    <AppShell surTitre={`${CORPUS.length} questions`} titre="Progression">
      <div className="space-y-5">
        <section className="surface p-5">
          <h2 className="text-lg">Répartition des cartes</h2>
          <div className="mt-4 flex h-3 overflow-hidden rounded-full bg-elevated">
            {ETATS.map((e) => (
              <div
                key={e.cle}
                style={{
                  width: `${(parEtat[e.cle] / CORPUS.length) * 100}%`,
                  backgroundColor: e.couleur,
                }}
              />
            ))}
          </div>
          <ul className="mt-4 grid grid-cols-2 gap-3">
            {ETATS.map((e) => (
              <li key={e.cle} className="flex items-center gap-2 text-sm">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: e.couleur }}
                />
                <span className="min-w-0 truncate text-muted-foreground">{e.label}</span>
                <span className="ml-auto font-semibold">{parEtat[e.cle]}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="surface p-5">
          <h2 className="text-lg">Sept derniers jours</h2>
          <div className="mt-4 flex h-24 items-end gap-1.5">
            {sept.map((s) => (
              <div key={s.jour} className="flex min-w-0 flex-1 flex-col items-center gap-1">
                <span className="text-[0.6rem] text-muted-foreground">{s.n || ""}</span>
                <div
                  className="w-full rounded-t bg-primary/70"
                  style={{ height: `${Math.max(2, (s.n / maxJ) * 100)}%` }}
                />
                <span className="text-[0.6rem] text-muted-foreground">{s.jour.slice(8)}</span>
              </div>
            ))}
          </div>
        </section>

        <section className="surface p-5">
          <h2 className="text-lg">Charge à venir</h2>
          <ul className="mt-3 space-y-1.5 text-sm">
            {charge.map((c, k) => (
              <li key={c.jour} className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                <span className="truncate text-muted-foreground">
                  {k === 0 ? "Aujourd'hui (dû)" : c.jour}
                </span>
                <span className="shrink-0 font-semibold">{c.n}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="surface p-5">
          <h2 className="text-lg">Axes et niveaux actifs</h2>
          <ul className="mt-3 space-y-3">
            {AXES.map((a) => {
              const qs = CORPUS.filter((q) => q.axe === a.id);
              const sujets = Array.from(new Set(qs.map((q) => q.sujet)));
              const niveauMoyen =
                sujets.reduce((s, su) => s + niveauActif(su, etat), 0) / Math.max(1, sujets.length);
              const ok = qs.filter((q) => etatCarte(etat[q.id]) === "acquis").length;
              return (
                <li key={a.id}>
                  <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-2">
                    <p className="truncate text-sm">{a.nom}</p>
                    <p className="shrink-0 text-xs text-muted-foreground">
                      niveau {niveauMoyen.toFixed(1)} · {ok}/{qs.length}
                    </p>
                  </div>
                  <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-elevated">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${(ok / qs.length) * 100}%`,
                        backgroundColor: a.couleur,
                      }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        <section className="surface p-5">
          <h2 className="text-lg">Formats</h2>
          <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            {Object.entries(parType).map(([t, v]) => (
              <li key={t} className="grid grid-cols-[minmax(0,1fr)_auto] gap-2">
                <span className="truncate text-muted-foreground">{TYPES[t as keyof typeof TYPES] ?? t}</span>
                <span className="shrink-0">
                  {v.ok}/{v.total}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {mouvants.length > 0 && (
          <section className="surface p-5">
            <h2 className="text-lg">Faits mouvants à revérifier</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Données susceptibles d'avoir changé depuis leur dernière vérification.
            </p>
            <ul className="mt-3 space-y-2 text-sm">
              {mouvants.slice(0, 15).map((q) => (
                <li key={q.id} className="border-l-2 border-warning pl-3">
                  <p className="leading-snug">{q.question}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {q.aVerifier ?? "à confirmer"}
                    {q.derniereVerification ? ` · ${q.derniereVerification}` : ""}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </AppShell>
  );
}
