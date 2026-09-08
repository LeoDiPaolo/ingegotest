import { Flame, Star } from "lucide-react";
import { MotIngego, PastilleIngego } from "@/components/ingego/marque";

export function Entete({ xp, serie }: { xp: number; serie: number }) {
  return (
    <header className="sticky top-0 z-20 border-b border-border bg-card/95 px-5 py-3 backdrop-blur">
      <div className="mx-auto flex max-w-2xl items-center gap-2.5">
        <PastilleIngego className="h-8 w-8 rounded-xl" />
        <div className="min-w-0">
          <MotIngego className="text-lg" />
          <p className="truncate text-[0.65rem] text-muted-foreground">
            Réussissez votre concours Ingénieur Territorial Bâtiment
          </p>
        </div>
        <div className="ml-auto flex shrink-0 items-center gap-2 text-sm font-semibold">
          <span className="flex items-center gap-1 rounded-full bg-brand/15 px-2.5 py-1 text-brand">
            <Flame className="h-4 w-4" />
            {serie}
          </span>
          <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-primary">
            <Star className="h-4 w-4" />
            {xp}
          </span>
        </div>
      </div>
    </header>
  );
}
