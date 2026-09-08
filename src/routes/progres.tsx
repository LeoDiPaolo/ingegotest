import { createFileRoute } from "@tanstack/react-router";
import { Flame, Star, Trophy } from "lucide-react";
import { Entete } from "@/components/ingego/entete";
import { NavBas } from "@/components/ingego/nav-bas";
import { LECONS, UNITES, useProgres } from "@/lib/ingego/parcours";
import { useHistorique } from "@/lib/ingego/historique";

export const Route = createFileRoute("/progres")({
  head: () => ({
    meta: [
      { title: "Mes progrès — IngéGo" },
      { name: "description", content: "Suivez votre série, vos points d'expérience et l'avancement par thème du parcours ingénieur territorial." },
      { property: "og:title", content: "Mes progrès — IngéGo" },
      { property: "og:description", content: "Série, points d'expérience et avancement par thème." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

function Page() {
  const { progres } = useProgres();
  const { historique } = useHistorique();
  const faites = Object.keys(progres.lecons).length;
  const justes = Object.values(historique).filter((r) => r === "ok").length;
  const repondues = Object.keys(historique).length;

  return (
    <div className="min-h-screen bg-background pb-24">
      <Entete xp={progres.xp} serie={progres.serie} />
      <main className="mx-auto max-w-2xl space-y-5 px-5 py-5">
        <h1 className="text-2xl text-primary">Mes progrès</h1>

        <div className="grid grid-cols-3 gap-3">
          <Stat icone={<Flame className="h-5 w-5 text-brand" />} valeur={`${progres.serie} j`} label="Série" />
          <Stat icone={<Star className="h-5 w-5 text-primary" />} valeur={String(progres.xp)} label="Points" />
          <Stat
            icone={<Trophy className="h-5 w-5 text-success" />}
            valeur={`${faites}/${LECONS.length}`}
            label="Leçons"
          />
        </div>

        <div className="surface p-4">
          <p className="text-sm font-semibold text-primary">Réponses justes</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {justes} sur {repondues} questions répondues
          </p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-elevated">
            <div
              className="h-full rounded-full bg-success"
              style={{ width: `${repondues ? (justes / repondues) * 100 : 0}%` }}
            />
          </div>
        </div>

        <section className="space-y-3">
          <h2 className="text-lg text-primary">Par thème</h2>
          {UNITES.map((u) => {
            const faits = u.lecons.filter((l) => progres.lecons[l.id]).length;
            return (
              <div key={`${u.axe.id}-${u.sousTheme}`} className="surface p-3">
                <div className="flex items-baseline justify-between gap-3">
                  <p className="min-w-0 truncate text-sm font-medium">{u.sousTheme}</p>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {faits}/{u.lecons.length}
                  </span>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-elevated">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${(faits / u.lecons.length) * 100}%`,
                      backgroundColor: u.axe.couleur,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </section>
      </main>
      <NavBas />
    </div>
  );
}

function Stat({ icone, valeur, label }: { icone: React.ReactNode; valeur: string; label: string }) {
  return (
    <div className="surface flex flex-col items-center gap-1 p-3">
      {icone}
      <p className="text-lg font-bold text-foreground">{valeur}</p>
      <p className="text-[0.68rem] text-muted-foreground">{label}</p>
    </div>
  );
}
