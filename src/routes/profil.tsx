import { createFileRoute, Link } from "@tanstack/react-router";
import { ListOrdered, RotateCcw, ClipboardList } from "lucide-react";
import castor from "@/assets/ingego-castor.png.asset.json";
import { Entete } from "@/components/ingego/entete";
import { NavBas } from "@/components/ingego/nav-bas";
import { useProgres } from "@/lib/ingego/parcours";
import { useHistorique } from "@/lib/ingego/historique";

export const Route = createFileRoute("/profil")({
  head: () => ({
    meta: [
      { title: "Profil — IngéGo" },
      { name: "description", content: "Votre profil IngéGo : progression enregistrée sur cet appareil, accès à toutes les questions et au mode relecture." },
      { property: "og:title", content: "Profil — IngéGo" },
      { property: "og:description", content: "Progression locale, toutes les questions et mode relecture." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Page,
});

function Page() {
  const { progres, reinitialiser } = useProgres();
  const { reinitialiser: viderHistorique } = useHistorique();

  return (
    <div className="min-h-screen bg-background pb-24">
      <Entete xp={progres.xp} serie={progres.serie} />
      <main className="mx-auto max-w-2xl space-y-5 px-5 py-5">
        <section className="surface flex items-center gap-4 p-4">
          <img src={castor.url} alt="" className="h-16 w-16 object-contain" />
          <div>
            <h1 className="text-xl text-primary">Candidat IngéGo</h1>
            <p className="text-sm text-muted-foreground">
              {progres.xp} points · série de {progres.serie} jour{progres.serie > 1 ? "s" : ""}
            </p>
          </div>
        </section>

        <div className="space-y-2">
          <Lien to="/questions" icone={<ListOrdered className="h-4 w-4" />} label="Toutes les questions" />
          <Lien to="/beta" icone={<ClipboardList className="h-4 w-4" />} label="Mode relecture (bêta)" />
        </div>

        <button
          onClick={() => {
            reinitialiser();
            viderHistorique();
          }}
          className="tap flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/40 bg-destructive/10 py-3 text-sm font-semibold text-destructive"
        >
          <RotateCcw className="h-4 w-4" /> Réinitialiser ma progression
        </button>

        <p className="text-xs text-muted-foreground">
          Aucun compte n'est nécessaire : la progression est enregistrée sur cet appareil.
        </p>
      </main>
      <NavBas />
    </div>
  );
}

function Lien({ to, icone, label }: { to: "/questions" | "/beta"; icone: React.ReactNode; label: string }) {
  return (
    <Link
      to={to}
      className="tap flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium"
    >
      {icone}
      {label}
    </Link>
  );
}
