import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Check, Lock, Play, Star } from "lucide-react";
import castor from "@/assets/ingego-castor.png.asset.json";
import { Entete } from "@/components/ingego/entete";
import { NavBas } from "@/components/ingego/nav-bas";
import { UNITES, ouverte, prochaineLecon, useProgres, type Lecon } from "@/lib/ingego/parcours";
import { cn } from "@/lib/utils";

const TITRE = "IngéGo — parcours du concours d'ingénieur territorial";
const DESC =
  "Apprenez le concours d'ingénieur territorial bâtiment leçon par leçon : parcours par thème, exercices variés, séries quotidiennes et points d'expérience.";

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>) => ({
    q: search.q ? Number(search.q) : undefined,
  }),
  head: () => ({
    meta: [
      { title: TITRE },
      { name: "description", content: DESC },
      { property: "og:title", content: TITRE },
      { property: "og:description", content: DESC },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "twitter:title", content: TITRE },
      { name: "twitter:description", content: DESC },
    ],
  }),
  component: Parcours,
});

function Parcours() {
  const { progres, pret } = useProgres();
  const navigate = useNavigate();
  const prochaine = prochaineLecon(progres);

  return (
    <div className="min-h-screen bg-background pb-24">
      <Entete xp={progres.xp} serie={progres.serie} />

      <main className="mx-auto max-w-2xl px-5 py-5">
        <section className="surface flex items-center gap-4 overflow-hidden p-4">
          <img src={castor.url} alt="" className="h-20 w-20 shrink-0 object-contain" />
          <div className="min-w-0">
            <h1 className="text-xl text-primary">Reprenons l'entraînement</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {prochaine.sousTheme} · leçon {prochaine.rang}
            </p>
            <button
              onClick={() => navigate({ to: "/lecon/$id", params: { id: prochaine.id } })}
              className="tap mt-3 inline-flex items-center gap-2 rounded-xl bg-brand px-4 py-2.5 text-sm font-semibold text-brand-foreground"
            >
              <Play className="h-4 w-4" /> Continuer
            </button>
          </div>
        </section>

        <div className="mt-6 space-y-8">
          {UNITES.map((unite) => {
            const faites = unite.lecons.filter((l) => progres.lecons[l.id]).length;
            return (
              <section key={`${unite.axe.id}-${unite.sousTheme}`} className="space-y-4">
                <div
                  className="rounded-2xl px-4 py-3 text-card"
                  style={{ backgroundColor: unite.axe.couleur }}
                >
                  <p className="text-[0.65rem] font-semibold tracking-[0.16em] text-white/80 uppercase">
                    {unite.axe.court}
                  </p>
                  <h2 className="text-lg text-white">{unite.sousTheme}</h2>
                  <p className="text-xs text-white/85">
                    {faites} / {unite.lecons.length} leçons terminées
                  </p>
                </div>

                <ol className="space-y-3">
                  {unite.lecons.map((lecon, i) => (
                    <li
                      key={lecon.id}
                      className="flex"
                      style={{
                        justifyContent: ["center", "flex-end", "center", "flex-start"][i % 4],
                      }}
                    >
                      <Bulle
                        lecon={lecon}
                        etoiles={progres.lecons[lecon.id]?.etoiles ?? 0}
                        ouverte={pret ? ouverte(lecon.id, progres) : lecon.id === prochaine.id}
                        couleur={unite.axe.couleur}
                      />
                    </li>
                  ))}
                </ol>
              </section>
            );
          })}
        </div>
      </main>

      <NavBas />
    </div>
  );
}

function Bulle({
  lecon,
  etoiles,
  ouverte: dispo,
  couleur,
}: {
  lecon: Lecon;
  etoiles: number;
  ouverte: boolean;
  couleur: string;
}) {
  const contenu = (
    <span
      className={cn(
        "flex h-16 w-16 items-center justify-center rounded-full border-4 border-b-[6px] text-lg font-bold",
        dispo ? "text-white" : "border-border bg-muted text-muted-foreground",
      )}
      style={
        dispo
          ? { backgroundColor: couleur, borderColor: "color-mix(in oklab, black 18%, transparent)" }
          : undefined
      }
    >
      {!dispo ? (
        <Lock className="h-5 w-5" />
      ) : etoiles > 0 ? (
        <Check className="h-6 w-6" />
      ) : (
        lecon.rang
      )}
    </span>
  );

  return (
    <div className="flex flex-col items-center gap-1">
      {dispo ? (
        <Link to="/lecon/$id" params={{ id: lecon.id }} className="tap" aria-label={`Leçon ${lecon.rang}`}>
          {contenu}
        </Link>
      ) : (
        contenu
      )}
      <span className="flex gap-0.5" aria-label={`${etoiles} étoiles sur 3`}>
        {[0, 1, 2].map((s) => (
          <Star
            key={s}
            className={cn("h-3 w-3", s < etoiles ? "fill-brand text-brand" : "text-border")}
          />
        ))}
      </span>
    </div>
  );
}
