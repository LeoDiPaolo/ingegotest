import { Link } from "@tanstack/react-router";
import { Layers, Library, Settings, Zap } from "lucide-react";
import { PastilleIngego } from "@/components/ingego/marque";

const ONGLETS = [
  { to: "/", label: "Réviser", Icone: Zap },
  { to: "/elevation", label: "Élévation", Icone: Layers },
  { to: "/corpus", label: "Corpus", Icone: Library },
  { to: "/reglages", label: "Réglages", Icone: Settings },
] as const;

export function NavBas() {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-card/95 backdrop-blur">
      <ul className="relative mx-auto flex max-w-6xl px-2 py-1">
        {ONGLETS.map(({ to, label, Icone }) => (
          <li key={to} className="flex-1">
            <Link
              to={to}
              activeOptions={{ exact: true }}
              activeProps={{ className: "bg-primary/10 text-primary" }}
              inactiveProps={{ className: "text-muted-foreground" }}
              className="tap group relative flex flex-col items-center gap-1 py-2 text-[0.65rem] font-bold transition-transform after:absolute after:inset-x-7 after:top-0 after:h-0.5 after:origin-center after:scale-x-0 after:bg-brand after:transition-transform data-[status=active]:after:scale-x-100 active:scale-95"
            >
              {to === "/" ? (
                <span className="-mt-4 grid h-11 w-11 place-items-center rounded-full border-4 border-card bg-primary shadow-[var(--shadow-card)]">
                  <PastilleIngego className="h-8 w-8 rounded-full" />
                </span>
              ) : (
                <span className="grid h-7 w-9 place-items-center border-x border-border group-data-[status=active]:border-primary">
                  <Icone className="h-4.5 w-4.5" />
                </span>
              )}
              {label}
            </Link>
          </li>
        ))}
      </ul>
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
}
