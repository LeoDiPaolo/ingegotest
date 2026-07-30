import { useState } from "react";
import { ArrowRight, BookOpen, Brain, Smartphone, Target } from "lucide-react";
import { PanneauConnexion } from "@/components/ingego/panneau-connexion";
import { Castor, LogoIngego } from "@/components/ingego/marque";

export function LandingPage() {
  const [montrerConnexion, setMontrerConnexion] = useState(false);

  if (montrerConnexion) {
    return <PanneauConnexion />;
  }

  return (
    <div className="relative flex min-h-screen flex-col justify-center overflow-hidden bg-background px-5 py-12">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(60%_100%_at_50%_0%,color-mix(in_oklab,var(--color-brand)_14%,transparent),transparent)]"
      />

      <div className="relative mx-auto w-full max-w-md">
        <LogoIngego className="max-w-[17rem]" />

        <p className="mt-5 text-base leading-relaxed text-muted-foreground">
          322 questions réparties sur six axes, révision par répétition espacée, progression
          synchronisée du téléphone au PC.
        </p>

        <div className="mt-8 grid gap-3">
          <button
            type="button"
            onClick={() => setMontrerConnexion(true)}
            className="tap flex items-center justify-center gap-2 rounded-xl bg-primary py-3.5 text-sm font-semibold text-primary-foreground shadow-card transition-colors hover:bg-primary/90"
          >
            Commencer à réviser
            <ArrowRight className="h-4 w-4" />
          </button>
          <p className="text-center text-xs text-muted-foreground">
            Gratuit. Connexion par e-mail ou Google.
          </p>
        </div>

        <section className="mt-10 grid grid-cols-2 gap-3">
          <Avantage
            icone={<Brain className="h-5 w-5 text-brand" />}
            titre="Répétition espacée"
            texte="Chaque question revient au bon moment pour ancrer durablement."
          />
          <Avantage
            icone={<Target className="h-5 w-5 text-brand" />}
            titre="Six axes"
            texte="Droit, gestion, technique, architecture, urbanisme, environnement."
          />
          <Avantage
            icone={<Smartphone className="h-5 w-5 text-brand" />}
            titre="Multi-écran"
            texte="Même progression sur mobile, tablette et ordinateur."
          />
          <Avantage
            icone={<BookOpen className="h-5 w-5 text-brand" />}
            titre="322 questions"
            texte="QCM, libres, frises, association, vrai/faux, tri."
          />
        </section>

        <div className="mt-10 flex items-end gap-4 rounded-2xl border border-border bg-elevated p-4">
          <Castor className="w-20 shrink-0" />
          <p className="pb-1 text-sm leading-relaxed text-foreground">
            « Un peu chaque jour, c'est l'ouvrage qui tient. »
            <span className="mt-1 block text-xs text-muted-foreground">
              Votre castor de chantier
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}

function Avantage({
  icone,
  titre,
  texte,
}: {
  icone: React.ReactNode;
  titre: string;
  texte: string;
}) {
  return (
    <div className="surface p-4">
      <div className="flex items-center gap-2">
        {icone}
        <h3 className="text-sm font-semibold text-primary">{titre}</h3>
      </div>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{texte}</p>
    </div>
  );
}
